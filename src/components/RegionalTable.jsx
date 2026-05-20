import { useState, useMemo } from 'react';
import { ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown, Search, ArrowRight, Eye } from 'lucide-react';

const RegionalTable = ({ 
  data = [], 
  currentProvince = 'All', 
  currentDistrict = 'All', 
  currentSubdistrict = 'All',
  onProvinceChange,
  onDistrictChange,
  onSubdistrictChange,
  onSelectVillage
}) => {
  const [sortConfig, setSortConfig] = useState({ key: 'total_koperasi', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  // Determine current administrative level in the table
  const level = useMemo(() => {
    if (currentProvince === 'All') return 'province';
    if (currentDistrict === 'All') return 'district';
    if (currentSubdistrict === 'All') return 'subdistrict';
    return 'village';
  }, [currentProvince, currentDistrict, currentSubdistrict]);

  const handleRowClick = (row) => {
    console.log('[DEBUG] Row Clicked:', row.name, 'level:', level);
    if (level === 'province') {
      if (onProvinceChange) {
        onProvinceChange(row.name);
      } else {
        console.warn('onProvinceChange is not supplied!');
      }
    } else if (level === 'district') {
      if (onDistrictChange) {
        onDistrictChange(row.name);
      } else {
        console.warn('onDistrictChange is not supplied!');
      }
    } else if (level === 'subdistrict') {
      if (onSubdistrictChange) {
        onSubdistrictChange(row.name);
      } else {
        console.warn('onSubdistrictChange is not supplied!');
      }
    } else if (level === 'village') {
      if (onSelectVillage) {
        onSelectVillage(row.id);
      } else {
        console.warn('onSelectVillage is not supplied!');
      }
    }
  };



  // Local Search Filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item => item.name?.toLowerCase().includes(term));
  }, [data, searchTerm]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronsUpDown size={14} style={{ opacity: 0.3 }} />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', gap: '1rem', flexWrap: 'wrap', position: 'relative', zIndex: 5 }}>
        <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>
          {/* Clickable premium breadcrumbs navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', flexWrap: 'wrap', marginBottom: '0.5rem', position: 'relative', zIndex: 15, pointerEvents: 'auto', userSelect: 'none' }}>
            <span 
              onClick={() => {
                console.log('[DEBUG] Breadcrumb Nasional clicked');
                if (onProvinceChange) onProvinceChange('All');
              }}
              style={{ cursor: 'pointer', color: currentProvince === 'All' ? 'var(--secondary)' : 'var(--primary)', fontWeight: currentProvince === 'All' ? 700 : 500, position: 'relative', zIndex: 20, pointerEvents: 'auto' }}
            >
              Nasional
            </span>
            {currentProvince !== 'All' && (
              <>
                <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                <span 
                  onClick={(e) => {
                    if (e) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    console.log('[DEBUG] Breadcrumb Province clicked:', currentProvince);
                    if (onDistrictChange) onDistrictChange('All');
                  }}
                  style={{ cursor: 'pointer', color: currentDistrict === 'All' ? 'var(--secondary)' : 'var(--primary)', fontWeight: currentDistrict === 'All' ? 700 : 500, position: 'relative', zIndex: 20, pointerEvents: 'auto' }}
                >
                  {currentProvince}
                </span>
              </>
            )}
            {currentDistrict !== 'All' && (
              <>
                <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                <span 
                  onClick={(e) => {
                    if (e) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    console.log('[DEBUG] Breadcrumb District clicked:', currentDistrict);
                    if (onSubdistrictChange) onSubdistrictChange('All');
                  }}
                  style={{ cursor: 'pointer', color: currentSubdistrict === 'All' ? 'var(--secondary)' : 'var(--primary)', fontWeight: currentSubdistrict === 'All' ? 700 : 500, position: 'relative', zIndex: 20, pointerEvents: 'auto' }}
                >
                  {currentDistrict}
                </span>
              </>
            )}
            {currentSubdistrict !== 'All' && (
              <>
                <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--secondary)', fontWeight: 700, position: 'relative', zIndex: 20 }}>
                  {currentSubdistrict}
                </span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', position: 'relative', zIndex: 15, pointerEvents: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary)', margin: 0, userSelect: 'none' }}>
              {level === 'province' && 'Daftar Kesiapan Provinsi'}
              {level === 'district' && `Daftar Kabupaten`}
              {level === 'subdistrict' && `Daftar Kecamatan`}
              {level === 'village' && `Daftar Desa`}
            </h3>


          </div>
          
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem', userSelect: 'none' }}>
            Klik pada baris untuk melihat rincian lebih dalam
          </span>
        </div>

        {/* Local Search input */}
        <div className="search-input-wrapper">
          <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
          <input 
            type="text" 
            placeholder={`Cari nama ${level === 'province' ? 'provinsi' : level === 'district' ? 'kabupaten' : level === 'subdistrict' ? 'kecamatan' : 'desa'}...`}
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container" style={{ marginTop: '0.5rem' }}>
        <table>
          <thead>
            <tr>
              <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Nama {level === 'province' ? 'Provinsi' : level === 'district' ? 'Kabupaten' : level === 'subdistrict' ? 'Kecamatan' : 'Desa'} {getSortIcon('name')}
                </div>
              </th>
              {level !== 'village' && (
                <th onClick={() => requestSort('total_koperasi')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    Total Koperasi {getSortIcon('total_koperasi')}
                  </div>
                </th>
              )}
              <th onClick={() => requestSort('total_simpanan')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Total Simpanan {getSortIcon('total_simpanan')}
                </div>
              </th>
              <th onClick={() => requestSort('total_transaksi')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Total Transaksi {getSortIcon('total_transaksi')}
                </div>
              </th>
              <th onClick={() => requestSort('has_npwp')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  NPWP {getSortIcon('has_npwp')}
                </div>
              </th>
              <th onClick={() => requestSort('has_nib')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  NIB {getSortIcon('has_nib')}
                </div>
              </th>
              {level === 'village' ? (
                <>
                  <th onClick={() => requestSort('rat_verified')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      RAT {getSortIcon('rat_verified')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('accounts_count')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Pembangunan Gerai {getSortIcon('accounts_count')}
                    </div>
                  </th>
                </>
              ) : (
                <th onClick={() => requestSort('rat_verified')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    RAT Terverifikasi {getSortIcon('rat_verified')}
                  </div>
                </th>
              )}
              {level === 'village' && <th style={{ textAlign: 'center' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {sortedData.length > 0 ? (
              sortedData.map((row, i) => (
                <tr 
                  key={i} 
                  onClick={() => handleRowClick(row)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {row.name}
                      {level !== 'village' && <ArrowRight size={14} style={{ color: 'var(--primary)', opacity: 0.5 }} />}
                    </div>
                  </td>
                  {level !== 'village' && (
                    <td style={{ textAlign: 'center' }}>{row.total_koperasi_fmt}</td>
                  )}
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{row.total_simpanan_fmt}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{row.total_transaksi_fmt}</td>
                  
                  {/* NPWP Status */}
                  <td style={{ textAlign: 'center' }}>
                    {level === 'village' ? (
                      <span className={`status-pill ${row.has_npwp > 0 ? 'active' : 'inactive'}`}>
                        {row.has_npwp > 0 ? 'Y' : 'N'}
                      </span>
                    ) : (
                      <span>{row.has_npwp_fmt}</span>
                    )}
                  </td>
                  
                  {/* NIB Status */}
                  <td style={{ textAlign: 'center' }}>
                    {level === 'village' ? (
                      <span className={`status-pill ${row.has_nib > 0 ? 'active' : 'inactive'}`}>
                        {row.has_nib > 0 ? 'Y' : 'N'}
                      </span>
                    ) : (
                      <span>{row.has_nib_fmt}</span>
                    )}
                  </td>

                  {/* RAT Status / Count */}
                  <td style={{ textAlign: 'center' }}>
                    {level === 'village' ? (
                      <span className={`status-pill ${row.rat_verified > 0 ? 'active' : 'inactive'}`}>
                        {row.rat_verified > 0 ? 'Y' : 'N'}
                      </span>
                    ) : (
                      <span>{row.rat_verified_fmt}</span>
                    )}
                  </td>

                  {/* Store Progress Status (Village only) */}
                  {level === 'village' && (
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="progress-bar-container" style={{ width: '80px', height: '6px' }}>
                          <div 
                            className="progress-bar-fill" 
                            style={{ width: `${row.accounts_count}%` }} 
                          />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {row.accounts_count}%
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Action buttons */}
                  {level === 'village' && (
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectVillage(row.id);
                        }}
                      >
                        <Eye size={14} /> Periksa
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={level === 'village' ? 8 : 7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Tidak ada data wilayah ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegionalTable;
