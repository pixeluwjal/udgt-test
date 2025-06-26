"use client";

import React, { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import { useUser } from "@clerk/nextjs";
import { FiDollarSign, FiTrendingUp, FiPieChart, FiCalendar } from "react-icons/fi";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement
);

const Analysis = () => {
  const { user } = useUser();
  const [totalSpending, setTotalSpending] = useState(0);
  const [averageSpend, setAverageSpend] = useState(0);
  const [largestPurchase, setLargestPurchase] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [categorySpending, setCategorySpending] = useState<number[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchBills = async () => {
      try {
        const res = await fetch(`/api/bills?clerkId=${user.id}`);
        const data = await res.json();

        const bills = data.bills || [];
        let total = 0;
        let maxPurchase = 0;
        const categoryMap: { [category: string]: number } = {};
        const paymentMap: { [method: string]: number } = {};

        bills.forEach((bill: any) => {
          const billTotal = bill.total || 0;
          total += billTotal;
          if (billTotal > maxPurchase) maxPurchase = billTotal;

          // Track payment methods
          const method = bill.paymentMethod || "Unknown";
          paymentMap[method] = (paymentMap[method] || 0) + billTotal;

          // Category-wise Spending
          (bill.items || []).forEach((item: any) => {
            const category = item.category || "Uncategorized";
            const price = item.price || 0;
            categoryMap[category] = (categoryMap[category] || 0) + price;
          });
        });

        setTotalSpending(total);
        setAverageSpend(bills.length > 0 ? total / bills.length : 0);
        setLargestPurchase(maxPurchase);
        setCategories(Object.keys(categoryMap));
        setCategorySpending(Object.values(categoryMap));
        setPaymentMethods(paymentMap);
      } catch (error) {
        console.error("Error fetching bills:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [user]);

  const categoryColors = [
    "#06C3C3", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", 
    "#10B981", "#EF4444", "#6366F1", "#F97316", "#14B8A6"
  ];

  const barData = {
    labels: categories,
    datasets: [
      {
        label: "Spending (₹)",
        data: categorySpending,
        backgroundColor: categoryColors.slice(0, categories.length),
        borderRadius: 6,
      },
    ],
  };

  const pieData = {
    labels: Object.keys(paymentMethods),
    datasets: [
      {
        data: Object.values(paymentMethods),
        backgroundColor: categoryColors.slice(0, Object.keys(paymentMethods).length),
        borderWidth: 0,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#06C3C3]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Expense Analysis</h1>
        <div className="text-sm text-gray-400">
          <FiCalendar className="inline mr-2" />
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#213C5A] to-[#1A2F45] p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#06C3C3]/10 p-3 rounded-full">
              <FiDollarSign className="text-[#06C3C3] text-xl" />
            </div>
            <div>
              <h3 className="text-white/70 text-sm">Total Spending</h3>
              <p className="text-2xl font-bold text-white">
                ₹{totalSpending.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#213C5A] to-[#1A2F45] p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#3B82F6]/10 p-3 rounded-full">
              <FiTrendingUp className="text-[#3B82F6] text-xl" />
            </div>
            <div>
              <h3 className="text-white/70 text-sm">Average Transaction</h3>
              <p className="text-2xl font-bold text-white">
                ₹{averageSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#213C5A] to-[#1A2F45] p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#EC4899]/10 p-3 rounded-full">
              <FiDollarSign className="text-[#EC4899] text-xl" />
            </div>
            <div>
              <h3 className="text-white/70 text-sm">Largest Purchase</h3>
              <p className="text-2xl font-bold text-white">
                ₹{largestPurchase.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#213C5A] to-[#1A2F45] p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <FiPieChart className="text-[#06C3C3] text-xl" />
            <h2 className="text-lg font-bold text-white">Payment Methods</h2>
          </div>
          <div className="h-64">
            <Pie
              data={pieData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      color: '#E5E7EB',
                      font: {
                        size: 12
                      }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.raw as number;
                        return `₹${value.toLocaleString()} (${Math.round((value / totalSpending) * 100)}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#213C5A] to-[#1A2F45] p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <FiTrendingUp className="text-[#06C3C3] text-xl" />
            <h2 className="text-lg font-bold text-white">Category Breakdown</h2>
          </div>
          <div className="h-64">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.raw as number;
                        return `₹${value.toLocaleString()} (${Math.round((value / totalSpending) * 100)}%)`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      color: '#94A3B8'
                    }
                  },
                  y: {
                    grid: {
                      color: '#2D4A6A'
                    },
                    ticks: {
                      color: '#94A3B8',
                      callback: (value) => `₹${Number(value).toLocaleString()}`
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-gradient-to-br from-[#213C5A] to-[#1A2F45] p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-bold text-white mb-6">Top Spending Categories</h2>
        <div className="space-y-4">
          {categories.map((category, index) => (
            <div key={category} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-3" 
                style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
              ></div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">{category}</span>
                  <span className="text-[#06C3C3]">
                    ₹{categorySpending[index].toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{
                      width: `${(categorySpending[index] / Math.max(...categorySpending)) * 100}%`,
                      backgroundColor: categoryColors[index % categoryColors.length]
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analysis;