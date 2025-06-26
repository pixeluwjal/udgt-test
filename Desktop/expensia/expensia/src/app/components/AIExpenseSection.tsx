"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { useInView } from "framer-motion";
import analysis from "@/public/analysis.png";

export default function AIExpenseSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const features = [
    {
      title: "Instant AI extraction",
      description: "From receipts & invoices with 99% accuracy",
      icon: (
        <svg className="w-5 h-5 text-[#00C4C6]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm10 7h-3v3h-2v-3H6v-2h3V6h2v3h3v2z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Smart categorization",
      description: "Automatic organization of all expenses",
      icon: (
        <svg className="w-5 h-5 text-[#00C4C6]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
        </svg>
      )
    },
    {
      title: "Detailed analytics",
      description: "Track monthly trends and spending patterns",
      icon: (
        <svg className="w-5 h-5 text-[#00C4C6]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
      )
    }
  ];

  return (
    <section id="ai-expense" ref={ref} className="w-full bg-gradient-to-br from-[#f8fafc] via-white to-[#f1f5f9] py-28 px-6 overflow-hidden relative">
      
      {/* Floating Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-[#00C4C6]/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.5, 0.8] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-[#00a8a6]/10 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* Left Text Content */}
        <motion.div initial={{ opacity: 0, x: -50 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}>
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-[#00C4C6]/10 to-[#00a8a6]/10 rounded-full text-[#00a8a6] font-medium mb-4 border border-[#00C4C6]/20">
            Smart Expense Tracking
          </span>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#223C5F] mb-6 leading-tight">
            <span className="relative inline-block">
              <span className="relative z-10">AI-Powered</span>
              <motion.span className="absolute bottom-0 left-0 w-full h-3 bg-[#00C4C6]/30 -z-0"
                initial={{ scaleX: 0 }} animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C4C6] to-[#00a8a6]">
              Expense Insights
            </span>
          </h2>

          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl leading-relaxed">
            Our intelligent system scans your bills, receipts, and transactions to deliver accurate, real-time expense reports — no manual entry, no stress.
          </p>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-[#00C4C6]/20"
                whileHover={{ y: -5 }} initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              >
                <div className="w-12 h-12 bg-[#00C4C6]/10 rounded-lg flex items-center justify-center">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Image and Cards */}
        <motion.div className="relative" initial={{ opacity: 0, scale: 0.9 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.6, delay: 0.4 }}>
          
          <div className="relative w-full max-w-xl mx-auto">
            
            {/* Floating Top Card */}
            <motion.div className="absolute -top-8 -left-8 w-32 h-32 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10"
              animate={{ y: [0, 10, 0], rotate: [0, -2, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#00C4C6]/10 to-[#00a8a6]/10" />
              <div className="p-4">
                <div className="w-8 h-8 bg-[#00C4C6]/20 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#00C4C6]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm10 7h-3v3h-2v-3H6v-2h3V6h2v3h3v2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-700 text-sm">Receipt Scan</h4>
                <p className="text-xs text-gray-500 mt-1">$24.95 • Coffee</p>
              </div>
            </motion.div>

            {/* Floating Bottom Card */}
            <motion.div className="absolute -bottom-6 -right-6 w-40 h-40 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10"
              animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#00a8a6]/10 to-[#00C4C6]/10" />
              <div className="p-4">
                <div className="w-8 h-8 bg-[#00a8a6]/20 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#00a8a6]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-700 text-sm">Monthly Report</h4>
                <p className="text-xs text-gray-500 mt-1">$1,245 • June 2023</p>
              </div>
            </motion.div>

            {/* Main Image */}
            <motion.div initial={{ opacity: 0, y: 50 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.6 }}>
              <Image
                src={analysis}
                alt="AI Expense Extraction"
                width={1000}
                height={700}
                className="rounded-3xl shadow-2xl border-8 border-white object-cover hover:scale-[1.02] transition-transform"
                priority
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
