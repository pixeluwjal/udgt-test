"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const colors = {
    primary: "#00C4C6",
    primaryDark: "#00a8a6",
    secondary: "#223C5F",
    lightBg: "#f8fafc",
    white: "#ffffff",
    gray: "#64748b",
    grayLight: "#e2e8f0"
  };

  const steps = [
    {
      title: "Snap Your Receipt",
      description: "Capture any receipt with your phone camera in seconds",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      title: "AI Extracts Data",
      description: "Our AI automatically reads and categorizes all expenses",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      )
    },
    {
      title: "Track & Analyze",
      description: "Get real-time insights and spending trends",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  return (
    <section id="how-it-works" ref={ref} className="w-full py-24 px-6 relative overflow-hidden" style={{ backgroundColor: colors.lightBg }}>
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <span className="inline-block px-5 py-2 rounded-full font-medium mb-6 border" style={{ backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20`, color: colors.primaryDark }}>
            Effortless Expense Tracking
          </span>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ color: colors.secondary }}>
            How <span style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Expenzoid</span> Works
          </h2>

          <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.gray }}>
            AI expense tracking simplified. No complicated steps. Just scan, extract, track.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div key={index} className="relative group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:shadow-lg transition-all duration-300" initial={{ opacity: 0, y: 50 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 * index }}>
              
              <div className="w-14 h-14 flex items-center justify-center rounded-lg mb-4" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`, color: colors.white }}>
                {step.icon}
              </div>

              <h3 className="text-xl font-bold mb-2" style={{ color: colors.secondary }}>{step.title}</h3>
              <p className="text-gray-500">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
