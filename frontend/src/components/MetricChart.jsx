import React from 'react';

const MetricChart = ({ data, color = '#3B82F6', height = 200 }) => {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  
  return (
    <div className="relative" style={{ height: `${height}px` }}>
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between">
        {[0, 25, 50, 75, 100].map((percent) => (
          <div
            key={percent}
            className="border-t border-gray-200"
            style={{ top: `${percent}%` }}
          ></div>
        ))}
      </div>
      
      {/* Chart bars */}
      <div className="absolute bottom-0 left-0 right-0 h-4/5 flex items-end space-x-1 px-2">
        {data.map((value, index) => {
          const heightPercent = ((value - minValue) / (maxValue - minValue)) * 100;
          return (
            <div
              key={index}
              className="flex-1 relative group"
              style={{ height: `${Math.max(10, heightPercent)}%` }}
            >
              <div
                className="w-full rounded-t transition-all hover:opacity-100"
                style={{
                  backgroundColor: color,
                  opacity: 0.7,
                  height: '100%'
                }}
              ></div>
              
              {/* Tooltip on hover */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block">
                <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* X-axis labels */}
      <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-500">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>
    </div>
  );
};

export default MetricChart;