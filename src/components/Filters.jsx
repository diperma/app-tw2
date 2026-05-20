import { ArrowLeft, RotateCcw } from 'lucide-react';
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
        {selectedProvince !== 'All' ? (
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
            
            <a 
              href={getExportUrl(selectedProvince, selectedDistrict, selectedSubdistrict)}
              target="_blank"
              rel="noopener noreferrer"
              title={`Unduh data Excel tingkat ${selectedDistrict === 'All' ? 'Provinsi' : (selectedSubdistrict === 'All' ? 'Kabupaten' : 'Kecamatan')}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.7rem 1.2rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #107C41 0%, #159A55 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: '0 4px 12px rgba(16, 124, 65, 0.18)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 124, 65, 0.26)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 124, 65, 0.18)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Unduh Excel ({selectedDistrict === 'All' ? 'Provinsi' : (selectedSubdistrict === 'All' ? 'Kabupaten' : 'Kecamatan')})
            </a>

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
        ) : (
          <a 
            href={getExportUrl('All')}
            target="_blank"
            rel="noopener noreferrer"
            title="Unduh Excel Ringkasan Provinsi Tingkat Nasional"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.7rem 1.4rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #107C41 0%, #159A55 100%)',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: '0 4px 12px rgba(16, 124, 65, 0.18)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 124, 65, 0.26)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 124, 65, 0.18)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Unduh Excel (Nasional)
          </a>
        )}
      </div>
    </div>
  );
};

export default Filters;
