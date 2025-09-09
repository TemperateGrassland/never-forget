'use client';

import { useState, useEffect } from 'react';

interface MetricsData {
  overview: {
    totalUsers: number;
    totalReminders: number;
    newSignups: number;
    newReminders: number;
    activeUsers: number;
    completedReminders: number;
  };
  subscriptions: Record<string, number>;
  charts: {
    dailySignups: Array<{ date: string; count: number }>;
    dailyReminders: Array<{ date: string; count: number }>;
  };
  reminderFrequencies: Record<string, number>;
  period: number;
}

export default function MetricsDashboard() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');

  const fetchMetrics = async (selectedPeriod: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/metrics?period=${selectedPeriod}`);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied - Admin privileges required');
        }
        throw new Error('Failed to fetch metrics');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(period);
  }, [period]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold">Error loading metrics</p>
          <p className="mt-2">{error}</p>
          <button 
            onClick={() => fetchMetrics(period)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add top padding to account for fixed navbar - mobile first responsive */}
      <div className="pt-20 sm:pt-24 md:pt-28 pb-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Track your app metrics and user engagement</p>
            </div>
          
            {/* Period Selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <MetricCard
            title="Total Users"
            value={data.overview.totalUsers}
            subtitle={`${data.overview.newSignups} new in last ${period} days`}
            icon="👥"
            trend={data.overview.newSignups > 0 ? 'up' : 'neutral'}
          />
          <MetricCard
            title="Total Reminders"
            value={data.overview.totalReminders}
            subtitle={`${data.overview.newReminders} new in last ${period} days`}
            icon="📝"
            trend={data.overview.newReminders > 0 ? 'up' : 'neutral'}
          />
          <MetricCard
            title="Active Users"
            value={data.overview.activeUsers}
            subtitle={`${data.overview.totalUsers > 0 ? Math.round((data.overview.activeUsers / data.overview.totalUsers) * 100) : 0}% of total users`}
            icon="🔥"
            trend="neutral"
          />
          <MetricCard
            title="Completed Reminders"
            value={data.overview.completedReminders}
            subtitle={`In last ${period} days`}
            icon="✅"
            trend={data.overview.completedReminders > 0 ? 'up' : 'neutral'}
          />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
            {/* Daily Signups Chart */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Daily Signups</h3>
            <SimpleLineChart 
              data={data.charts.dailySignups} 
              color="blue"
              emptyMessage="No new signups in this period"
              />
            </div>

            {/* Daily Reminders Chart */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Daily Reminders Created</h3>
            <SimpleLineChart 
              data={data.charts.dailyReminders} 
              color="green"
              emptyMessage="No reminders created in this period"
              />
            </div>
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Subscription Distribution */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Subscription Status</h3>
              <DistributionChart data={data.subscriptions} />
            </div>

            {/* Reminder Frequency Distribution */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Reminder Frequencies</h3>
              <DistributionChart data={data.reminderFrequencies} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend 
}: { 
  title: string; 
  value: number; 
  subtitle: string; 
  icon: string; 
  trend: 'up' | 'down' | 'neutral';
}) {
  // Ensure value is a valid number
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  
  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center">
        <div className="text-xl sm:text-2xl mr-2 sm:mr-3">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{safeValue.toLocaleString()}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 leading-tight">{subtitle}</p>
        </div>
        {trend === 'up' && (
          <div className="text-green-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple Line Chart Component
function SimpleLineChart({ 
  data, 
  color, 
  emptyMessage 
}: { 
  data: Array<{ date: string; count: number }>; 
  color: string;
  emptyMessage: string;
}) {
  // Validate and filter data
  const validData = data?.filter(d => 
    d && 
    typeof d.count === 'number' && 
    !isNaN(d.count) && 
    d.date && 
    typeof d.date === 'string'
  ) || [];

  if (validData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  const maxValue = Math.max(...validData.map(d => d.count));
  const safeMaxValue = maxValue > 0 ? maxValue : 1; // Prevent division by zero

  return (
    <div className="h-48 sm:h-64">
      <svg className="w-full h-full" viewBox="0 0 400 200">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Chart line */}
        {validData.length > 1 && (
          <polyline
            fill="none"
            stroke={color === 'blue' ? '#3b82f6' : '#10b981'}
            strokeWidth="2"
            points={validData.map((d, i) => {
              const x = validData.length > 1 ? (i * 380) / (validData.length - 1) + 10 : 200;
              const y = 190 - (d.count * 170) / safeMaxValue;
              return `${x},${y}`;
            }).join(' ')}
          />
        )}
        
        {/* Data points */}
        {validData.map((d, i) => {
          const x = validData.length > 1 ? (i * 380) / (validData.length - 1) + 10 : 200;
          const y = 190 - (d.count * 170) / safeMaxValue;
          
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill={color === 'blue' ? '#3b82f6' : '#10b981'}
            />
          );
        })}
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-1 sm:mt-2 overflow-hidden">
        {validData.slice(0, 3).map((d, i) => (
          <span key={i} className="truncate">{new Date(d.date).toLocaleDateString()}</span>
        ))}
      </div>
    </div>
  );
}

// Distribution Chart Component
function DistributionChart({ data }: { data: Record<string, number> }) {
  // Validate data and filter out invalid entries
  const validEntries = Object.entries(data || {}).filter(([key, count]) => 
    key && 
    typeof count === 'number' && 
    !isNaN(count) && 
    count >= 0
  );
  
  const total = validEntries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0 || validEntries.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {validEntries.map(([key, count]) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const safePercentage = Math.max(0, Math.min(100, percentage)); // Clamp between 0-100
        
        return (
          <div key={key} className="flex items-center">
            <div className="w-24 text-sm text-gray-600 capitalize">
              {key === 'none' ? 'Free' : key}
            </div>
            <div className="flex-1 ml-4">
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${safePercentage}%` }}
                  ></div>
                </div>
                <div className="ml-2 text-sm text-gray-600 w-16 text-right">
                  {count} ({safePercentage}%)
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}