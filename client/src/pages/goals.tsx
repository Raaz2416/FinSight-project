import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertGoalSchema } from "@shared/schema";
import { auth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Goal, InsertGoal } from "@shared/schema";

export default function Goals() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    queryFn: async () => {
      const response = await fetch("/api/goals", {
        headers: auth.getToken() ? { Authorization: `Bearer ${auth.getToken()}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch goals");
      return response.json();
    },
  });

  const form = useForm<InsertGoal>({
    resolver: zodResolver(insertGoalSchema.omit({ userId: true })),
    defaultValues: {
      title: "",
      description: "",
      targetAmount: 0,
      currentAmount: 0,
      targetDate: "",
      category: "",
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: Omit<InsertGoal, "userId">) =>
      apiRequest("POST", "/api/goals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setShowAddDialog(false);
      form.reset();
      toast({
        title: "Goal added",
        description: "Your financial goal has been successfully added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add goal.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertGoal> }) =>
      apiRequest("PUT", `/api/goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setEditingGoal(null);
      form.reset();
      toast({
        title: "Goal updated",
        description: "Your financial goal has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update goal.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Goal deleted",
        description: "Your financial goal has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete goal.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertGoal, "userId">) => {
    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data });
    } else {
      addMutation.mutate(data);
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    form.reset({
      title: goal.title,
      description: goal.description || "",
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate,
      category: goal.category,
    });
    setShowAddDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      deleteMutation.mutate(id);
    }
  };

  const categories = [
    "Emergency Fund",
    "Vacation",
    "New Car",
    "Home Down Payment",
    "Education",
    "Retirement",
    "Investment",
    "Debt Payoff",
    "Other",
  ];

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, string> = {
      "Emergency Fund": "fa-shield-alt",
      "Vacation": "fa-plane",
      "New Car": "fa-car",
      "Home Down Payment": "fa-home",
      "Education": "fa-graduation-cap",
      "Retirement": "fa-piggy-bank",
      "Investment": "fa-chart-line",
      "Debt Payoff": "fa-credit-card",
      "Other": "fa-bullseye",
    };
    return iconMap[category] || "fa-bullseye";
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      "Emergency Fund": "bg-blue-600",
      "Vacation": "bg-purple-600",
      "New Car": "bg-green-600",
      "Home Down Payment": "bg-orange-600",
      "Education": "bg-indigo-600",
      "Retirement": "bg-emerald-600",
      "Investment": "bg-red-600",
      "Debt Payoff": "bg-yellow-600",
      "Other": "bg-slate-600",
    };
    return colorMap[category] || "bg-slate-600";
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Financial Goals</h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingGoal(null);
              form.reset();
            }}>
              <i className="fas fa-plus mr-2"></i>
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? "Edit Goal" : "Add New Goal"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency Fund" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="3-6 months of expenses for emergencies" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="10000"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="5000"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addMutation.isPending || updateMutation.isPending}>
                    {editingGoal ? "Update" : "Add"} Goal
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-bullseye text-slate-400 text-2xl"></i>
              </div>
              <p className="text-slate-500 mb-4">No financial goals found.</p>
              <Button onClick={() => setShowAddDialog(true)}>
                Set your first financial goal
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining = goal.targetAmount - goal.currentAmount;
            const targetDate = new Date(goal.targetDate);
            const today = new Date();
            const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const monthlyNeeded = daysRemaining > 0 ? (remaining / (daysRemaining / 30)) : 0;

            return (
              <Card key={goal.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">{goal.title}</h3>
                    <div className={`h-10 w-10 ${getCategoryColor(goal.category)} rounded-lg flex items-center justify-center`}>
                      <i className={`fas ${getCategoryIcon(goal.category)} text-white`}></i>
                    </div>
                  </div>
                  
                  {goal.description && (
                    <p className="text-sm text-slate-600 mb-4">{goal.description}</p>
                  )}
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-medium text-slate-900">
                        ${goal.currentAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} / 
                        ${goal.targetAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className={`${getCategoryColor(goal.category)} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{progress.toFixed(1)}% complete</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Target Date:</span>
                      <span className="font-medium text-slate-900">
                        {new Date(goal.targetDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Remaining:</span>
                      <span className="font-medium text-slate-900">
                        ${remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {monthlyNeeded > 0 && daysRemaining > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Monthly needed:</span>
                        <span className="font-medium text-blue-600">
                          ${monthlyNeeded.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between">
                      <div className="text-sm">
                        {daysRemaining > 0 ? (
                          <span className="text-green-600 font-medium">
                            {daysRemaining} days remaining
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            {Math.abs(daysRemaining)} days overdue
                          </span>
                        )}
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(goal)}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(goal.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <i className="fas fa-trash text-red-600"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Goal Insights */}
      {goals.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>
                <i className="fas fa-lightbulb text-amber-500 mr-2"></i>
                Goal Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold mb-2 text-slate-900">On Track Performance</h4>
                  <p className="text-sm text-slate-600">
                    You have {goals.filter(g => (g.currentAmount / g.targetAmount) >= 0.5).length} out of {goals.length} goals 
                    that are at least 50% complete. Keep up the great progress!
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
                  <h4 className="font-semibold mb-2 text-slate-900">Optimization Tip</h4>
                  <p className="text-sm text-slate-600">
                    Consider setting up automatic transfers to make consistent progress toward your goals. 
                    Even small, regular contributions can make a big difference over time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
