"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSignUp, useAuth } from "@clerk/nextjs";

export default function PremiumSignUp() {
  const { isLoaded, signUp } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [verificationCode, setVerificationCode] = useState("");
  const [activeStep, setActiveStep] = useState<"form" | "verify">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);

  useEffect(() => {
    setPasswordMatch(
      formData.password === formData.confirmPassword || !formData.confirmPassword
    );
  }, [formData.password, formData.confirmPassword]);

  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const storeUserInDB = async (userId: string, email: string) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerkUserId: userId,
          email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          plan: "premium",
          verified: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to store user in database");
      }
      return await response.json();
    } catch (err) {
      console.error("Database storage error:", err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords don't match");
      }

      const result = await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        unsafeMetadata: { plan: "premium" },
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setActiveStep("verify");
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.errors?.[0]?.message || err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === "complete") {
        if (!completeSignUp.createdUserId) {
          throw new Error("User ID not available after verification");
        }

        await storeUserInDB(completeSignUp.createdUserId, formData.email);

        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 3000);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.errors?.[0]?.message || err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (isSignedIn) return null; // Hide component if user is signed in

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              {activeStep === "form" ? "Create Premium Account" : "Verify Email"}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm">
                {error}
              </div>
            )}

            {success ? (
              <div className="text-center py-4">
                <div className="text-green-600 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 font-medium">Account verified successfully!</p>
                </div>
                <p className="text-gray-600 mb-4">You'll be redirected to sign in shortly...</p>
              </div>
            ) : activeStep === "form" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="John"
                      className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Doe"
                      className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="your@email.com"
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input name="password" type="password" value={formData.password} onChange={handleChange} required minLength={8} placeholder="••••••••"
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required minLength={8} placeholder="••••••••"
                    className={`w-full border px-4 py-2 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent ${passwordMatch ? "border-gray-300" : "border-red-500"}`} />
                  {!passwordMatch && formData.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">Passwords don't match</p>
                  )}
                </div>

                <button type="submit" disabled={loading || !isLoaded || !passwordMatch}
                  className={`w-full bg-teal-600 text-white py-3 rounded-md hover:bg-teal-700 transition-colors ${loading || !isLoaded || !passwordMatch ? "opacity-70 cursor-not-allowed" : ""}`}>
                  {loading ? "Processing..." : "Create Account"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerification} className="space-y-4">
                <div className="text-center mb-6">
                  <svg className="w-16 h-16 mx-auto text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Verify Your Email</h3>
                  <p className="mt-1 text-sm text-gray-500">We've sent a verification code to <span className="font-medium">{formData.email}</span></p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                  <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} required placeholder="Enter 6-digit code"
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>

                <button type="submit" disabled={loading || !isLoaded}
                  className={`w-full bg-teal-600 text-white py-3 rounded-md hover:bg-teal-700 transition-colors ${loading || !isLoaded ? "opacity-70 cursor-not-allowed" : ""}`}>
                  {loading ? "Verifying..." : "Verify Email"}
                </button>

                <div className="text-center text-sm text-gray-500 mt-4">
                  Didn't receive a code?{" "}
                  <button type="button" onClick={async () => {
                    try {
                      await signUp?.prepareEmailAddressVerification({ strategy: "email_code" });
                    } catch (err) {
                      console.error("Resend error:", err);
                    }
                  }} className="text-teal-600 hover:text-teal-500 font-medium">Resend code</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
