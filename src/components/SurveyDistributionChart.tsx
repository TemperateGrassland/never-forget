'use client';

import { getSurveySchema } from '@/lib/surveySchemas';

interface Props {
  templateName: string;
  question: string;
  data: { answer: string; count: number; percentage: number }[];
  totalResponses: number;
}

export const SurveyDistributionChart = ({ templateName, question, data, totalResponses }: Props) => {
  // Ensure data is sorted consistently according to schema order
  const sortedData = data.sort((a, b) => {
    const schema = getSurveySchema(templateName);
    if (schema) {
      return schema.possibleAnswers.indexOf(a.answer) - schema.possibleAnswers.indexOf(b.answer);
    }
    return a.answer.localeCompare(b.answer);
  });

  const maxCount = Math.max(...sortedData.map(d => d.count), 1);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{templateName}</h3>
      <p className="text-sm text-gray-600 mb-2">{question}</p>
      <p className="text-xs text-gray-500 mb-4">Total responses: {totalResponses}</p>
      
      {/* Custom Bar Chart */}
      <div className="h-80 flex flex-col">
        {/* Chart Area */}
        <div className="flex-1 flex items-end justify-between gap-2 mb-4 px-2">
          {sortedData.map((item, index) => {
            const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            const color = item.count === 0 ? '#E5E7EB' : '#3B82F6';
            
            return (
              <div key={index} className="flex flex-col items-center flex-1 group relative">
                {/* Bar */}
                <div 
                  className="w-full bg-blue-500 rounded-t transition-opacity hover:opacity-80 min-h-[2px]"
                  style={{ 
                    height: `${Math.max(height, 2)}%`, 
                    backgroundColor: color 
                  }}
                />
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-gray-800 text-white text-xs p-2 rounded whitespace-nowrap">
                    {item.count} responses ({item.percentage}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* X-Axis Labels */}
        <div className="flex justify-between gap-2 px-2">
          {sortedData.map((item, index) => (
            <div 
              key={index} 
              className="flex-1 text-xs text-gray-600 text-center transform -rotate-45 origin-top"
              style={{ transformOrigin: 'top center' }}
            >
              <span className="block">{item.answer}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Responses</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-300 rounded"></div>
          <span>No responses</span>
        </div>
      </div>
      
      {/* Show zero-response answers clearly */}
      {sortedData.filter(d => d.count === 0).length > 0 && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
          <span className="text-gray-500">No responses: </span>
          <span className="text-gray-400">
            {sortedData.filter(d => d.count === 0).map(d => d.answer).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};