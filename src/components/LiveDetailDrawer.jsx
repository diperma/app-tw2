import { useState, useEffect } from 'react';
import { X, Copy, Check, AlertTriangle } from 'lucide-react';

const formatCurrency = (val) => {
  if (val === undefined || val === null) return 'Rp0';
  return 'Rp' + Number(val).toLocaleString('id-ID');
};

const formatNumber = (val) => {
  if (val === undefined || val === null) return '0';
  return Number(val).toLocaleString('id-ID');
};

const LiveDetailDrawer = ({ isOpen, onClose, villageId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !villageId) return;

    Promise.resolve().then(() => {
      setLoading(true);
      setError(null);
      setData(null);
    });

    // Call the database-free village detail proxy
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl : (apiUrl.endsWith('/') ? `${apiUrl}api` : `${apiUrl}/api`);

    fetch(`${baseUrl}/village-detail?id=${villageId}`)
      .then(res => {
        if (!res.ok) throw new Error('Gagal memuat detail desa');
        return res.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [isOpen, villageId]);

  const handleCopySummary = () => {
    if (!data) return;

    const t = data.territorial_data;
    const totals = t.totals || {};
    const savings = data.savings_summary || {};
    const rat = data.rat_summary || {};
    const econ = data.economic_impact || {};

    const summaryText = `📢 LAPORAN KESIAPAN KDKMP DESA ${t.village?.toUpperCase()}
📍 Wilayah: ${t.province} > ${t.district} > ${t.subdistrict}
----------------------------------------
✅ NPWP: ${totals.npwp_count > 0 ? '✔️ AKTIF' : '❌ BELUM'}
✅ NIB: ${totals.nib_count > 0 ? '✔️ AKTIF' : '❌ BELUM'}
✅ Verifikasi RAT: ${rat.total_verified_rat > 0 ? '✔️ TERVERIFIKASI' : (rat.total_draft_rat > 0 ? '⚠️ DRAF' : '❌ BELUM RAT')}
----------------------------------------
💰 Simpanan Pokok: ${formatCurrency(savings.simpanan_pokok?.total_amount)}
💰 Simpanan Wajib: ${formatCurrency(savings.simpanan_wajib?.total_amount)}
📈 Volume Transaksi: ${formatNumber(econ.total_volume)} transaksi
📈 Nilai Transaksi: ${formatCurrency(econ.total_value)}
----------------------------------------
Status per tanggal ${new Date(data.updated_at || Date.now()).toLocaleDateString('id-ID')}
Powered by Simkopdes Live Dashboard`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getStoreProgressPercent = (storeReadiness) => {
    if (!storeReadiness || !Array.isArray(storeReadiness)) return 0;
    const mapping = {
      'Total Pembangunan 100%': 100,
      'Total Pembangunan 76% - 99%': 85,
      'Total Pembangunan 51% - 75%': 65,
      'Total Pembangunan 21% - 50%': 35,
      'Total Pembangunan hingga 20%': 15
    };
    for (const key of Object.keys(mapping)) {
      const item = storeReadiness.find(s => s.label === key);
      if (item && item.value > 0) return mapping[key];
    }
    return 0;
  };

  if (!isOpen) return null;

  return (
    <div className={`drawer-container ${isOpen ? 'drawer-open' : ''}`}>
      <div className="drawer-header">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)' }}>Periksa Live Data</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Detail Kesiapan Desa</span>
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>
      </div>

      <div className="drawer-body">
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem' }}>
            <div className="glow-active" style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>Mengambil data live...</span>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem', color: 'var(--danger)', padding: '1rem', textAlign: 'center' }}>
            <AlertTriangle size={32} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Full Breadcrumb Path */}
            <div style={{ background: 'rgba(10, 143, 145, 0.04)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Lokasi Wilayah</span>
              <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                {data.territorial_data.province} &gt; {data.territorial_data.district} &gt; {data.territorial_data.subdistrict}
              </p>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--secondary)', fontWeight: 700, marginTop: '0.4rem' }}>
                Desa {data.territorial_data.village}
              </h3>
            </div>

            {/* Compliance Status Checklist */}
            <div className="glass-card" style={{ padding: '1.2rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>Kepatuhan &amp; Legalitas</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nomor Pokok Wajib Pajak (NPWP):</span>
                  <span className={`status-pill ${data.territorial_data.totals?.npwp_count > 0 ? 'active' : 'inactive'}`}>
                    {data.territorial_data.totals?.npwp_count > 0 ? 'Aktif' : 'Belum'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nomor Induk Berusaha (NIB):</span>
                  <span className={`status-pill ${data.territorial_data.totals?.nib_count > 0 ? 'active' : 'inactive'}`}>
                    {data.territorial_data.totals?.nib_count > 0 ? 'Aktif' : 'Belum'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Rapat Anggota Tahunan (RAT):</span>
                  <span className={`status-pill ${data.rat_summary?.total_verified_rat > 0 ? 'active' : 'inactive'}`}>
                    {data.rat_summary?.total_verified_rat > 0 ? 'Terverifikasi' : (data.rat_summary?.total_draft_rat > 0 ? 'Draf' : 'Belum RAT')}
                  </span>
                </div>
              </div>
            </div>

            {/* Store Construction Progress */}
            <div className="glass-card" style={{ padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pembangunan Gerai</h4>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary)' }}>
                  {getStoreProgressPercent(data.store_readiness)}%
                </span>
              </div>
              <div className="progress-bar-container" style={{ margin: '0.5rem 0' }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${getStoreProgressPercent(data.store_readiness)}%` }} 
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                Status gerai: {getStoreProgressPercent(data.store_readiness) === 100 ? 'Gerai 100% Selesai Dibangun' : (getStoreProgressPercent(data.store_readiness) > 0 ? 'Sedang dalam pembangunan' : 'Belum mulai pembangunan')}
              </span>
            </div>

            {/* Savings & Transaction Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <div className="glass-card" style={{ padding: '1.2rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.5px' }}>Akumulasi Simpanan</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Simpanan Pokok:</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatCurrency(data.savings_summary?.simpanan_pokok?.total_amount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Simpanan Wajib:</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatCurrency(data.savings_summary?.simpanan_wajib?.total_amount)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                    <span style={{ color: 'var(--primary)' }}>Total Simpanan:</span>
                    <span style={{ color: 'var(--secondary)' }}>{formatCurrency(data.savings_summary?.total_amount)}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.2rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.5px' }}>Dampak Ekonomi</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Volume Transaksi:</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatNumber(data.economic_impact?.total_volume)} trx</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Nilai Transaksi:</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatCurrency(data.economic_impact?.total_value)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Cooperatives List inside Village */}
            <div className="glass-card" style={{ padding: '1.2rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.5px' }}>Koperasi Aktif ({data.territorial_data.cooperatives?.length || 0})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                {data.territorial_data.cooperatives && data.territorial_data.cooperatives.length > 0 ? (
                  data.territorial_data.cooperatives.map((c, idx) => (
                    <div 
                      key={idx} 
                      style={{ background: 'rgba(10, 143, 145, 0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)' }}>{c.name || `KDKMP Desa ${data.territorial_data.village}`}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {c.cooperative_id || c.code || 'N/A'}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center', padding: '1rem' }}>Tidak ada Koperasi terdaftar</span>
                )}
              </div>
            </div>

            {/* Copy Report Actions */}
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
              <button 
                className="btn-primary" 
                onClick={handleCopySummary}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Salin Berhasil' : 'Salin Laporan WA'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Visual Animation Keyframe style injected */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default LiveDetailDrawer;
