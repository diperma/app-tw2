import React, { useState, useEffect } from 'react';
import { 
  fetchStats, 
  fetchHighlights, 
  fetchRegionalData, 
  fetchProvinces, 
  fetchDistricts, 
  fetchSubdistricts
} from '../services/api';
import StatCards from './StatCards';
import Highlights from './Highlights';
import RegionalTable from './RegionalTable';
import Charts from './Charts';
import Filters from './Filters';
import LiveDetailDrawer from './LiveDetailDrawer';
import CooperativeExplorer from './CooperativeExplorer';

const Dashboard = () => {
  const [province, setProvince] = useState('All');
  const [district, setDistrict] = useState('All');
  const [subdistrict, setSubdistrict] = useState('All');
  const [activeTab, setActiveTab] = useState('readiness');

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);

  const [stats, setStats] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [regionalData, setRegionalData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drawer States
  const [selectedVillageId, setSelectedVillageId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // National Export background states
  const [exportJobId, setExportJobId] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('idle'); // idle, processing, completed, failed
  const [exportError, setExportError] = useState(null);
  const [isProgressMinimized, setIsProgressMinimized] = useState(false);

  // Polling Effect for background Export Status monitoring
  useEffect(() => {
    let intervalId = null;
    
    if (exportStatus === 'processing' && exportJobId) {
      const getApiUrl = () => {
        const envUrl = import.meta.env.VITE_API_URL;
        if (!envUrl) return 'http://localhost:5000/api';
        return envUrl.endsWith('/api') ? envUrl : (envUrl.endsWith('/') ? `${envUrl}api` : `${envUrl}/api`);
      };
      const apiBase = getApiUrl();
      
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`${apiBase}/export/national/status?jobId=${exportJobId}`);
          if (!res.ok) throw new Error('Status request failed');
          const data = await res.json();
          
          setExportProgress(data.progress || 0);
          
          if (data.status === 'completed') {
            setExportStatus('completed');
            clearInterval(intervalId);
            
            // Programmatically trigger direct browser download of the scratch XLSX sheet
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = `${apiBase}/export/national/download?jobId=${exportJobId}`;
            link.setAttribute('download', 'Export_Kesiapan_Nasional_Indonesia.xlsx');
            document.body.appendChild(link);
            link.click();
            
            // Auto clean up and slide out widget
            setTimeout(() => {
              if (document.body.contains(link)) {
                document.body.removeChild(link);
              }
              setExportStatus('idle');
              setExportJobId(null);
              setExportProgress(0);
            }, 6000);
          } else if (data.status === 'failed') {
            setExportStatus('failed');
            setExportError(data.error || 'Terjadi kesalahan tidak dikenal saat kompilasi excel.');
            clearInterval(intervalId);
          }
        } catch (err) {
          console.error('Failed to query job status:', err);
        }
      }, 1500);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [exportStatus, exportJobId]);

  const handleNationalExport = async () => {
    if (exportStatus === 'processing') {
      setIsProgressMinimized(false);
      return;
    }
    
    setExportStatus('processing');
    setExportProgress(0);
    setExportError(null);
    setIsProgressMinimized(false);
    
    const getApiUrl = () => {
      const envUrl = import.meta.env.VITE_API_URL;
      if (!envUrl) return 'http://localhost:5000/api';
      return envUrl.endsWith('/api') ? envUrl : (envUrl.endsWith('/') ? `${envUrl}api` : `${envUrl}/api`);
    };
    const apiBase = getApiUrl();
    
    try {
      const res = await fetch(`${apiBase}/export/national/start`, { method: 'POST' });
      if (!res.ok) throw new Error('Gagal memulai proses export di server');
      const data = await res.json();
      setExportJobId(data.jobId);
    } catch (err) {
      setExportStatus('failed');
      setExportError(err.message || 'Gagal terhubung ke backend server.');
    }
  };

  const handleCancelExport = () => {
    setExportStatus('idle');
    setExportJobId(null);
    setExportProgress(0);
    setExportError(null);
    setIsProgressMinimized(false);
  };

  // ==========================================
  // ATOMIC FILTER TRANSITIONS
  // ==========================================
  const handleProvinceChange = (newProvince) => {
    setProvince(newProvince);
    setDistrict('All');
    setSubdistrict('All');
    setSubdistricts([]);
  };

  const handleDistrictChange = (newDistrict) => {
    setDistrict(newDistrict);
    setSubdistrict('All');
  };

  const handleSubdistrictChange = (newSubdistrict) => {
    setSubdistrict(newSubdistrict);
  };

  // Load Provinces on Initial Mount
  useEffect(() => {
    fetchProvinces().then(setProvinces).catch(console.error);
  }, []);

  // Sync Districts when Province Changes
  useEffect(() => {
    if (province !== 'All') {
      fetchDistricts(province).then(setDistricts).catch(console.error);
    } else {
      setDistricts([]);
    }
  }, [province]);

  // Sync Subdistricts when District Changes
  useEffect(() => {
    if (province !== 'All' && district !== 'All') {
      fetchSubdistricts(province, district).then(setSubdistricts).catch(console.error);
    } else {
      setSubdistricts([]);
    }
  }, [province, district]);

  // Fetch Dashboard Stats & Highlights
  useEffect(() => {
    setLoading(true);
    
    // Fallback to empty states if fetch fails
    Promise.all([
      fetchStats(province, district),
      fetchHighlights(province, district),
      fetchRegionalData(province, district, subdistrict)
    ]).then(([s, h, r]) => {
      setStats(s || { total_villages: 0, total_simpanan: 0, total_transaksi: 0, rat_submitted: 0, has_npwp: 0, has_nib: 0 });
      setHighlights(h || []);
      setRegionalData(r || []);
      setLastUpdated(new Date());
      setLoading(false);
    }).catch(e => {
      console.error('Failed to load dashboard data:', e);
      setLoading(false);
    });
  }, [province, district, subdistrict]);

  const handleSelectVillage = (villageId) => {
    setSelectedVillageId(villageId);
    setIsDrawerOpen(true);
  };

  return (
    <div className="app-container" style={{ opacity: loading ? 0.8 : 1, transition: 'opacity 0.2s', paddingRight: isDrawerOpen && activeTab === 'readiness' ? '420px' : '2rem' }}>
      <header className="header-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Simkopdes Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
              Alat verifikasi & kesiapan operasional live KDKMP Seluruh Indonesia
            </p>
            {lastUpdated && (
              <div style={{ 
                color: 'var(--accent)', 
                marginTop: '0.5rem', 
                fontSize: '0.78rem', 
                fontWeight: 600, 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.4rem',
                background: 'rgba(56, 158, 13, 0.06)',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid rgba(56, 158, 13, 0.12)'
              }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '6px', 
                  height: '6px', 
                  backgroundColor: 'var(--accent)', 
                  borderRadius: '50%'
                }} />
                Terakhir diperbarui: {lastUpdated.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB
              </div>
            )}
          </div>
          
          {/* Sleek Tab Switcher */}
          <div style={{ 
            display: 'flex', 
            gap: '0.25rem', 
            background: 'rgba(10, 143, 145, 0.04)', 
            padding: '0.3rem', 
            borderRadius: '12px', 
            border: '1px solid var(--border)',
            width: 'fit-content'
          }}>
            <button
              onClick={() => setActiveTab('readiness')}
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: activeTab === 'readiness' ? 'var(--white)' : 'transparent',
                color: activeTab === 'readiness' ? 'var(--secondary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'readiness' ? '0 2px 8px rgba(10, 143, 145, 0.08)' : 'none'
              }}
            >
              Kesiapan Nasional
            </button>
            <button
              onClick={() => setActiveTab('explorer')}
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: activeTab === 'explorer' ? 'var(--white)' : 'transparent',
                color: activeTab === 'explorer' ? 'var(--secondary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'explorer' ? '0 2px 8px rgba(10, 143, 145, 0.08)' : 'none'
              }}
            >
              Eksplorasi Koperasi
            </button>
          </div>
        </div>

        {activeTab === 'readiness' && (
          <Filters 
            provinces={provinces} 
            selectedProvince={province} 
            onProvinceChange={handleProvinceChange} 
            districts={districts}
            selectedDistrict={district}
            onDistrictChange={handleDistrictChange} 
            subdistricts={subdistricts}
            selectedSubdistrict={subdistrict}
            onSubdistrictChange={handleSubdistrictChange} 
            onNationalExport={handleNationalExport}
          />
        )}
      </header>

      {activeTab === 'readiness' ? (
        <>
          {/* Main Stats Cards row */}
          <StatCards stats={stats} />

          {/* Highlights best performing districts */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ marginBottom: '1.2rem', fontSize: '1.3rem', fontWeight: 600, color: 'var(--secondary)' }}>
              Kinerja Performa Terbaik
            </h2>
            <Highlights 
              highlights={highlights} 
              currentProvince={province}
              currentDistrict={district}
              onProvinceChange={handleProvinceChange}
              onDistrictChange={handleDistrictChange}
              onSubdistrictChange={handleSubdistrictChange}
            />
          </section>

          {/* Glassmorphic charts section */}
          <div className="charts-grid">
            <Charts type="store" province={province} district={district} />
            <Charts type="rat" province={province} district={district} />
          </div>

          {/* Main Table view */}
          <section style={{ marginBottom: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '0.8rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--secondary)' }}>Rincian Wilayah</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Menampilkan data untuk: <strong style={{ color: 'var(--primary)' }}>
                    {province === 'All' ? 'Seluruh Indonesia' : (district === 'All' ? province : (subdistrict === 'All' ? `${province} > ${district}` : `${province} > ${district} > ${subdistrict}`))}
                  </strong>
                </span>
              </div>

            </div>
            
            <RegionalTable 
              data={regionalData} 
              currentProvince={province} 
              currentDistrict={district} 
              currentSubdistrict={subdistrict}
              onProvinceChange={(val) => {
                console.log('[PARENT] setProvince called with:', val);
                setProvince(val);
              }}
              onDistrictChange={(val) => {
                console.log('[PARENT] setDistrict called with:', val);
                setDistrict(val);
              }}
              onSubdistrictChange={(val) => {
                console.log('[PARENT] setSubdistrict called with:', val);
                setSubdistrict(val);
              }}
              onSelectVillage={handleSelectVillage}
            />
          </section>

          {/* Interactive Detail Drawer slide-out */}
          <LiveDetailDrawer 
            isOpen={isDrawerOpen} 
            onClose={() => setIsDrawerOpen(false)} 
            villageId={selectedVillageId} 
          />
        </>
      ) : (
        <CooperativeExplorer />
      )}
      
      {/* Global Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem 0 1rem',
        marginTop: '2rem',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)'
      }}>
        © Tim Pengawasan APP KDKMP 2026
      </footer>

      {/* Floating Glassmorphic Progress Widget for Non-blocking Export */}
      {exportStatus !== 'idle' && (
        <div className={`export-progress-widget ${isProgressMinimized ? 'minimized' : ''}`}>
          {isProgressMinimized ? (
            <button 
              className="export-widget-pulsing-badge"
              onClick={() => setIsProgressMinimized(false)}
              title="Unduh Excel (Nasional) - Klik untuk detail progress"
            >
              <svg className="progress-badge-svg" viewBox="0 0 36 36">
                <path
                  className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${exportProgress}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="pulsing-badge-content">
                {exportStatus === 'completed' ? (
                  <span className="badge-checkmark">✓</span>
                ) : exportStatus === 'failed' ? (
                  <span className="badge-error">!</span>
                ) : (
                  <span className="badge-percent">{exportProgress}%</span>
                )}
              </div>
            </button>
          ) : (
            <div className="export-widget-expanded">
              <div className="export-widget-header">
                <h3>Unduh Laporan Nasional</h3>
                <div className="widget-header-actions">
                  <button 
                    onClick={() => setIsProgressMinimized(true)}
                    className="widget-action-btn minimize-btn"
                    title="Minimalkan (Ekspor berjalan di latar belakang)"
                  >
                    −
                  </button>
                  <button 
                    onClick={handleCancelExport}
                    className="widget-action-btn cancel-btn"
                    title="Batalkan Ekspor"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="export-widget-body">
                {exportStatus === 'processing' && (
                  <>
                    <p className="widget-status-text">
                      Mempersiapkan data kesiapan nasional...
                    </p>
                    <div className="widget-progress-container">
                      <div className="widget-progress-bar">
                        <div 
                          className="widget-progress-fill" 
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                      <span className="widget-progress-label">{exportProgress}%</span>
                    </div>
                    <p className="widget-info-text">
                      Laporan ini memuat 83.000+ baris data. Anda dapat menutup panel ini atau terus menjelajahi dashboard; proses pengunduhan akan berjalan secara otomatis di latar belakang.
                    </p>
                  </>
                )}
                
                {exportStatus === 'completed' && (
                  <div className="widget-success-view">
                    <div className="success-icon-wrapper">
                      <span className="success-checkmark">✓</span>
                    </div>
                    <div>
                      <p className="success-title">Ekspor Selesai!</p>
                      <p className="success-desc">Proses kompilasi berhasil. Unduhan Anda dimulai otomatis.</p>
                    </div>
                  </div>
                )}
                
                {exportStatus === 'failed' && (
                  <div className="widget-error-view">
                    <div className="error-icon-wrapper">
                      <span className="error-cross">!</span>
                    </div>
                    <div>
                      <p className="error-title">Gagal Mengekspor</p>
                      <p className="error-desc">{exportError || 'Koneksi terputus.'}</p>
                      <button onClick={handleNationalExport} className="retry-btn">Coba Lagi</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
