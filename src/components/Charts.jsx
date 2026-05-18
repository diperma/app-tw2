import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { fetchCharts } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Charts = ({ type, province, district }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // DB exact strings
  const DB_LABELS = [
    "Total Pembangunan hingga 20%",
    "Total Pembangunan 21% - 50%",
    "Total Pembangunan 51% - 75%",
    "Total Pembangunan 76% - 99%",
    "Total Pembangunan 100%"
  ];

  // User requested display labels
  const DISPLAY_LABELS = [
    "Hingga 20%",
    "21% - 50%",
    "51% - 75%",
    "76% - 99%",
    "Selesai 100%"
  ];

  useEffect(() => {
    setLoading(true);
    fetchCharts(province, district).then(res => {
      if (type === 'store') {
        // Map DB values to display labels
        const sortedStore = DB_LABELS.map((dbLabel, index) => {
            const found = res?.store?.find(d => d.label === dbLabel);
            return { displayLabel: DISPLAY_LABELS[index], value: found ? found.value : 0 };
        });

        setData({
          labels: sortedStore.map(d => d.displayLabel),
          datasets: [{
            label: 'Kesiapan Gerai',
            data: sortedStore.map(d => d.value),
            backgroundColor: [
              'rgba(250, 173, 20, 0.45)', // hingga 20% (Amber)
              'rgba(12, 164, 165, 0.35)', // 21%-50% (Teal)
              'rgba(12, 164, 165, 0.55)', // 51%-75% (Teal)
              'rgba(12, 164, 165, 0.75)', // 76%-99% (Teal)
              'rgba(82, 196, 26, 0.65)',   // 100% Selesai (Emerald)
            ],
            borderColor: [
              'rgba(250, 173, 20, 1)',
              'rgba(12, 164, 165, 0.8)',
              'rgba(12, 164, 165, 0.9)',
              'rgba(12, 164, 165, 1)',
              'rgba(82, 196, 26, 1)',
            ],
            borderWidth: 1.5,
            borderRadius: 6
          }]
        });
      } else {
        setData({
          labels: ['Terverifikasi', 'Draf', 'Belum RAT'],
          datasets: [{
            data: [res?.rat?.Verified || 0, res?.rat?.Draft || 0, res?.rat?.['Belum RAT'] || 0],
            backgroundColor: [
              'rgba(82, 196, 26, 0.65)',   // Terverifikasi (Emerald)
              'rgba(250, 173, 20, 0.6)',  // Draf (Amber)
              'rgba(255, 77, 79, 0.55)',   // Belum RAT (Coral)
            ],
            borderColor: [
              'rgba(82, 196, 26, 1)',
              'rgba(250, 173, 20, 1)',
              'rgba(255, 77, 79, 1)',
            ],
            borderWidth: 1.5,
          }]
        });
      }
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, [province, district, type]);

  const customScales = {
    x: {
      ticks: { color: '#627e81', font: { family: 'Outfit', size: 11 } },
      grid: { color: 'rgba(10, 143, 145, 0.06)' }
    },
    y: {
      ticks: { color: '#627e81', font: { family: 'Outfit', size: 11 } },
      grid: { color: 'rgba(10, 143, 145, 0.06)' }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: { family: 'Outfit', size: 13 },
        bodyFont: { family: 'Outfit', size: 12 },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1d3336',
        bodyColor: '#627e81',
        borderColor: 'var(--border)',
        borderWidth: 1
      }
    },
    scales: customScales
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#1d3336',
          font: { family: 'Outfit', size: 12 },
          padding: 15
        }
      },
      tooltip: {
        titleFont: { family: 'Outfit', size: 13 },
        bodyFont: { family: 'Outfit', size: 12 },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1d3336',
        bodyColor: '#627e81',
        borderColor: 'var(--border)',
        borderWidth: 1
      }
    }
  };

  if (loading || !data) {
    return (
      <div className="glass-card" style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>Memuat grafik...</span>
      </div>
    );
  }

  if (type === 'store') {
    return (
      <div className="glass-card">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Progres Pembangunan Gerai
        </h3>
        <div style={{ height: '240px', position: 'relative' }}>
          <Bar data={data} options={barOptions} />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Status RAT (Rapat Anggota Tahunan)
      </h3>
      <div style={{ height: '240px', position: 'relative' }}>
        <Doughnut data={data} options={doughnutOptions} />
      </div>
    </div>
  );
};

export default Charts;
