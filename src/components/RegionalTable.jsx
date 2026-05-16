import React, { useState, useMemo } from 'react';
import { Download, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { getExportUrl } from '../services/api';

const RegionalTable = ({ data, currentProvince, currentDistrict }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'total_koperasi', direction: 'desc' });

  const handleExportRow = (name) => {
    let province = currentProvince;
    let district = currentDistrict;
    let subdistrict = 'All';

    if (currentProvince === 'All') {
      province = name;
    } else if (currentDistrict === 'All') {
      district = name;
    } else {
      // If we have both province and district selected, 
      // the 'name' in this row must be a subdistrict (Kecamatan).
      subdistrict = name;
    }
    window.open(getExportUrl(province, district, subdistrict), '_blank');
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [data, sortConfig]);

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
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Nama Wilayah {getSortIcon('name')}
              </div>
            </th>
            <th onClick={() => requestSort('total_koperasi')} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Total Koperasi {getSortIcon('total_koperasi')}
              </div>
            </th>
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
            <th onClick={() => requestSort('has_npwp')} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                NPWP {getSortIcon('has_npwp')}
              </div>
            </th>
            <th onClick={() => requestSort('has_nib')} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                NIB {getSortIcon('has_nib')}
              </div>
            </th>
            <th onClick={() => requestSort('rat_verified')} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                RAT Terverifikasi {getSortIcon('rat_verified')}
              </div>
            </th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 600 }}>{row.name}</td>
              <td>{row.total_koperasi_fmt}</td>
              <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{row.total_simpanan_fmt}</td>
              <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{row.total_transaksi_fmt}</td>
              <td style={{ color: row.has_npwp < 400 ? '#f39c12' : 'inherit' }}>{row.has_npwp_fmt}</td>
              <td>{row.has_nib_fmt}</td>
              <td style={{ color: row.rat_verified > 100 ? '#27ae60' : 'inherit' }}>{row.rat_verified_fmt}</td>
              <td>
                <button 
                  className="btn-primary" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => handleExportRow(row.name)}
                >
                  <Download size={14} /> Ekspor
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RegionalTable;
