import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const SummaryCard = ({ data }) => {
  const getTrendColor = (trend) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? <FiTrendingUp /> : <FiTrendingDown />;
  };

  return (
    <div className={`${data.color} rounded-xl shadow p-6 transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {data.icon}
          <h3 className="font-semibold text-gray-800">{data.title}</h3>
        </div>
        <div className={`flex items-center space-x-1 ${getTrendColor(data.trend)}`}>
          {getTrendIcon(data.trend)}
          <span className="text-sm font-medium">{data.change}</span>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900">{data.value}</p>
      </div>
      
      {/* Mini chart/trend visualization */}
      <div className="h-8 flex items-end space-x-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t ${
              data.trend === 'up' ? 'bg-green-400' : 'bg-red-400'
            }`}
            style={{
              height: `${data.trend === 'up' ? 30 + i * 3 : 30 - i * 3}%`,
              opacity: 0.7 + (i * 0.03)
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default SummaryCard;