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
    "Total pembangunan hingga 20%",
    "21% - 50%",
    "51% - 75%",
    "76% - 99%",
    "Total pembangunan 100%"
  ];

  useEffect(() => {
    setLoading(true);
    fetchCharts(province, district).then(res => {
      if (type === 'store') {
        // Map DB values to display labels
        const sortedStore = DB_LABELS.map((dbLabel, index) => {
            const found = res.store.find(d => d.label === dbLabel);
            return { displayLabel: DISPLAY_LABELS[index], value: found ? found.value : 0 };
        });

        setData({
          labels: sortedStore.map(d => d.displayLabel),
          datasets: [{
            label: 'Kesiapan Gerai',
            data: sortedStore.map(d => d.value),
            backgroundColor: [
              'rgba(230, 57, 70, 0.7)',
              'rgba(244, 162, 97, 0.7)',
              'rgba(244, 162, 97, 0.7)',
              'rgba(244, 162, 97, 0.7)',
              'rgba(45, 106, 79, 0.7)',
            ],
            borderColor: [
              'rgba(230, 57, 70, 1)',
              'rgba(244, 162, 97, 1)',
              'rgba(244, 162, 97, 1)',
              'rgba(244, 162, 97, 1)',
              'rgba(45, 106, 79, 1)',
            ],
            borderWidth: 1,
            borderRadius: 4
          }]
        });
      } else {
        setData({
          labels: ['Terverifikasi', 'Draf', 'Belum RAT'],
          datasets: [{
            data: [res.rat.Verified, res.rat.Draft, res.rat['Belum RAT']],
            backgroundColor: [
              'rgba(45, 106, 79, 0.7)',
              'rgba(255, 195, 0, 0.7)',
              'rgba(230, 57, 70, 0.7)',
            ],
            borderColor: [
              'rgba(45, 106, 79, 1)',
              'rgba(255, 195, 0, 1)',
              'rgba(230, 57, 70, 1)',
            ],
            borderWidth: 1,
          }]
        });
      }
      setLoading(false);
    });
  }, [province, district, type]);

  if (loading || !data) return <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat...</div>;

  if (type === 'store') {
    return (
      <div className="glass-card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Progres Pembangunan Gerai</h3>
        <Bar data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </div>
    );
  }

  return (
    <div className="glass-card">
      <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Status RAT (Rapat Anggota Tahunan)</h3>
      <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Doughnut 
          data={data} 
          options={{ 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
              }
            }
          }} 
        />
      </div>
    </div>
  );
};

export default Charts;
