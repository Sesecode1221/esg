import React from 'react';
import { FiFileText, FiDownload, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const ESGReporting = ({ timeRange }) => {
  const complianceData = {
    sdg: { value: 92, target: 95, trend: 'up' },
    gri: { value: 88, target: 90, trend: 'up' },
    tcfd: { value: 85, target: 85, trend: 'stable' }
  };

  const metrics = [
    { name: 'Carbon Emissions', value: '1,245 tCO₂e', change: -8.5, unit: 'tons' },
    { name: 'Energy Consumption', value: '5,678 MWh', change: -12.3, unit: 'MWh' },
    { name: 'Water Usage', value: '23,450 m³', change: -5.2, unit: 'cubic meters' },
    { name: 'Renewable Energy %', value: '34%', change: +15.7, unit: 'percentage' }
  ];

  const reportTemplates = [
    { name: 'Annual ESG Report', lastGenerated: '2024-01-15', status: 'Ready' },
    { name: 'TCFD Disclosure', lastGenerated: '2024-01-10', status: 'Pending Review' },
    { name: 'GRI Standards Report', lastGenerated: '2024-01-05', status: 'Ready' },
    { name: 'SDG Progress Report', lastGenerated: '2024-01-03', status: 'Ready' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Progress */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Compliance Framework Progress</h3>
            <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <FiDownload />
              <span>Generate Full Report</span>
            </button>
          </div>
          
          <div className="space-y-6">
            {Object.entries(complianceData).map(([framework, data]) => (
              <div key={framework} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{framework.toUpperCase()}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{data.value}%</span>
                    {data.trend === 'up' && <FiTrendingUp className="text-green-500" />}
                    {data.trend === 'down' && <FiTrendingDown className="text-red-500" />}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full"
                    style={{ width: `${data.value}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Current Progress</span>
                  <span>Target: {data.target}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Templates */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Report Templates</h3>
          <div className="space-y-3">
            {reportTemplates.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiFileText className="text-gray-400" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-xs text-gray-500">Last: {report.lastGenerated}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    report.status === 'Ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.status}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800">
                    <FiDownload />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-6">ESG Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">{metric.name}</p>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">{metric.value}</span>
                <span className={`flex items-center ${
                  metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change >= 0 ? '+' : ''}{metric.change}%
                  {metric.change >= 0 ? <FiTrendingUp className="ml-1" /> : <FiTrendingDown className="ml-1" />}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">vs. previous period</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Visualization */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Emissions Trend (Last 12 Months)</h3>
        <div className="h-64 relative">
          <div className="absolute bottom-0 left-0 right-0 h-48 border-b border-l border-gray-200">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="absolute bottom-0" style={{ left: `${(i / 12) * 100}%`, width: '8%' }}>
                <div className="flex h-full items-end">
                  <div 
                    className="w-full bg-red-400 rounded-t"
                    style={{ height: `${60 - i * 3 + Math.random() * 10}%` }}
                  ></div>
                </div>
                <div className="absolute -bottom-6 text-xs text-gray-500" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                  {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESGReporting;
