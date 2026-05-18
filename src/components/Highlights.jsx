import React, { useState } from 'react';
import { Wallet, ArrowUpRight, CheckCircle, X, Download } from 'lucide-react';
import { fetchDistrictDetails, getExportUrl } from '../services/api';

const Highlights = ({ highlights }) => {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('');

  const icons = { Wallet, ArrowUpRight, CheckCircle };

  const handleRowClick = (districtName, category) => {
    setSelectedDistrict(districtName);
    setCurrentCategory(category);
    setLoadingModal(true);
    fetchDistrictDetails(districtName, category).then(res => {
      setModalData(res);
      setLoadingModal(false);
    });
  };

  const handleExportDetail = () => {
    window.open(getExportUrl('All', selectedDistrict), '_blank');
  };

  const handleDownloadDistrict = (e, districtName, province) => {
    e.stopPropagation();
    window.open(getExportUrl(province || 'All', districtName), '_blank');
  };

  return (
    <div className="highlights-container">
      {highlights.map((group, i) => {
        const Icon = icons[group.icon] || Wallet;
        return (
          <div key={i} className="glass-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(45, 106, 79, 0.1)', borderRadius: '8px' }}>
                <Icon size={18} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{group.type} Teratas</h3>
            </div>
            
            <div className="table-container" style={{ marginTop: 0, maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem' }}>#</th>
                    <th style={{ padding: '0.5rem' }}>Kabupaten</th>
                    <th style={{ padding: '0.5rem' }}>Nilai</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {group.districts.map((d, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => handleRowClick(d.name, group.type)} 
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ padding: '0.5rem' }}>{idx + 1}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 500 }}>{d.name}</td>
                      <td style={{ padding: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>{d.value}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <button 
                          className="btn-ghost"
                          title="Download Data Kabupaten"
                          onClick={(e) => handleDownloadDistrict(e, d.name, d.province)}
                          style={{ padding: '0.3rem', borderRadius: '4px' }}
                        >
                          <Download size={14} color="var(--primary)" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {selectedDistrict && (
        <div className="modal-overlay" onClick={() => setSelectedDistrict(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedDistrict(null)}>
              <X size={20} />
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>Detail Performa: {selectedDistrict}</h2>
                <p style={{ color: 'var(--text-muted)' }}>Kategori: {currentCategory} Teratas</p>
              </div>
              <button 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                onClick={handleExportDetail}
              >
                <Download size={16} /> Ekspor Detail
              </button>
            </div>
            
            {loadingModal ? (
              <p>Memuat detail...</p>
            ) : (
              <div className="table-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Desa</th>
                      <th>Nama Koperasi</th>
                      <th>{currentCategory === 'Penyelesaian RAT' ? 'Status RAT' : (currentCategory === 'Simpanan' ? 'Total Simpanan' : 'Total Transaksi')}</th>
                      <th>Progres Gerai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((m, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{m.village}</td>
                        <td style={{ fontWeight: 500 }}>{m.koperasi}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{m.value}</td>
                        <td>
                          <span style={{ 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem',
                            background: m.progress === 'Belum pembangunan' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                            color: m.progress === 'Belum pembangunan' ? '#e74c3c' : '#27ae60',
                            fontWeight: 500
                          }}>
                            {m.progress}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Highlights;
