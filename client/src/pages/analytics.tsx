import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import SpendingChart from "@/components/charts/spending-chart";
import CategoryChart from "@/components/charts/category-chart";
import type { Transaction, SavingsTip } from "@shared/schema";

interface AnalyticsData {
  insights: Array<{
    type: string;
    message: string;
    category?: string;
    amount?: number;
    change_percent?: number;
    current_amount?: number;
    previous_amount?: number;
  }>;
  category_analysis: Record<string, number>;
  monthly_trends: Record<string, number>;
  category_averages: Record<string, number>;
}

export default function Analytics() {
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions", {
        headers: auth.getToken() ? { Authorization: `Bearer ${auth.getToken()}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/spending"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/spending", {
        headers: auth.getToken() ? { Authorization: `Bearer ${auth.getToken()}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch analytics data");
      return response.json();
    },
    enabled: transactions.length > 0,
  });

  const { data: savingsTips = [], isLoading: tipsLoading, refetch: refetchTips } = useQuery<SavingsTip[]>({
    queryKey: ["/api/analytics/savings-tips"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/savings-tips", {
        headers: auth.getToken() ? { Authorization: `Bearer ${auth.getToken()}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch savings tips");
      return response.json();
    },
  });

  const generateNewTips = async () => {
    try {
      const response = await fetch("/api/analytics/tips", {
        headers: auth.getToken() ? { Authorization: `Bearer ${auth.getToken()}` } : {},
      });
      if (response.ok) {
        refetchTips();
      }
    } catch (error) {
      console.error("Failed to generate new tips:", error);
    }
  };

  // Calculate spending efficiency
  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const spendingEfficiency = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  if (transactionsLoading || analyticsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Financial Analytics</h1>
      
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Spending Efficiency</h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {spendingEfficiency.toFixed(0)}%
              </div>
              <p className="text-sm text-slate-500">Budget adherence this month</p>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(spendingEfficiency, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Savings Projection</h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                ${((totalIncome - totalExpenses) * 12).toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </div>
              <p className="text-sm text-slate-500">Projected year-end savings</p>
              <p className="text-sm text-green-600 mt-2">
                <i className="fas fa-arrow-up mr-1"></i>
                Based on current trends
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk Score</h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-500 mb-2">
                {spendingEfficiency > 70 ? "Low" : spendingEfficiency > 40 ? "Med" : "High"}
              </div>
              <p className="text-sm text-slate-500">Financial risk assessment</p>
              <p className="text-sm text-amber-500 mt-2">
                {spendingEfficiency > 70 ? "Conservative spending" : spendingEfficiency > 40 ? "Moderate risk level" : "High spending risk"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingChart transactions={transactions} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Category Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart transactions={transactions} />
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      {analyticsData && analyticsData.insights && analyticsData.insights.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              <i className="fas fa-chart-bar text-blue-600 mr-2"></i>
              Data Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.insights.map((insight, index) => (
                <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center mt-0.5">
                      <i className="fas fa-lightbulb text-blue-600 text-sm"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-900">{insight.message}</p>
                      {insight.amount && (
                        <p className="text-sm text-blue-600 mt-1">
                          Amount: ${insight.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              <i className="fas fa-robot text-blue-600 mr-2"></i>
              AI-Powered Recommendations
            </CardTitle>
            <Button onClick={generateNewTips} disabled={tipsLoading}>
              <i className="fas fa-sync-alt mr-2"></i>
              Generate New Tips
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {savingsTips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">No recommendations available.</p>
              <p className="text-sm text-slate-400">Add more transactions to get personalized savings tips.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savingsTips.map((tip) => (
                <div key={tip.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start">
                    <div className="bg-blue-600 rounded-full p-2 mr-3">
                      <i className="fas fa-lightbulb text-white text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">{tip.category}</h4>
                      <p className="text-sm text-slate-600 mb-3">{tip.recommendation}</p>
                      <div className="flex items-center text-sm">
                        <span className="text-blue-600 font-medium">
                          Potential savings: ${tip.potentialSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}/month
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center">
                          <span className="text-xs text-slate-500 mr-2">Confidence:</span>
                          <div className="flex-1 bg-slate-200 rounded-full h-1">
                            <div 
                              className="bg-green-500 h-1 rounded-full" 
                              style={{ width: `${tip.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-600 ml-2">{(tip.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
