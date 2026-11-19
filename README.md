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

Masuk memakai username. Username adalah nama peran, huruf kecil, tanpa spasi. Kata sandi demo adalah username ditambah `123`.

| Peran | Username | Kata sandi | Pekerjaan yang menunggu |
| --- | --- | --- | --- |
| Super Admin | superadmin | superadmin123 | Seluruh modul dan akun |
| Admin Proyek | adminproyek | adminproyek123 | Ajukan PO Bekasi, verifikasi BAST Premier |
| Direktur | direktur | direktur123 | Arahan rencana RSHS |
| Gudang | gudang | gudang123 | Terima PR Siloam, cek sisa unit Premier |
| Produksi | produksi | produksi123 | Siapkan proses CT Siloam |
| QC Produksi | qcproduksi | qcproduksi123 | QC ulang Bumi Sehat |
| Instalasi | instalasi | instalasi123 | QC internal Sentosa lantai 4 |
| Pelanggan | pelanggan | pelanggan123 | Periksa dan tanda tangan BAST lantai 2 |

## Netlify

Repo ini sudah berisi `netlify.toml`. Deploy ulang dari GitHub setelah perubahan ini masuk. Build membuat database demo sendiri, jadi jangan isi `DATABASE_URL` dengan Postgres di dashboard Netlify. Kalau variabel itu sudah ada dan bukan `file:./dev.db`, hapus lalu deploy lagi.

Login demo tetap `superadmin` / `superadmin123`. Data kembali ke kondisi awal setiap kali situs di-deploy.

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
