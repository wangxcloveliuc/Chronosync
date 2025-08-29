"use client";

import React, { useState } from 'react';
import { Task, CreateTaskShareData, TaskShare } from '@/types';
import api from '@/lib/api';

interface TaskSharingProps {
  task: Task;
  onClose: () => void;
}

export const TaskSharing: React.FC<TaskSharingProps> = ({ task, onClose }) => {
  const [shares, setShares] = useState<TaskShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [shareType, setShareType] = useState<'public_link' | 'user_share'>('public_link');
  const [sharedWithEmail, setSharedWithEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const loadShares = async () => {
    try {
      const response = await api.get('/tasks/shares');
      const taskShares = response.data.filter((share: TaskShare) => share.task.id === task.id);
      setShares(taskShares);
    } catch (error) {
      console.error('Error loading shares:', error);
    }
  };

  React.useEffect(() => {
    loadShares();
  }, []);

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const shareData: CreateTaskShareData = {
        shareType,
        expiresAt: expiresAt || undefined,
      };

      // For user sharing, we'd need to look up user by email
      // For now, just implement public link sharing
      if (shareType === 'user_share') {
        alert('User sharing feature coming soon! Please use public link for now.');
        setLoading(false);
        return;
      }

      const response = await api.post(`/tasks/${task.id}/share`, shareData);
      setShares(prev => [response.data, ...prev]);
      
      // Reset form
      setExpiresAt('');
      setSharedWithEmail('');
      
    } catch (error) {
      console.error('Error creating share:', error);
      alert('Failed to create share');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (shareId: number) => {
    try {
      await api.delete(`/tasks/shares/${shareId}`);
      setShares(prev => prev.filter(share => share.id !== shareId));
    } catch (error) {
      console.error('Error revoking share:', error);
      alert('Failed to revoke share');
    }
  };

  const copyToClipboard = (shareToken: string) => {
    const url = `${window.location.origin}/public/task/${shareToken}`;
    navigator.clipboard.writeText(url);
    alert('Share link copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Share Task: {task.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Create New Share Form */}
          <form onSubmit={handleCreateShare} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Share</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Type
                </label>
                <select
                  value={shareType}
                  onChange={(e) => setShareType(e.target.value as 'public_link' | 'user_share')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="public_link">Public Link</option>
                  <option value="user_share">Share with User (Coming Soon)</option>
                </select>
              </div>

              {shareType === 'user_share' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Email
                  </label>
                  <input
                    type="email"
                    value={sharedWithEmail}
                    onChange={(e) => setSharedWithEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter user email"
                    disabled
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires At (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating Share...' : 'Create Share'}
              </button>
            </div>
          </form>

          {/* Existing Shares */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Active Shares</h3>
            
            {shares.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active shares for this task
              </div>
            ) : (
              <div className="space-y-3">
                {shares.map((share) => (
                  <div key={share.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            share.shareType === 'public_link' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {share.shareType === 'public_link' ? 'Public Link' : 'User Share'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Created {new Date(share.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {share.expiresAt && (
                          <div className="text-xs text-gray-500 mb-2">
                            Expires: {new Date(share.expiresAt).toLocaleString()}
                          </div>
                        )}
                        
                        <div className="min-w-0">
                          <code className="bg-gray-200 px-2 py-1 rounded text-xs font-mono block truncate min-w-0 overflow-hidden">
                            {window.location.origin}/public/task/{share.shareToken}
                          </code>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col items-end space-y-2 flex-shrink-0">
                        <button
                          onClick={() => copyToClipboard(share.shareToken)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex-shrink-0"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => handleRevokeShare(share.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};