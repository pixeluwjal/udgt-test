// app/seeker/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Sidebar from '@/app/components/Sidebar';
import Link from 'next/link';

// Define interfaces for data structure
interface DashboardStats {
  appliedJobs: number;
  interviews: number;
  savedJobs: number;
}

interface ApplicationDisplay {
  _id: string;
  job: {
    _id: string;
    title: string;
    location: string;
    salary: number;
  };
  status: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected';
  appliedAt: string;
}

export default function JobSeekerDashboardPage() {
  const { user, loading: authLoading, isAuthenticated, logout, token } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    appliedJobs: 0,
    interviews: 0,
    savedJobs: 0,
  });
  const [recentApplications, setRecentApplications] = useState<ApplicationDisplay[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);
  const [errorApplications, setErrorApplications] = useState<string | null>(null);

  // Redirection Logic
  useEffect(() => {
    if (authLoading) return; // Wait until auth loading is complete

    if (!isAuthenticated || !user) {
      console.warn('JobSeekerDashboardPage: Not authenticated or user missing. Redirecting to /login.');
      router.push('/login');
      return;
    }

    if (user.firstLogin) {
      console.warn('JobSeekerDashboardPage: User is firstLogin. Redirecting to /change-password.');
      router.push('/change-password');
      return;
    }

    // IMPORTANT: Redirect job_referrer to their own dashboard
    if (user.role === 'job_referrer') {
      console.warn('JobSeekerDashboardPage: User role is job_referrer. Redirecting to /referrer/dashboard.');
      router.push('/referrer/dashboard');
      return;
    }

    // Handle other roles trying to access seeker dashboard
    if (user.role !== 'job_seeker') {
      console.warn(`JobSeekerDashboardPage: User role is ${user.role}, not job_seeker. Redirecting.`);
      if (user.role === 'admin') router.push('/admin/dashboard');
      else if (user.role === 'job_poster') router.push('/poster/dashboard');
      else router.push('/'); // Fallback for unexpected roles
      return;
    }

    // Only job_seeker needs onboarding check
    if (user.role === 'job_seeker' && user.onboardingStatus !== 'completed') {
      console.warn('JobSeekerDashboardPage: Job Seeker, onboarding pending. Redirecting to /seeker/onboarding.');
      router.push('/seeker/onboarding');
      return;
    }
  }, [authLoading, isAuthenticated, user, router]); // Dependency array includes all variables used in the effect


  // Fetch Dashboard Stats (only if job_seeker and fully ready)
  const fetchStats = useCallback(async () => {
    // Added explicit checks here as well, though the useEffect below should handle it
    if (!token || !user?._id || user.role !== 'job_seeker' || user.onboardingStatus !== 'completed') {
      console.warn("Skipping fetchStats: Token/User ID not available or user not a completed job seeker.");
      setLoadingStats(false); // Ensure loading state is turned off
      return;
    }

    setLoadingStats(true);
    setErrorStats(null);
    try {
      const response = await fetch(`/api/seeker/stats?userId=${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch dashboard stats');
      }

      setStats({
        appliedJobs: data.appliedJobs || 0,
        interviews: data.interviews || 0,
        savedJobs: data.savedJobs || 0
      });
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      setErrorStats(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoadingStats(false);
    }
  }, [token, user]); // Dependencies ensure this function is re-created if token or user changes


  // Fetch Recent Applications (only if job_seeker and fully ready)
  const fetchRecentApplications = useCallback(async () => {
    // Added explicit checks here as well
    if (!token || !user?._id || user.role !== 'job_seeker' || user.onboardingStatus !== 'completed') {
      console.warn("Skipping fetchRecentApplications: Token/User ID not available or user not a completed job seeker.");
      setLoadingApplications(false); // Ensure loading state is turned off
      return;
    }

    setLoadingApplications(true);
    setErrorApplications(null);
    try {
      // Assuming /api/applications can take applicantId, limit, sortBy, sortOrder
      const response = await fetch(`/api/applications?applicantId=${user._id}&limit=3&sortBy=appliedAt&sortOrder=desc`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recent applications');
      }
      // Ensure data.applications is an array
      setRecentApplications(Array.isArray(data.applications) ? data.applications : []);
    } catch (err: any) {
      console.error('Failed to fetch recent applications:', err);
      setErrorApplications(err.message || 'Failed to load recent applications.');
      setRecentApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  }, [token, user]); // Dependencies ensure this function is re-created if token or user changes


  // This useEffect ensures data fetching only happens when all conditions are met
  useEffect(() => {
    // Only fetch data if auth is loaded, user is authenticated, user object exists,
    // AND the user is a job_seeker with completed onboarding
    if (
      !authLoading &&
      isAuthenticated &&
      user &&
      user.role === 'job_seeker' &&
      user.onboardingStatus === 'completed'
    ) {
      console.log('JobSeekerDashboardPage: All conditions met. Fetching dashboard data.');
      fetchStats();
      fetchRecentApplications();
    } else {
      // If conditions are not met, ensure loading states are reset and data cleared
      setStats({ appliedJobs: 0, interviews: 0, savedJobs: 0 });
      setRecentApplications([]);
      setLoadingStats(false);
      setLoadingApplications(false);
    }
  }, [authLoading, isAuthenticated, user, fetchStats, fetchRecentApplications]); // All dependencies are correctly listed


  // Show loading spinner if auth is still loading or user is not authorized/onboarded to view THIS page
  if (
    authLoading ||
    !isAuthenticated ||
    !user ||
    user.firstLogin ||
    user.role !== 'job_seeker' || // Only show this page if role is job_seeker
    user.onboardingStatus !== 'completed' // And onboarding is completed for job_seeker
  ) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="m-auto flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If we reach this point, the user is a fully authorized and onboarded job_seeker.
  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden font-inter">
      <Sidebar userRole={user.role} onLogout={logout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center">
          <span className="text-lg font-bold text-indigo-600">
            Job Seeker Dashboard
          </span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">
                  Welcome back, {user.username}!
                </h1>
                <p className="text-gray-500 text-lg">
                  Job Seeker Dashboard Overview
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex items-center justify-between transition-transform transform hover:scale-105 duration-200">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Jobs Applied</p>
                  {loadingStats ? (
                    <div className="h-8 w-12 bg-gray-200 animate-pulse rounded mt-2"></div>
                  ) : (
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{stats.appliedJobs}</h3>
                  )}
                </div>
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 shadow-sm">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex items-center justify-between transition-transform transform hover:scale-105 duration-200">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Upcoming Interviews</p>
                  {loadingStats ? (
                    <div className="h-8 w-12 bg-gray-200 animate-pulse rounded mt-2"></div>
                  ) : (
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{stats.interviews}</h3>
                  )}
                </div>
                <div className="p-3 rounded-full bg-green-100 text-green-600 shadow-sm">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex items-center justify-between transition-transform transform hover:scale-105 duration-200">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Saved Jobs</p>
                  {loadingStats ? (
                    <div className="h-8 w-12 bg-gray-200 animate-pulse rounded mt-2"></div>
                  ) : (
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{stats.savedJobs}</h3>
                  )}
                </div>
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 shadow-sm">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Recent Applications Section */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Your Recent Applications</h2>
                <Link href="/seeker/applications" passHref>
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center">
                    View All Applications
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </Link>
              </div>
              <div className="p-4 md:p-6">
                {loadingApplications ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                    <p className="ml-4 text-gray-700">Loading recent applications...</p>
                  </div>
                ) : errorApplications ? (
                  <div className="text-center py-8 text-red-500 font-medium">
                    {errorApplications}
                  </div>
                ) : recentApplications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    You haven't applied to any jobs recently.
                    <div className="mt-4">
                      <Link href="/seeker/job" passHref>
                        <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
                          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.55 23.55 0 0112 15c-1.606 0-3.14-.153-4.59-.445M21 4.87V11m0 0h-7.5M21 11l-3.25-3.25M12 3a9 9 0 100 18 9 9 0 000-18z" />
                          </svg>
                          Browse Jobs
                        </button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentApplications.map((app) => (
                      <div key={app._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{app.job.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{app.job.location}</p>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 6v2m0 6v2" /></svg>
                            <span className="font-medium">Salary:</span> ${app.job.salary.toLocaleString()}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="font-medium">Applied On:</span> {new Date(app.appliedAt).toLocaleDateString()}
                          </div>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              app.status === 'interview' ? 'bg-blue-100 text-blue-800' :
                              app.status === 'reviewed' ? 'bg-purple-100 text-purple-800' :
                              'bg-yellow-100 text-yellow-800'}`}
                          >
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </div>
                        <div className="mt-4">
                          <Link href={`/seeker/job/${app.job._id}`} passHref>
                            <button className="w-full text-indigo-600 hover:text-indigo-900 font-medium py-2 px-4 border border-indigo-200 rounded-md transition-colors duration-200">
                              View Job Details
                            </button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
