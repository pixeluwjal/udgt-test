// app/admin/my-created-users/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';

interface UserDisplay {
  _id: string;
  username?: string;
  email: string;
  role: string;
  firstLogin: boolean;
  isSuperAdmin: boolean;
  createdAt: string; // ISO date string
}

export default function MyCreatedUsersPage() {
  const { user, loading: authLoading, isAuthenticated, logout, token } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  // Delete confirmation states (same as AdminDashboardPage for consistency)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingUserEmail, setDeletingUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Redirection logic for this specific page
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      console.warn('MyCreatedUsersPage: Not authenticated or user missing. Redirecting to /login.');
      router.push('/login');
      return;
    }

    if (user.firstLogin) {
      console.warn('MyCreatedUsersPage: User is firstLogin. Redirecting to /change-password.');
      router.push('/change-password');
      return;
    }

    if (user.role !== 'admin') {
      console.warn(`MyCreatedUsersPage: User role is ${user.role}, not admin. Redirecting to appropriate dashboard.`);
      if (user.role === 'job_poster') router.push('/poster/dashboard');
      else if (user.role === 'job_seeker') router.push('/seeker/dashboard');
      else router.push('/');
      return;
    }
    console.log('MyCreatedUsersPage: User is authenticated as admin. Proceeding.');
  }, [authLoading, isAuthenticated, user, router]);

  // Fetch users created by the current admin
  const fetchMyCreatedUsers = useCallback(async () => {
    setFetchError(null);
    setFetchLoading(true);
    setMessage(null);
    try {
      if (!isAuthenticated || !token || !user || !user._id) {
        setFetchError('Authentication or user ID missing for fetching created users.');
        setFetchLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.append('createdBy', user._id); // Filter by current admin's ID
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const apiUrl = `/api/admin/users?${params.toString()}`;
      console.log(`API: Fetching users created by ${user._id} from: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch created users');
      }

      if (Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        console.error('API: Backend response for users is not in expected format (missing "users" array):', data);
        setFetchError('Failed to fetch users: Invalid data format from server.');
        setUsers([]);
      }
    } catch (err: any) {
      console.error('API: Failed to fetch created users:', err);
      let errorMessage = 'Failed to fetch users. Please check your network connection.';
      if (err instanceof Error) {
          errorMessage = err.message;
      } else if (typeof err === 'string') {
          errorMessage = err;
      }
      setFetchError(errorMessage);
    } finally {
      setFetchLoading(false);
    }
  }, [isAuthenticated, token, user, searchQuery]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && user.role === 'admin') {
      const handler = setTimeout(() => {
        fetchMyCreatedUsers();
      }, 500); // Debounce search/fetch

      return () => {
        clearTimeout(handler);
      };
    }
  }, [authLoading, isAuthenticated, user, fetchMyCreatedUsers, searchQuery]);

  // Handle Delete User Confirmation (reused from AdminDashboardPage)
  const handleDeleteClick = (userId: string, userEmail: string, userRole: string) => {
    if (userRole === 'admin') {
      setFetchError('Cannot delete an admin user from this interface.');
      return;
    }
    setDeletingUserId(userId);
    setDeletingUserEmail(userEmail);
    setShowDeleteConfirm(true);
  };

  // Execute Delete User (reused from AdminDashboardPage)
  const confirmDelete = async () => {
    if (!deletingUserId || !token) {
      setFetchError('Error: User ID or token missing for deletion.');
      setShowDeleteConfirm(false);
      return;
    }

    setFetchLoading(true);
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
      setFetchLoading(false);
      setShowDeleteConfirm(false);
      setDeletingUserId(null);
      setDeletingUserEmail(null);
    }
  };

  if (authLoading || !isAuthenticated || !user || user.firstLogin || user.role !== 'admin') {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="m-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-700">Loading or redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden font-inter">
      <Sidebar userRole={user.role} onLogout={logout} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="md:hidden bg-white shadow-sm p-4 flex justify-end items-center">
          <span className="text-lg font-bold text-indigo-600">Admin Panel</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">My Created Users</h1>
                <p className="text-gray-500 text-lg">Users you have created</p>
              </div>
              <div className="flex w-full md:w-auto">
                <div className="relative flex-grow">
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchMyCreatedUsers();
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">Your Created Users List</h2>
                <Link href="/admin/dashboard" passHref>
                  <button className="flex items-center px-3 py-1 md:px-4 md:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors w-full md:w-auto justify-center shadow-sm">
                    <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-sm md:text-base">Back to All Users</span>
                  </button>
                </Link>
              </div>

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

              {fetchLoading ? (
                <div className="p-8 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                  <p className="ml-4 text-gray-700">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No users found that you have created.
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                                'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-4 md:px-6 whitespace-nowrap text-sm text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 md:px-6 whitespace-nowrap text-sm font-medium">
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
