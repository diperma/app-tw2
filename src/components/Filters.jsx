import React from 'react';

const Filters = ({ 
  provinces, 
  selectedProvince, 
  onProvinceChange,
  districts,
  selectedDistrict,
  onDistrictChange
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Provinsi:</label>
        <select 
          className="filter-select" 
          style={{ minWidth: '150px' }}
          value={selectedProvince} 
          onChange={(e) => onProvinceChange(e.target.value)}
        >
          <option value="All">Seluruh Indonesia</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Kabupaten:</label>
        <select 
          className="filter-select" 
          style={{ minWidth: '150px' }}
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
    </div>
  );
};

export default Filters;
