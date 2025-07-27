// app/poster/applications/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Sidebar from '@/app/components/Sidebar';
import mongoose from 'mongoose'; 
import Link from 'next/link';

// Updated interface to match the populated data from the API
interface Application {
  _id: string;
  job: { // Changed from jobId to job, matching API's populate
    _id: string;
    title: string;
    // Add other job details if needed for display, e.g., description, location, salary
    description: string;
    location: string;
    salary: number;
    postedBy: string | mongoose.Types.ObjectId;
  };
  applicant: { // Changed from applicantId to applicant, matching API's populate
    _id: string;
    username?: string; // Added username as it's populated
    email: string;
    candidateDetails?: { // Added candidateDetails as it's populated
      fullName?: string;
      phone?: string;
      skills?: string[];
      experience?: string;
    };
  } | null; // IMPORTANT FIX: applicant can be null if populate fails or document is missing
  status: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected'; // Corrected enum to match model
  appliedAt: string;
  resumePath?: string;
}

export default function ApplicationsPage() {
  const { user, loading: authLoading, isAuthenticated, token, logout } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed unused sidebar state variables

  useEffect(() => {
    // No need for window resize listener for sidebar in this context
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'job_poster') {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/seeker/dashboard');
      }
      return;
    }

    fetchApplications();
  }, [authLoading, isAuthenticated, user, router, token]);

  const fetchApplications = useCallback(async () => {
    if (!token) {
      setError('Authentication token missing. Please log in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/applications', { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch applications');
      }

      const data = await response.json();
      // FIX: Access the 'applications' array from the response data object
      setApplications(Array.isArray(data.applications) ? data.applications : []);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(err.message || 'An unexpected error occurred');
      setApplications([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateApplicationStatus = async (id: string, status: Application['status']) => { // Use Application['status'] for type safety
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json(); // Get error message from response
        throw new Error(errorData.error || 'Failed to update status');
      }

      // Optimistically update the UI
      setApplications(applications.map(app => 
        app._id === id ? { 
          ...app, 
          status: status // Status is already correctly typed
        } : app
      ));
    } catch (err: any) { // Catch the error object
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update application status'); // Display the specific error message
    }
  };

  if (authLoading || !isAuthenticated || !user || user.role !== 'job_poster') {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="m-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-700">Loading applications...</p> {/* Added loading text */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden font-inter"> {/* Applied gradient background */}
      <Sidebar userRole={user.role} onLogout={logout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header (simplified, as logout is now in sidebar) */}
        <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center">
          <span className="text-lg font-bold text-indigo-600">Job Applications</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Removed redundant bg-gradient */}
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"> {/* Adjusted alignment and spacing */}
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">Job Applications</h1> {/* Increased font size */}
                <p className="text-gray-500 text-lg mt-2">Review and manage applications for your posted jobs</p> {/* Adjusted text color and size */}
              </div>
              <Link 
                href="/poster/dashboard" 
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 flex items-center justify-center w-full sm:w-auto" // Added flex for centering, full width on mobile
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-md"> {/* Added shadow */}
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p> {/* Added font-medium */}
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12 bg-white rounded-xl shadow-md"> {/* Added styling to loading state */}
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="ml-4 text-gray-700">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100"> {/* Added shadow and border */}
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> {/* Increased icon size */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-xl font-semibold text-gray-900">No applications yet</h3> {/* Increased font size */}
                <p className="mt-1 text-base text-gray-500">You haven't received any applications for your posted jobs.</p> {/* Increased font size */}
                <div className="mt-6">
                  <Link
                    href="/poster/new-job"
                    className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200" // Increased padding and font size
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Post New Job
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100"> {/* Added shadow and border */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applied On
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applications.map((application) => (
                        <tr key={application._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{application.job.title}</div> {/* Access title from job object */}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                {/* FIX: Add optional chaining for 'applicant' itself */}
                                <div className="text-sm font-medium text-gray-900">{application.applicant?.candidateDetails?.fullName || application.applicant?.username || 'N/A'}</div> 
                                <div className="text-sm text-gray-500">{application.applicant?.email || 'N/A'}</div> {/* Also add optional chaining for email */}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(application.appliedAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              application.status === 'accepted' ? 'bg-green-100 text-green-800' : // Changed 'hired' to 'accepted'
                              application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              application.status === 'interview' ? 'bg-blue-100 text-blue-800' :
                              application.status === 'reviewed' ? 'bg-purple-100 text-purple-800' : // Added reviewed status color
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)} {/* Capitalize status */}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2 items-center"> {/* Added items-center for vertical alignment */}
                              {application.resumePath && (
                                <a
                                  href={application.resumePath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-900 flex items-center" // Added flex for icon alignment
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
                                  </svg>
                                  Resume
                                </a>
                              )}
                              <select
                                value={application.status}
                                onChange={(e) => updateApplicationStatus(application._id, e.target.value as Application['status'])} // Cast value to correct type
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm" // Added shadow
                              >
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="interview">Interview</option>
                                <option value="rejected">Rejected</option>
                                <option value="accepted">Accepted</option> {/* Changed 'hired' to 'accepted' */}
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
