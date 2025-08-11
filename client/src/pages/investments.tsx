import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertInvestmentSchema } from "@shared/schema";
import { auth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Investment, InsertInvestment } from "@shared/schema";

export default function Investments() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  const { data: investments = [], isLoading } = useQuery<Investment[]>({
    queryKey: ["/api/investments"],
    queryFn: async () => {
      const response = await fetch("/api/investments", {
        headers: auth.getToken() ? { Authorization: `Bearer ${auth.getToken()}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch investments");
      return response.json();
    },
  });

  const form = useForm<InsertInvestment>({
    resolver: zodResolver(insertInvestmentSchema.omit({ userId: true })),
    defaultValues: {
      symbol: "",
      name: "",
      type: "stock",
      shares: 0,
      purchasePrice: 0,
      currentPrice: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: Omit<InsertInvestment, "userId">) =>
      apiRequest("POST", "/api/investments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      setShowAddDialog(false);
      form.reset();
      toast({
        title: "Investment added",
        description: "Your investment has been successfully added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add investment.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertInvestment> }) =>
      apiRequest("PUT", `/api/investments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      setEditingInvestment(null);
      form.reset();
      toast({
        title: "Investment updated",
        description: "Your investment has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update investment.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/investments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      toast({
        title: "Investment deleted",
        description: "Your investment has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete investment.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertInvestment, "userId">) => {
    if (editingInvestment) {
      updateMutation.mutate({ id: editingInvestment.id, data });
    } else {
      addMutation.mutate(data);
    }
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    form.reset({
      symbol: investment.symbol,
      name: investment.name,
      type: investment.type,
      shares: investment.shares,
      purchasePrice: investment.purchasePrice,
      currentPrice: investment.currentPrice,
      purchaseDate: investment.purchaseDate,
    });
    setShowAddDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this investment?")) {
      deleteMutation.mutate(id);
    }
  };

  // Calculate portfolio metrics
  const totalValue = investments.reduce(
    (sum, inv) => sum + inv.shares * inv.currentPrice,
    0
  );
  const totalInvested = investments.reduce(
    (sum, inv) => sum + inv.shares * inv.purchasePrice,
    0
  );
  const totalGain = totalValue - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Investment Portfolio</h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingInvestment(null);
              form.reset();
            }}>
              <i className="fas fa-plus mr-2"></i>
              Add Investment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingInvestment ? "Edit Investment" : "Add New Investment"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symbol</FormLabel>
                        <FormControl>
                          <Input placeholder="AAPL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="stock">Stock</SelectItem>
                            <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                            <SelectItem value="etf">ETF</SelectItem>
                            <SelectItem value="bond">Bond</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Apple Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="shares"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shares</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="10"
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
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="150.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currentPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="175.00"
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
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addMutation.isPending || updateMutation.isPending}>
                    {editingInvestment ? "Update" : "Add"} Investment
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Portfolio Summary */}
      {investments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Portfolio Value</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  <p className={`text-sm mt-1 ${totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                    <i className={`fas fa-arrow-${totalGain >= 0 ? "up" : "down"} mr-1`}></i>
                    ${Math.abs(totalGain).toLocaleString("en-US", { minimumFractionDigits: 2 })} 
                    ({totalReturnPercent >= 0 ? "+" : ""}{totalReturnPercent.toFixed(1)}%)
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-blue-600"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Invested</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    ${totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">Across {investments.length} assets</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-coins text-green-600"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Best Performer</p>
                  {investments.length > 0 && (() => {
                    const bestInvestment = investments.reduce((best, inv) => {
                      const currentReturn = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
                      const bestReturn = ((best.currentPrice - best.purchasePrice) / best.purchasePrice) * 100;
                      return currentReturn > bestReturn ? inv : best;
                    });
                    const returnPercent = ((bestInvestment.currentPrice - bestInvestment.purchasePrice) / bestInvestment.purchasePrice) * 100;
                    
                    return (
                      <>
                        <p className="text-2xl font-bold text-slate-900 mt-2">{bestInvestment.symbol}</p>
                        <p className="text-green-600 text-sm mt-1">
                          +{returnPercent.toFixed(1)}%
                        </p>
                      </>
                    );
                  })()}
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-trophy text-yellow-600"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Monthly Return</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {totalReturnPercent >= 0 ? "+" : ""}{(totalReturnPercent / 12).toFixed(1)}%
                  </p>
                  <p className="text-slate-500 text-sm mt-1">Estimated monthly</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-percentage text-purple-600"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Investments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">No investments found.</p>
              <Button onClick={() => setShowAddDialog(true)}>
                Add your first investment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Asset</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Shares</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Invested</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Current Value</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Gain/Loss</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Return %</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((investment) => {
                    const currentValue = investment.shares * investment.currentPrice;
                    const purchaseValue = investment.shares * investment.purchasePrice;
                    const gain = currentValue - purchaseValue;
                    const gainPercent = (gain / purchaseValue) * 100;

                    return (
                      <tr key={investment.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <i className="fas fa-chart-line text-blue-600"></i>
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{investment.symbol}</div>
                              <div className="text-sm text-slate-500">{investment.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                            {investment.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-slate-900">
                          {investment.shares.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-slate-900">
                          ${purchaseValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-900">
                          ${currentValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${gain >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {gain >= 0 ? "+" : ""}${gain.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${gainPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {gainPercent >= 0 ? "+" : ""}{gainPercent.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(investment)}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(investment.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <i className="fas fa-trash text-red-600"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
