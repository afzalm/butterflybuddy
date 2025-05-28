import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../utils/api';
import {
  ShieldExclamationIcon,
  EyeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function Analytics() {
  const [analytics, setAnalytics] = useState({
    total_usage: 0,
    blocked_attempts: 0,
    recent_logs: [],
    blocked_logs: [],
  });
  const [studentActivity, setStudentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [usageRes, activityRes] = await Promise.all([
        analyticsAPI.getUsage(),
        analyticsAPI.getStudentActivity(),
      ]);

      setAnalytics(usageRes.data);
      setStudentActivity(activityRes.data.student_activity || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
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
    return date.toLocaleDateString();
  };

  const getDomainFromUrl = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
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
        <h1 className="text-3xl font-bold leading-6 text-gray-900">Analytics & Reports</h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Monitor student web activity and track policy violations.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Activities
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {analytics.total_usage}
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
                  {analytics.blocked_attempts}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Active Students
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {studentActivity.filter(s => s.recent_activity.length > 0).length}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Alert Rate
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {analytics.total_usage > 0 ? Math.round((analytics.blocked_attempts / analytics.total_usage) * 100) : 0}%
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Blocked Attempts */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Blocked Attempts</h3>
          <span className="text-sm text-gray-500">Last 24 hours</span>
        </div>
        
        {analytics.blocked_logs.length === 0 ? (
          <div className="text-center py-8">
            <ShieldExclamationIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No blocked attempts</h3>
            <p className="mt-1 text-sm text-gray-500">
              Great! Students are following the browsing policies.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {analytics.blocked_logs.slice(0, 10).map((log, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Blocked
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {log.title || 'Untitled Page'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {getDomainFromUrl(log.url)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {formatTimeAgo(log.timestamp)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Student: {log.student_hash}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Student Activity Summary</h3>
          <span className="text-sm text-gray-500">Recent activity per student</span>
        </div>
        
        {studentActivity.length === 0 ? (
          <div className="text-center py-8">
            <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No student activity</h3>
            <p className="mt-1 text-sm text-gray-500">
              Activity will appear here once students start browsing.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {studentActivity.map((student, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-butterfly-100 flex items-center justify-center">
                      <span className="text-butterfly-600 font-medium text-sm">
                        {student.student.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {student.student.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {student.student.class_name} • Grade {student.student.grade}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {student.recent_activity.length} activities
                  </span>
                </div>
                
                {student.recent_activity.length > 0 ? (
                  <div className="space-y-2">
                    {student.recent_activity.slice(0, 3).map((activity, actIndex) => (
                      <div
                        key={actIndex}
                        className={`flex items-center justify-between text-sm p-2 rounded ${
                          activity.is_blocked
                            ? 'bg-red-50 border border-red-100'
                            : 'bg-gray-50 border border-gray-100'
                        }`}
                      >
                        <div className="flex-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                            activity.is_blocked
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {activity.is_blocked ? 'Blocked' : 'Allowed'}
                          </span>
                          <span className="text-gray-900">
                            {getDomainFromUrl(activity.url)}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    ))}
                    {student.recent_activity.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        ... and {student.recent_activity.length - 3} more activities
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No recent activity</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
