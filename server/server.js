import express from 'express';
import cors from 'cors';
import ExcelJS from 'exceljs';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

const formatID = (num, digits = 1) => {
  if (num === undefined || num === null) return '0';
  return Number(num).toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const formatIDInt = (num) => {
  if (num === undefined || num === null) return '0';
  return Number(num).toLocaleString('id-ID');
};

const normalizeName = (name) => {
  if (!name) return '';
  return name.toUpperCase()
    .replace(/^KAB\.\s+/, '')
    .replace(/^KOTA\s+/, '')
    .replace(/^KABUPATEN\s+/, '')
    .replace(/^KEC\.\s+/, '')
    .replace(/^KECAMATAN\s+/, '')
    .trim();
};

// Simple In-Memory Cache
const memoryCache = {
  data: {},
  get(key) {
    const item = this.data[key];
    if (item && Date.now() < item.expires) return item.val;
    return null;
  },
  set(key, val, ttl = 600000) { // 10 minutes default TTL
    this.data[key] = { val, expires: Date.now() + ttl };
  }
};

// Controlled parallel chunking helper to limit concurrency
const fetchInChunks = async (items, mapper, concurrency = 15) => {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkPromises = chunk.map(mapper);
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  return results;
};

const getStoreProgressPercent = (storeReadiness) => {
  if (!storeReadiness || !Array.isArray(storeReadiness)) return 0;
  const mapping = {
    'Total Pembangunan 100%': 100,
    'Total Pembangunan 76% - 99%': 85,
    'Total Pembangunan 51% - 75%': 65,
    'Total Pembangunan 21% - 50%': 35,
    'Total Pembangunan hingga 20%': 15
  };
  for (const key of Object.keys(mapping)) {
    const item = storeReadiness.find(s => s.label === key);
    if (item && item.value > 0) return mapping[key];
  }
  return 0;
};

const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API returned status ${res.status} for URL: ${url}`);
  }
  return res.json();
};

const getNestedVal = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : 0, obj);
};

// Cash-in-memory for provinces list to minimize overhead
let provincesCache = null;
const getProvinces = async () => {
  if (!provincesCache) {
    try {
      const res = await fetchJSON('https://api.simkopdes.go.id/api/provinces');
      provincesCache = res.data || [];
    } catch (e) {
      console.error('Failed to load provinces:', e.message);
      return [];
    }
  }
  return provincesCache;
};

const resolveProvince = async (name) => {
  const provinces = await getProvinces();
  return provinces.find(p => normalizeName(p.name) === normalizeName(name));
};

const resolveDistrict = async (provinceName, districtName) => {
  const prov = await resolveProvince(provinceName);
  if (!prov) return null;
  const provData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/province/${prov.province_id}?period=2026`);
  const distList = provData.territorial_data?.districts || [];
  return distList.find(d => normalizeName(d.district) === normalizeName(districtName));
};

const resolveSubdistrict = async (provinceName, districtName, subdistrictName) => {
  const dist = await resolveDistrict(provinceName, districtName);
  if (!dist) return null;
  const distData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/district/${dist.district_id}?period=2026`);
  const subList = distData.territorial_data?.subdistricts || [];
  return subList.find(s => normalizeName(s.subdistrict) === normalizeName(subdistrictName));
};

const router = express.Router();

router.get('/provinces', async (req, res) => {
  try {
    const data = await getProvinces();
    res.json(data.map(p => p.name).sort());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/districts', async (req, res) => {
  const { province } = req.query;
  try {
    if (!province || province === 'All') return res.json([]);
    const prov = await resolveProvince(province);
    if (!prov) return res.json([]);
    const data = await fetchJSON(`https://api.simkopdes.go.id/api/districts/by-province-code/${prov.code}`);
    res.json((data.data || []).map(d => d.name).sort());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/subdistricts', async (req, res) => {
  const { province, district } = req.query;
  try {
    if (!province || province === 'All' || !district || district === 'All') return res.json([]);
    const dist = await resolveDistrict(province, district);
    if (!dist) return res.json([]);
    const data = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/district/${dist.district_id}?period=2026`);
    res.json((data.territorial_data?.subdistricts || []).map(s => s.subdistrict).sort());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get('/stats', async (req, res) => {
  const { province = 'All', district = 'All' } = req.query;
  try {
    if (province === 'All') {
      const coop = await fetchJSON('https://api.simkopdes.go.id/api/statistics/national-readiness/cooperative-stats?period=2026');
      const econ = await fetchJSON('https://api.simkopdes.go.id/api/statistics/national-readiness/economic-impact-rat?period=2026');
      const total_simpanan = (coop.nested_data?.grouped || []).reduce((sum, item) => sum + (item.savings_summary?.total_amount || 0), 0);
      const storeData = coop.store_readiness || [];
      const gerai_all_progress = storeData.reduce((sum, item) => sum + (item.value || 0), 0);
      const gerai_100_percent = storeData.find(item => item.label === 'Total Pembangunan 100%')?.value || 0;
      
      return res.json({
        total_villages: coop.cooperative_stats?.total || 0,
        total_simpanan: total_simpanan,
        total_transaksi: econ.economic_impact?.total_value || 0,
        rat_submitted: (econ.rat_summary?.total_verified_rat || 0) + (econ.rat_summary?.total_draft_rat || 0),
        has_npwp: coop.cooperative_stats?.total_with_npwp || 0,
        has_nib: coop.cooperative_stats?.total_with_nib || 0,
        gerai_all_progress,
        gerai_100_percent
      });
    }

    if (district === 'All') {
      const prov = await resolveProvince(province);
      if (!prov) return res.status(404).json({ error: 'Province not found' });
      const pData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/province/${prov.province_id}?period=2026`);
      const storeData = pData.store_readiness || [];
      const gerai_all_progress = storeData.reduce((sum, item) => sum + (item.value || 0), 0);
      const gerai_100_percent = storeData.find(item => item.label === 'Total Pembangunan 100%')?.value || 0;
      
      return res.json({
        total_villages: pData.territorial_data?.totals?.count || 0,
        total_simpanan: pData.savings_summary?.total_amount || 0,
        total_transaksi: pData.economic_impact?.total_value || pData.territorial_data?.totals?.transaction_value || 0,
        rat_submitted: (pData.rat_summary?.total_verified_rat || 0) + (pData.rat_summary?.total_draft_rat || 0),
        has_npwp: pData.territorial_data?.totals?.npwp_count || 0,
        has_nib: pData.territorial_data?.totals?.nib_count || 0,
        gerai_all_progress,
        gerai_100_percent
      });
    }

    const dist = await resolveDistrict(province, district);
    if (!dist) return res.status(404).json({ error: 'District not found' });
    const dData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/district/${dist.district_id}?period=2026`);
    const storeData = dData.store_readiness || [];
    const gerai_all_progress = storeData.reduce((sum, item) => sum + (item.value || 0), 0);
    const gerai_100_percent = storeData.find(item => item.label === 'Total Pembangunan 100%')?.value || 0;

    res.json({
      total_villages: dData.territorial_data?.totals?.count || 0,
      total_simpanan: dData.savings_summary?.total_amount || 0,
      total_transaksi: dData.economic_impact?.total_value || dData.territorial_data?.totals?.transaction_value || 0,
      rat_submitted: (dData.rat_summary?.total_verified_rat || 0) + (dData.rat_summary?.total_draft_rat || 0),
      has_npwp: dData.territorial_data?.totals?.npwp_count || 0,
      has_nib: dData.territorial_data?.totals?.nib_count || 0,
      gerai_all_progress,
      gerai_100_percent
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const mapHighlights = (list, nameKey, savingsKey, transKey, ratKey, labelPrefix = '') => {
  const sortedSavings = [...list].sort((a, b) => getNestedVal(b, savingsKey) - getNestedVal(a, savingsKey));
  const sortedTrans = [...list].sort((a, b) => getNestedVal(b, transKey) - getNestedVal(a, transKey));
  const sortedRat = [...list].sort((a, b) => getNestedVal(b, ratKey) - getNestedVal(a, ratKey));

  return [
    {
      type: "Simpanan",
      icon: "Wallet",
      districts: sortedSavings.map(d => ({
        name: d[nameKey],
        province: d.province || labelPrefix || '',
        value: `Rp${formatID(getNestedVal(d, savingsKey) / 1000000)} Jt`
      }))
    },
    {
      type: "Transaksi",
      icon: "ArrowUpRight",
      districts: sortedTrans.map(d => ({
        name: d[nameKey],
        province: d.province || labelPrefix || '',
        value: `Rp${formatID(getNestedVal(d, transKey) / 1000000)} Jt`
      }))
    },
    {
      type: "Penyelesaian RAT",
      icon: "CheckCircle",
      districts: sortedRat.map(d => ({
        name: d[nameKey],
        province: d.province || labelPrefix || '',
        value: `${formatIDInt(getNestedVal(d, ratKey))} RAT`
      }))
    }
  ];
};

router.get('/highlights', async (req, res) => {
  const { province = 'All', district = 'All' } = req.query;
  try {
    if (province === 'All') {
      const coop = await fetchJSON('https://api.simkopdes.go.id/api/statistics/national-readiness/cooperative-stats?period=2026');
      return res.json(mapHighlights(coop.nested_data?.grouped || [], 'province', 'savings_summary.total_amount', 'transaction_value', 'rat_count', ''));
    }

    if (district === 'All') {
      const prov = await resolveProvince(province);
      if (!prov) return res.status(404).json({ error: 'Province not found' });
      const pData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/province/${prov.province_id}?period=2026`);
      return res.json(mapHighlights(pData.territorial_data?.districts || [], 'district', 'savings_summary.total_amount', 'transaction_value', 'rat_count', prov.name));
    }

    const dist = await resolveDistrict(province, district);
    if (!dist) return res.status(404).json({ error: 'District not found' });
    const dData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/district/${dist.district_id}?period=2026`);
    return res.json(mapHighlights(dData.territorial_data?.subdistricts || [], 'subdistrict', 'savings_summary.total_amount', 'transaction_value', 'rat_count', dist.district));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/charts', async (req, res) => {
  const { province = 'All', district = 'All' } = req.query;
  try {
    if (province === 'All') {
      const coop = await fetchJSON('https://api.simkopdes.go.id/api/statistics/national-readiness/cooperative-stats?period=2026');
      const econ = await fetchJSON('https://api.simkopdes.go.id/api/statistics/national-readiness/economic-impact-rat?period=2026');
      return res.json({
        store: coop.store_readiness || [],
        rat: {
          Verified: econ.rat_summary?.total_verified_rat || 0,
          Draft: econ.rat_summary?.total_draft_rat || 0,
          'Belum RAT': econ.rat_summary?.total_no_rat || 0
        }
      });
    }

    if (district === 'All') {
      const prov = await resolveProvince(province);
      if (!prov) return res.status(404).json({ error: 'Province not found' });
      const pData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/province/${prov.province_id}?period=2026`);
      return res.json({
        store: pData.store_readiness || [],
        rat: {
          Verified: pData.rat_summary?.total_verified_rat || 0,
          Draft: pData.rat_summary?.total_draft_rat || 0,
          'Belum RAT': pData.rat_summary?.total_no_rat || 0
        }
      });
    }

    const dist = await resolveDistrict(province, district);
    if (!dist) return res.status(404).json({ error: 'District not found' });
    const dData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/district/${dist.district_id}?period=2026`);
    res.json({
      store: dData.store_readiness || [],
      rat: {
        Verified: dData.rat_summary?.total_verified_rat || 0,
        Draft: dData.rat_summary?.total_draft_rat || 0,
        'Belum RAT': dData.rat_summary?.total_no_rat || 0
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/regional-data', async (req, res) => {
  const { province = 'All', district = 'All', subdistrict = 'All' } = req.query;
  const cacheKey = `regional_${province}_${district}_${subdistrict}`;
  const cachedData = memoryCache.get(cacheKey);
  if (cachedData) {
    console.log(`[CACHE HIT] returning cached regional-data for key: ${cacheKey}`);
    return res.json(cachedData);
  }

  try {
    let rawList = [];

    if (province === 'All') {
      const coop = await fetchJSON('https://api.simkopdes.go.id/api/statistics/national-readiness/cooperative-stats?period=2026');
      rawList = (coop.nested_data?.grouped || []).map(item => ({
        id: item.province_id,
        name: item.province,
        total_koperasi: item.count,
        has_npwp: item.npwp_count,
        has_nib: item.nib_count,
        rat_verified: item.rat_count,
        total_simpanan: item.savings_summary?.total_amount || 0,
        total_transaksi: item.transaction_value || 0
      }));
    } else if (district === 'All') {
      const prov = await resolveProvince(province);
      if (!prov) return res.json([]);
      const pData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/province/${prov.province_id}?period=2026`);
      rawList = (pData.territorial_data?.districts || []).map(item => ({
        id: item.district_id,
        name: item.district,
        total_koperasi: item.count,
        has_npwp: item.npwp_count,
        has_nib: item.nib_count,
        rat_verified: item.rat_count,
        total_simpanan: item.savings_summary?.total_amount || 0,
        total_transaksi: item.transaction_value || 0
      }));
    } else if (subdistrict === 'All') {
      const dist = await resolveDistrict(province, district);
      if (!dist) return res.json([]);
      const dData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/district/${dist.district_id}?period=2026`);
      const subdistricts = dData.territorial_data?.subdistricts || [];

      // Fetch all subdistricts' details in parallel
      const subdistDetailList = await Promise.all(
        subdistricts.map(s => 
          fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/subdistrict/${s.subdistrict_id}?period=2026`)
            .catch(() => null)
        )
      );

      let villages = [];
      for (const sData of subdistDetailList) {
        if (sData && sData.territorial_data?.villages) {
          const sName = sData.territorial_data.subdistrict;
          villages.push(...sData.territorial_data.villages.map(v => ({
            ...v,
            subdistrict: sName
          })));
        }
      }

      // Fetch all village details in parallel (chunked)
      const villageDetails = await fetchInChunks(
        villages,
        v => fetchJSON(`https://api.merahputih.kop.id/api/statistics/national-readiness/village/${v.village_id}?period=2026`).catch(() => null),
        15
      );

      rawList = villages.map((item, idx) => {
        const vDetail = villageDetails[idx];
        const storeProgress = vDetail ? getStoreProgressPercent(vDetail.store_readiness) : 0;
        
        return {
          id: item.village_id,
          name: `${item.village} (${item.subdistrict})`,
          total_koperasi: item.count,
          has_npwp: item.npwp_count,
          has_nib: item.nib_count,
          rat_verified: item.rat_count,
          total_simpanan: item.savings_summary?.total_amount || 0,
          total_transaksi: item.transaction_value || 0,
          accounts_count: storeProgress
        };
      });
    } else {
      const sub = await resolveSubdistrict(province, district, subdistrict);
      if (!sub) return res.json([]);
      const sData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/subdistrict/${sub.subdistrict_id}?period=2026`);
      const villages = sData.territorial_data?.villages || [];

      // Fetch all village details in parallel (chunked)
      const villageDetails = await fetchInChunks(
        villages,
        v => fetchJSON(`https://api.merahputih.kop.id/api/statistics/national-readiness/village/${v.village_id}?period=2026`).catch(() => null),
        15
      );

      rawList = villages.map((item, idx) => {
        const vDetail = villageDetails[idx];
        const storeProgress = vDetail ? getStoreProgressPercent(vDetail.store_readiness) : 0;
        
        return {
          id: item.village_id,
          name: item.village,
          total_koperasi: item.count,
          has_npwp: item.npwp_count,
          has_nib: item.nib_count,
          rat_verified: item.rat_count,
          total_simpanan: item.savings_summary?.total_amount || 0,
          total_transaksi: item.transaction_value || 0,
          accounts_count: storeProgress
        };
      });
    }

    const response = rawList.map((d, i) => ({
      id: d.id || i,
      name: d.name,
      total_koperasi: d.total_koperasi,
      has_npwp: d.has_npwp,
      has_nib: d.has_nib,
      rat_verified: d.rat_verified,
      total_simpanan: d.total_simpanan,
      total_transaksi: d.total_transaksi,
      accounts_count: d.accounts_count || 0,
      total_koperasi_fmt: formatIDInt(d.total_koperasi),
      has_npwp_fmt: formatIDInt(d.has_npwp),
      has_nib_fmt: formatIDInt(d.has_nib),
      rat_verified_fmt: formatIDInt(d.rat_verified),
      total_simpanan_fmt: `Rp${formatID(d.total_simpanan / 1000000)} Jt`,
      total_transaksi_fmt: `Rp${formatID(d.total_transaksi / 1000000)} Jt`
    }));

    memoryCache.set(cacheKey, response);
    res.json(response);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/district-detail', async (req, res) => {
  const { province = 'All', district, type } = req.query;
  try {
    if (!district) return res.json([]);
    const dist = await resolveDistrict(province, district);
    if (!dist) return res.json([]);
    
    const distData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/district/${dist.district_id}?period=2026`);
    const subdistricts = distData.territorial_data?.subdistricts || [];

    // Fetch all subdistricts' villages in parallel
    const subdistDetailList = await Promise.all(
      subdistricts.map(s => 
        fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/subdistrict/${s.subdistrict_id}?period=2026`)
          .catch(() => null)
      )
    );

    let allVillages = [];
    for (const sData of subdistDetailList) {
      if (sData && sData.territorial_data?.villages) {
        allVillages.push(...sData.territorial_data.villages);
      }
    }

    if (type === 'Simpanan') {
      allVillages.sort((a, b) => (b.savings_summary?.total_amount || 0) - (a.savings_summary?.total_amount || 0));
    } else if (type === 'Transaksi') {
      allVillages.sort((a, b) => (b.transaction_value || 0) - (a.transaction_value || 0));
    } else {
      allVillages.sort((a, b) => (b.rat_count || 0) - (a.rat_count || 0));
    }

    const response = allVillages.slice(0, 200).map(v => ({
      village: v.village,
      village_id: v.village_id,
      koperasi: `Koperasi Desa ${v.village}`,
      value: type === 'Simpanan'
        ? `Rp${formatID((v.savings_summary?.total_amount || 0) / 1000000)} Jt`
        : (type === 'Transaksi'
          ? `Rp${formatID((v.transaction_value || 0) / 1000000)} Jt`
          : (v.rat_count > 0 ? 'Terverifikasi' : 'Belum RAT')),
      status: v.rat_count > 0 ? 'Verified' : 'Draft',
      progress: v.accounts_count > 0 ? '100%' : 'Belum pembangunan'
    }));

    res.json(response);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Single Village Lookup Route for Drawer Tool
router.get('/village-detail', async (req, res) => {
  const { id } = req.query;
  try {
    if (!id) return res.status(400).json({ error: 'Village ID is required' });
    const data = await fetchJSON(`https://api.merahputih.kop.id/api/statistics/national-readiness/village/${id}?period=2026`);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/export', async (req, res) => {
  const { province, district, subdistrict } = req.query;
  try {
    let villagesList = [];
    let pName = province || 'All';
    let dName = district || 'All';
    let sName = subdistrict || 'All';

    let filename = `Export_Kesiapan_Desa_Nasional.xlsx`;

    if (pName === 'All') {
      filename = `Export_Kesiapan_Desa_Nasional.xlsx`;
      const coop = await fetchJSON('https://api.simkopdes.go.id/api/statistics/national-readiness/cooperative-stats?period=2026');
      const provinces = coop.nested_data?.grouped || [];
      villagesList = provinces.map(p => ({
        province: p.province,
        district: 'Seluruh Kabupaten',
        subdistrict: 'Seluruh Kecamatan',
        village: 'Rincian Tingkat Provinsi',
        koperasi: `Aggregat ${p.province}`,
        savings: p.savings_summary?.total_amount || 0,
        transactions: p.transaction_value || 0,
        npwp: p.npwp_count > 0 ? 'Y' : 'N',
        nib: p.nib_count > 0 ? 'Y' : 'N',
        rat_draft: 0,
        rat_verified: p.rat_count || 0,
        store_progress: '-'
      }));
    } else if (sName !== 'All') {
      filename = `Export_Kesiapan_Desa_Kecamatan_${sName}.xlsx`;
      const sub = await resolveSubdistrict(pName, dName, sName);
      if (sub) {
        const sData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/subdistrict/${sub.subdistrict_id}?period=2026`);
        villagesList = (sData.territorial_data?.villages || []).map(v => ({
          province: pName,
          district: dName,
          subdistrict: sName,
          village: v.village,
          koperasi: `Koperasi Desa ${v.village}`,
          savings: v.savings_summary?.total_amount || 0,
          transactions: v.transaction_value || 0,
          npwp: v.npwp_count > 0 ? 'Y' : 'N',
          nib: v.nib_count > 0 ? 'Y' : 'N',
          rat_draft: 0,
          rat_verified: v.rat_count || 0,
          store_progress: v.accounts_count > 0 ? '100%' : 'Belum pembangunan'
        }));
      }
    } else if (dName !== 'All') {
      filename = `Export_Kesiapan_Desa_Kabupaten_${dName}.xlsx`;
      const dist = await resolveDistrict(pName, dName);
      if (dist) {
        const distData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/district/${dist.district_id}?period=2026`);
        const subdistricts = distData.territorial_data?.subdistricts || [];
        const subDetailList = await Promise.all(
          subdistricts.map(s => fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/subdistrict/${s.subdistrict_id}?period=2026`).catch(() => null))
        );
        for (const sData of subDetailList) {
          if (sData && sData.territorial_data?.villages) {
            villagesList.push(...sData.territorial_data.villages.map(v => ({
              province: pName,
              district: dName,
              subdistrict: sData.territorial_data.subdistrict,
              village: v.village,
              koperasi: `Koperasi Desa ${v.village}`,
              savings: v.savings_summary?.total_amount || 0,
              transactions: v.transaction_value || 0,
              npwp: v.npwp_count > 0 ? 'Y' : 'N',
              nib: v.nib_count > 0 ? 'Y' : 'N',
              rat_draft: 0,
              rat_verified: v.rat_count || 0,
              store_progress: v.accounts_count > 0 ? '100%' : 'Belum pembangunan'
            })));
          }
        }
      }
    } else {
      // Province-level export
      filename = `Export_Kesiapan_Desa_Provinsi_${pName}.xlsx`;
      const prov = await resolveProvince(pName);
      if (prov) {
        const pData = await fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/province/${prov.province_id}?period=2026`);
        const districts = pData.territorial_data?.districts || [];
        
        const distDetailList = await Promise.all(
          districts.map(d => fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/district/${d.district_id}?period=2026`).catch(() => null))
        );
        
        let subdistricts = [];
        for (const dData of distDetailList) {
          if (dData && dData.territorial_data?.subdistricts) {
            const dNameLocal = dData.territorial_data.district;
            subdistricts.push(...dData.territorial_data.subdistricts.map(s => ({
              ...s,
              districtName: dNameLocal
            })));
          }
        }
        
        const subdistDetailList = await fetchInChunks(
          subdistricts,
          s => fetchJSON(`https://api.simkopdes.go.id/api/statistics/national-readiness/subdistrict/${s.subdistrict_id}?period=2026`).catch(() => null),
          20
        );
        
        for (let idx = 0; idx < subdistDetailList.length; idx++) {
          const sData = subdistDetailList[idx];
          const sLocal = subdistricts[idx];
          if (sData && sData.territorial_data?.villages) {
            villagesList.push(...sData.territorial_data.villages.map(v => ({
              province: pName,
              district: sLocal.districtName,
              subdistrict: sData.territorial_data.subdistrict,
              village: v.village,
              koperasi: `Koperasi Desa ${v.village}`,
              savings: v.savings_summary?.total_amount || 0,
              transactions: v.transaction_value || 0,
              npwp: v.npwp_count > 0 ? 'Y' : 'N',
              nib: v.nib_count > 0 ? 'Y' : 'N',
              rat_draft: 0,
              rat_verified: v.rat_count || 0,
              store_progress: v.accounts_count > 0 ? '100%' : 'Belum pembangunan'
            })));
          }
        }
      }
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Village Readiness');
    worksheet.columns = [
      { header: 'Provinsi', key: 'province', width: 20 },
      { header: 'Kabupaten', key: 'district', width: 20 },
      { header: 'Kecamatan', key: 'subdistrict', width: 20 },
      { header: 'Desa', key: 'village', width: 20 },
      { header: 'Nama Koperasi', key: 'koperasi', width: 30 },
      { header: 'Simpanan Total', key: 'savings', width: 15 },
      { header: 'Total Transaksi', key: 'transactions', width: 15 },
      { header: 'Status NPWP', key: 'npwp', width: 15 },
      { header: 'Status NIB', key: 'nib', width: 15 },
      { header: 'Pengajuan RAT', key: 'rat_draft', width: 15 },
      { header: 'RAT Terverifikasi', key: 'rat_verified', width: 15 },
      { header: 'Progres Pembangunan Gerai', key: 'store_progress', width: 25 }
    ];

    villagesList.forEach(d => worksheet.addRow(d));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const KEY_STRING = "EX7rvuSQItlrBOSzePdlrrGuQOjOmIPs";
const IV_STRING = "HIYa12MVEqtZIiBG";

const decryptPayload = (encryptedBase64) => {
  try {
    const key = crypto.createHash('sha256').update(KEY_STRING).digest();
    const iv = Buffer.from(IV_STRING, 'utf8');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error inside server proxy:', err.message);
    throw err;
  }
};

router.get('/cooperatives/explore', async (req, res) => {
  const { search = '', page = 1, page_size = 10 } = req.query;
  try {
    const targetUrl = `https://api.simkopdes.go.id/api/cooperatives/explore?page=${page}&page_size=${page_size}&search=${encodeURIComponent(search)}`;
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'X-App-Version': '1.3.17',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    const result = await response.json();
    if (result.data) {
      const decryptedText = decryptPayload(result.data);
      const decryptedJson = JSON.parse(decryptedText);
      res.json({
        message: result.message,
        data: decryptedJson,
        pagination: result.pagination
      });
    } else {
      res.json({
        message: result.message,
        data: [],
        pagination: result.pagination
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Mount the router
app.use('/api', router);
app.use('/', router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
