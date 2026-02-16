import React from 'react';
import { 
  FiHome, FiZap, FiFileText, FiTrash2, FiUsers,
  FiBarChart2, FiSettings, FiHelpCircle, FiActivity,
  FiRefreshCw, FiCheckCircle, FiAlertCircle,
  FiPower, FiTrendingUp, FiDollarSign
} from 'react-icons/fi';

const GRID_EMISSION_FACTOR = 0.95;     // kgCO₂e / kWh
const ENERGY_TARIFF_ZAR = 1.99;        // ZAR / kWh

const CIRCUITS = [
  'HVAC/Aircom',
  'Local Mains',
  'Kitchen',
  'Server Room',
  'Canteen',
  'Passage Plugs',
  'Caretaker Flat',
  'Battenlane (Outside DB)',
];

const Sidebar = ({ activeTab, setActiveTab, apiStatus, globalData }) => {

  const menuItems = [
    { id: 'dashboard', icon: <FiHome />, label: 'Dashboard' },
    { id: 'energy', icon: <FiZap />, label: 'Bertha House Energy' },
    { id: 'esg', icon: <FiFileText />, label: 'ESG Reporting' },
    { id: 'waste', icon: <FiTrash2 />, label: 'Waste Reporting' },
    { id: 'social', icon: <FiUsers />, label: 'Social Impact' },
    { id: 'reports', icon: <FiBarChart2 />, label: 'Generate Reports' },
    { id: 'insights', icon: <FiBarChart2 />, label: 'AI Insights' },
    { id: 'settings', icon: <FiSettings />, label: 'Settings' },
  ];

  /* ================= LIVE ENERGY METRICS ================= */

  const calculateEnergyMetrics = () => {
    if (!globalData?.energy?.raw_data) return null;

    const raw = globalData.energy.raw_data;

    const totalUsageW = CIRCUITS.reduce(
      (sum, c) => sum + (Number(raw[c]) || 0),
      0
    );

    const totalUsageKW = totalUsageW / 1000;
    const usageKWh = totalUsageKW; // live snapshot approximation

    const carbonKg = usageKWh * GRID_EMISSION_FACTOR;
    const costZar = usageKWh * ENERGY_TARIFF_ZAR;

    let trend = 'stable';
    if (totalUsageKW > 10) trend = 'up';
    else if (totalUsageKW < 3) trend = 'down';

    return {
      currentPower: totalUsageKW.toFixed(1),
      energyUsed: usageKWh.toFixed(1),
      cost: costZar.toFixed(2),
      carbon: (carbonKg / 1000).toFixed(3), // tons CO₂
      trend,
      timestamp: globalData.energy.timestamp
        ? new Date(globalData.energy.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        : '--:--',
      recommendations:
        totalUsageKW > 15 ? 'High Load' :
        totalUsageKW > 8 ? 'Moderate Load' :
        'Normal'
    };
  };

  const energyMetrics = calculateEnergyMetrics();

  /* ================= RENDER ================= */

  return (
    <aside className="hidden lg:block w-64 bg-white border-r shadow-sm">
      <div className="p-6 space-y-6">

        {/* ================= CONNECTION STATUS ================= */}
        <div className={`rounded-lg p-4 ${
          apiStatus?.egaugeConnected ? 'bg-green-50 border border-green-100' :
          apiStatus?.backendConnected ? 'bg-yellow-50 border border-yellow-100' :
          'bg-red-50 border border-red-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                apiStatus?.egaugeConnected ? 'bg-green-500 animate-pulse' :
                apiStatus?.backendConnected ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <p className="text-sm font-medium">
                {apiStatus?.egaugeConnected ? 'Live eGauge Data' :
                 apiStatus?.backendConnected ? 'API Connected' : 'Disconnected'}
              </p>
            </div>
            {apiStatus?.isLoading && (
              <FiRefreshCw className="animate-spin text-gray-400" size={14} />
            )}
          </div>

          {energyMetrics ? (
            <>
              <div className="flex items-baseline space-x-1 mb-1">
                <FiActivity className="text-green-600" size={16} />
                <span className="text-2xl font-bold text-gray-900">
                  {energyMetrics.currentPower}
                </span>
                <span className="text-sm text-gray-600">kW</span>
              </div>
              <p className="text-xs text-gray-600">
                Current Load • Updated {energyMetrics.timestamp}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              {apiStatus?.error ? 'Connection Error' : 'Waiting for data...'}
            </p>
          )}
        </div>

        {/* ================= REAL-TIME METRICS ================= */}
        {energyMetrics && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">

            <MetricRow icon={<FiPower />} label="Usage Today" value={`${energyMetrics.energyUsed} kWh`} />

            <MetricRow icon={<FiDollarSign />} label="Cost Today" value={`R${energyMetrics.cost}`} />

            <MetricRow icon={<div className="w-3 h-3 bg-gray-400 rounded-full" />} label="Carbon Today" value={`${energyMetrics.carbon} tCO₂`} />

            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Trend</span>
                <div className="flex items-center space-x-1">
                  <FiTrendingUp
                    className={
                      energyMetrics.trend === 'up'
                        ? 'text-green-500'
                        : energyMetrics.trend === 'down'
                        ? 'text-red-500'
                        : 'text-yellow-500'
                    }
                    size={12}
                  />
                  <span className="text-xs font-medium capitalize">
                    {energyMetrics.trend}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= NAVIGATION ================= */}
        <nav className="space-y-1">
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            const showLive = item.id === 'energy' && apiStatus?.egaugeConnected;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                    : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={isActive ? 'text-green-600' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </div>

                {showLive && (
                  <span className="text-xs text-green-600 font-medium flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                    Live
                  </span>
                )}

                {item.id === 'settings' && apiStatus?.error && (
                  <FiAlertCircle className="text-red-500" size={14} />
                )}
              </button>
            );
          })}
        </nav>

        {/* ================= FOOTER ================= */}
        <div className="pt-4 border-t border-gray-200 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">G</span>
            </div>
            <span className="text-sm font-medium text-gray-800">
              Green<span className="text-green-600">BDG</span>
            </span>
          </div>
          <p className="text-xs text-gray-500">ESG Platform v1.0</p>
          <p className="text-xs text-gray-400 mt-1">
            {energyMetrics ? 'Live • Bertha House • eGauge' : 'Beta V.1.0'}
          </p>
        </div>
      </div>
    </aside>
  );
};

/* -------- Small Helper -------- */
const MetricRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2 text-xs text-gray-600">
      {icon}
      <span>{label}</span>
    </div>
    <span className="text-sm font-semibold">{value}</span>
  </div>
);

export default Sidebar;

