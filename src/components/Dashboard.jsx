import React, { useState, useEffect } from 'react';
import { 
  fetchStats, 
  fetchHighlights, 
  fetchRegionalData, 
  fetchProvinces, 
  fetchDistricts, 
  fetchSubdistricts,
  getExportUrl 
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

  // Load Provinces on Initial Mount
  useEffect(() => {
    fetchProvinces().then(setProvinces).catch(console.error);
  }, []);

  // Sync Districts when Province Changes
  useEffect(() => {
    if (province !== 'All') {
      fetchDistricts(province).then(setDistricts).catch(console.error);
      setDistrict('All');
      setSubdistrict('All');
      setSubdistricts([]);
    } else {
      setDistricts([]);
      setDistrict('All');
      setSubdistrict('All');
      setSubdistricts([]);
    }
  }, [province]);

  // Sync Subdistricts when District Changes
  useEffect(() => {
    if (province !== 'All' && district !== 'All') {
      fetchSubdistricts(province, district).then(setSubdistricts).catch(console.error);
      setSubdistrict('All');
    } else {
      setSubdistricts([]);
      setSubdistrict('All');
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
            <h1>Simkopdes Premium Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
              Alat verifikasi & kesiapan operasional live KDKMP Seluruh Indonesia
            </p>
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
            onProvinceChange={setProvince} 
            districts={districts}
            selectedDistrict={district}
            onDistrictChange={setDistrict}
            subdistricts={subdistricts}
            selectedSubdistrict={subdistrict}
            onSubdistrictChange={setSubdistrict}
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
              onProvinceChange={setProvince}
              onDistrictChange={setDistrict}
              onSubdistrictChange={setSubdistrict}
            />
          </section>

          {/* Glassmorphic charts section */}
          <div className="charts-grid">
            <Charts type="store" province={province} district={district} />
            <Charts type="rat" province={province} district={district} />
          </div>

          {/* Main Table view */}
          <section style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--secondary)' }}>Rincian Wilayah</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Menampilkan data untuk: <strong style={{ color: 'var(--primary)' }}>
                  {province === 'All' ? 'Seluruh Indonesia' : (district === 'All' ? province : (subdistrict === 'All' ? `${province} > ${district}` : `${province} > ${district} > ${subdistrict}`))}
                </strong>
              </span>
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
    </div>
  );
};

export default Dashboard;
