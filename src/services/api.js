const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return 'http://localhost:5000/api';
  return url.endsWith('/api') ? url : (url.endsWith('/') ? `${url}api` : `${url}/api`);
};

const API_BASE_URL = getApiBaseUrl();

export const fetchProvinces = async () => {
  const res = await fetch(`${API_BASE_URL}/provinces`);
  return res.json();
};

export const fetchDistricts = async (province) => {
  const res = await fetch(`${API_BASE_URL}/districts?province=${province}`);
  return res.json();
};

export const fetchStats = async (province, district) => {
  const res = await fetch(`${API_BASE_URL}/stats?province=${province}&district=${district || 'All'}`);
  return res.json();
};

export const fetchHighlights = async (province, district) => {
  const res = await fetch(`${API_BASE_URL}/highlights?province=${province}&district=${district || 'All'}`);
  return res.json();
};

export const fetchRegionalData = async (province, district) => {
  const res = await fetch(`${API_BASE_URL}/regional-data?province=${province}&district=${district || 'All'}`);
  return res.json();
};

export const fetchCharts = async (province, district) => {
  const res = await fetch(`${API_BASE_URL}/charts?province=${province}&district=${district || 'All'}`);
  return res.json();
};

export const fetchDistrictDetails = async (districtName, type) => {
  const res = await fetch(`${API_BASE_URL}/district-detail?district=${districtName}&type=${type}`);
  return res.json();
};

export const getExportUrl = (province, district, subdistrict) => {
  let url = `${API_BASE_URL}/export?province=${province}`;
  if (district && district !== 'All') url += `&district=${district}`;
  if (subdistrict && subdistrict !== 'All') url += `&subdistrict=${subdistrict}`;
  return url;
};
