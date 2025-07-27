// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  userRole: 'job_poster' | 'job_seeker' | 'admin' | 'job_referrer';
  onLogout: () => void;
}

export default function Sidebar({ userRole, onLogout }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Common navigation items
  const navItems = [
    // Job Poster specific links
    ...(userRole === 'job_poster' ? [
      {
        href: '/poster/dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        text: 'Dashboard',
      },
      {
        href: '/poster/new-job',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        ),
        text: 'Post New Job',
      },
      {
        href: '/poster/posted-jobs', // NEW: Added Posted Jobs link
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
        text: 'Posted Jobs',
      },
      {
        href: '/poster/applications',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
        text: 'Applications',
      }
    ] : []),
    // Job Seeker specific links
    ...(userRole === 'job_seeker' ? [
      {
        href: '/seeker/dashboard',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7m7-7v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        text: 'Dashboard',
      },
      {
        href: '/seeker/job',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.55 23.55 0 0112 15c-1.606 0-3.14-.153-4.59-.445M21 4.87V11m0 0h-7.5M21 11l-3.25-3.25M12 3a9 9 0 100 18 9 9 0 000-18z" />
          </svg>
        ),
        text: 'Browse Jobs',
      },
      {
        href: '/seeker/applications',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
        text: 'My Applications',
      },
      {
        href: '/seeker/saved-jobs',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        ),
        text: 'Saved Jobs',
      },
    ] : []),
    // Admin specific links
    ...(userRole === 'admin' ? [
      {
        href: '/admin/dashboard',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        text: 'Dashboard',
      },
      {
        href: '/admin/create-user',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM12 14v1.5a2.5 2.5 0 005 0V14m-5 0H5a2 2 0 00-2 2v3a2 2 0 002 2h10a2 2 0 002-2v-3a2 2 0 00-2-2h-2z" />
          </svg>
        ),
        text: 'Create User',
      },
      {
        href: '/admin/generate-referral',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        ),
        text: 'Generate Referral',
      },
      { // NEW: My Created Users link
        href: '/admin/my-created-users',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h2a2 2 0 002-2V7a2 2 0 00-2-2h-2V3m-2 16h-4m-2 0h-2a2 2 0 01-2-2v-7a2 2 0 012-2h2m-4 5l4-4 4 4m-6 6h6" />
          </svg>
        ),
        text: 'My Created Users',
      },
    ] : []),
    // Job Referrer specific links
    ...(userRole === 'job_referrer' ? [
      {
        href: '/referrer/dashboard',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H2v-2a3 3 0 015.356-1.857M17 20v-9a2 2 0 00-2-2H9a2 2 0 00-2 2v9M4 10V4a2 2 0 012-2h2" />
          </svg>
        ),
        text: 'Referral Dashboard',
      },
      {
        href: '/referrer/generate',
        icon: (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101m-1.721 2.875a.5.5 0 00.354.854H17a.5.5 0 00.354-.854l-2.875-2.875z" />
          </svg>
        ),
        text: 'Generate Referral Link',
      },
    ] : []),
  ];

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-md bg-indigo-600 text-white focus:outline-none"
        >
          {mobileSidebarOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden md:flex md:flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-20'} bg-indigo-800 text-white transition-all duration-300 ease-in-out flex-col h-full`}>
        <div className="flex items-center justify-between p-4 border-b border-indigo-700">
          {sidebarOpen ? (
            <h1 className="text-xl font-bold">
              {userRole === 'job_poster' ? 'Job Poster' :
                userRole === 'job_seeker' ? 'Job Seeker' :
                userRole === 'admin' ? 'Admin' : 'Job Referrer'}
            </h1>
          ) : (
            <div className="mx-auto">📝</div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-full hover:bg-indigo-700"
          >
            {sidebarOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <div className="mt-6">
            {navItems.map((item) => (
              <Link href={item.href} key={item.href} passHref>
                <div className={`flex items-center p-3 mx-2 rounded-lg mb-2 ${sidebarOpen ? 'justify-start' : 'justify-center'} ${
                  pathname === item.href ? 'bg-indigo-700' : 'hover:bg-indigo-700'
                } cursor-pointer`}>
                  {item.icon}
                  {sidebarOpen && <span className="ml-3">{item.text}</span>}
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-indigo-700">
          <button
            onClick={onLogout}
            className={`flex items-center w-full p-2 rounded-lg hover:bg-indigo-700 transition-colors ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileSidebarOpen(false)}></div>
          <div className="relative flex flex-col w-72 max-w-xs h-full bg-indigo-800 text-white">
            <div className="flex items-center justify-between p-4 border-b border-indigo-700">
              <h1 className="text-xl font-bold">
                {userRole === 'job_poster' ? 'Job Poster' :
                  userRole === 'job_seeker' ? 'Job Seeker' :
                  userRole === 'admin' ? 'Admin' : 'Job Referrer'}
              </h1>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-full hover:bg-indigo-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto">
              <div className="mt-6">
                {navItems.map((item) => (
                  <Link href={item.href} key={item.href} passHref>
                    <div
                      className={`flex items-center p-3 mx-2 rounded-lg mb-2 justify-start ${
                        pathname === item.href ? 'bg-indigo-700' : 'hover:bg-indigo-700'
                      } cursor-pointer`}
                      onClick={() => setMobileSidebarOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.text}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </nav>

            <div className="p-4 border-t border-indigo-700">
              <button
                onClick={() => {
                  onLogout();
                  setMobileSidebarOpen(false);
                }}
                className="flex items-center w-full p-2 rounded-lg hover:bg-indigo-700 transition-colors justify-start"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="ml-3">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
