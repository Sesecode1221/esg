import React, { useState } from 'react';
import { FiFilter, FiPieChart, FiBarChart2, FiRefreshCw } from 'react-icons/fi';

const WasteReporting = ({ timeRange }) => {
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedWasteType, setSelectedWasteType] = useState('all');

  const wasteData = {
    total: '5,678 tons',
    recycled: '3,245 tons',
    landfill: '342 tons',
    recyclingRate: '57.2%'
  };

  const wasteStreams = [
    { type: 'Construction Debris', total: 2345, recycled: 1200, color: '#3B82F6' },
    { type: 'Mining Tailings', total: 1890, recycled: 850, color: '#10B981' },
    { type: 'Plastic Waste', total: 890, recycled: 650, color: '#8B5CF6' },
    { type: 'Metal Scrap', total: 543, recycled: 495, color: '#F59E0B' },
    { type: 'Hazardous Waste', total: 210, recycled: 50, color: '#EF4444' }
  ];

  const projects = [
    { id: 'mining-a', name: 'Mining Site A', location: 'Limpopo', type: 'Mining' },
    { id: 'construction-b', name: 'Construction B', location: 'Gauteng', type: 'Construction' },
    { id: 'mining-c', name: 'Mining Site C', location: 'Northern Cape', type: 'Mining' },
    { id: 'mixed-d', name: 'Mixed Facility D', location: 'Western Cape', type: 'Mixed' }
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-400" />
            <span className="font-medium">Filters:</span>
          </div>
          
          <select 
            className="border border-gray-300 rounded-lg px-4 py-2"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <select 
            className="border border-gray-300 rounded-lg px-4 py-2"
            value={selectedWasteType}
            onChange={(e) => setSelectedWasteType(e.target.value)}
          >
            <option value="all">All Waste Types</option>
            <option value="construction">Construction</option>
            <option value="mining">Mining</option>
            <option value="hazardous">Hazardous</option>
          </select>

          <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
            <FiRefreshCw />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiBarChart2 className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Waste Generated</p>
              <p className="text-2xl font-bold">{wasteData.total}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">-8.3% vs last period</div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiRefreshCw className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Recycled Waste</p>
              <p className="text-2xl font-bold">{wasteData.recycled}</p>
            </div>
          </div>
          <div className="text-sm text-green-600">+12.5% improvement</div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiBarChart2 className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Waste to Landfill</p>
              <p className="text-2xl font-bold">{wasteData.landfill}</p>
            </div>
          </div>
          <div className="text-sm text-green-600">-15.2% reduction</div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiPieChart className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Recycling Rate</p>
              <p className="text-2xl font-bold">{wasteData.recyclingRate}</p>
            </div>
          </div>
          <div className="text-sm text-green-600">+5.7% improvement</div>
        </div>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste Stream Breakdown */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Waste Stream Breakdown</h3>
          <div className="space-y-4">
            {wasteStreams.map((stream, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{stream.type}</span>
                  <span className="text-gray-600">{stream.recycled.toLocaleString()} of {stream.total.toLocaleString()} tons recycled</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full"
                    style={{ 
                      width: `${(stream.recycled / stream.total) * 100}%`,
                      backgroundColor: stream.color
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{((stream.recycled / stream.total) * 100).toFixed(1)}% recycled</span>
                  <span>{(stream.total - stream.recycled).toLocaleString()} tons to landfill</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Performance */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Project Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Project</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Waste Generated</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Recycling Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, index) => {
                  const recyclingRate = 40 + Math.random() * 40;
                  return (
                    <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-gray-500">{project.location} • {project.type}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {(Math.random() * 2000 + 500).toFixed(0)} tons
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-green-500"
                              style={{ width: `${recyclingRate}%` }}
                            ></div>
                          </div>
                          <span>{recyclingRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          recyclingRate > 60 ? 'bg-green-100 text-green-800' : 
                          recyclingRate > 40 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {recyclingRate > 60 ? 'Excellent' : recyclingRate > 40 ? 'Good' : 'Needs Improvement'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WasteReporting;