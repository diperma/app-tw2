import React, { useState, useEffect } from 'react';
import { Search, X, ChevronLeft, ChevronRight, ExternalLink, Users, Award, MapPin } from 'lucide-react';
import { fetchExploreCooperatives } from '../services/api';

// Helper utility to dynamically generate the subdirectory slug from a cooperative's name
const generateSlug = (coopName) => {
  if (!coopName) return '';
  // Strip both DESA and KELURAHAN prefixes case-insensitively
  let clean = coopName.replace(/^KOPERASI\s+(DESA|KELURAHAN)\s+MERAH\s+PUTIH\s+/i, '');
  
  // Normalize to lowercase, strip special characters, replace spaces with hyphens
  return clean
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
};

const CooperativeExplorer = () => {
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9); // 9 cards per page looks perfect in a 3x3 grid
  const [cooperatives, setCooperatives] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search-as-you-type
  useEffect(() => {
    const handler = setTimeout(() => {
      setActiveSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch cooperatives when activeSearch or page changes
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchExploreCooperatives(activeSearch, page, pageSize)
      .then(res => {
        if (active) {
          setCooperatives(res.data || []);
          setPagination(res.pagination || null);
          setLoading(false);
        }
      })
      .catch(err => {
        if (active) {
          console.error(err);
          setError('Gagal memuat data koperasi. Silakan coba beberapa saat lagi.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeSearch, page, pageSize]);

  // Get Initials for Fallback Avatar
  const getInitials = (name) => {
    if (!name) return 'KP';
    const cleanName = name.replace(/^KOPERASI DESA MERAH PUTIH\s+/, '');
    const words = cleanName.split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return cleanName.substring(0, 2).toUpperCase();
  };

  // Helper to generate unique gradient backgrounds for fallback avatars based on coop name
  const getAvatarGradient = (name) => {
    if (!name) return 'linear-gradient(135deg, #0a8f91, #065366)';
    const code = name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0);
    const index = code % 4;
    const gradients = [
      'linear-gradient(135deg, #0a8f91 0%, #065366 100%)', // Default Teal
      'linear-gradient(135deg, #389e0d 0%, #065366 100%)', // Green-Teal
      'linear-gradient(135deg, #1d3949 0%, #0a8f91 100%)', // Midnight-Teal
      'linear-gradient(135deg, #d46b08 0%, #065366 100%)', // Warm Orange-Teal
    ];
    return gradients[index];
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(p => p - 1);
  };

  const handleNextPage = () => {
    if (pagination && page < pagination.last_page) setPage(p => p + 1);
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Search Header Area */}
      <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Search bar input */}
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '280px' }}>
            <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)' 
              }} 
            />
            <input
              type="text"
              className="search-input"
              placeholder="Cari koperasi berdasarkan nama desa, kecamatan, atau komoditas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.8rem', paddingRight: search ? '2.5rem' : '1rem' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <button 
            className="btn-primary"
            onClick={() => setActiveSearch(search)}
            style={{ height: '42px', display: 'flex', alignItems: 'center' }}
          >
            <Search size={16} />
            <span>Cari</span>
          </button>
        </div>

        {/* Active Search indicators */}
        <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {activeSearch ? (
              <>Hasil pencarian untuk: <strong style={{ color: 'var(--primary)' }}>"{activeSearch}"</strong></>
            ) : (
              'Menampilkan seluruh Koperasi Desa Merah Putih'
            )}
          </span>
          {pagination && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Total ditemukan: <strong style={{ color: 'var(--secondary)' }}>{pagination.total} Koperasi</strong>
            </span>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', borderLeft: '4px solid var(--danger)', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '1.05rem' }}>{error}</p>
          <button 
            className="btn-primary" 
            onClick={() => setActiveSearch(search)} 
            style={{ marginTop: '1rem' }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loading Skeleton Grid */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass-card" style={{ height: '280px', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.8rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(10,143,145,0.08)', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ height: '16px', borderRadius: '4px', backgroundColor: 'rgba(10,143,145,0.08)', width: '80%', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                  <div style={{ height: '12px', borderRadius: '4px', backgroundColor: 'rgba(10,143,145,0.08)', width: '50%', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                </div>
              </div>
              <div style={{ height: '40px', borderRadius: '6px', backgroundColor: 'rgba(10,143,145,0.05)', animation: 'pulse 1.5s infinite ease-in-out', marginTop: '0.5rem' }}></div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <div style={{ height: '28px', borderRadius: '15px', backgroundColor: 'rgba(10,143,145,0.08)', width: '100px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                <div style={{ height: '28px', borderRadius: '15px', backgroundColor: 'rgba(10,143,145,0.08)', width: '100px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Empty Results state */}
          {cooperatives.length === 0 && !error && (
            <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', marginBottom: '2rem' }}>
              <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '1.2rem', opacity: 0.6 }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--secondary)' }}>Koperasi Tidak Ditemukan</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', maxWidth: '400px', margin: '0.5rem auto 0' }}>
                Kami tidak menemukan koperasi yang cocok dengan kata kunci pencarian Anda. Silakan coba kata kunci lain.
              </p>
            </div>
          )}

          {/* Cooperatives Grid View */}
          {cooperatives.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2.5rem'
            }}>
              {cooperatives.map((coop) => {
                const initials = getInitials(coop.name);
                const gradient = getAvatarGradient(coop.name);
                const cleanName = coop.name.replace(/^KOPERASI DESA MERAH PUTIH\s+/, '');
                
                // Process village potentials (commodities)
                const commodities = coop.potensi_desa 
                  ? coop.potensi_desa.split(',').map(s => s.trim()).filter(s => s.length > 0)
                  : [];
                const displayCommodities = commodities.slice(0, 5);
                const extraCount = commodities.length - 5;

                return (
                  <div key={coop.cooperative_id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.8rem', position: 'relative' }}>
                    
                    {/* Top card header details */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      
                      {/* GCS logo or gradient initials fallback */}
                      {coop.image_url ? (
                        <div style={{ 
                          width: '60px', 
                          height: '60px', 
                          borderRadius: '50%', 
                          overflow: 'hidden', 
                          border: '2px solid var(--border)',
                          background: 'var(--white)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <img 
                            src={coop.image_url} 
                            alt={coop.name}
                            onError={(e) => {
                              // If image fails, replace with gradient avatar dynamically
                              e.target.style.display = 'none';
                              e.target.parentNode.style.background = gradient;
                              e.target.parentNode.innerHTML = `<span style="color: var(--white); font-weight: 700; font-size: 1.2rem">${initials}</span>`;
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        </div>
                      ) : (
                        <div style={{ 
                          width: '60px', 
                          height: '60px', 
                          borderRadius: '50%', 
                          background: gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--white)',
                          fontWeight: 700,
                          fontSize: '1.2rem',
                          boxShadow: '0 4px 10px rgba(10,143,145,0.1)',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                      )}

                      {/* Name and Location metadata */}
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ 
                          fontSize: '1.05rem', 
                          fontWeight: 600, 
                          color: 'var(--secondary)', 
                          lineHeight: '1.3',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textTransform: 'capitalize'
                        }} title={cleanName}>
                          {cleanName.toLowerCase()}
                        </h4>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                          <MapPin size={12} style={{ color: 'var(--primary)' }} />
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            ID: {coop.cooperative_id}
                          </span>
                          {coop.distance_km && (
                            <span style={{ marginLeft: '0.5rem', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                              {coop.distance_km.toFixed(1)} km
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Commodities / village potentials tag list */}
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '72px', overflow: 'hidden' }}>
                        {displayCommodities.length > 0 ? (
                          displayCommodities.map((item, idx) => (
                            <span key={idx} style={{
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              color: 'var(--primary)',
                              backgroundColor: 'var(--primary-glow)',
                              border: '1px solid rgba(10,143,145,0.15)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              textTransform: 'capitalize'
                            }}>
                              {item.toLowerCase()}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Potensi desa belum dicatat
                          </span>
                        )}
                        {extraCount > 0 && (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            backgroundColor: 'rgba(0,0,0,0.03)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px'
                          }}>
                            +{extraCount} lainnya
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Member breakdown details capsules */}
                    <div style={{ display: 'flex', gap: '0.8rem', borderTop: '1px solid rgba(10,143,145,0.06)', paddingTop: '0.8rem' }}>
                      <div style={{ flex: 1, backgroundColor: 'rgba(10,143,145,0.03)', border: '1px solid rgba(10,143,145,0.05)', padding: '0.4rem 0.6rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1890ff' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pria</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)' }}>
                            {coop.members_male_count}
                          </span>
                        </div>
                      </div>
                      <div style={{ flex: 1, backgroundColor: 'rgba(10,143,145,0.03)', border: '1px solid rgba(10,143,145,0.05)', padding: '0.4rem 0.6rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eb2f96' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Wanita</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)' }}>
                            {coop.members_female_count}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Open Portal subdirectory slug button */}
                    <a 
                      href={`https://simkopdes.go.id/${generateSlug(coop.name)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-primary"
                      style={{ 
                        width: '100%', 
                        justifyContent: 'center', 
                        height: '40px',
                        background: 'rgba(10,143,145,0.06)',
                        border: '1px solid rgba(10,143,145,0.12)',
                        color: 'var(--primary)',
                        boxShadow: 'none',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        marginTop: '0.4rem',
                        position: 'relative',
                        zIndex: 10
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)';
                        e.currentTarget.style.color = 'var(--white)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(10,143,145,0.06)';
                        e.currentTarget.style.color = 'var(--primary)';
                      }}
                    >
                      <span>Kunjungi Portal</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.last_page > 1 && (
            <div className="glass-card" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '1.2rem 1.8rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Halaman <strong>{page}</strong> dari <strong>{pagination.last_page}</strong>
              </span>

              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <button
                  className="btn-primary"
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    background: page === 1 ? 'rgba(0,0,0,0.03)' : undefined,
                    color: page === 1 ? 'var(--text-muted)' : undefined,
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    boxShadow: page === 1 ? 'none' : undefined,
                    border: page === 1 ? '1px solid rgba(0,0,0,0.05)' : undefined
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Sebelumnya</span>
                </button>

                <button
                  className="btn-primary"
                  onClick={handleNextPage}
                  disabled={page === pagination.last_page}
                  style={{
                    padding: '0.5rem 1rem',
                    background: page === pagination.last_page ? 'rgba(0,0,0,0.03)' : undefined,
                    color: page === pagination.last_page ? 'var(--text-muted)' : undefined,
                    cursor: page === pagination.last_page ? 'not-allowed' : 'pointer',
                    boxShadow: page === pagination.last_page ? 'none' : undefined,
                    border: page === pagination.last_page ? '1px solid rgba(0,0,0,0.05)' : undefined
                  }}
                >
                  <span>Selanjutnya</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Shimmer / Pulse keyframes injection */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CooperativeExplorer;
