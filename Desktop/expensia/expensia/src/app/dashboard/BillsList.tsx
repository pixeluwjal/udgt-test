"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUpload,
  FiTrash2,
  FiClock,
  FiDollarSign,
  FiCreditCard,
  FiShoppingBag,
  FiX,
  FiFileText,
  FiPrinter,
  FiDownload,
  FiEdit,
} from "react-icons/fi";

export default function BillsList() {
  const { userId } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletedBill, setDeletedBill] = useState<any>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchBills = async () => {
      try {
        const res = await fetch(`/api/bills?clerkId=${userId}`);
        if (!res.ok) throw new Error(await res.text());

        const { bills } = await res.json();
        setBills(bills || []);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Failed to fetch bills");
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [userId]);

const handleDelete = async (billId: string) => {
  const billToDelete = bills.find((b) => b._id === billId);
  if (!billToDelete) return;

  setDeletedBill(billToDelete);
  setBills((prev) => prev.filter((b) => b._id !== billId));
  setShowUndo(true);

  // Create a reference that won't change due to closures
  const shouldDelete = { current: true };

  const undoTimeout = setTimeout(async () => {
    if (!shouldDelete.current) return;

    try {
      const res = await fetch(`/api/bills/${billId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete bill');
      }
    } catch (err) {
      console.error('Delete error:', err);
      // Revert if deletion fails
      setBills((prev) => [...prev, billToDelete]);
    }
  }, 5000);

  // Cleanup function for undo
  return () => {
    clearTimeout(undoTimeout);
    shouldDelete.current = false;
  };
};

const handleUndo = () => {
  if (deletedBill) {
    setBills((prev) => [...prev, deletedBill]);
  }
  setShowUndo(false);
  setDeletedBill(null);
};



  const filteredBills = bills.filter(
    (bill) =>
      bill.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3854] to-[#0A1A2E] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Your <span className="text-[#06C3C3]">Bills</span>
            </h1>
            <p className="text-sm text-gray-400">
              Track and manage your expenses
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <input
                type="text"
                placeholder="Search bills..."
                className="w-full bg-[#1E3854]/70 border border-[#06C3C3]/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#06C3C3]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {showUndo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-[#1E3854] border border-[#06C3C3]/30 rounded-lg flex justify-between items-center"
          >
            <span className="text-white">Bill deleted</span>
            <button
              onClick={handleUndo}
              className="text-[#06C3C3] hover:text-white underline flex items-center gap-1"
            >
              Undo <FiClock className="text-sm" />
            </button>
          </motion.div>
        )}

        {filteredBills.length === 0 ? (
          <EmptyState hasSearch={searchTerm.length > 0} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredBills.map((bill) => (
                <BillCard
                  key={bill._id}
                  bill={bill}
                  onDelete={handleDelete}
                  onClick={() => setSelectedBill(bill)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedBill && (
          <BillDetailsModal
            bill={selectedBill}
            onClose={() => setSelectedBill(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const BillCard = ({
  bill,
  onDelete,
  onClick,
}: {
  bill: any;
  onDelete: (id: string) => void;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative bg-[#1E3854] rounded-xl overflow-hidden shadow-lg border border-[#06C3C3]/20 cursor-pointer group"
      onClick={onClick}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#06C3C3] to-[#1E3854]"></div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <FiShoppingBag className="text-[#06C3C3]" /> {bill.vendorName}
            </h3>
            <p className="text-sm text-gray-400">
              {bill.date}
            </p>
          </div>

        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#06C3C3]/10 rounded-lg">
              <FiDollarSign className="text-[#06C3C3]" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Amount</p>
              <p className="font-medium text-white">
                ₹{bill.total.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#06C3C3]/10 rounded-lg">
              <FiCreditCard className="text-[#06C3C3]" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Payment Method</p>
              <p className="font-medium text-white capitalize">
                {bill.paymentMethod}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#06C3C3]/10 rounded-lg">
              <FiClock className="text-[#06C3C3]" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Added On</p>
              <p className="font-medium text-white">
                {new Date(bill.createdAt).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BillDetailsModal = ({
  bill,
  onClose,
}: {
  bill: any;
  onClose: () => void;
}) => {
  const [isPrintView, setIsPrintView] = useState(false);

  const handlePrint = () => {
    setIsPrintView(true);
    setTimeout(() => {
      window.print();
      setIsPrintView(false);
    }, 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className={`relative bg-[#1E3854] rounded-2xl shadow-xl border border-[#06C3C3]/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
          isPrintView ? "print-mode" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#1E3854] z-10 p-4 border-b border-[#06C3C3]/20 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiFileText className="text-[#06C3C3]" />
            Bill Details
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Print"
            >
              <FiPrinter />
            </button>
            <button
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Download PDF"
            >
              <FiDownload />
            </button>
            <button
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Edit"
            >
              <FiEdit />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              <FiX />
            </button>
          </div>
        </div>

        <div className="p-6 print:p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                {bill.vendorName}
              </h2>
              <p className="text-gray-400 mt-1">
                {bill.date}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-sm text-gray-400">
                Added: {new Date(bill.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:gap-4 print:mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2 print:text-base">
                Vendor Details
              </h3>
              <div className="space-y-3 print:space-y-1">
                <div>
                  <p className="text-sm text-gray-400 print:text-xs">
                    Vendor Name
                  </p>
                  <p className="text-white print:text-sm">{bill.vendorName}</p>
                </div>
                {bill.vendorAddress && (
                  <div>
                    <p className="text-sm text-gray-400 print:text-xs">
                      Address
                    </p>
                    <p className="text-white print:text-sm">
                      {bill.vendorAddress}
                    </p>
                  </div>
                )}
                {bill.vendorGST && (
                  <div>
                    <p className="text-sm text-gray-400 print:text-xs">
                      GST Number
                    </p>
                    <p className="text-white print:text-sm">{bill.vendorGST}</p>
                  </div>
                )}
                {bill.vendorPhone && (
                  <div>
                    <p className="text-sm text-gray-400 print:text-xs">
                      Contact
                    </p>
                    <p className="text-white print:text-sm">
                      {bill.vendorPhone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2 print:text-base">
                Payment Information
              </h3>
              <div className="space-y-3 print:space-y-1">
                <div>
                  <p className="text-sm text-gray-400 print:text-xs">
                    Payment Method
                  </p>
                  <p className="text-white capitalize print:text-sm">
                    {bill.paymentMethod}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 print:text-xs">
                    Payment Date
                  </p>
                  <p className="text-white print:text-sm">{bill.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 print:text-xs">
                    Payment Status
                  </p>
                  <p className="text-white capitalize print:text-sm">
                    {bill.paid ? (
                      <span className="text-green-400">Paid</span>
                    ) : (
                      <span className="text-green-400">Paid</span>
                    )}
                  </p>
                </div>
                {bill.paymentReference && (
                  <div>
                    <p className="text-sm text-gray-400 print:text-xs">
                      Reference
                    </p>
                    <p className="text-white print:text-sm">
                      {bill.paymentReference}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-8 print:mb-4">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2 print:text-base">
              Items Breakdown
            </h3>
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full print:w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 text-gray-400 font-medium print:text-xs print:py-1">
                      Item
                    </th>
                    <th className="text-right py-3 text-gray-400 font-medium print:text-xs print:py-1">
                      Qty
                    </th>
                    <th className="text-right py-3 text-gray-400 font-medium print:text-xs print:py-1">
                      Price
                    </th>
                    <th className="text-right py-3 text-gray-400 font-medium print:text-xs print:py-1">
                      Tax
                    </th>
                    <th className="text-right py-3 text-gray-400 font-medium print:text-xs print:py-1">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items?.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className="border-b border-white/5 hover:bg-white/5 print:border-b print:border-gray-300"
                    >
                      <td className="py-3 text-white print:text-sm print:py-1">
                        {item.name || "Unnamed Item"}
                        {item.description && (
                          <p className="text-xs text-gray-400 print:text-xs">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3 text-right text-white print:text-sm print:py-1">
                        {item.quantity || 1}
                      </td>
                      <td className="py-3 text-right text-white print:text-sm print:py-1">
                        ₹{item.price?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 text-right text-white print:text-sm print:py-1">
                        {item.taxRate ? `${item.taxRate}%` : "N/A"}
                      </td>
                      <td className="py-3 text-right text-white print:text-sm print:py-1">
                        ₹
                        {(
                          (item.price || 0) *
                          (item.quantity || 1) *
                          (1 + (item.taxRate || 0) / 100)
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#06C3C3]/10 p-6 rounded-xl print:p-4">
            <div className="flex justify-end">
              <div className="w-full md:w-1/2 space-y-3 print:space-y-1">
                <div className="flex justify-between">
                  <p className="text-gray-400 print:text-xs">Subtotal</p>
                  <p className="text-white print:text-sm">
                    ₹{bill.subtotal?.toLocaleString() || "0"}
                  </p>
                </div>
                {bill.taxAmount && (
                  <div className="flex justify-between">
                    <p className="text-gray-400 print:text-xs">Tax</p>
                    <p className="text-white print:text-sm">
                      ₹{bill.taxAmount.toLocaleString()}
                    </p>
                  </div>
                )}
                {bill.discount && (
                  <div className="flex justify-between">
                    <p className="text-gray-400 print:text-xs">Discount</p>
                    <p className="text-white print:text-sm">
                      -₹{bill.discount.toLocaleString()}
                    </p>
                  </div>
                )}
                {bill.shipping && (
                  <div className="flex justify-between">
                    <p className="text-gray-400 print:text-xs">Shipping</p>
                    <p className="text-white print:text-sm">
                      ₹{bill.shipping.toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/10 pt-3 print:pt-1">
                  <p className="text-white font-semibold print:text-sm">
                    Total
                  </p>
                  <p className="text-[#06C3C3] font-bold text-xl print:text-lg">
                    ₹{bill.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {(bill.notes || bill.terms) && (
            <div className="mt-8 print:mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
              {bill.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 print:text-base">
                    Notes
                  </h3>
                  <p className="text-gray-300 bg-white/5 p-4 rounded-lg print:text-sm print:p-2 print:bg-transparent print:border print:border-gray-200">
                    {bill.notes}
                  </p>
                </div>
              )}
              {bill.terms && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 print:text-base">
                    Terms
                  </h3>
                  <p className="text-gray-300 bg-white/5 p-4 rounded-lg print:text-sm print:p-2 print:bg-transparent print:border print:border-gray-200">
                    {bill.terms}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#1E3854] to-[#0A1A2E] p-6">
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="h-10 w-48 bg-[#1E3854]/70 rounded-lg animate-pulse"></div>
        <div className="h-10 w-32 bg-[#06C3C3]/30 rounded-lg animate-pulse"></div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-64 bg-[#1E3854]/70 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
    </div>
  </div>
);

const EmptyState = ({ hasSearch }: { hasSearch: boolean }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.3 }}
    className="flex flex-col items-center justify-center py-16 text-center"
  >
    <div className="w-48 h-48 bg-[#1E3854] rounded-full flex items-center justify-center mb-6">
      <div className="w-32 h-32 bg-[#06C3C3]/10 rounded-full flex items-center justify-center">
        {hasSearch ? (
          <svg
            className="w-16 h-16 text-[#06C3C3]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        ) : (
          <FiUpload className="text-[#06C3C3] text-5xl" />
        )}
      </div>
    </div>
    <h3 className="text-2xl font-semibold text-white mb-2">
      {hasSearch ? "No bills found" : "No bills yet"}
    </h3>
    <p className="text-gray-400 max-w-md mb-6">
      {hasSearch
        ? "Try adjusting your search or filter to find what you're looking for."
        : "You haven't uploaded any bills yet. Click the button below to get started!"}
    </p>
    <button className="bg-[#06C3C3] hover:bg-[#04a8a8] text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2">
      <FiUpload /> {hasSearch ? "Clear Search" : "Upload Your First Bill"}
    </button>
  </motion.div>
);

const ErrorDisplay = ({ error }: { error: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-[#1E3854] to-[#0A1A2E] flex items-center justify-center p-6">
    <div className="max-w-md bg-[#1E3854] p-8 rounded-xl border border-red-500/30 text-center">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        Error Loading Bills
      </h3>
      <p className="text-gray-400 mb-6">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-[#06C3C3] hover:bg-[#04a8a8] text-white px-6 py-2 rounded-lg transition-all"
      >
        Try Again
      </button>
    </div>
  </div>
);

// Add this to your global CSS or styles
const styles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-mode, .print-mode * {
      visibility: visible;
    }
    .print-mode {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      max-width: 100%;
      border: none;
      box-shadow: none;
      background: white;
      color: black;
    }
    .print-mode .text-white {
      color: black !important;
    }
    .print-mode .text-gray-400 {
      color: #666 !important;
    }
    .print-mode .bg-[#1E3854] {
      background: white !important;
    }
    .print-mode .border-white {
      border-color: #ddd !important;
    }
  }
`;

// Inject the styles
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement);
}
