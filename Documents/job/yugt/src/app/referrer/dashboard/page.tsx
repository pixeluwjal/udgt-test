// app/referrer/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react'; // Removed FormEvent
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Sidebar from '@/app/components/Sidebar';

// Define interfaces for your referral data
interface RecentReferral {
  id: string;
  candidateName: string; // Keep this for display, will default to email if name not set by candidate
  candidateEmail: string;
  referredOn: string;
  referralCode: string; // Added referralCode
  // Removed 'status' as it relates to onboarding
}

interface ReferralSummary {
  totalReferrals: number;
  // Removed onboardingPendingReferrals and onboardingCompleteReferrals
  recentReferrals: RecentReferral[];
}

export default function ReferrerDashboardPage() {
  const { user, loading: authLoading, isAuthenticated, logout, token } = useAuth();
  const router = useRouter();

  // State for referral dashboard data
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Removed all state for new referral form and submission messages
  // const [newCandidateEmail, setNewCandidateEmail] = useState('');
  // const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);
  // const [referralSubmitMessage, setReferralSubmitMessage] = useState<string | null>(null);
  // const [referralSubmitError, setReferralSubmitError] = useState<string | null>(null);

  // --- Data Fetching Logic (Real API Call) ---
  const fetchReferralData = useCallback(async (referrerId: string, authToken: string) => {
    setDataLoading(true);
    setDataError(null);
    console.log(`Fetching real referral data for referrer ID: ${referrerId}`);

    try {
      const response = await fetch(`/api/referrer/dashboard-data?userId=${referrerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch referral data');
      }

      const data: ReferralSummary = await response.json();
      setReferralSummary(data);
      console.log('Referral data fetched successfully:', data);

    } catch (error: any) {
      console.error('Error fetching referral data:', error);
      setDataError(error.message || 'An unexpected error occurred while loading data.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  // --- Referral Submission Logic (REMOVED ENTIRELY) ---
  // const handleSubmitReferral = async (e: FormEvent) => { /* ... */ };


  // --- Authentication and Redirection Logic ---
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      console.warn('ReferrerDashboardPage: Not authenticated or user missing. Redirecting to /login.');
      router.push('/login');
      return;
    }

    if (user.firstLogin) {
      console.warn('ReferrerDashboardPage: User is firstLogin. Redirecting to /change-password.');
      router.push('/change-password');
      return;
    }

    if (user.role !== 'job_referrer') {
      console.warn(`ReferrerDashboardPage: User role is ${user.role}, not job_referrer. Redirecting.`);
      if (user.role === 'admin') router.push('/admin/dashboard');
      else if (user.role === 'job_poster') router.push('/poster/dashboard');
      else if (user.role === 'job_seeker') router.push('/seeker/dashboard');
      else router.push('/');
      return;
    }

    if (user._id && token) {
      fetchReferralData(user._id, token);
    } else if (user._id && !token) {
      console.error("ReferrerDashboardPage: Authentication token is missing, cannot fetch referral data.");
      setDataError("Authentication error: Please log in again.");
      setDataLoading(false);
    } else {
      console.error("ReferrerDashboardPage: User ID is missing, cannot fetch referral data.");
      setDataError("User ID not available to fetch referral data.");
      setDataLoading(false);
    }

  }, [authLoading, isAuthenticated, user, router, fetchReferralData, token]);


  if (authLoading || !isAuthenticated || !user || user.firstLogin || user.role !== 'job_referrer') {
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="m-auto flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-700">Loading referrer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden font-inter">
      <Sidebar userRole={user.role} onLogout={logout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center">
          <span className="text-lg font-bold text-teal-600">
            Referrer Dashboard
          </span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">
              Welcome, {user.username || 'Referrer'}!
            </h1>
            <p className="text-gray-600 text-lg">
              Here's an overview of the candidates you've referred to the portal.
            </p>

            {/* Referral Statistics Section - Simplified */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center justify-between col-span-full"> {/* Made it col-span-full for centering if only one stat */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Total Referrals</h2>
                  {dataLoading ? (
                    <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : dataError ? (
                    <p className="text-red-500 text-sm">{dataError}</p>
                  ) : (
                    <p className="text-4xl font-bold text-indigo-600">{referralSummary?.totalReferrals ?? 'N/A'}</p>
                  )}
                </div>
                <svg className="w-10 h-10 text-indigo-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.06-.665.06-1V11a5 5 0 00-5-5H5a5 5 0 00-5 5v6h17.07A2.001 2.001 0 0019 18H1c.546-1.55 1.77-2.909 3.44-3.72l1.638-1.092A2.001 2.001 0 018 12.01V15h4.168c.205 0 .408.01.609.03L12 17zM15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              {/* Removed Onboarding Complete and Pending Onboarding cards */}
            </div>

            {/* Submit New Referral Form (REMOVED ENTIRELY) */}
            {/* <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Refer a New Candidate to the Portal</h2>
              <form onSubmit={handleSubmitReferral} className="space-y-4">
                <div>
                  <label htmlFor="candidateEmail" className="block text-sm font-medium text-gray-700">Candidate Email</label>
                  <input
                    type="email"
                    id="candidateEmail"
                    value={newCandidateEmail}
                    onChange={(e) => setNewCandidateEmail(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                {referralSubmitMessage && (
                  <p className="text-sm text-green-600">{referralSubmitMessage}</p>
                )}
                {referralSubmitError && (
                  <p className="text-sm text-red-600">{referralSubmitError}</p>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingReferral}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReferral ? 'Submitting...' : 'Submit Referral'}
                </button>
              </form>
            </div> */}


            {/* Recent Referrals Section */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Referrals</h2>
              {dataLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => ( // Placeholder for 3 items
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : dataError ? (
                <p className="text-red-500 text-sm">{dataError}</p>
              ) : (referralSummary?.recentReferrals && referralSummary.recentReferrals.length > 0) ? (
                <ul className="divide-y divide-gray-200">
                  {referralSummary.recentReferrals.map((referral) => (
                    <li key={referral.id} className="py-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-medium text-gray-900 truncate">
                          {referral.candidateName} (<span className="text-gray-600">{referral.candidateEmail}</span>)
                        </p>
                        <p className="text-sm text-gray-500">
                          Referred On: {new Date(referral.referredOn).toLocaleDateString()}
                        </p>
                        {/* Display Referral Code */}
                        <p className="text-sm font-medium text-blue-700 mt-1">
                          Referral Code: <strong>{referral.referralCode}</strong>
                        </p>
                      </div>
                      {/* Removed Status display */}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No recent referrals to display.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}