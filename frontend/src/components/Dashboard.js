import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI, studentAPI } from '../utils/api';
import {
  UserGroupIcon,
  ShieldExclamationIcon,
  ClockIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { teacher } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    blockedAttempts: 0,
    totalUsage: 0,
    activeStudents: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [studentsRes, analyticsRes] = await Promise.all([
        studentAPI.getAll(),
        analyticsAPI.getUsage(),
      ]);

      const students = studentsRes.data.students || [];
      const analytics = analyticsRes.data;

      setStats({
        totalStudents: students.length,
        blockedAttempts: analytics.blocked_attempts || 0,
        totalUsage: analytics.total_usage || 0,
        activeStudents: students.filter(s => s.last_active).length,
      });

      setRecentActivity(analytics.recent_logs || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-butterfly-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold leading-6 text-gray-900">
          Welcome back, {teacher?.name}
        </h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Monitor your students' web activity and manage browsing policies from your dashboard.
        </p>
        <div className="mt-4 bg-butterfly-50 border border-butterfly-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-butterfly-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🔑</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-butterfly-800">
                Your Class Hash Key
              </h3>
              <div className="mt-1">
                <code className="text-lg font-mono font-bold text-butterfly-600">
                  {teacher?.hash_key}
                </code>
                <p className="text-xs text-butterfly-700 mt-1">
                  Share this key with your students to connect their Chrome extensions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Students
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {stats.totalStudents}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Active Students
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {stats.activeStudents}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldExclamationIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Blocked Attempts
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {stats.blockedAttempts}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Activities
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {stats.totalUsage}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <span className="text-sm text-gray-500">Last 24 hours</span>
        </div>
        
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
            <p className="mt-1 text-sm text-gray-500">
              Student activity will appear here once they start browsing.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.slice(0, 10).map((activity, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  activity.is_blocked
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.is_blocked
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {activity.is_blocked ? 'Blocked' : 'Allowed'}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {activity.title || 'Untitled Page'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {activity.url}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Student: {activity.student_hash}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
