import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../types/roles';

const AdminPage: React.FC = () => {
  const { user, isAdmin, getRoleLevel } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">User Information</h2>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Username:</span> {user?.username}</p>
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              <p><span className="font-medium">Role:</span> <span className="capitalize">{user?.role}</span></p>
              <p><span className="font-medium">Role Level:</span> {getRoleLevel()}</p>
            </div>
          </div>

          {/* Admin Actions Card */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-green-900 mb-2">Admin Actions</h2>
            <div className="space-y-2">
              <button className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700">
                Manage Users
              </button>
              <button className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700">
                System Settings
              </button>
              <button className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700">
                View Logs
              </button>
            </div>
          </div>

          {/* Role Permissions Card */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-purple-900 mb-2">Role Permissions</h2>
            <div className="space-y-1 text-sm">
              <p className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${isAdmin() ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                Admin Access: {isAdmin() ? 'Yes' : 'No'}
              </p>
              <p className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${user?.role === ROLES.MODERATOR ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                Moderator Access: {user?.role === ROLES.MODERATOR ? 'Yes' : 'No'}
              </p>
              <p className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${user?.role === ROLES.PREMIUM ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                Premium Access: {user?.role === ROLES.PREMIUM ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">1,234</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">567</div>
              <div className="text-sm text-gray-600">Total Books</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">89</div>
              <div className="text-sm text-gray-600">Collections</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">12</div>
              <div className="text-sm text-gray-600">Active Sessions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 