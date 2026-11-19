import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <p className="text-[12px] uppercase tracking-[0.14em] text-copper">404</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Halaman tidak ada</h1>
      <p className="mt-2 text-sm text-muted">Berkas itu tidak ditemukan, atau tidak terbuka untuk akun Anda.</p>
      <Link href="/" className="mt-4 text-sm text-copper">Kembali ke beranda</Link>
    </main>
  );
}
