// app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar'; // Ensure Sidebar is imported

interface UserDisplay {
  _id: string;
  username?: string;
  email: string;
  role: string;
  firstLogin: boolean;
  isSuperAdmin: boolean;
  createdAt: string; // ISO date string
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading, isAuthenticated, logout, token, isSuperAdmin: currentUserIsSuperAdmin } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true); // Manages loading for fetching users and actions
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [message, setMessage] = useState<string | null>(null); // State for success messages
  // Removed: const [showAllUsers, setShowAllUsers] = useState(false); // New state for the toggle

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingUserEmail, setDeletingUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // setMobileSidebarOpen(false); // This is handled by Sidebar component internally
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Redirection Logic ---
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      console.warn('AdminDashboardPage: Not authenticated or user missing. Redirecting to /login.');
      router.push('/login');
      return;
    }

    if (user.firstLogin) {
      console.warn('AdminDashboardPage: User is firstLogin. Redirecting to /change-password.');
      router.push('/change-password');
      return;
    }

    if (user.role !== 'admin') {
      console.warn(`AdminDashboardPage: User role is ${user.role}, not admin. Redirecting to appropriate dashboard.`);
      if (user.role === 'job_poster') router.push('/poster/dashboard');
      else if (user.role === 'job_seeker') router.push('/seeker/dashboard'); // Added job_seeker redirect
      else router.push('/'); // Fallback for other roles
      return;
    }

    console.log('AdminDashboardPage: User is authenticated as admin. Proceeding with dashboard.');
    // Removed: Initialize showAllUsers based on current user's super admin status
    // setShowAllUsers(currentUserIsSuperAdmin);
  }, [authLoading, isAuthenticated, user, router, currentUserIsSuperAdmin]);

  // --- Fetch Users Function (Memoized) ---
  const fetchUsers = useCallback(async () => {
    setFetchError(null);
    setFetchLoading(true); // Set loading true for fetch operation
    setMessage(null); // Clear messages on new fetch
    try {
      if (!isAuthenticated || !token || !user || user.role !== 'admin') {
        setFetchError('Authentication or authorization missing for fetching users.');
        setFetchLoading(false);
        return;
      }

      const params = new URLSearchParams();
      // Only append 'all=true' if the current user is a Super Admin
      if (currentUserIsSuperAdmin) {
        params.append('all', 'true');
      }
      if (searchQuery) { // Add search query to params
        params.append('search', searchQuery); // Backend /api/admin/users should handle this parameter for filtering
      }

      const apiUrl = `/api/admin/users?${params.toString()}`;
      console.log(`API: Fetching users from: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      if (Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        console.error('API: Backend response for users is not in expected format (missing "users" array):', data);
        setFetchError('Failed to fetch users: Invalid data format from server.');
        setUsers([]);
      }
    } catch (err: any) {
      console.error('API: Failed to fetch users:', err);
      let errorMessage = 'Failed to fetch users. Please check your network connection.';
      if (err instanceof Error) {
          errorMessage = err.message;
      } else if (typeof err === 'string') {
          errorMessage = err;
      }
      setFetchError(errorMessage);
    } finally {
      setFetchLoading(false); // Set loading false after fetch operation
    }
  }, [isAuthenticated, token, user, currentUserIsSuperAdmin, searchQuery]); // Removed showAllUsers dependency

  // --- Effect to fetch users when relevant states change ---
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && user.role === 'admin') {
      // Debounce search query to prevent excessive API calls
      const handler = setTimeout(() => {
        fetchUsers();
      }, 500); // 500ms debounce

      return () => {
        clearTimeout(handler);
      };
    }
  }, [authLoading, isAuthenticated, user, fetchUsers, searchQuery]); // Removed showAllUsers from dependencies

  // --- Handle Delete User Confirmation ---
  const handleDeleteClick = (userId: string, userEmail: string, userRole: string) => {
    // Prevent deletion of 'admin' role users from the UI
    if (userRole === 'admin') {
      setFetchError('Cannot delete an admin user from this interface.');
      return;
    }
    setDeletingUserId(userId);
    setDeletingUserEmail(userEmail);
    setShowDeleteConfirm(true);
  };

  // --- Execute Delete User ---
  const confirmDelete = async () => {
    if (!deletingUserId || !token) {
      setFetchError('Error: User ID or token missing for deletion.');
      setShowDeleteConfirm(false);
      return;
    }

    setFetchLoading(true); // Set loading for the delete action
    setFetchError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${deletingUserId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(prevUsers => prevUsers.filter(u => u._id !== deletingUserId));
      setMessage('User deleted successfully!');
      console.log(`User ${deletingUserId} deleted successfully.`);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setFetchError(err.message || 'An unexpected error occurred during deletion.');
    } finally {
      setFetchLoading(false); // End loading for the delete action
      setShowDeleteConfirm(false);
      setDeletingUserId(null);
      setDeletingUserEmail(null);
    }
  };

  // --- Conditional Render for Initial Loading/Unauthorized ---
  if (authLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="m-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-700">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.firstLogin || user.role !== 'admin') {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="m-auto text-center">
          <div className="text-red-500 font-medium">Unauthorized access or password change required</div>
          <div className="text-gray-500 mt-2">Redirecting...</div>
        </div>
      </div>
    );
  }

  // --- Main Component Render ---
  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden font-inter">
      {/* Sidebar Component */}
      <Sidebar userRole={user.role} onLogout={logout} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile header (simplified, as logout is now in sidebar) */}
        <div className="md:hidden bg-white shadow-sm p-4 flex justify-end items-center">
          <span className="text-lg font-bold text-indigo-600">Admin Panel</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">Welcome back, {user.username}!</h1>
      
              </div>
              {/* Search bar with integrated button */}
              <div className="flex w-full md:w-auto"> {/* Use flex to contain input and button */}
                <div className="relative flex-grow"> {/* Allows input to take available space */}
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full p-3 pl-10 text-base text-gray-900 border border-gray-300 rounded-l-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-200 ease-in-out hover:border-indigo-400"
                    placeholder="Search Users"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { // Trigger search on Enter key
                      if (e.key === 'Enter') {
                        fetchUsers();
                      }
                    }}
                  />
                </div>
               
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 md:mb-8">
              {/* Total Users */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm md:text-base">Total Users</p>
                    <h3 className="text-xl md:text-2xl font-bold mt-1 text-gray-900">{users.length}</h3>
                  </div>
                  <div className="p-2 md:p-3 rounded-full bg-indigo-100 text-indigo-600">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 md:mt-4">
                  <div className="flex items-center text-xs md:text-sm text-green-600">
                    <svg className="w-3 h-3 md:w-4 md:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>12% from last month</span>
                  </div>
                </div>
              </div>

              {/* Active Today */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm md:text-base">Active Today</p>
                    <h3 className="text-xl md:text-2xl font-bold mt-1 text-gray-900">{users.filter(u => !u.firstLogin).length}</h3> {/* Simplified active logic */}
                  </div>
                  <div className="p-2 md:p-3 rounded-full bg-green-100 text-green-600">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 md:mt-4">
                  <div className="flex items-center text-xs md:text-sm text-green-600">
                    <svg className="w-3 h-3 md:w-4 md:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>8% from yesterday</span>
                  </div>
                </div>
              </div>

              {/* New This Week */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm md:text-base">New This Week</p>
                    <h3 className="text-xl md:text-2xl font-bold mt-1 text-gray-900">
                      {users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                    </h3>
                  </div>
                  <div className="p-2 md:p-3 rounded-full bg-blue-100 text-blue-600">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 md:mt-4">
                  <div className="flex items-center text-xs md:text-sm text-red-600">
                    <svg className="w-3 h-3 md:w-4 md:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span>3% from last week</span>
                  </div>
                </div>
              </div>

              {/* REMOVED: "Need Password Reset" stat card */}
            </div>

            {/* User Management Section */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">User Management</h2>
                <div className="flex space-x-3 w-full md:w-auto">
                  <Link href="/admin/create-user" passHref>
                    <button className="flex items-center px-3 py-1 md:px-4 md:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full md:w-auto justify-center shadow-sm">
                      <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-sm md:text-base">New User</span>
                    </button>
                  </Link>
                  <Link href="/admin/generate-referral" passHref>
                    <button className="flex items-center px-3 py-1 md:px-4 md:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors w-full md:w-auto justify-center shadow-sm">
                      <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm md:text-base">Referral Codes</span>
                    </button>
                  </Link>
                </div>
              </div>

              {/* Removed: Toggle for showing all users (Super Admin only) */}
              {/* {currentUserIsSuperAdmin && (
                  <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-end px-6">
                      <label htmlFor="showAllUsersToggle" className="flex items-center cursor-pointer">
                          <div className="relative inline-flex items-center cursor-pointer">
                              <input
                                  type="checkbox"
                                  id="showAllUsersToggle"
                                  className="sr-only peer"
                                  checked={showAllUsers}
                                  onChange={(e) => setShowAllUsers(e.target.checked)}
                              />
                              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                  {showAllUsers ? 'Showing All Users' : 'Showing My Created Users'}
                              </span>
                          </div>
                      </label>
                  </div>
              )} */}

              {/* Error and Success Messages for User Management */}
              {fetchError && (
                <div className="p-4 bg-red-100 text-red-700 border-l-4 border-red-500 rounded-r-lg mx-4 mb-4" role="alert">
                  {fetchError}
                </div>
              )}
              {message && (
                <div className="p-4 bg-green-100 text-green-700 border-l-4 border-green-500 rounded-r-lg mx-4 mb-4" role="alert">
                  {message}
                </div>
              )}

              {/* Users Table */}
              {fetchLoading ? (
                <div className="p-8 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                  <p className="ml-4 text-gray-700">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No users found or you haven't created any users yet.
                </div>
              ) : (
                <div className="overflow-x-auto"> {/* Ensures horizontal scrolling on small screens */}
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th scope="col" className="px-4 py-3 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-4 py-3 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th scope="col" className="px-4 py-3 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                        <th scope="col" className="px-4 py-3 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 md:px-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                                {u.username?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-3 md:ml-4">
                                <div className="text-sm font-medium text-gray-900">{u.username || 'N/A'}</div>
                                <div className="text-xs md:text-sm text-gray-500">{u.isSuperAdmin ? 'Super Admin' : (u.firstLogin ? 'First Login' : '')}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 md:px-6 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                          <td className="px-4 py-4 md:px-6 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                u.role === 'job_poster' ? 'bg-blue-100 text-blue-800' : 
                                u.role === 'job_seeker' ? 'bg-green-100 text-green-800' :
                                'bg-yellow-100 text-yellow-800' // For job_referrer
                              }`}
                            >
                              {u.role.replace('_', ' ')} {/* Display role nicely */}
                            </span>
                          </td>
                          <td className="px-4 py-4 md:px-6 whitespace-nowrap text-sm text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 md:px-6 whitespace-nowrap text-sm font-medium">
                            {/* Conditionally render delete button: hide if user is 'admin' */}
                            {u.role !== 'admin' && (
                              <button 
                                onClick={() => handleDeleteClick(u._id, u.email, u.role)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-auto transform transition-all scale-100 opacity-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to delete user <span className="font-semibold">{deletingUserEmail}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                disabled={fetchLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={fetchLoading}
              >
                {fetchLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
