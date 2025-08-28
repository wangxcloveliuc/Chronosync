"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  title?: string;
  showNotifications?: boolean;
  notificationsEnabled?: boolean;
  hasPermission?: boolean;
  onToggleNotifications?: () => void;
  onRequestPermission?: () => void;
};

export const NavBar: React.FC<Props> = ({
  title,
  showNotifications,
  notificationsEnabled,
  hasPermission,
  onToggleNotifications,
  onRequestPermission,
}) => {
  const router = useRouter();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <h1 className="text-xl font-semibold text-gray-900">{title || 'Chronosync'}</h1>
          <div className="flex items-center space-x-4">
            {showNotifications && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onToggleNotifications && onToggleNotifications()}
                  className={`p-2 rounded-md text-sm ${
                    notificationsEnabled && hasPermission
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  title={`Notifications ${notificationsEnabled ? 'enabled' : 'disabled'}`}
                >
                  🔔
                </button>
                {notificationsEnabled && !hasPermission && onRequestPermission && (
                  <button
                    onClick={() => onRequestPermission()}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md hover:bg-blue-200"
                  >
                    Enable
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/calendar')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Calendar
            </button>
            <button
              onClick={() => router.push('/analytics')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Analytics
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Profile
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                router.push('/auth/login');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
