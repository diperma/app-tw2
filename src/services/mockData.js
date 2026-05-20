const PROVINCES = [
  "ACEH", "SUMATERA UTARA", "JAWA BARAT", "JAWA TENGAH", "JAWA TIMUR", "BALI", "KALIMANTAN TIMUR", "SULAWESI SELATAN", "PAPUA"
];

const DISTRICTS = {
  "ACEH": ["KAB. ACEH BARAT", "KAB. ACEH BESAR", "KOTA BANDA ACEH"],
  "JAWA BARAT": ["KAB. BANDUNG", "KAB. BOGOR", "KOTA BANDUNG"],
  "JAWA TIMUR": ["KAB. MALANG", "KAB. SIDOARJO", "KOTA SURABAYA"]
};

export const getMockStats = (province = "All") => {
  return {
    total_villages: province === "All" ? 83761 : 5420,
    has_account: Math.floor(Math.random() * 5000),
    has_npwp: Math.floor(Math.random() * 4500),
    has_nib: Math.floor(Math.random() * 4000),
  };
};

export const getMockHighlights = () => {
  const categories = [
    { type: "Simpanan", icon: "Wallet", unit: "Miliar" },
    { type: "Transaksi", icon: "ArrowUpRight", unit: "Trx" },
    { type: "Penyelesaian RAT", icon: "CheckCircle", unit: "%" }
  ];

  return categories.map(cat => ({
    ...cat,
    districts: Array.from({ length: 4 }).map((_, i) => ({
      id: `${cat.type}-${i}`,
      name: `KAB. DISTRICT ${i + 1}`,
      value: cat.type === "Savings" ? `Rp ${20 - i} M` : 
             cat.type === "Transactions" ? `${(1000 - i * 100).toLocaleString()} Trx` : 
             `${98 - i}%`
    }))
  }));
};

export const getMockRegionalData = (province = "All") => {
  const list = province === "All" ? PROVINCES : (DISTRICTS[province] || ["District A", "District B"]);
  return list.map((name, i) => ({
    id: i,
    name: name,
    total_koperasi: Math.floor(Math.random() * 1000),
    has_account: Math.floor(Math.random() * 800),
    has_npwp: Math.floor(Math.random() * 700),
    has_nib: Math.floor(Math.random() * 600),
    rat_verified: Math.floor(Math.random() * 500)
  }));
};

export const getMockDistrictDetails = () => {
  return Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    village: `Desa ${i + 1}`,
    koperasi: `Koperasi Desa ${i + 1}`,
    savings: `Rp ${Math.floor(Math.random() * 500)} Juta`,
    status: i % 3 === 0 ? "Verified" : "Draft"
  }));
};

export { PROVINCES };
