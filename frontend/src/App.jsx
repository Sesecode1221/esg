import React, { useState, createContext, useEffect } from 'react';
import { FiAlertCircle, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';

import DashboardOverview from './components/DashboardOverview';
import EnergyOptimisation from './components/EnergyOptimisation';
import ESGReporting from './components/ESGReporting';
import WasteReporting from './components/WasteReporting';
import SocialImpactGovernance from './components/SocialImpactGovernance';
import NavigationBar from './components/NavigationBar';
import Sidebar from './components/Sidebar';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';


// Create API Context for global state management
export const ApiContext = createContext();

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeRange, setTimeRange] = useState('monthly');

  // Global API State
  const [apiStatus, setApiStatus] = useState({
    isLoading: false,
    lastUpdated: null,
    error: null,
    backendConnected: false,
    egaugeConnected: false
  });

  // Global data store (can be accessed by any component)
  const [globalData, setGlobalData] = useState({
    energy: null,
    esg: null,
    waste: null,
    social: null
  });

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // --- Refresh & Fetch live data ---
  const refreshAllData = async () => {
    setApiStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch live eGauge data directly (simulate API call)
      const energyResponse = await fetch(`${API_BASE}/api/energy/instant`);
      let energyData = null;
      if (energyResponse.ok) energyData = await energyResponse.json();

      setGlobalData(prev => ({ ...prev, energy: energyData }));

      setApiStatus({
        isLoading: false,
        lastUpdated: new Date(),
        error: energyResponse.ok ? null : 'eGauge meter not responding',
        backendConnected: true,
        egaugeConnected: !!energyData
      });
    } catch (error) {
      console.error('Data refresh failed:', error);
      setApiStatus({
        isLoading: false,
        lastUpdated: new Date(),
        error: error.message,
        backendConnected: false,
        egaugeConnected: false
      });
    }
  };

  // Initial load + periodic refresh every 30s
  useEffect(() => {
    refreshAllData();
    const intervalId = setInterval(refreshAllData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // --- Handle summary cards & live metric calculations ---
  const calculateSummaryMetrics = () => {
    if (!globalData.energy) return null;

    const rawData = globalData.energy.raw_data || {};
    const numbers = Object.values(rawData).filter(v => typeof v === 'number');

    const currentLoad = numbers.reduce((a, b) => a + b, 0) / 1000; // kW
    const usageToday = numbers.reduce((a, b) => a + b, 0) / 1000; // kWh
    const carbonEmission = usageToday * 0.95; // Example carbon factor

    return {
      currentLoad: currentLoad.toFixed(1),
      usageToday: usageToday.toFixed(0),
      carbonEmission: carbonEmission.toFixed(2)
    };
  };

  const summaryMetrics = calculateSummaryMetrics();

  // --- Render active tab content ---
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            timeRange={timeRange}
            energyData={globalData.energy}
            summaryMetrics={summaryMetrics}
            apiStatus={apiStatus}
          />
        );
      case 'energy':
        return (
          <EnergyOptimisation
            timeRange={timeRange}
            energyData={globalData.energy}
            apiStatus={apiStatus}
            summaryMetrics={summaryMetrics}
            onRefresh={refreshAllData}
          />
        );
      case 'esg':
        return (
          <ESGReporting
            timeRange={timeRange}
            energyData={globalData.energy}
            summaryMetrics={summaryMetrics}
            apiStatus={apiStatus}
          />
        );
      case 'waste':
        return <WasteReporting timeRange={timeRange} apiStatus={apiStatus} />;
      case 'social':
        return <SocialImpactGovernance timeRange={timeRange} apiStatus={apiStatus} />;
      case 'reports': {
  if (!globalData.energy) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Waiting for live eGauge data…</p>
      </div>
    );
  }

  const raw = globalData.energy.raw_data || {};

  /* ---------------- Shared Insight Logic ---------------- */

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

  const aggregateUsageW = CIRCUITS.reduce(
    (sum, c) => sum + (Number(raw[c]) || 0),
    0
  );

  const aggregateUsageKW = aggregateUsageW / 1000;

  const powerFactor = Number(raw['Main Incomer Power Factor']) || 0;

  const voltages = [
    Number(raw['L1 Voltage']),
    Number(raw['L2 Voltage']),
    Number(raw['L3 Voltage']),
  ].filter(Boolean);

  const avgV =
    voltages.reduce((a, b) => a + b, 0) / voltages.length;

  const phaseImbalance =
    voltages.length === 3
      ? ((Math.max(...voltages) - Math.min(...voltages)) / avgV) * 100
      : 0;

  const GRID_EMISSION_FACTOR = 0.95;
  const carbonKg = aggregateUsageKW * GRID_EMISSION_FACTOR;

  const PEAK_DEMAND_THRESHOLD_KW = 80;

  const sortedCircuits = CIRCUITS
    .map(c => ({
      name: c,
      kw: (Number(raw[c]) || 0) / 1000,
    }))
    .sort((a, b) => b.kw - a.kw);

  const topCircuit = sortedCircuits[0];

  const recommendations = [];

  if (powerFactor < 0.9) {
    recommendations.push(
      'Low power factor detected — install or tune power factor correction capacitors.'
    );
  } else if (powerFactor < 0.95) {
    recommendations.push(
      'Power factor is acceptable but not optimal — continued monitoring recommended.'
    );
  }

  if (phaseImbalance > 5) {
    recommendations.push(
      'High phase voltage imbalance detected — investigate phase loading.'
    );
  }

  if (aggregateUsageKW > PEAK_DEMAND_THRESHOLD_KW * 0.9) {
    recommendations.push(
      'Site approaching contract demand limit — shift non-critical loads to avoid penalties.'
    );
  }

  if (topCircuit && topCircuit.kw > aggregateUsageKW * 0.4) {
    recommendations.push(
      `${topCircuit.name} is the dominant load — optimisation here offers the highest savings potential.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'System operating within optimal parameters — no immediate corrective actions required.'
    );
  }

  /* ---------------- PDF Export ---------------- */

  const generatePDF = async () => {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();

    let y = 20;

    pdf.setFontSize(16);
    pdf.text('ESG Energy Report – Bertha House', 20, y);
    y += 10;

    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, y);
    y += 10;

    pdf.setFontSize(12);
    pdf.text('Live Energy Summary', 20, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.text(`Current Load: ${aggregateUsageKW.toFixed(1)} kW`, 20, y);
    y += 6;
    pdf.text(`Power Factor: ${powerFactor.toFixed(3)}`, 20, y);
    y += 6;
    pdf.text(`Phase Imbalance: ${phaseImbalance.toFixed(2)} %`, 20, y);
    y += 6;
    pdf.text(`Carbon Emissions: ${carbonKg.toFixed(2)} kgCO₂e`, 20, y);
    y += 10;

    pdf.setFontSize(12);
    pdf.text('Circuit Breakdown (kW)', 20, y);
    y += 8;

    pdf.setFontSize(10);
    sortedCircuits.forEach(c => {
      pdf.text(`${c.name}: ${c.kw.toFixed(2)} kW`, 20, y);
      y += 5;
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
    });

    y += 8;
    pdf.setFontSize(12);
    pdf.text('AI-Driven Recommendations', 20, y);
    y += 8;

    pdf.setFontSize(10);
    recommendations.forEach(r => {
      pdf.text(`• ${r}`, 20, y);
      y += 6;
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
    });

    pdf.save(`ESG_Report_${timeRange}_Bertha_House.pdf`);
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">ESG Report Generation</h2>

      <p className="text-gray-600">
        Generate an auditable ESG report using live eGauge meter data and the
        same insight logic displayed in the dashboard.
      </p>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="text-sm text-gray-700 space-y-1">
          <p><strong>Current Load:</strong> {aggregateUsageKW.toFixed(1)} kW</p>
          <p><strong>Power Factor:</strong> {powerFactor.toFixed(3)}</p>
          <p><strong>Phase Imbalance:</strong> {phaseImbalance.toFixed(2)}%</p>
          <p><strong>Carbon Emissions:</strong> {carbonKg.toFixed(2)} kgCO₂e</p>
        </div>

        <button
          onClick={generatePDF}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Generate ESG Report (PDF)
        </button>
      </div>
    </div>
  );
}

 case 'insights': { 
  if (!globalData.energy) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading live eGauge data…</p>
      </div>
    );
  }

  const raw = globalData.energy.raw_data || {};

  /* ---------------- Shared logic with EnergyOptimisation ---------------- */

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

  const aggregateUsageW = CIRCUITS.reduce(
    (sum, c) => sum + (Number(raw[c]) || 0),
    0
  );

  const aggregateUsageKW = aggregateUsageW / 1000;

  const powerFactor = Number(raw['Main Incomer Power Factor']) || 0;

  const voltages = [
    Number(raw['L1 Voltage']),
    Number(raw['L2 Voltage']),
    Number(raw['L3 Voltage']),
  ].filter(Boolean);

  const avgV =
    voltages.reduce((a, b) => a + b, 0) / voltages.length;

  const phaseImbalance =
    voltages.length === 3
      ? ((Math.max(...voltages) - Math.min(...voltages)) / avgV) * 100
      : 0;

  const GRID_EMISSION_FACTOR = 0.95;
  const carbonKg = aggregateUsageKW * GRID_EMISSION_FACTOR;

  const PEAK_DEMAND_THRESHOLD_KW = 80;

  /* ---------------- Insight derivations ---------------- */

  const sortedCircuits = CIRCUITS
    .map(c => ({
      name: c,
      kw: (Number(raw[c]) || 0) / 1000,
    }))
    .sort((a, b) => b.kw - a.kw);

  const topCircuit = sortedCircuits[0];

  const recommendations = [];

  if (powerFactor < 0.9) {
    recommendations.push(
      'Low power factor detected — installing or tuning power factor correction capacitors could reduce penalties.'
    );
  } else if (powerFactor < 0.95) {
    recommendations.push(
      'Power factor is acceptable but not optimal — monitoring is recommended.'
    );
  }

  if (phaseImbalance > 5) {
    recommendations.push(
      'High phase voltage imbalance detected — investigate phase loading to protect equipment.'
    );
  }

  if (aggregateUsageKW > PEAK_DEMAND_THRESHOLD_KW * 0.9) {
    recommendations.push(
      'Site is approaching contract demand limit — consider load shifting to avoid peak demand charges.'
    );
  }

  if (topCircuit && topCircuit.kw > aggregateUsageKW * 0.4) {
  recommendations.push(
    `${topCircuit.name} dominates site load — targeted optimisation here will yield the biggest savings.`
  );
}

  if (recommendations.length === 0) {
    recommendations.push(
      'System operating within optimal parameters — continue monitoring for anomalies.'
    );
  }

  /* ---------------- Radar Chart Data (Normalised 0–100) ---------------- */

  const radarData = [
    {
      metric: 'Load Health',
      value: Math.max(
        0,
        100 - (aggregateUsageKW / PEAK_DEMAND_THRESHOLD_KW) * 100
      ),
    },
    {
      metric: 'Power Factor',
      value: powerFactor * 100,
    },
    {
      metric: 'Phase Balance',
      value: Math.max(0, 100 - phaseImbalance * 5),
    },
    {
      metric: 'Carbon Impact',
      value: Math.max(0, 100 - carbonKg * 2),
    },
    {
      metric: 'Circuit Balance',
      value: Math.max(
        0,
        100 - ((topCircuit?.kw || 0) / aggregateUsageKW) * 100
      ),
    },
  ];

  /* ---------------- Render ---------------- */

  return (
    <div className="p-6 space-y-6">

      {/* Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-3">Live Energy Overview</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Current Site Load</span>
            <span className="font-medium">
              {aggregateUsageKW.toFixed(1)} kW
            </span>
          </div>
          <div className="flex justify-between">
            <span>Power Factor</span>
            <span className="font-medium">
              {powerFactor.toFixed(3)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Phase Imbalance</span>
            <span className="font-medium">
              {phaseImbalance.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* 🔥 Radar / Spider Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-4">Live Energy Health Snapshot</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Live Health Score"
                dataKey="value"
                stroke="#16a34a"
                fill="#16a34a"
                fillOpacity={0.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Circuit Insight */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-3">Circuit-Level Insight</h3>
        <p className="text-sm text-gray-600 mb-3">
          Highest contributing circuit:
        </p>
        <div className="flex justify-between text-sm">
          <span>{topCircuit?.name}</span>
          <span className="font-medium">
            {topCircuit?.kw.toFixed(2)} kW
          </span>
        </div>
      </div>

      {/* Carbon & ESG */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-3">Carbon & ESG Context</h3>
        <p className="text-sm text-gray-600">
          Estimated real-time carbon emissions:
        </p>
        <p className="mt-2 font-medium">
          {carbonKg.toFixed(2)} kgCO₂e
        </p>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-3">AI-Driven Recommendations</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          {recommendations.map((rec, idx) => (
            <li key={idx}>{rec}</li>
          ))}
        </ul>
      </div>

    </div>
  );
}

      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">System Settings</h2>
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">Backend Server</p>
                  <p className="text-sm text-gray-600">{API_BASE}</p>
                </div>
                <div className="flex items-center">
                  {apiStatus.backendConnected ? (
                    <>
                      <FiCheckCircle className="text-green-500 mr-2" />
                      <span className="text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <FiAlertCircle className="text-red-500 mr-2" />
                      <span className="text-red-600">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">eGauge Connection</p>
                  <p className="text-sm text-gray-600">{process.env.REACT_APP_EGAUGE_DEVICE_ID || 'Bertha House'}</p>
                </div>
                <div className="flex items-center">
                  {apiStatus.egaugeConnected ? (
                    <>
                      <FiCheckCircle className="text-green-500 mr-2" />
                      <span className="text-green-600">Active</span>
                    </>
                  ) : (
                    <>
                      <FiAlertCircle className="text-yellow-500 mr-2" />
                      <span className="text-yellow-600">No Data</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={refreshAllData}
                disabled={apiStatus.isLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FiRefreshCw className={`mr-2 ${apiStatus.isLoading ? 'animate-spin' : ''}`} />
                {apiStatus.isLoading ? 'Refreshing Data...' : 'Refresh All Data'}
              </button>
            </div>
          </div>
        );
      default:
        return (
          <DashboardOverview
            timeRange={timeRange}
            energyData={globalData.energy}
            summaryMetrics={summaryMetrics}
            apiStatus={apiStatus}
          />
        );
    }
  };

  return (
    <ApiContext.Provider value={{ apiStatus, globalData, refreshAllData, API_BASE }}>
      <div className="min-h-screen bg-gray-50">
        {/* API Status Banner */}
        {apiStatus.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 flex justify-between items-center">
            <div className="flex items-center">
              <FiAlertCircle className="text-red-500 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-700"><strong>Connection Error:</strong> {apiStatus.error}</p>
              </div>
            </div>
            <button onClick={refreshAllData} className="text-sm text-red-700 hover:text-red-900">Retry</button>
          </div>
        )}

        {/* Success Banner */}
        {apiStatus.backendConnected && !apiStatus.error && apiStatus.lastUpdated && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 flex justify-between items-center">
            <div className="flex items-center">
              <FiCheckCircle className="text-green-500 mr-3" />
              <p className="text-sm text-green-700">
                Connected to Bertha House eGauge • Last updated: {apiStatus.lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <button onClick={refreshAllData} className="flex items-center text-sm text-green-700 hover:text-green-900">
              <FiRefreshCw className={`mr-1 ${apiStatus.isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        )}

        <NavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} apiStatus={apiStatus} globalData={globalData} />
          <main className="flex-1 p-6">
            {/* Filters & Actions */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {activeTab === 'dashboard' && 'ESG Dashboard Overview'}
                  {activeTab === 'energy' && 'Bertha House Energy Optimisation'}
                  {activeTab === 'esg' && 'ESG Reporting'}
                  {activeTab === 'waste' && 'Waste Reporting'}
                  {activeTab === 'social' && 'Social Impact & Governance'}
                  {activeTab === 'reports' && 'Report Generation'}
                  {activeTab === 'insights' && 'AI Insights & Analytics'}
                  {activeTab === 'settings' && 'System Settings'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {activeTab === 'energy' && 'Live data from Bertha House eGauge smart meter'}
                  {activeTab === 'dashboard' && 'Integrated view of all ESG metrics'}
                  {activeTab === 'esg' && 'Compliance tracking and reporting'}
                  {apiStatus.isLoading && ' • Loading latest data...'}
                </p>
              </div>

              <div className="flex space-x-3">
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white"
                  value={timeRange}
                  onChange={e => setTimeRange(e.target.value)}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>

                <button
                  onClick={() => {
                    if (!globalData.energy) return alert('Please wait for live data to load before exporting');
                    console.log('Exporting report with data:', globalData);
                    alert(`Exporting ${timeRange} report with live eGauge data`);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  Export {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Report
                </button>

                <button
                  onClick={refreshAllData}
                  disabled={apiStatus.isLoading}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  title="Refresh all data"
                >
                  <FiRefreshCw className={`mr-1 ${apiStatus.isLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </div>

            {apiStatus.isLoading && (
              <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                  <FiRefreshCw className="animate-spin text-3xl text-green-600 mx-auto mb-4" />
                  <p className="text-gray-700">Connecting to Bertha House eGauge...</p>
                  <p className="text-sm text-gray-500 mt-1">Fetching live energy data</p>
                </div>
              </div>
            )}

            <div className={apiStatus.isLoading ? 'opacity-50' : ''}>
              {renderActiveTab()}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
              <span>GreenBDG Africa ESG Platform • Bertha House eGauge Integration</span>
              <span>
                <span className={`w-2 h-2 rounded-full inline-block mr-2 ${
                  apiStatus.backendConnected ? (apiStatus.egaugeConnected ? 'bg-green-500' : 'bg-yellow-500') : 'bg-red-500'
                }`}></span>
                {apiStatus.backendConnected
                  ? (apiStatus.egaugeConnected ? 'Connected to eGauge' : 'Backend connected, no meter data')
                  : 'Backend disconnected'
                }
                {apiStatus.lastUpdated && ` • Updated: ${apiStatus.lastUpdated.toLocaleTimeString()}`}
              </span>
            </div>
          </main>
        </div>
      </div>
    </ApiContext.Provider>
  );
}

export default App;
