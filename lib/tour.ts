import { LOGIN_NAME, demoPassword } from "@/lib/labels";

export const TOUR_KEY = "swm-tour-step";

export function tourCode(n: number) {
  return `SWM-${new Date().getFullYear()}-${String(n).padStart(3, "0")}`;
}

export type TourStep = {
  role: string;
  lane: string;
  person: string;
  title: string;
  lead: string;
  steps: string[];
  href: string;
};

function openProject(n: number) {
  return `/buka/${tourCode(n)}`;
}

export const TOUR: TourStep[] = [
  {
    role: "PELANGGAN",
    lane: "Pelanggan",
    person: "dr. Nadia Putri",
    title: "Pesanan berangkat dari rumah sakit",
    lead: "Alur dibuka oleh kebutuhan pelanggan, bukan oleh gudang. Akun ini hanya melihat proyek RS Sentosa Medika. Permintaan itulah yang nanti dicatat admin sebagai PO.",
    steps: [
      "Portal menampilkan pesanan rumah sakit Anda, beserta tahap yang sedang berjalan.",
      "Pita tembaga artinya ada proyek yang menunggu pemeriksaan Anda. Itu bagian akhir alur, bukan awal.",
      "Di langkah ini belum ada tombol pengajuan. PO dicatat di meja admin.",
    ],
    href: "/portal",
  },
  {
    role: "ADMIN_PROYEK",
    lane: "Admin proyek",
    person: "Bima Pratama",
    title: "PO dicatat, lalu rencana diajukan",
    lead: `${tourCode(1)} masih draft untuk RSUD Bekasi, 8 unit. Sebelum diajukan, direktur tidak punya tindakan pada berkas ini.`,
    steps: [
      "Buka panel tindakan proyek. Jumlah unit, lokasi, dan nomor PO-BEKASI-118 sudah terisi.",
      "Pilih Ajukan rencana. Status berubah menjadi Menunggu arahan.",
      "Dokumen PO dan data proyek tersimpan di tab Dokumen.",
    ],
    href: openProject(1),
  },
  {
    role: "DIREKTUR",
    lane: "Direktur",
    person: "Ir. Hendra Kusuma",
    title: "Arahan hanya punya dua jalan",
    lead: `${tourCode(2)} untuk RSHS sudah menunggu. Gateway ini tidak meneruskan pekerjaan ke gudang sebelum ada keputusan.`,
    steps: [
      "Isi catatan arahan. Tanpa catatan, persetujuan ditolak.",
      "Setujui rencana bila data cukup. Gudang dan produksi menerima pekerjaan bersamaan.",
      "Kembalikan bila lokasi, jumlah, atau spesifikasi masih kurang. Berkas kembali ke admin.",
    ],
    href: openProject(2),
  },
  {
    role: "WAREHOUSE",
    lane: "Gudang",
    person: "Lestari Ayu",
    title: "Material diuji per unit yang bisa dikerjakan",
    lead: `Cukup berarti stok menutup minimal satu unit utuh, bukan seluruh sisa. Di ${tourCode(4)} sisa 4 unit, stok hanya menutup 2, jadi alokasi berhenti di 2. ${tourCode(3)} adalah cabang sebaliknya: timbal 3 mm kosong, satu unit pun tidak tertutup, maka terbit PR.`,
    steps: [
      `Pada ${tourCode(4)} pilih Jalankan pemeriksaan material. Stok terpotong dan batch 2 unit terbentuk.`,
      `Pada ${tourCode(3)} jangan memaksa produksi. PR timbal 3 mm berstatus dipesan.`,
      "Saat barang PR tiba, konfirmasi kedatangan. Stok naik dan proyek kembali operasional.",
    ],
    href: openProject(4),
  },
  {
    role: "PRODUKSI",
    lane: "Produksi",
    person: "Agus Setiawan",
    title: "Batch mengikuti material yang sudah dialokasi",
    lead: `${tourCode(3)} belum bisa dikerjakan karena timbal 3 mm belum tiba. Produksi hanya menyiapkan proses. Batch dimulai setelah gudang mengalokasi, dan gagal QC mengembalikan batch yang sama, bukan batch baru.`,
    steps: [
      `Di ${tourCode(3)} pilih Siapkan proses produksi.`,
      "Setelah ada batch berstatus Material dialokasi, mulai produksi lalu selesaikan unitnya.",
      "Hanya satu batch yang belum lolos QC boleh aktif. Selesaikan atau perbaiki batch itu dulu.",
    ],
    href: openProject(3),
  },
  {
    role: "QC_PRODUKSI",
    lane: "QC produksi",
    person: "Maya Fitriani",
    title: "QC mengulang batch yang sama",
    lead: `${tourCode(5)} pernah gagal karena celah bawah. Perbaikan selesai dan batch menunggu keputusan ulang. Lolos membuat nomor seri. Bila pesanan belum penuh, proyek kembali ke gudang. Bila semua unit lolos, QC menerbitkan surat jalan.`,
    steps: [
      "Pilih lolos, atau tidak sesuai beserta catatan cacat.",
      "Tidak sesuai mengirim batch yang sama ke perbaikan produksi.",
      "Surat jalan baru terbit ketika seluruh unit pesanan sudah lolos, bukan sebagian.",
    ],
    href: openProject(5),
  },
  {
    role: "INSTALASI",
    lane: "Instalasi",
    person: "Rudi Hartono",
    title: "Pintu dipasang, lalu diperiksa di lokasi",
    lead: `${tourCode(6)} untuk Sentosa lantai 4 sudah terkirim dan terpasang. QC lapangan yang lolos meminta pelanggan memeriksa. Gagal QC memperbaiki di lokasi sebelum diajukan lagi.`,
    steps: [
      "Tab Dokumen memuat surat jalan tujuan lantai 4.",
      "Pilih QC internal sesuai, atau tidak sesuai bila pemasangan masih cacat.",
      "Lolos menggeser proyek ke inspeksi pelanggan dan mengirim permintaan pemeriksaan.",
    ],
    href: openProject(6),
  },
  {
    role: "PELANGGAN",
    lane: "Pelanggan",
    person: "dr. Nadia Putri",
    title: "Pesanan kembali ke tangan pelanggan",
    lead: `${tourCode(7)}, empat pintu radiologi lantai 2, menunggu pemeriksaan dr. Nadia. Sesuai berarti tanda tangan BAST. Tidak sesuai mengembalikan pekerjaan ke instalasi, bukan menutup pesanan.`,
    steps: [
      "Buka proyek ini dan baca hasil QC instalasi di dokumen.",
      "Gambar tanda tangan, atau unggah berkas, lalu tandatangani BAST.",
      "Pilih minta perbaikan bila seal atau ayunan daun belum sesuai.",
    ],
    href: openProject(7),
  },
  {
    role: "ADMIN_PROYEK",
    lane: "Admin proyek",
    person: "Bima Pratama",
    title: "BAST diverifikasi, berkas ditutup",
    lead: `${tourCode(8)} sudah ditandatangani pelanggan Premier. Admin mencocokkan BAST dengan pekerjaan, lalu menutup proyek. Tanpa centang konfirmasi, penutupan tidak jalan.`,
    steps: [
      "Baca BAST di tab Dokumen. Penandatangan pada sampel ini dr. Andika Rahman.",
      "Centang konfirmasi, lalu tutup proyek.",
      "Status menjadi Selesai. Lead time dihitung dari PO masuk sampai penutupan.",
    ],
    href: openProject(8),
  },
];

export function tourLogin(role: string) {
  return { username: LOGIN_NAME[role] ?? "", password: demoPassword(role) };
}

export function tourSignInFailed(result: { error?: string | null; url?: string | null } | undefined | null) {
  if (!result || result.error) return true;
  return Boolean(result.url && /[?&](error|csrf)=/.test(result.url));
}
