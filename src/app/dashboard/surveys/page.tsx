'use client';

import { useState, useEffect } from 'react';
import { SurveyDistributionChart } from '@/components/SurveyDistributionChart';

interface Distribution {
  question: string;
  totalResponses: number;
  answers: Record<string, number>;
}

export default function SurveyAnalytics() {
  const [distributions, setDistributions] = useState<Record<string, Distribution> | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/survey-distribution?timeframe=${timeframe}`);
        const data = await response.json();
        setDistributions(data);
      } catch (error) {
        console.error('Error fetching survey distributions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Survey Response Distribution</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!distributions) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Survey Response Distribution</h1>
        <div className="text-red-500">Error loading survey data</div>
      </div>
    );
  }

  const chartData = Object.entries(distributions).map(([templateName, dist]) => {
    const answers = Object.entries(dist.answers).map(([answer, count]) => ({
      answer,
      count,
      percentage: Math.round((count / (dist.totalResponses || 1)) * 100)
    }));
    
    return {
      templateName,
      question: dist.question,
      data: answers,
      totalResponses: dist.totalResponses
    };
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Survey Response Distribution</h1>
        
        <select 
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="365d">Last year</option>
        </select>
      </div>
      
      {chartData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">No survey responses found for the selected timeframe.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartData.map((chart) => (
            <SurveyDistributionChart
              key={chart.templateName}
              templateName={chart.templateName}
              question={chart.question}
              data={chart.data}
              totalResponses={chart.totalResponses}
            />
          ))}
        </div>
      )}
    </div>
  );
}