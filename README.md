# PT Satya Wira Mandiri — ERP operasional

Dasbor proyek pintu timbal: penerimaan PO, arahan direktur, pengadaan, produksi batch sesuai stok, QC, pengiriman, instalasi, dan BAST.

## Menjalankan lokal

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Buka http://localhost:3000

Kata sandi semua akun demo: `SatyaWira#2026`

| Peran | Email | Pekerjaan yang menunggu |
| --- | --- | --- |
| Super Admin | superadmin@satyawira.co.id | Seluruh modul dan akun |
| Admin Proyek | admin.proyek@satyawira.co.id | Ajukan PO Bekasi, verifikasi BAST Premier |
| Direktur | direktur@satyawira.co.id | Arahan rencana RSHS |
| Gudang | gudang@satyawira.co.id | Terima PR Siloam, cek sisa unit Premier |
| Produksi | produksi@satyawira.co.id | Siapkan proses CT Siloam |
| QC Produksi | qc@satyawira.co.id | QC ulang Bumi Sehat |
| Instalasi | instalasi@satyawira.co.id | QC internal Sentosa lantai 4 |
| Pelanggan | pelanggan@rssentosa.id | Periksa dan tanda tangan BAST lantai 2 |

## Environment

Salin `.env.example` menjadi `.env`.

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="string-acak-minimal-32-karakter"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="PT Satya Wira Mandiri <noreply@satyawira.co.id>"
```

OTP lupa kata sandi memakai Nodemailer. Jika `SMTP_HOST` kosong dan aplikasi berjalan di development, kode 6 digit tampil di layar supaya alurnya bisa diuji tanpa server surat. Di production, kode tidak pernah dikembalikan ke browser.

Contoh Resend:

```
SMTP_HOST="smtp.resend.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="resend"
SMTP_PASS="re_xxxxxxxx"
SMTP_FROM="PT Satya Wira Mandiri <noreply@domain-anda.com>"
```

Untuk PostgreSQL, ganti provider di `prisma/schema.prisma` menjadi `postgresql` dan arahkan `DATABASE_URL` ke server Anda, lalu jalankan `npx prisma db push` lagi.

## Produksi parsial

Pemeriksaan material mengalokasikan sebanyak unit yang stoknya menutupi, misalnya 2 dari 4 sisa, lalu mencatat gateway **Ya**. PR hanya terbit bila stok tidak menutup satu unit lengkap (gateway **Tidak**). Setelah batch lolos QC dan pesanan belum penuh, proyek kembali ke gudang.
