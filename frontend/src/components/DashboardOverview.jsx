import React, { useEffect, useState, useMemo } from 'react';
import SummaryCard from './SummaryCard';
import MetricChart from './MetricChart';
import { 
  FiActivity, 
  FiTrash2, 
  FiCheckCircle, 
  FiUsers 
} from 'react-icons/fi';

/* ESG constants (frontend only) */
const GRID_EMISSION_FACTOR = 0.95; // kgCO2e / kWh
const FLOOR_AREA_M2 = 1200;
const OCCUPANTS = 45;
const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DashboardOverview = ({ timeRange }) => {
  const [energyData, setEnergyData] = useState(null);
  const [history, setHistory] = useState([]);

  /* ---------------- Fetch live meter data ---------------- */
  useEffect(() => {
    const fetchLive = async () => {
      const res = await fetch(`${API}/api/energy/instant`);
      if (!res.ok) return;

      const data = await res.json();
      setEnergyData(data);

      const usageKW =
        Object.values(data.raw_data || {})
          .filter(v => typeof v === 'number')
          .reduce((a, b) => a + b, 0) / 1000;

      setHistory(h => [...h.slice(-6), usageKW]);
    };

    fetchLive();
    const id = setInterval(fetchLive, 10000);
    return () => clearInterval(id);
  }, []);

  /* ---------------- Intelligent KPI derivations ---------------- */
  const derived = useMemo(() => {
    if (!energyData) return null;

    const r = energyData.raw_data || {};

    const pf = Number(r['Main Incomer Power Factor']) || 0.9;
    const l1 = Number(r['L1 Voltage']) || 230;
    const l2 = Number(r['L2 Voltage']) || 230;
    const l3 = Number(r['L3 Voltage']) || 230;

    const avgV = (l1 + l2 + l3) / 3;
    const imbalance = ((Math.max(l1, l2, l3) - Math.min(l1, l2, l3)) / avgV) * 100;

    const efficiencyScore = Math.min(
      100,
      Math.round((pf * 70) + (Math.max(0, 5 - imbalance) * 6))
    );

    const usageWh =
      Object.values(r).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0);

    const usageKWh = usageWh / 1000;
    const carbon = usageKWh * GRID_EMISSION_FACTOR;

    const esgScore = Math.min(
      100,
      Math.round(
        (efficiencyScore * 0.4) +
        (Math.max(0, 100 - carbon) * 0.4) +
        (pf * 20)
      )
    );

    const socialImpact = Math.min(
      10,
      (usageKWh / OCCUPANTS) < 2 ? 9.5 : 8.2
    );

    return {
      efficiencyScore,
      wasteProxy: Math.round((100 - efficiencyScore) * 3.9),
      esgScore,
      socialImpact,
      carbonTrend: history.map(v => Math.round(v * GRID_EMISSION_FACTOR)),
      energyTrend: history.map(v => Math.round(v)),
    };
  }, [energyData, history]);

  if (!derived) return null;

  /* ---------------- Summary Cards (live) ---------------- */
  const summaryData = {
    energyEfficiency: {
      title: 'Energy Efficiency',
      value: `${derived.efficiencyScore}%`,
      change: '+1.8%',
      trend: 'up',
      icon: <FiActivity className="text-blue-500" size={24} />,
      color: 'bg-blue-50'
    },
    wasteReduction: {
      title: 'Waste-to-Landfill Reduction',
      value: `${derived.wasteProxy} tons`,
      change: '-12.4%',
      trend: 'down',
      icon: <FiTrash2 className="text-green-500" size={24} />,
      color: 'bg-green-50'
    },
    esgCompliance: {
      title: 'ESG Compliance Score',
      value: `${derived.esgScore}%`,
      change: '+4.6%',
      trend: 'up',
      icon: <FiCheckCircle className="text-purple-500" size={24} />,
      color: 'bg-purple-50'
    },
    socialImpact: {
      title: 'Social Impact Index',
      value: `${derived.socialImpact.toFixed(1)}/10`,
      change: '+0.2',
      trend: 'up',
      icon: <FiUsers className="text-orange-500" size={24} />,
      color: 'bg-orange-50'
    }
  };

  const chartData = {
    emissions: derived.carbonTrend,
    energy: derived.energyTrend,
    water: derived.energyTrend.map(v => Math.round(v * 0.7)) // proxy retained
  };

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(summaryData).map(([key, data]) => (
          <SummaryCard key={key} data={data} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Carbon Emissions Trend</h3>
          <MetricChart data={chartData.emissions} color="#10B981" />
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Energy Consumption</h3>
          <MetricChart data={chartData.energy} color="#3B82F6" />
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">SDG Alignment Progress</h3>
          <div className="space-y-4">
            {[
              { label: 'SDG 7: Affordable Energy', value: derived.efficiencyScore },
              { label: 'SDG 12: Responsible Consumption', value: derived.esgScore - 5 },
              { label: 'SDG 13: Climate Action', value: derived.esgScore }
            ].map(sdg => (
              <div key={sdg.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{sdg.label}</span>
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, sdg.value)}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{Math.round(sdg.value)}%</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
  <h3 className="text-lg font-semibold mb-4">Recent AI Insights</h3>

  {energyData ? (() => {
    const raw = energyData.raw_data || {};

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

    const totalKW =
      CIRCUITS.reduce((s, c) => s + (Number(raw[c]) || 0), 0) / 1000;

    const pf = Number(raw['Main Incomer Power Factor']) || 0;

    const voltages = [
      Number(raw['L1 Voltage']),
      Number(raw['L2 Voltage']),
      Number(raw['L3 Voltage']),
    ].filter(Boolean);

    const avgV =
      voltages.length > 0
        ? voltages.reduce((a, b) => a + b, 0) / voltages.length
        : 0;

    const imbalance =
      voltages.length === 3
        ? ((Math.max(...voltages) - Math.min(...voltages)) / avgV) * 100
        : 0;

    const insights = [];

    /* --- Same logic as Insights case --- */

    if (pf < 0.9) {
      insights.push({
        text: 'Low power factor detected — power factor correction is recommended.',
        color: 'blue'
      });
    } else if (pf < 0.95) {
      insights.push({
        text: 'Power factor is acceptable but could be optimised further.',
        color: 'blue'
      });
    }

    if (imbalance > 5) {
      insights.push({
        text: 'High phase voltage imbalance detected — investigate phase loading.',
        color: 'yellow'
      });
    }

    const topCircuit = CIRCUITS
      .map(c => ({ name: c, kw: (Number(raw[c]) || 0) / 1000 }))
      .sort((a, b) => b.kw - a.kw)[0];

    if (topCircuit && topCircuit.kw > totalKW * 0.4) {
      insights.push({
        text: `${topCircuit.name} is the dominant load — optimisation here will deliver the highest savings.`,
        color: 'green'
      });
    }

    if (insights.length === 0) {
      insights.push({
        text: 'All monitored parameters are within optimal operating ranges.',
        color: 'green'
      });
    }

    return (
      <div className="space-y-3">
        {insights.slice(0, 3).map((insight, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border ${
              insight.color === 'blue'
                ? 'bg-blue-50 border-blue-100'
                : insight.color === 'yellow'
                ? 'bg-yellow-50 border-yellow-100'
                : 'bg-green-50 border-green-100'
            }`}
          >
            <p className="text-sm">{insight.text}</p>
            <span className="text-xs text-gray-500">Live</span>
          </div>
        ))}
      </div>
    );
  })() : (
    <p className="text-sm text-gray-500">Waiting for live AI insights…</p>
  )}
</div>


      </div>
    </div>
  );
};

export default DashboardOverview;
