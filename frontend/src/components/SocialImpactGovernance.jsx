import React from 'react';
import { FiSmile, FiFrown, FiMeh, FiShield, FiUsers, FiCamera } from 'react-icons/fi';

const SocialImpactGovernance = ({ timeRange }) => {
  const sentimentData = {
    positive: 65,
    neutral: 25,
    negative: 10
  };

  const safetyMetrics = [
    { name: 'LTIFR', value: '0.85', target: '0.80', status: 'warning' },
    { name: 'TRIFR', value: '2.3', target: '2.0', status: 'warning' },
    { name: 'Safety Compliance', value: '96%', target: '95%', status: 'good' },
    { name: 'Training Hours', value: '1,245', target: '1,000', status: 'good' }
  ];

  const governanceIndicators = [
    { area: 'Board Diversity', score: 75, trend: 'up' },
    { area: 'Ethical Compliance', score: 92, trend: 'up' },
    { area: 'Stakeholder Engagement', score: 88, trend: 'stable' },
    { area: 'Transparency Index', score: 81, trend: 'up' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Analysis */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Stakeholder Sentiment</h3>
            <div className="flex items-center space-x-1">
              <FiSmile className="text-green-500" />
              <FiMeh className="text-yellow-500" />
              <FiFrown className="text-red-500" />
            </div>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="relative w-48 h-48">
              {/* Doughnut Chart */}
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="20" />
                <circle 
                  cx="50" cy="50" r="40" fill="none" 
                  stroke="#10B981" strokeWidth="20" 
                  strokeDasharray={`${sentimentData.positive * 2.5} ${100 * 2.5}`}
                  strokeDashoffset="0"
                />
                <circle 
                  cx="50" cy="50" r="40" fill="none" 
                  stroke="#FBBF24" strokeWidth="20" 
                  strokeDasharray={`${sentimentData.neutral * 2.5} ${100 * 2.5}`}
                  strokeDashoffset={`${-sentimentData.positive * 2.5}`}
                />
                <circle 
                  cx="50" cy="50" r="40" fill="none" 
                  stroke="#EF4444" strokeWidth="20" 
                  strokeDasharray={`${sentimentData.negative * 2.5} ${100 * 2.5}`}
                  strokeDashoffset={`${-(sentimentData.positive + sentimentData.neutral) * 2.5}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{sentimentData.positive}%</span>
                <span className="text-sm text-gray-600">Positive</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <FiSmile className="text-green-500" />
                <span className="font-bold">{sentimentData.positive}%</span>
              </div>
              <span className="text-xs text-gray-600">Positive</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <FiMeh className="text-yellow-500" />
                <span className="font-bold">{sentimentData.neutral}%</span>
              </div>
              <span className="text-xs text-gray-600">Neutral</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <FiFrown className="text-red-500" />
                <span className="font-bold">{sentimentData.negative}%</span>
              </div>
              <span className="text-xs text-gray-600">Negative</span>
            </div>
          </div>
        </div>

        {/* Safety Dashboard */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Worker Safety Compliance</h3>
            <FiShield className="text-blue-500" />
          </div>
          
          <div className="space-y-4">
            {safetyMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{metric.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">{metric.value}</span>
                    <span className={`text-sm ${
                      metric.status === 'good' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.status === 'good' ? '✓' : '⚠'}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${parseFloat(metric.value) / parseFloat(metric.target) * 100}%`,
                      backgroundColor: metric.status === 'good' ? '#10B981' : '#EF4444'
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">Target: {metric.target}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Camera Feed */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">AI Safety Monitoring</h3>
            <FiCamera className="text-purple-500" />
          </div>
          
          <div className="bg-gray-900 rounded-lg h-48 mb-4 relative overflow-hidden">
            {/* Mock Camera Feed */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-4xl mb-2">📹</div>
                <p className="text-sm">Live AI Camera Feed</p>
                <p className="text-xs text-gray-400 mt-2">PPE Compliance: 98%</p>
              </div>
            </div>
            
            {/* AI Detection Overlays */}
            <div className="absolute top-4 left-4">
              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">✅ Safe Zone</div>
            </div>
            <div className="absolute bottom-4 right-4">
              <div className="bg-red-500 text-white text-xs px-2 py-1 rounded">⚠ Alert: No Helmet</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Alerts:</span>
              <span className="font-medium">3</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">PPE Compliance:</span>
              <span className="font-medium text-green-600">98.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Governance & Social License */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Governance Indicators */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-6">Governance Indicators</h3>
          <div className="space-y-4">
            {governanceIndicators.map((indicator, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{indicator.area}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold">{indicator.score}</span>
                    <span className={`text-sm ${
                      indicator.trend === 'up' ? 'text-green-600' : 
                      indicator.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {indicator.trend === 'up' ? '↑' : indicator.trend === 'down' ? '↓' : '→'}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-blue-500"
                    style={{ width: `${indicator.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social License Tracker */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Social License Tracker</h3>
            <FiUsers className="text-orange-500" />
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">Community Engagement Score</span>
                <span className="text-2xl font-bold text-orange-600">8.5/10</span>
              </div>
              <p className="text-sm text-gray-600">Based on 245 stakeholder responses</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">Local Employment Rate</span>
                <span className="text-2xl font-bold text-green-600">78%</span>
              </div>
              <p className="text-sm text-gray-600">+5% improvement from last quarter</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">CSR Project Impact</span>
                <span className="text-2xl font-bold text-blue-600">92%</span>
              </div>
              <p className="text-sm text-gray-600">Positive community feedback</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialImpactGovernance;