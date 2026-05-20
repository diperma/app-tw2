import { Wallet, ArrowUpRight, CheckCircle } from 'lucide-react';

const Highlights = ({ 
  highlights = [],
  currentProvince = 'All',
  currentDistrict = 'All',
  onProvinceChange,
  onDistrictChange,
  onSubdistrictChange
}) => {
  const icons = { Wallet, ArrowUpRight, CheckCircle };

  const handleRowClick = (item) => {
    console.log('[HIGHLIGHTS] Row clicked!', item);
    
    if (currentProvince === 'All') {
      // 1. National level -> Clicked item is a Province!
      console.log('[HIGHLIGHTS] Filtering dashboard to Province:', item.name);
      if (onProvinceChange) onProvinceChange(item.name);
      if (onDistrictChange) onDistrictChange('All');
      if (onSubdistrictChange) onSubdistrictChange('All');
    } else if (currentDistrict === 'All') {
      // 2. Province level -> Clicked item is a District!
      console.log('[HIGHLIGHTS] Filtering dashboard to District:', item.name, 'in Province:', item.province);
      if (onProvinceChange) onProvinceChange(item.province || currentProvince);
      if (onDistrictChange) onDistrictChange(item.name);
      if (onSubdistrictChange) onSubdistrictChange('All');
    } else {
      // 3. District level -> Clicked item is a Subdistrict!
      console.log('[HIGHLIGHTS] Filtering dashboard to Subdistrict:', item.name, 'in District:', currentDistrict);
      if (onProvinceChange) onProvinceChange(currentProvince);
      if (onDistrictChange) onDistrictChange(currentDistrict);
      if (onSubdistrictChange) onSubdistrictChange(item.name);
    }
  };

  return (
    <div className="highlights-container">
      {highlights.map((group, i) => {
        const Icon = icons[group.icon] || Wallet;
        return (
          <div key={i} className="glass-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', height: '380px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <div style={{ padding: '0.4rem', background: 'var(--primary-glow)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{group.type} Teratas</h3>
            </div>
            
            <div className="table-container" style={{ marginTop: 0, overflowY: 'auto', flex: 1 }}>
              <table style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.6rem', width: '30px' }}>#</th>
                    <th style={{ padding: '0.6rem' }}>Wilayah</th>
                    <th style={{ padding: '0.6rem' }}>Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {group.districts.map((d, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => handleRowClick(d)} 
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ padding: '0.6rem' }}>{idx + 1}</td>
                      <td style={{ padding: '0.6rem', fontWeight: 600, color: 'var(--secondary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{d.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>{d.province}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.6rem', color: 'var(--primary)', fontWeight: 700 }}>{d.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Highlights;
