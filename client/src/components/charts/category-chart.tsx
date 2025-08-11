import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import type { Transaction } from "@shared/schema";

Chart.register(...registerables);

interface CategoryChartProps {
  transactions: Transaction[];
}

export default function CategoryChart({ transactions }: CategoryChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Group expenses by category
    const categoryData = transactions
      .filter(t => t.type === "expense")
      .reduce((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

    const categories = Object.keys(categoryData);
    const amounts = Object.values(categoryData);

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    const colors = [
      "#2563EB", // blue
      "#059669", // emerald
      "#F59E0B", // amber
      "#DC2626", // red
      "#8B5CF6", // violet
      "#06B6D4", // cyan
      "#84CC16", // lime
      "#F97316", // orange
    ];

    chartInstance.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: categories,
        datasets: [
          {
            data: amounts,
            backgroundColor: colors.slice(0, categories.length),
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [transactions]);

  // Calculate category breakdown for display
  const expenseTransactions = transactions.filter(t => t.type === "expense");
  const categoryTotals = expenseTransactions.reduce((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const colors = [
    "#2563EB", "#059669", "#F59E0B", "#DC2626", "#8B5CF6"
  ];

  return (
    <div>
      <div className="h-64 mb-4">
        <canvas ref={chartRef} />
      </div>
      <div className="space-y-3">
        {sortedCategories.map(([category, amount], index) => (
          <div key={category} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors[index] }}
              ></div>
              <span className="text-sm font-medium text-slate-700">{category}</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
