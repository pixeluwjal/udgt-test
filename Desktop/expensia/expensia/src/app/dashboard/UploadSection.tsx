"use client";

import { useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

export default function UploadSection() {
  const { user } = useUser();
  const clerkId = user?.id;

  const [image, setImage] = useState<File | null>(null);
  const [billData, setBillData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImage(e.target.files[0]);
      setBillData(null);
      setError(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImage(e.dataTransfer.files[0]);
      setBillData(null);
      setError(null);
    }
  };

  const saveBillToDB = async (data: any) => {
    if (!clerkId) {
      console.error("User not authenticated.");
      return;
    }

    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId,
          vendorName: data.vendorName,
          date: data.date,
          items: data.items,
          subtotal: data.subtotal,
          tax: data.tax,
          total: data.total,
          paymentMethod: data.paymentMethod,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
    } catch (err: any) {
      console.error("Failed to save bill:", err);
      setError(err?.message || "Failed to save bill data");
    }
  };

  const extractBillData = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(await response.text());

      const { data } = await response.json();
      setBillData(data);
      await saveBillToDB(data);
    } catch (err: any) {
      console.error("Error extracting bill:", err);
      setError(err?.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#213C5A] to-[#0A1E2F] py-12 px-4">
      <main className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden shadow-2xl border border-white/20">
          {/* Header */}
          <div className="bg-[#213C5A] p-6">
            <h2 className="text-3xl font-bold text-center text-white">
              <span className="text-[#05C8C6]">Smart</span> Receipt Scanner
            </h2>
            <p className="text-center text-white/80 mt-2">
              Upload your receipt and let AI extract all the details
            </p>
          </div>

          {/* Upload Area */}
          <div className="p-8">
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${dragActive ? "border-[#05C8C6] bg-[#05C8C6]/10" : "border-gray-300/30"}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-[#05C8C6]/20 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-[#05C8C6]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-white">
                    {image ? image.name : "Drag & drop your receipt here"}
                  </p>
                  <p className="text-sm text-white/60 mt-1">
                    {image ? "Ready to process!" : "or click to browse files"}
                  </p>
                </div>
                <label className="cursor-pointer bg-[#05C8C6] hover:bg-[#04b4b2] text-white font-medium py-2 px-6 rounded-full transition-colors duration-300">
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Preview */}
            {image && (
              <div className="mt-8 flex justify-center">
                <div className="relative group overflow-hidden rounded-lg shadow-lg border-2 border-white/20">
                  <Image
                    src={URL.createObjectURL(image)}
                    alt="Receipt preview"
                    width={400}
                    height={300}
                    className="object-contain max-h-64"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => setImage(null)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={extractBillData}
                disabled={!image || loading}
                className={`relative overflow-hidden bg-gradient-to-r from-[#05C8C6] to-[#00A8A6] text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${!image || loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? (
                  <>
                    <span className="relative z-10 flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-[#05C8C6] to-[#00A8A6] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Extract Bill Data</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-[#05C8C6] to-[#00A8A6] opacity-0 hover:opacity-100 transition-opacity"></span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Results */}
            {billData && (
              <div className="mt-10 bg-[#213C5A] rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-[#05C8C6]">
                    Extracted Bill Details
                  </h3>
                  <span className="bg-[#05C8C6]/20 text-[#05C8C6] px-3 py-1 rounded-full text-sm font-medium">
                    Success!
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Vendor Info */}
                  <div className="bg-white/5 p-5 rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-3 border-b border-white/10 pb-2">
                      Vendor Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/70">Vendor Name</span>
                        <span className="font-medium text-white">
                          {billData.vendorName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Date</span>
                        <span className="font-medium text-white">
                          {billData.date}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Payment Method</span>
                        <span className="font-medium text-white">
                          {billData.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="bg-white/5 p-5 rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-3 border-b border-white/10 pb-2">
                      Transaction Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/70">Subtotal</span>
                        <span className="font-medium text-white">
                          ₹{billData.subtotal}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Tax</span>
                        <span className="font-medium text-white">
                          ₹{billData.tax}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-2">
                        <span className="text-white/70 font-bold">Total</span>
                        <span className="font-bold text-[#05C8C6] text-lg">
                          ₹{billData.total}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="mt-6 bg-white/5 p-5 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2">
                    Purchased Items ({billData.items?.length || 0})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {billData.items?.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-3 whitespace-nowrap text-white">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-white">
                              ₹{item.price}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}