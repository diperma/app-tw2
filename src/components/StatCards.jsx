import { Home, FileText, CheckCircle, ClipboardCheck, Wallet, TrendingUp, Hammer, Award } from 'lucide-react';

const StatCards = ({ stats }) => {
  const formatValue = (val) => {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString('id-ID');
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return 'Rp0';
    if (val >= 1000000000) {
      return `Rp${(val / 1000000000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M`;
    }
    if (val >= 1000000) {
      return `Rp${(val / 1000000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Jt`;
    }
    return 'Rp' + Number(val).toLocaleString('id-ID');
  };

  const cards = [
    { label: 'Total Desa', value: formatValue(stats?.total_villages), icon: Home, color: 'var(--primary)' },
    { label: 'NPWP Aktif', value: formatValue(stats?.has_npwp), icon: FileText, color: '#36cfc9' },
    { label: 'NIB Terdaftar', value: formatValue(stats?.has_nib), icon: CheckCircle, color: 'var(--accent)' },
    { label: 'Penyelesaian RAT', value: formatValue(stats?.rat_submitted), icon: ClipboardCheck, color: 'var(--warning)' },
    { label: 'Progres Pembangunan', value: formatValue(stats?.gerai_all_progress), icon: Hammer, color: '#9254de' },
    { label: 'Gerai Selesai 100%', value: formatValue(stats?.gerai_100_percent), icon: Award, color: '#2f54eb' },
    { label: 'Akumulasi Simpanan', value: formatCurrency(stats?.total_simpanan), icon: Wallet, color: '#597ef7' },
    { label: 'Volume Transaksi', value: formatCurrency(stats?.total_transaksi), icon: TrendingUp, color: '#ff7875' },
  ];

  const complianceCards = cards.slice(0, 6);
  const economicCards = cards.slice(6);

  return (
    <div>
      {/* Row 1: Compliance Metrics (6 Columns) */}
      <div className="compliance-grid">
        {complianceCards.map((card, i) => (
          <div key={i} className="glass-card" style={{ borderLeft: `4px solid ${card.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-label">{card.label}</span>
              <card.icon size={18} color={card.color} />
            </div>
            <div className="stat-value">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Economic/Financial Metrics (2 Columns) */}
      <div className="economic-grid">
        {economicCards.map((card, i) => (
          <div key={i} className="glass-card" style={{ borderLeft: `4px solid ${card.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-label">{card.label}</span>
              <card.icon size={18} color={card.color} />
            </div>
            <div className="stat-value">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatCards;
