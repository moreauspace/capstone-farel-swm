"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="panel mx-auto max-w-lg p-6">
      <h1 className="font-display text-3xl tracking-tight">Terjadi kendala</h1>
      <p className="mt-2 text-sm text-muted">Muat ulang halaman. Jika berulang, coba masuk lagi.</p>
      <button type="button" onClick={reset} className="mt-4 h-10 rounded-[8px] bg-navy px-3 text-sm text-white">
        Coba lagi
      </button>
    </div>
  );
}
