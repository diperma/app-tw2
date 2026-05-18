import React from 'react';

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
    </div>
  );
};

export default Filters;
