// src/app/login/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link'; // Import Link for navigation
import { useRouter } from 'next/navigation'; // Import useRouter

// Define the interface for your User object (same as in AuthContext.tsx)
interface User {
  _id: string;
  email: string;
  username: string;
  role: 'admin' | 'job_poster' | 'job_seeker' | 'job_referrer';
  isSuperAdmin: boolean;
  firstLogin: boolean;
  createdAt: string;
  updatedAt: string;
  onboardingStatus?: 'pending' | 'in_progress' | 'completed'; // Added onboardingStatus
}

// Define the interface for the expected API response data on successful login
interface LoginApiResponse {
  token?: string; // Make token optional for error responses
  user?: User; // Make user optional for error responses
  error?: string; // FIX: Add optional error property
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // New loading state

  const { login } = useAuth();
  const router = useRouter(); // Initialize useRouter

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true); // Set loading to true on form submission

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', // Specify the HTTP method
        headers: {
          'Content-Type': 'application/json', // Tell the server we're sending JSON
        },
        body: JSON.stringify({ email, password }), // Convert data to JSON string
      });

      // Parse the JSON response from the server
      const data: LoginApiResponse = await response.json(); // Directly assert type here

      // Check if the response was successful (status code 2xx)
      if (!response.ok) {
        // If response is not OK, it means there was an error from the server
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      // Now TypeScript knows that 'data' has 'token' and 'user' properties
      // We've made token optional in LoginApiResponse, so ensure it exists before using
      if (!data.token) {
        throw new Error('Login successful but no token received.');
      }
      const { token, user } = data; // Destructure user as well

      console.log('Login Page: API Response - received token (first few chars):', token.substring(0, 20) + '...');
      // The `AuthContext`'s `login` function will decode the user from the token
      await login(token); // Pass only the token to the login function

      setMessage('Login successful! Redirecting...');

      // FIX: Explicitly redirect based on user data received from API
      if (user) {
        if (user.firstLogin) {
          router.push('/change-password');
        } else if (user.role === 'job_seeker' && user.onboardingStatus !== 'completed') {
          router.push('/seeker/onboarding');
        } else if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (user.role === 'job_poster') {
          router.push('/poster/dashboard');
        } else {
          router.push('/seeker/dashboard'); // Default for job_seeker (completed onboarding) and job_referrer
        }
      } else {
        // Fallback if user object is unexpectedly missing
        router.push('/');
      }

    } catch (err: any) { // Using 'any' for the error for broad compatibility
      // Error handling for fetch API
      if (err instanceof Error) {
        setError(err.message);
        console.error('Login error:', err.message);
      } else {
        setError('An unexpected login error occurred.');
        console.error('Login unknown error:', err);
      }
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border border-gray-100 transform transition-all duration-300 hover:scale-105">
        <div>
          <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900 leading-tight">
            Welcome Back!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* FIX: Added space-y-4 for separation between email and password fields */}
          <div className="rounded-md shadow-sm space-y-4"> 
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition duration-200"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition duration-200"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/forgot-password" passHref>
                <span className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer">
                  Forgot your password?
                </span>
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-md">
              <div className="flex">
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
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg shadow-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700 font-medium">{message}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading} // Disable button when loading
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm mt-6">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" passHref>
              <span className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer">
                Register here
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
