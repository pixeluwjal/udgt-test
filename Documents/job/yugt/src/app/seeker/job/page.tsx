// app/seeker/jobs/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Sidebar from '@/app/components/Sidebar';
import Link from 'next/link';

// Define a more specific Job interface
interface Job {
  _id: string;
  title: string;
  description: string;
  location: string;
  salary: number;
  company?: string;
  companyLogo?: string;
  jobType?: string;
  skills?: string[];
  createdAt: string; // ISO date string
  isSaved?: boolean; // Add isSaved property to track saved status
}

export default function JobSeekerJobsPage() {
  const { user, loading: authLoading, isAuthenticated, logout, token } = useAuth();
  const router = useRouter();

  // --- DEBUGGING LOG ---
  // This log will fire on every render, helping us see the state of `user` and `authLoading`
  console.log('JobSeekerJobsPage Render:', { user, authLoading, isAuthenticated, token: token ? 'present' : 'missing' });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true); // Initial loading for page
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<{ [jobId: string]: string }>({});
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(9); // Display 9 jobs per page
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  // --- Data Fetching Logic for Applications (to check applied status) ---
  const fetchApplicationStatuses = useCallback(async (jobIds: string[], applicantId: string) => {
    if (!token || jobIds.length === 0 || !applicantId) {
      console.log("Skipping fetchApplicationStatuses: Missing token, applicantId, or jobIds.");
      return {};
    }
    console.log(`fetchApplicationStatuses: Fetching for applicantId: ${applicantId} and ${jobIds.length} jobIds.`);

    try {
      const response = await fetch(`/api/applications?jobIds=${jobIds.join(',')}&applicantId=${applicantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok && Array.isArray(data.applications)) {
        const statusMap: { [jobId: string]: string } = {};
        data.applications.forEach((app: any) => {
          if (app.job && app.job._id) { // Ensure job._id exists
            statusMap[app.job._id] = 'Applied';
          } else {
            console.warn('Application object missing job or job._id from backend for app:', app);
          }
        });
        console.log('fetchApplicationStatuses: Fetched status map:', statusMap);
        return statusMap;
      } else {
        console.error('fetchApplicationStatuses: Error fetching applications status:', data.error || 'Invalid response');
        return {};
      }
    } catch (error) {
      console.error('fetchApplicationStatuses: Caught error:', error);
      return {};
    }
  }, [token]);

  // --- Data Fetching Logic for Saved Jobs (to check saved status) ---
  const fetchSavedJobStatuses = useCallback(async (applicantId: string) => {
    if (!token || !applicantId) {
        console.log("Skipping fetchSavedJobStatuses: Missing token or applicantId.");
        return [];
    }
    console.log(`fetchSavedJobStatuses: Fetching for applicantId: ${applicantId}.`);

    try {
      const response = await fetch(`/api/seeker/saved-jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data.savedJobs)) {
        const savedJobIds = data.savedJobs.map((savedJob: any) => savedJob.job._id);
        console.log('fetchSavedJobStatuses: Fetched saved job IDs:', savedJobIds);
        return savedJobIds;
      } else {
        console.error('fetchSavedJobStatuses: Error fetching saved jobs status:', data.error || 'Invalid response');
        return [];
      }
    } catch (error) {
      console.error('fetchSavedJobStatuses: Caught error:', error);
      return [];
    }
  }, [token]);

  // --- Data Fetching Logic for Jobs ---
  const fetchJobs = useCallback(async (page: number, limit: number, currentUserId: string | null | undefined) => {
    setLoading(true); // Indicate loading for jobs specific to this fetch
    setError(null);
    setMessage(null);
    console.log(`fetchJobs: Attempting to fetch jobs for page ${page}, limit ${limit}. User ID: ${currentUserId}`);

    try {
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        setLoading(false);
        return;
      }
      
      let url = '/api/jobs';
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (locationFilter) params.append('location', locationFilter);
      if (salaryFilter) params.append('minSalary', salaryFilter);
      
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      if (Array.isArray(data.jobs)) {
        const fetchedJobs: Job[] = data.jobs;
        setTotalJobs(data.totalJobs || 0);
        setTotalPages(Math.ceil((data.totalJobs || 0) / jobsPerPage));

        let appliedStatusMap: { [jobId: string]: string } = {};
        let savedJobsList: string[] = [];

        // ONLY fetch statuses if currentUserId is valid
        if (currentUserId) {
            console.log('fetchJobs: User ID available. Fetching application and saved job statuses.');
            [appliedStatusMap, savedJobsList] = await Promise.all([
                fetchApplicationStatuses(fetchedJobs.map(job => job._id), currentUserId),
                fetchSavedJobStatuses(currentUserId)
            ]);
        } else {
            console.warn('fetchJobs: User ID is null or undefined. Cannot fetch application/saved statuses for this batch of jobs.');
            // Optionally, clear existing statuses if the user ID becomes unavailable
            setApplicationStatus({}); 
            setJobs(fetchedJobs.map(job => ({ ...job, isSaved: false }))); // Ensure no saved status
        }

        const updatedJobs = fetchedJobs.map(job => ({
          ...job,
          isSaved: savedJobsList.includes(job._id)
        }));
        
        setJobs(updatedJobs);
        if (currentUserId) { // Only update if we actually fetched statuses
            setApplicationStatus(appliedStatusMap);
        } else {
            // If currentUserId was null, ensure applicationStatus is reset
            setApplicationStatus({});
        }

      } else {
        setError('Invalid data format from server');
        setJobs([]);
        setTotalJobs(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('fetchJobs: Caught error:', err);
      setError(err.message || 'Failed to load jobs');
      setJobs([]);
      setTotalJobs(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [token, searchTerm, locationFilter, salaryFilter, jobsPerPage, fetchApplicationStatuses, fetchSavedJobStatuses]);


  // --- Redirection and Initial Data Fetch Logic ---
  useEffect(() => {
    console.log('useEffect: Running. authLoading:', authLoading, 'isAuthenticated:', isAuthenticated, 'user:', user);

    // Stage 1: Initial auth check & loading state
    if (authLoading) {
      setLoading(true); // Keep main page loading indicator active
      return;
    }

    // Stage 2: Authentication and role-based redirection
    if (!isAuthenticated || !user) {
      console.warn('useEffect: Not authenticated or user missing. Redirecting to /login.');
      router.push('/login');
      return;
    }
    if (user.firstLogin) {
      console.warn('useEffect: User is firstLogin. Redirecting to /change-password.');
      router.push('/change-password');
      return;
    }
    if (user.role !== 'job_seeker') {
      console.warn(`useEffect: User role is ${user.role}, not a job_seeker. Redirecting.`);
      if (user.role === 'admin') router.push('/admin/dashboard');
      else if (user.role === 'job_poster') router.push('/poster/dashboard');
      else router.push('/');
      return;
    }
    if (user.role === 'job_seeker' && user.onboardingStatus !== 'completed') {
      console.warn('useEffect: Job Seeker onboarding not completed. Redirecting to /seeker/onboarding.');
      router.push('/seeker/onboarding');
      return;
    }

    // Stage 3: User is authenticated, correct role, and onboarding completed.
    // Now, ensure user._id is available before triggering job fetch with status calls.
    // This condition ensures fetchJobs is called only when user is fully ready.
    if (user._id) { 
      console.log('useEffect: User ID confirmed:', user._id, '. Triggering fetchJobs...');
      // Pass user._id explicitly to fetchJobs
      fetchJobs(currentPage, jobsPerPage, user._id);
    } else {
      // This else block indicates a deeper issue if user is supposedly authenticated but has no _id
      console.error('useEffect: CRITICAL - User object is present but _id is missing after all checks. User:', user);
      setError('User ID could not be retrieved. Please try logging in again.');
      setLoading(false); // Stop loading if we can't proceed
    }

  }, [
    authLoading,
    isAuthenticated,
    user, // Dependency on the user object itself
    router,
    currentPage,
    jobsPerPage,
    searchTerm,
    locationFilter,
    salaryFilter,
    token,
    fetchJobs // fetchJobs is a useCallback, so it's a dependency
  ]);


  // --- Handle Apply Button Click ---
  const handleApply = async (jobId: string) => {
    if (!token) {
      setError('You must be logged in to apply');
      return;
    }
    if (!user?._id) { // User ID must be available to apply
      setError('User information missing. Cannot apply for job.');
      return;
    }

    setApplicationStatus(prev => ({ ...prev, [jobId]: 'Applying...' }));
    setError(null);
    setMessage(null);
    
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId, applicantId: user._id })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply');
      }

      // After successful application, update the status for this specific job
      setApplicationStatus(prev => ({ ...prev, [jobId]: 'Applied' }));
      setMessage('Application submitted successfully!');
    } catch (err: any) {
      console.error('handleApply: Caught error:', err);
      setApplicationStatus(prev => ({ ...prev, [jobId]: 'Failed' }));
      setError(err.message || 'Failed to apply for job');
    }
  };

  // --- Handle Save/Unsave Job Button Click ---
  const handleSaveUnsaveJob = async (jobId: string, isCurrentlySaved: boolean) => {
    if (!token) {
      setError('You must be logged in to save jobs.');
      return;
    }
    if (!user?._id) { // User ID must be available to save/unsave
      setError('User information missing. Cannot save job.');
      return;
    }

    // Optimistically update UI
    setJobs(prevJobs => prevJobs.map(job => 
      job._id === jobId ? { ...job, isSaved: !isCurrentlySaved } : job
    ));
    setMessage(isCurrentlySaved ? 'Unsaving job...' : 'Saving job...');
    setError(null);

    try {
      const method = isCurrentlySaved ? 'DELETE' : 'POST';
      const url = isCurrentlySaved ? `/api/seeker/saved-jobs?jobId=${jobId}` : '/api/seeker/saved-jobs';
      const body = isCurrentlySaved ? null : JSON.stringify({ jobId, applicantId: user._id }); // Backend might infer applicantId from token

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body
      });

      const data = await response.json();

      if (!response.ok) {
        // Revert optimistic update on error
        setJobs(prevJobs => prevJobs.map(job => 
          job._id === jobId ? { ...job, isSaved: isCurrentlySaved } : job
        ));
        throw new Error(data.error || `Failed to ${isCurrentlySaved ? 'unsave' : 'save'} job`);
      }

      setMessage(data.message || `Job ${isCurrentlySaved ? 'unsaved' : 'saved'} successfully!`);
      // No need to re-fetch all jobs here, optimistic update is sufficient.
      // If a full re-sync is needed (e.g., if saved jobs list is displayed elsewhere),
      // you'd call fetchJobs(currentPage, jobsPerPage, user._id) here.
    } catch (err: any) {
      console.error('handleSaveUnsaveJob: Caught error:', err);
      setError(err.message || `Failed to ${isCurrentlySaved ? 'unsave' : 'save'} job`);
      // Revert optimistic update on error (already done above)
    }
  };

  // --- Handle Filter Application ---
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters change
    // The useEffect hook will now automatically trigger fetchJobs due to filter state changes
  };

  // --- Handle Pagination Clicks ---
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // The useEffect hook will now automatically trigger fetchJobs due to currentPage change
    }
  };

  // --- Conditional Rendering for Loading/Unauthorized States ---
  // This initial loading state should cover the period while auth is being determined
  if (authLoading || !isAuthenticated || !user || user.firstLogin || 
      (user.role === 'job_seeker' && user.onboardingStatus !== 'completed')) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="m-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // --- Main Component Render ---
  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden font-inter">
      <Sidebar userRole={user.role} onLogout={logout} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="md:hidden bg-white shadow-sm p-4 flex justify-end items-center">
          <span className="text-lg font-bold text-indigo-600">JobPortal</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">Browse Jobs</h1>
                <p className="text-gray-500 text-lg">Find your next career opportunity</p>
              </div>
              <Link href="/seeker/dashboard" passHref>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition duration-200 shadow-sm">
                  Back to Dashboard
                </button>
              </Link>
            </div>

            <div className="sticky top-0 z-10 bg-gradient-to-r from-white to-gray-50 py-4 mb-6 shadow-lg rounded-xl border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Keywords</label>
                  <input
                    type="text"
                    id="search"
                    placeholder="e.g., Software Engineer, React"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    id="location"
                    placeholder="e.g., New York, Remote"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">Minimum Salary</label>
                  <select
                    id="salary"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    value={salaryFilter}
                    onChange={(e) => setSalaryFilter(e.target.value)}
                  >
                    <option value="">Any</option>
                    <option value="50000">$50,000+</option>
                    <option value="75000">$75,000+</option>
                    <option value="100000">$100,000+</option>
                    <option value="125000">$125,000+</option>
                    <option value="150000">$150,000+</option>
                    <option value="200000">$200,000+</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end px-4">
                <button
                  onClick={handleApplyFilters}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 shadow-md transform hover:scale-105"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm" role="alert">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}
            {message && (
              <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg shadow-sm" role="alert">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700 font-medium">{message}</p>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
                <p className="ml-4 text-gray-700 text-lg">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">No jobs found</h3>
                <p className="mt-2 text-md text-gray-600">Try adjusting your search filters or check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <div key={job._id} className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1 flex flex-col">
                    <Link href={`/seeker/job/${job._id}`} passHref className="flex-grow cursor-pointer">
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 h-14 w-14 bg-indigo-100 rounded-lg flex items-center justify-center shadow-sm">
                            {job.companyLogo ? (
                              <img src={job.companyLogo} alt={job.company} className="h-12 w-12 object-contain rounded-md" />
                            ) : (
                              <span className="text-indigo-600 font-bold text-xl">{job.company?.charAt(0) || 'J'}</span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 hover:text-indigo-600 transition-colors duration-200">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-sm font-medium text-gray-600">{job.company || 'N/A'}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-sm text-gray-500">{job.location}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-sm text-gray-500">{job.jobType || 'Full-time'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>
                        </div>
                        
                        <div className="mt-4 flex flex-wrap gap-2">
                          {job.skills?.slice(0, 4).map((skill: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
                              {skill}
                            </span>
                          ))}
                          {job.skills && job.skills.length > 4 && (
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
                              +{job.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="p-6 pt-0 flex flex-col items-end gap-2 mt-auto">
                      <div className="text-right w-full">
                        <span className="text-xl font-bold text-gray-900">${job.salary.toLocaleString()}</span>
                        <span className="text-sm text-gray-500">/year</span>
                      </div>
                      <div className="text-sm text-gray-500 w-full text-right">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2 w-full justify-end">
                        <button
                          onClick={() => handleSaveUnsaveJob(job._id, job.isSaved || false)}
                          className={`mt-2 py-2 px-4 rounded-md font-medium transition-colors duration-200 shadow-md flex items-center justify-center gap-1
                            ${job.isSaved
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                          {job.isSaved ? (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path></svg>
                              Saved
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                              Save
                            </>
                          )}
                        </button>

                        {applicationStatus[job._id] === 'Applying...' ? (
                          <button
                            disabled
                            className="mt-2 bg-indigo-300 text-white py-2 px-6 rounded-md font-medium cursor-not-allowed shadow-sm"
                          >
                            Applying...
                          </button>
                        ) : applicationStatus[job._id] === 'Applied' ? (
                          <button
                            disabled
                            className="mt-2 bg-green-100 text-green-800 py-2 px-6 rounded-md font-medium flex items-center justify-center gap-1 shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Applied
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApply(job._id)}
                            className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-md font-medium transition-colors duration-200 shadow-md"
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8 py-4 bg-white rounded-xl shadow-md border border-gray-100">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === page
                        ? 'bg-indigo-700 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition-colors duration-200`}
                    disabled={loading}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}