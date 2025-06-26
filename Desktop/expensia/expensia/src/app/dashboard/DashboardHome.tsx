"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiPieChart,
  FiTrendingUp,
} from "react-icons/fi";

export default function DashboardHome() {
  const { user } = useUser();
  const username = user?.firstName || "User";

  const [bills, setBills] = useState<any[]>([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await fetch(`/api/bills?clerkId=${user?.id}`);
        const { bills } = await res.json();

        setBills(bills);

        const total = bills.reduce((sum: number, bill: any) => sum + (bill.total || 0), 0);
        setTotalSpend(total);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching bills:", error);
      }
    };

    if (user?.id) {
      fetchBills();
    }
  }, [user?.id]);

  const averageSpending = bills.length > 0 ? (totalSpend / bills.length) : 0;

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Welcome back, <span className="text-[#06C3C3]">{username}</span>!
        </h1>
        <p className="text-gray-400 mt-2">Here's your spending overview</p>
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div className="bg-gradient-to-br from-[#213C5A] to-[#1A2F45] p-6 rounded-2xl shadow-lg">
          <h3 className="text-white/70 text-sm mb-2 flex items-center gap-2">
            <FiDollarSign className="text-[#06C3C3]" /> Total Spending
          </h3>
          <p className="text-3xl font-bold text-[#06C3C3]">₹{totalSpend.toLocaleString()}</p>
        </motion.div>

        <motion.div className="bg-gradient-to-br from-[#213C5A] to-[#1A2F45] p-6 rounded-2xl shadow-lg">
          <h3 className="text-white/70 text-sm mb-2 flex items-center gap-2">
            <FiPieChart className="text-[#06C3C3]" /> Number of Bills
          </h3>
          <p className="text-3xl font-bold text-[#06C3C3]">{bills.length}</p>
        </motion.div>

        <motion.div className="bg-gradient-to-br from-[#213C5A] to-[#1A2F45] p-6 rounded-2xl shadow-lg">
          <h3 className="text-white/70 text-sm mb-2 flex items-center gap-2">
            <FiTrendingUp className="text-[#06C3C3]" /> Avg Spend per Bill
          </h3>
          <p className="text-3xl font-bold text-[#06C3C3]">₹{averageSpending.toFixed(2)}</p>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="bg-gradient-to-br from-[#213C5A] to-[#1A2F45] p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-6">Recent Bills</h3>
        <div className="space-y-4">
          {loading ? (
            <div className="h-24 flex justify-center items-center text-white">Loading...</div>
          ) : bills.length === 0 ? (
            <p className="text-gray-500">No bills uploaded yet.</p>
          ) : (
            bills.slice(0, 5).map((bill) => (
              <div key={bill._id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-[#06C3C3]/10 p-2 rounded-lg">
                    <FiDollarSign className="text-[#06C3C3]" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{bill.vendorName}</h4>
                    <p className="text-xs text-white/50">{new Date(bill.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#06C3C3]">₹{bill.total}</p>
                  <p className="text-xs text-white/50">{bill.paymentMethod || "—"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
