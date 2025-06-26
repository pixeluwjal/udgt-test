"use client";

import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import UploadSection from "./UploadSection";
import BillsList from "./BillsList";
import Analysis from "./Analysis";
import { FiLoader } from "react-icons/fi";

export default function Dashboard() {
  const { userId } = useAuth();

  if (!userId) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3854] to-[#0A1A2E]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="text-[#06C3C3] text-4xl"
      >
        <FiLoader />
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3854] to-[#0A1A2E] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-2"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome to <span className="text-[#06C3C3]">Expensia</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Manage your expenses efficiently
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <UploadSection />
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6"
        >
          <Analysis />
        </motion.div>

        {/* Bills List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-8"
        >
          <BillsList />
        </motion.div>

        {/* Simple Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="text-center text-xs text-gray-500 pt-8 mt-8 border-t border-[#06C3C3]/10"
        >
          <p>Expensia © {new Date().getFullYear()}</p>
        </motion.div>
      </div>
    </div>
  );
}