import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, LineChart, Line
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ================= ESG CONFIG ================= */
const FLOOR_AREA_M2 = 1200;
const OCCUPANTS = 45;
const GRID_EMISSION_FACTOR = 0.95;
const PEAK_DEMAND_THRESHOLD_KW = 80;

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

const EnergyOptimisation = () => {
  const [energyData, setEnergyData] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const dashboardRef = useRef(null);

  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  /* ================= FETCH ================= */
  const fetchInstant = useCallback(async () => {
    const res = await fetch(`${API}/api/energy/instant`);
    if (!res.ok) return;

    const data = await res.json();
    setEnergyData(data);

    const usageW = aggregateUsage(data.raw_data);
    const usageKW = usageW / 1000;

    setHistory(h => [
      ...h,
      {
        t: new Date(data.timestamp).toLocaleTimeString(),
        kw: usageKW,
        pf: Number(data.raw_data['Main Incomer Power Factor']) || 0,
        l1: Number(data.raw_data['L1 Voltage']) || 0,
        l2: Number(data.raw_data['L2 Voltage']) || 0,
        l3: Number(data.raw_data['L3 Voltage']) || 0,
      }
    ].slice(-60));

    detectPeakDemand(usageKW);
  }, [API]);

  useEffect(() => {
    fetchInstant();
    const id = setInterval(fetchInstant, 10000);
    return () => clearInterval(id);
  }, [fetchInstant]);

  /* ================= AGGREGATION ================= */
  const aggregateUsage = (raw = {}) =>
    CIRCUITS.reduce((sum, c) => sum + (Number(raw[c]) || 0), 0);

  /* ================= POWER QUALITY ================= */
  const powerQuality = useMemo(() => {
    if (!energyData) return null;
    const r = energyData.raw_data;

    const pf = Number(r['Main Incomer Power Factor']) || 0;
    const volts = [
      Number(r['L1 Voltage']),
      Number(r['L2 Voltage']),
      Number(r['L3 Voltage']),
    ].filter(Boolean);

    const avg = volts.reduce((a, b) => a + b, 0) / volts.length;
    const imbalance = ((Math.max(...volts) - Math.min(...volts)) / avg) * 100;

    return { pf, imbalance };
  }, [energyData]);

  /* ================= PF RECOMMENDATIONS ================= */
  const pfRecommendation = useMemo(() => {
    if (!powerQuality) return null;
    if (powerQuality.pf >= 0.95) return "Power factor is optimal.";
    if (powerQuality.pf >= 0.9) return "Monitor PF. Consider capacitor bank tuning.";
    return "⚠️ Install or increase power factor correction capacitors immediately.";
  }, [powerQuality]);

  /* ================= ESG METRICS ================= */
  const esg = useMemo(() => {
    if (!energyData) return null;
    const usageWh = aggregateUsage(energyData.raw_data);
    const usageKWh = usageWh / 1000;

    return {
      carbon: usageKWh * GRID_EMISSION_FACTOR,
      perArea: usageKWh / FLOOR_AREA_M2,
      perPerson: usageKWh / OCCUPANTS,
    };
  }, [energyData]);

  /* ================= PEAK DEMAND ================= */
  const detectPeakDemand = (kw) => {
    if (kw > PEAK_DEMAND_THRESHOLD_KW) {
      setAlerts(a => [
        ...a,
        { time: new Date().toLocaleTimeString(), message: `Peak demand exceeded: ${kw.toFixed(1)} kW` }
      ].slice(-5));
    }
  };

  /* ================= HEATMAP DATA ================= */
  const heatmap = useMemo(() => {
    if (!energyData) return [];
    return CIRCUITS.map(c => ({
      circuit: c,
      kw: (Number(energyData.raw_data[c]) || 0) / 1000,
    }));
  }, [energyData]);

  /* ================= EXPORTS ================= */
  const exportCSV = () => {
    const rows = [
      ['Timestamp', 'Usage kW', 'Power Factor', 'L1 V', 'L2 V', 'L3 V'],
      ...history.map(h => [h.t, h.kw, h.pf, h.l1, h.l2, h.l3])
    ];

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'energy-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const canvas = await html2canvas(dashboardRef.current);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save('energy-dashboard.pdf');
  };

  if (!energyData) return <p>Loading…</p>;

  return (
    <div className="energy-optimisation" ref={dashboardRef}>

      <h2>{energyData.meter_name}</h2>

      {/* ================= EXPORT ================= */}
      <div className="export-actions">
        <button onClick={exportCSV}>⬇️ Export CSV</button>
        <button onClick={exportPDF}>⬇️ Export PDF</button>
      </div>

      {/* ================= TRUE USAGE ================= */}
      <section>
        <h3>True Energy Usage</h3>
        <p>{aggregateUsage(energyData.raw_data).toFixed(0)} W</p>
      </section>

      {/* ================= CARBON ================= */}
      <section>
        <h3>Carbon Impact</h3>
        <p>{esg.carbon.toFixed(2)} kgCO₂e</p>
      </section>

      {/* ================= POWER QUALITY ================= */}
      <section>
        <h3>Power Quality</h3>
        <p>Power Factor: <strong>{powerQuality.pf.toFixed(3)}</strong></p>
        <p>Phase Imbalance: <strong>{powerQuality.imbalance.toFixed(2)}%</strong></p>
        <p className="recommendation">{pfRecommendation}</p>
      </section>

      {/* ================= RAW DATA BAR CHART ================= */}
      <section>
        <h3>Raw Circuit Load (kW)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={heatmap}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="circuit" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="kw" name="kW" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* ================= RAW DATA LINE CHART ================= */}
      <section>
        <h3>Voltage & Power Factor Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="t" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="l1" name="L1 Voltage" stroke="#2563eb" />
            <Line dataKey="l2" name="L2 Voltage" stroke="#16a34a" />
            <Line dataKey="l3" name="L3 Voltage" stroke="#dc2626" />
            <Line dataKey="pf" name="Power Factor" stroke="#9333ea" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* ================= USAGE TREND ================= */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={history}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area dataKey="kw" name="Usage (kW)" stroke="#2563eb" fill="#2563eb" />
        </AreaChart>
      </ResponsiveContainer>

      <details>
        <summary>Raw Meter Data</summary>
        <pre>{JSON.stringify(energyData.raw_data, null, 2)}</pre>
      </details>

    </div>
  );
};

export default EnergyOptimisation;
