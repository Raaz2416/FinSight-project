import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import SpendingChart from "@/components/charts/spending-chart";
import CategoryChart from "@/components/charts/category-chart";
import type { Transaction, Investment, Goal, SavingsTip } from "@shared/schema";

export default function Dashboard() {
  const user = auth.getUser();

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions?limit=10", {
        headers: auth.getToken() ? { Authorization: `Bearer ${auth.getToken()}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  const { data: investments = [] } = useQuery<Investment[]>({
    queryKey: ["/api/investments"],
    queryFn: async () => {
      const response = await fetch("/api/investments", {
        headers: auth.getToken() ? { Authorization: `Bearer ${auth.getToken()}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch investments");
      return response.json();
    },
  });

  const { data: savingsTips = [] } = useQuery<SavingsTip[]>({
    queryKey: ["/api/analytics/savings-tips"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/savings-tips", {
        headers: auth.getToken() ? { Authorization: `Bearer ${auth.getToken()}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch savings tips");
      return response.json();
    },
  });

  // Calculate metrics
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpenses;

  const portfolioValue = investments.reduce(
    (sum, inv) => sum + inv.shares * inv.currentPrice,
    0
  );

  const portfolioGain = investments.reduce(
    (sum, inv) => sum + (inv.currentPrice - inv.purchasePrice) * inv.shares,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {user?.firstName}!
            </h2>
            <p className="text-blue-100">Here's your financial overview for this month</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Last updated</p>
            <p className="font-semibold">2 minutes ago</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Balance</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-green-600 text-sm mt-1">
                  <i className="fas fa-arrow-up mr-1"></i>
                  +12.5% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-wallet text-green-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Monthly Income</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  ${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-green-600 text-sm mt-1">
                  <i className="fas fa-arrow-up mr-1"></i>
                  +5.2% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-arrow-down text-green-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Monthly Expenses</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-red-600 text-sm mt-1">
                  <i className="fas fa-arrow-up mr-1"></i>
                  +8.1% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-arrow-up text-red-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Portfolio Value</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  ${portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-sm mt-1 ${portfolioGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                  <i className={`fas fa-arrow-${portfolioGain >= 0 ? "up" : "down"} mr-1`}></i>
                  ${Math.abs(portfolioGain).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-yellow-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Spending Analytics */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Spending Analytics</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="default" size="sm">6M</Button>
                  <Button variant="outline" size="sm">1Y</Button>
                  <Button variant="outline" size="sm">All</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SpendingChart transactions={transactions} />
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart transactions={transactions} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Investment Tracker */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Investment Portfolio</CardTitle>
              <Button variant="outline" size="sm">
                Manage <i className="fas fa-arrow-right ml-1"></i>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investments.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No investments found. Add your first investment to get started.</p>
              ) : (
                investments.slice(0, 3).map((investment) => {
                  const currentValue = investment.shares * investment.currentPrice;
                  const purchaseValue = investment.shares * investment.purchasePrice;
                  const gain = currentValue - purchaseValue;
                  const gainPercent = (gain / purchaseValue) * 100;

                  return (
                    <div key={investment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <i className="fas fa-chart-line text-blue-600"></i>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{investment.name}</p>
                          <p className="text-sm text-slate-600">
                            ${currentValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${gain >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {gain >= 0 ? "+" : ""}{gainPercent.toFixed(1)}%
                        </p>
                        <p className="text-sm text-slate-600">
                          {gain >= 0 ? "+" : ""}${gain.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Smart Savings Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Smart Savings Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savingsTips.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No savings tips available. Add more transactions to get personalized recommendations.</p>
              ) : (
                savingsTips.slice(0, 3).map((tip) => (
                  <div key={tip.id} className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center mt-0.5">
                        <i className="fas fa-lightbulb text-blue-600 text-sm"></i>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 mb-1">{tip.category}</p>
                        <p className="text-sm text-slate-600 mb-2">{tip.recommendation}</p>
                        <p className="text-sm font-semibold text-blue-600">
                          Potential savings: ${tip.potentialSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}/month
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {savingsTips.length > 0 && (
              <Button className="w-full mt-4">
                View All Recommendations
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Transactions</CardTitle>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm">
                <i className="fas fa-plus mr-1"></i>Add Transaction
              </Button>
              <Button variant="outline" size="sm">
                View All <i className="fas fa-arrow-right ml-1"></i>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No transactions found. Add your first transaction to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Category</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((transaction) => (
                    <tr key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            transaction.type === "income" ? "bg-green-100" : "bg-red-100"
                          }`}>
                            <i className={`fas ${
                              transaction.type === "income" ? "fa-arrow-down text-green-600" : "fa-arrow-up text-red-600"
                            } text-xs`}></i>
                          </div>
                          <span className="font-medium text-slate-900">{transaction.description}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          transaction.type === "income" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {transaction.category}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        transaction.type === "income" ? "text-green-600" : "text-red-600"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}$
                        {transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
