"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import dashboardImage from "@/public/dashboard-image.png";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white min-h-[100vh] flex items-center">
      {/* Soft background gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] to-[#e0f2fe]" />
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-[#00C4C6]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-[#223C5F]/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 md:py-24">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 xl:gap-20">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow border border-gray-200 text-[#00C4C6] text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-[#00C4C6] opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-[#00C4C6]" />
                </span>
                AI-Powered Expense Tracking
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C4C6] to-[#00a8a6]">
                  Effortless
                </span>{" "}
                <br />
                Expense Management
              </h1>

              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                Transform your receipts into insights with our AI platform.
                Simplify expenses, save time, and take full control of your
                finances.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/sign-up">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-7 py-3 bg-gradient-to-r from-[#00C4C6] to-[#00a8a6] text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Get Started Free
                  </motion.button>
                </Link>
                <Link href="#how-it-works">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-7 py-3 bg-white text-[#00C4C6] font-medium rounded-xl border border-[#00C4C6] hover:bg-[#00C4C6]/10 transition-all duration-300"
                  >
                    How it Works
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right - Dashboard Mockup */}
          <motion.div
            className="flex-1 w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl"

            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
              {/* Browser header */}
              <div className="bg-gray-50 px-4 py-3 flex items-center border-b border-gray-200">
                <div className="flex gap-2 mr-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 bg-white rounded py-1 px-3 text-xs text-gray-500 shadow-inner border border-gray-200 truncate">
                  https://app.expenzoid.com/dashboard
                </div>
              </div>

              {/* Responsive image with perfect ratio */}
              <div
                className="relative w-full"
                style={{ paddingBottom: `${(754 / 1933) * 100}%` }}
              >
                <Image
                  src={dashboardImage}
                  alt="Expenzoid Dashboard"
                  fill
                  className="object-cover object-left-top"
                  quality={100}
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              {/* Floating Action */}
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 flex items-center gap-2 cursor-pointer border border-gray-200 hover:bg-gray-50 transition"
              >
                <div className="bg-[#00C4C6]/10 p-2 rounded-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#00C4C6]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">
                  Scan Receipt
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
