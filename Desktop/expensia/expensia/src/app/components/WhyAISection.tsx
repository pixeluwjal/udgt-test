"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import bill from "@/public/bill.png";

export default function WhyAISection() {
  const router = useRouter();

  const handleSignupClick = () => {
    router.push('/sign-up');
  };

  return (
    <section className="w-full py-24 bg-gradient-to-b from-[#f0f9ff] to-white px-6 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-[#00C4C6]/10 blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#223C5F]/10 blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
        
        {/* Left Image - Enhanced with floating animation */}
        <motion.div 
          className="flex-1 relative"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div
            animate={{
              y: [0, -15, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative"
          >
            <Image 
              src={bill}
              alt="AI Automation"
              width={600}
              height={600}
              className="rounded-3xl shadow-2xl object-cover w-full border-8 border-white"
            />
            {/* Floating badge */}
            <motion.div 
              className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#00C4C6]/20 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00C4C6]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-bold text-[#223C5F]">94% Accuracy</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right Content - Enhanced with staggered animations */}
        <motion.div 
          className="flex-1"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-block mb-4 text-[#00C4C6] font-semibold bg-[#00C4C6]/10 px-4 py-1.5 rounded-full text-sm">
              AI-POWERED EFFICIENCY
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-[#223C5F] mb-6 leading-tight">
              Transform Your <span className="text-[#00C4C6]">Expense Tracking</span> with AI
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-lg">
              Manual expense tracking is outdated. Expenzoid's advanced AI extracts data instantly, eliminates errors, and provides real-time financial insights — saving you hours every week.
            </p>
          </motion.div>

          <ul className="space-y-5">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00C4C6]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H5a1 1 0 010-2h1V4zm3 1h2v2H7V5zm0 4h2v2H7V9zm0 4h2v2H7v-2z" clipRule="evenodd" />
                  </svg>
                ),
                text: "Scan receipts with your phone and let AI extract all details instantly",
                delay: 0.3
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00C4C6]" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                ),
                text: "Automated categorization and reporting with 94% accuracy",
                delay: 0.4
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00C4C6]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                ),
                text: "Smart spending insights and predictive budgeting",
                delay: 0.5
              }
            ].map((item, index) => (
              <motion.li 
                key={index}
                className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: item.delay }}
                viewport={{ once: true }}
              >
                <div className="p-3 bg-[#00C4C6]/10 rounded-lg flex-shrink-0">
                  {item.icon}
                </div>
                <span className="text-gray-700 font-medium">{item.text}</span>
              </motion.li>
            ))}
          </ul>

          {/* CTA Button with hover animation */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.button 
              className="px-8 py-4 bg-gradient-to-r from-[#00C4C6] to-[#00A8C6] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignupClick}
            >
              Try AI Expense Tracking Free
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}