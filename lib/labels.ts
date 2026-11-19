export const ROLE_META: Record<
  string,
  { label: string; short: string; department: string }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    short: "Admin sistem",
    department: "Manajemen Sistem",
  },
  ADMIN_PROYEK: {
    label: "Admin Proyek",
    short: "Admin",
    department: "Administrasi Proyek",
  },
  DIREKTUR: {
    label: "Direktur Operasional",
    short: "Direktur",
    department: "Direktur Operasional",
  },
  WAREHOUSE: {
    label: "Gudang & Pengadaan",
    short: "Gudang",
    department: "Gudang & Pengadaan",
  },
  PRODUKSI: {
    label: "Produksi",
    short: "Produksi",
    department: "Produksi",
  },
  QC_PRODUKSI: {
    label: "QC Produksi",
    short: "QC",
    department: "QC Produksi",
  },
  INSTALASI: {
    label: "Instalasi",
    short: "Instalasi",
    department: "Instalasi & Pengawas",
  },
  PELANGGAN: {
    label: "Pelanggan",
    short: "Pelanggan",
    department: "Portal Klien",
  },
};

export const STATUS_META: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: "Draft PO", tone: "neutral" },
  MENUNGGU_DIREKTUR: { label: "Menunggu arahan", tone: "warn" },
  OPERASIONAL: { label: "Operasional", tone: "info" },
  PENGADAAN: { label: "Pengadaan", tone: "warn" },
  PRODUKSI: { label: "Produksi", tone: "info" },
  QC_PRODUKSI: { label: "QC produksi", tone: "info" },
  REWORK_PRODUKSI: { label: "Perbaikan produk", tone: "bad" },
  SIAP_KIRIM: { label: "Siap kirim", tone: "info" },
  INSTALASI: { label: "Instalasi", tone: "info" },
  QC_INSTALASI: { label: "QC instalasi", tone: "info" },
  REWORK_INSTALASI: { label: "Perbaikan instalasi", tone: "bad" },
  INSPEKSI_PELANGGAN: { label: "Inspeksi pelanggan", tone: "copper" },
  VERIFIKASI_BAST: { label: "Verifikasi BAST", tone: "warn" },
  SELESAI: { label: "Selesai", tone: "good" },
};

export const BATCH_META: Record<string, string> = {
  ALLOCATED: "Material dialokasi",
  IN_PRODUCTION: "Sedang diproduksi",
  QC_PENDING: "Menunggu QC",
  REWORK: "Perbaikan",
  PASSED: "Lolos QC",
};

export const PR_META: Record<string, string> = {
  DRAFT: "Draft",
  DIPROSES: "Diproses",
  DIPESAN: "Dipesan",
  TIBA: "Tiba di gudang",
  DITUTUP: "Ditutup",
};

export const DOC_META: Record<string, string> = {
  PO: "Purchase Order",
  DATA_PROYEK: "Data proyek",
  RENCANA_PROYEK: "Rencana proyek",
  ARAHAN_DIREKTUR: "Arahan direktur",
  PR: "Permintaan pembelian",
  LAPORAN_QC_PRODUKSI: "Laporan QC produksi",
  SURAT_JALAN: "Surat jalan",
  HASIL_QC_INSTALASI: "Hasil QC instalasi",
  PERMINTAAN_PEMERIKSAAN: "Permintaan pemeriksaan",
  CATATAN_PERBAIKAN: "Catatan perbaikan",
  BAST: "Berita acara serah terima",
};

export const GATEWAY_META: Record<string, string> = {
  ARAHAN_DIREKTUR: "Arahan direktur disetujui?",
  MATERIAL_CUKUP: "Material cukup untuk unit tertentu?",
  HASIL_QC_PRODUKSI: "Hasil QC produksi sesuai?",
  SEMUA_UNIT: "Seluruh unit pesanan lolos QC?",
  HASIL_QC_INSTALASI: "Hasil QC instalasi sesuai?",
  HASIL_SESUAI_PELANGGAN: "Hasil pemeriksaan pelanggan sesuai?",
};

export const UNIT_STATUS: Record<string, string> = {
  STORED: "Di gudang",
  SHIPPED: "Dikirim",
  INSTALLED: "Terpasang",
};

export function statusToneClass(tone: string) {
  switch (tone) {
    case "good":
      return "bg-[#e7f5ee] text-[#176b42] dark:bg-[#17352a] dark:text-[#b7e4cb]";
    case "bad":
      return "bg-[#fbeceb] text-[#9d3b34] dark:bg-[#3a2220] dark:text-[#f0b4ae]";
    case "warn":
      return "bg-[#fbf3df] text-[#8a5a10] dark:bg-[#3a3018] dark:text-[#f0d48a]";
    case "info":
      return "bg-[#e7f0f8] text-[#1d4e79] dark:bg-[#1a2c3d] dark:text-[#c5d9ee]";
    case "copper":
      return "bg-[#f8efe8] text-[#8a4b2a] dark:bg-[#3a2a22] dark:text-[#f0c2a8]";
    default:
      return "bg-[#efeae3] text-[#5c6770] dark:bg-[#24303a] dark:text-[#c5ced6]";
  }
}

export function homeFor(role: string) {
  return role === "PELANGGAN" ? "/portal" : "/dashboard";
}

export const CLIENT_DOC_TYPES = new Set([
  "PO",
  "DATA_PROYEK",
  "RENCANA_PROYEK",
  "ARAHAN_DIREKTUR",
  "SURAT_JALAN",
  "HASIL_QC_INSTALASI",
  "PERMINTAAN_PEMERIKSAAN",
  "CATATAN_PERBAIKAN",
  "BAST",
]);
