import React from 'react';
import { Home, FileText, CheckCircle, ClipboardCheck } from 'lucide-react';

const StatCards = ({ stats }) => {
  const formatValue = (val) => {
    if (val === undefined || val === null) return '0';
    return val.toLocaleString('id-ID');
  };

  const cards = [
    { label: 'Total Desa', value: formatValue(stats.total_villages), icon: Home, color: 'var(--primary)' },
    { label: 'NPWP Terverifikasi', value: formatValue(stats.has_npwp), icon: FileText, color: 'var(--primary)' },
    { label: 'Koperasi memiliki NIB', value: formatValue(stats.has_nib), icon: CheckCircle, color: '#2a9d8f' },
    { label: 'Total RAT', value: formatValue(stats.rat_submitted), icon: ClipboardCheck, color: 'var(--accent)' },
  ];

  return (
    <div className="dashboard-grid">
      {cards.map((card, i) => (
        <div key={i} className="glass-card" style={{ borderLeft: `4px solid ${card.color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">{card.label}</span>
            <card.icon size={20} color={card.color} />
          </div>
          <div className="stat-value">{card.value}</div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
