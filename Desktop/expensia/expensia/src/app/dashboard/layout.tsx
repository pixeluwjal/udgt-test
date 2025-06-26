"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserButton } from "@clerk/nextjs";
import { FiHome, FiUpload, FiFileText, FiPieChart, FiDollarSign, FiMenu, FiX } from "react-icons/fi";
import { useState, useEffect } from "react";
import DashboardHome from "./DashboardHome";
import UploadSection from "./UploadSection";
import BillsList from "./BillsList";
import Analysis from "./Analysis";

export default function DashboardLayout() {
  const { userId } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3854] to-[#0A1A2E]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-[#06C3C3] text-4xl"
        >
          <FiDollarSign />
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", icon: <FiHome />, view: "dashboard" },
    { name: "Upload", icon: <FiUpload />, view: "upload" },
    { name: "Bills", icon: <FiFileText />, view: "bills" },
    { name: "Analytics", icon: <FiPieChart />, view: "analytics" },
  ];

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardHome />;
      case "upload":
        return <UploadSection />;
      case "bills":
        return <BillsList />;
      case "analytics":
        return <Analysis />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#1E3854] to-[#0A1A2E] overflow-hidden">
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#06C3C3] text-white shadow-lg"
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {(!isMobile || sidebarOpen) && (
          <motion.div
            initial={{ x: isMobile ? -300 : 0, opacity: isMobile ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isMobile ? -300 : 0, opacity: isMobile ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            className={`w-64 bg-[#1E3854] border-r border-[#06C3C3]/20 flex flex-col fixed h-full z-40`}
          >
            <div className="p-6 flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#06C3C3] flex items-center justify-center text-white">
                <FiDollarSign />
              </div>
              <span className="text-xl font-bold text-white">Expenzoid</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={item.view}
                  onClick={() => {
                    setCurrentView(item.view);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    currentView === item.view
                      ? "bg-[#06C3C3] text-white"
                      : "hover:bg-[#06C3C3]/20 text-gray-300"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </motion.div>
              ))}
            </nav>

            <div className="p-4 border-t border-[#06C3C3]/20">
              <div className="flex items-center space-x-3">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-8 h-8",
                      userButtonPopoverCard: "bg-[#1E3854] border border-[#06C3C3]/20",
                    },
                  }}
                />
                <div>
                  <p className="text-sm font-medium text-white">Your Account</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'ml-0' : 'ml-64'}`}>
        {/* Mobile Header */}
        {isMobile && (
          <div className="p-4 bg-[#1E3854] text-white flex justify-end items-center border-b border-[#06C3C3]/20">
            <div className="w-8 h-8">
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                  },
                }}
              />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}