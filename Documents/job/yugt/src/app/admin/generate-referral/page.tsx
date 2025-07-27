// app/admin/generate-referral/page.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar'; // Import the Sidebar component

export default function GenerateReferralPage() {
  const [email, setEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Removed local sidebar state as it's managed by the Sidebar component itself
  // const [sidebarOpen, setSidebarOpen] = useState(true);
  // const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { user: currentUser, loading: authLoading, isAuthenticated, token, logout } = useAuth();
  const router = useRouter();

  // No longer need this useEffect for sidebar resize, as Sidebar handles its own responsiveness
  // useEffect(() => {
  //   const handleResize = () => {
  //     if (window.innerWidth >= 768) {
  //       setMobileSidebarOpen(false);
  //     }
  //   };
  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, []);

  // Redirect logic: Only admins should access this page
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !currentUser) {
      console.warn('GenerateReferralPage: Not authenticated or user missing. Redirecting to /login.');
      router.push('/login');
      return;
    }

    if (currentUser.firstLogin) {
      console.warn('GenerateReferralPage: User is firstLogin. Redirecting to /change-password.');
      router.push('/change-password');
      return;
    }

    if (currentUser.role !== 'admin') {
      console.warn(`GenerateReferralPage: User role is ${currentUser.role}, not an admin. Redirecting to their dashboard.`);
      if (currentUser.role === 'job_poster') router.push('/poster/dashboard');
      else if (currentUser.role === 'job_seeker') router.push('/seeker/dashboard'); // Added job_seeker redirect
      else router.push('/'); // Fallback for other roles
      return;
    }
    // If we reach here, user is an authenticated admin and not firstLogin.
  }, [authLoading, isAuthenticated, currentUser, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setGeneratedCode(null);
    setExpiresAt(null);
    setLoading(true);

    if (!token) {
      setError('Authentication token missing. Please log in again.');
      setLoading(false);
      return;
    }

    if (!email) {
      setError('Please provide an email address.');
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/generate-referral-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // FIX: Change 'email' to 'candidateEmail' to match backend expectation
        body: JSON.stringify({ candidateEmail: email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate referral code');
      }

      setMessage(data.message || 'Referral code generated successfully!');
      setGeneratedCode(data.code); // Backend sends 'code', not 'referralCode'
      setExpiresAt(new Date(data.expiresAt).toLocaleDateString()); // Format date nicely
      setEmail(''); // Clear email field after success
      console.log('Referral Code Generated:', data);

    } catch (err: any) {
      console.error('Generate referral code error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !isAuthenticated || !currentUser || currentUser.firstLogin || currentUser.role !== 'admin') {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="m-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden font-inter">
      {/* Sidebar Component */}
      <Sidebar userRole={currentUser.role} onLogout={logout} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile header (simplified, as logout is now handled by Sidebar) */}
        <div className="md:hidden bg-white shadow-sm p-4 flex justify-end items-center">
          <span className="text-lg font-bold text-indigo-600">Admin Panel</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8"> {/* Enhanced shadow and border */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Generate Referral Code</h2>
              <Link href="/admin/dashboard" passHref>
                <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md transform hover:scale-105"> {/* Enhanced button style */}
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Dashboard
                </button>
              </Link>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Candidate Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200" // Enhanced input style
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading} // Disable input while loading
                    placeholder="candidate@example.com"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-100 border-l-4 border-red-500 rounded-r-lg shadow-sm" role="alert"> {/* Enhanced error message style */}
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-sm text-red-700 font-medium">{error}</span>
                  </div>
                </div>
              )}

              {message && (
                <div className="p-3 bg-green-100 border-l-4 border-green-500 rounded-r-lg shadow-sm" role="alert"> {/* Enhanced success message style */}
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-sm text-green-700 font-medium">{message}</span>
                  </div>
                </div>
              )}

              {generatedCode && (
                <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-lg shadow-sm"> {/* Enhanced generated code display */}
                  <div className="flex items-center mb-2">
                    <svg className="h-5 w-5 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-semibold text-gray-900">Generated Referral Code</h3>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-indigo-100 mb-2">
                    <code className="font-mono text-lg break-all text-indigo-700">{generatedCode}</code>
                  </div>
                  <p className="text-sm text-indigo-600">Expires on: <span className="font-medium">{expiresAt}</span></p>
                  <p className="text-sm text-indigo-600 mt-1">An email with this code has been sent to the candidate.</p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ${loading ? 'opacity-80 cursor-not-allowed' : 'hover:shadow-xl transform hover:-translate-y-0.5'}`} // Further enhanced button style
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Code'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
