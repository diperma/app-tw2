import React from 'react';
import { ArrowLeft, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { getExportUrl } from '../services/api';

const Filters = ({ 
  provinces = [], 
  selectedProvince = 'All', 
  onProvinceChange,
  districts = [], 
  selectedDistrict = 'All', 
  onDistrictChange,
  subdistricts = [],
  selectedSubdistrict = 'All',
  onSubdistrictChange
}) => {
  const handleGoBack = () => {
    if (selectedSubdistrict !== 'All') {
      onSubdistrictChange('All');
    } else if (selectedDistrict !== 'All') {
      onDistrictChange('All');
    } else if (selectedProvince !== 'All') {
      onProvinceChange('All');
    }
  };

  const handleReset = () => {
    onProvinceChange('All');
  };

  return (
    <div className="filters-container">
      <div className="filter-group">
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Provinsi:</label>
        <select 
          className="filter-select" 
          value={selectedProvince} 
          onChange={(e) => onProvinceChange(e.target.value)}
        >
          <option value="All">Seluruh Indonesia</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kabupaten:</label>
        <select 
          className="filter-select" 
          value={selectedDistrict} 
          onChange={(e) => onDistrictChange(e.target.value)}
          disabled={selectedProvince === 'All'}
        >
          <option value="All">Semua Kabupaten</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kecamatan:</label>
        <select 
          className="filter-select" 
          value={selectedSubdistrict} 
          onChange={(e) => onSubdistrictChange(e.target.value)}
          disabled={selectedDistrict === 'All' || selectedProvince === 'All'}
        >
          <option value="All">Semua Kecamatan</option>
          {subdistricts.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="filter-actions-group">
        {selectedProvince !== 'All' && (
          <>
            <button 
              onClick={handleGoBack}
              title="Kembali ke Tingkat Sebelumnya"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                padding: '0.7rem 1.2rem', 
                borderRadius: '10px', 
                background: 'var(--primary-glow)', 
                border: '1px solid var(--border)', 
                color: 'var(--primary)', 
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
            >
              <ArrowLeft size={14} /> Kembali
            </button>
            <button 
              onClick={handleReset}
              title="Reset ke Seluruh Indonesia"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                padding: '0.7rem 1.2rem', 
                borderRadius: '10px', 
                background: 'rgba(207, 19, 34, 0.05)', 
                border: '1px solid rgba(207, 19, 34, 0.15)', 
                color: 'var(--danger)', 
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          </>
        )}
        <button 
          onClick={() => window.open(getExportUrl(selectedProvince, selectedDistrict, selectedSubdistrict), '_blank')}
          title="Unduh Laporan Excel Kesiapan Desa"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            padding: '0.7rem 1.2rem', 
            borderRadius: '10px', 
            background: 'rgba(56, 158, 13, 0.08)', 
            border: '1px solid rgba(56, 158, 13, 0.2)', 
            color: '#2e7d32', 
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.3s ease'
          }}
          className="btn-export-excel"
        >
          <FileSpreadsheet size={14} /> Unduh Excel
        </button>
      </div>
    </div>
  );
};

export default Filters;
