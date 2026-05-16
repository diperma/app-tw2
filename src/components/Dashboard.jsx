import React, { useState, useEffect } from 'react';
import { fetchStats, fetchHighlights, fetchRegionalData, fetchProvinces, fetchDistricts, fetchCharts } from '../services/api';
import StatCards from './StatCards';
import Highlights from './Highlights';
import RegionalTable from './RegionalTable';
import Charts from './Charts';
import Filters from './Filters';

const Dashboard = () => {
  const [province, setProvince] = useState('All');
  const [district, setDistrict] = useState('All');
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [stats, setStats] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [regionalData, setRegionalData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProvinces().then(setProvinces);
  }, []);

  useEffect(() => {
    if (province !== 'All') {
      fetchDistricts(province).then(setDistricts);
      setDistrict('All');
    } else {
      setDistricts([]);
      setDistrict('All');
    }
  }, [province]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchStats(province, district),
      fetchHighlights(province, district),
      fetchRegionalData(province, district)
    ]).then(([s, h, r]) => {
      setStats(s);
      setHighlights(h);
      setRegionalData(r);
      setLoading(false);
    });
  }, [province, district]);

  if (loading && !stats) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--primary)', fontWeight: 600 }}>Memuat Dasbor...</div>;

  return (
    <div className="app-container" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      <header>
        <div>
          <h1>Dasbor Kesiapan Koperasi Desa/Kelurahan Merah Putih</h1>
          <p style={{ color: 'var(--text-muted)', marginLeft: '1rem', marginTop: '0.2rem' }}>
            Status kesiapan operasional KDKMP per tanggal 12 Mei 2026
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Filters 
            provinces={provinces} 
            selectedProvince={province} 
            onProvinceChange={setProvince} 
            districts={districts}
            selectedDistrict={district}
            onDistrictChange={setDistrict}
          />
        </div>
      </header>

      <StatCards stats={stats} />

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 600 }}>Kabupaten/Kota Performa Terbaik</h2>
        <Highlights highlights={highlights} />
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <Charts type="store" province={province} district={district} />
        <Charts type="rat" province={province} district={district} />
      </div>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Ikhtisar Wilayah</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Menampilkan data untuk {province === 'All' ? 'Seluruh Indonesia' : (district === 'All' ? province : `${province} - ${district}`)}
          </span>
        </div>
        <RegionalTable data={regionalData} currentProvince={province} currentDistrict={district} />
      </section>
    </div>
  );
};

export default Dashboard;
