"use client";

import { useEffect, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { TOUR, TOUR_KEY, tourLogin, tourSignInFailed } from "@/lib/tour";

export function FlowTour() {
  const [step, setStep] = useState<number | null>(null);
  const [open, setOpen] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem(TOUR_KEY);
    if (raw == null) return;
    const index = Number(raw);
    if (!Number.isInteger(index) || index < 0 || index >= TOUR.length) {
      sessionStorage.removeItem(TOUR_KEY);
      return;
    }
    setStep(index);
  }, []);

  if (step == null) return null;
  const current = TOUR[step];

  function stop() {
    sessionStorage.removeItem(TOUR_KEY);
    setStep(null);
  }

  async function go(next: number) {
    const target = TOUR[next];
    if (!target) {
      stop();
      return;
    }
    setPending(true);
    setError("");
    const login = tourLogin(target.role);
    const result = await signIn("credentials", {
      redirect: false,
      username: login.username,
      password: login.password,
      remember: "true",
    });
    const session = await getSession();
    if (tourSignInFailed(result) || session?.user.role !== target.role) {
      setPending(false);
      setError("Gagal beralih akun. Coba lagi.");
      return;
    }
    sessionStorage.setItem(TOUR_KEY, String(next));
    window.location.assign(target.href);
  }

  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-40 max-h-[70vh] overflow-y-auto rounded-[14px] border border-line bg-card shadow-[0_16px_40px_rgba(16,36,51,0.16)] lg:inset-x-auto lg:left-[264px] lg:w-[380px]"
      aria-label="Tutorial alur pesanan"
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <p className="text-[12px] uppercase tracking-[0.14em] text-copper">
          {step + 1} dari {TOUR.length} · {current.lane}
        </p>
        <button type="button" className="text-[12px] text-muted" onClick={stop}>
          Tutup
        </button>
      </div>
      {open ? (
        <div className="px-4 pb-4">
          <h2 className="mt-1 font-display text-[26px] leading-tight tracking-tight">{current.title}</h2>
          <p className="mt-1 text-[12px] text-muted">
            Masuk sebagai {current.person}
          </p>
          <p className="mt-3 text-sm leading-6">{current.lead}</p>
          <ol className="mt-3 space-y-2 text-sm leading-5">
            {current.steps.map((item, index) => (
              <li key={item} className="flex gap-2">
                <span className="num text-copper">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
          {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {step > 0 ? (
              <button
                type="button"
                className="h-10 rounded-[8px] border border-line px-3 text-sm"
                disabled={pending}
                onClick={() => void go(step - 1)}
              >
                Sebelumnya
              </button>
            ) : null}
            <button
              type="button"
              className="h-10 rounded-[8px] bg-navy px-3 text-sm text-white disabled:opacity-50 dark:bg-[#d7e6f4] dark:text-[#102433]"
              disabled={pending}
              onClick={() => void go(step + 1)}
            >
              {pending ? "Beralih akun…" : step === TOUR.length - 1 ? "Selesai" : `Lanjut ke ${TOUR[step + 1].lane.toLowerCase()}`}
            </button>
            <button type="button" className="h-10 px-2 text-sm text-muted" onClick={() => setOpen(false)}>
              Sembunyikan
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 px-4 pb-3">
          <p className="truncate text-sm">{current.title}</p>
          <button type="button" className="text-sm text-copper" onClick={() => setOpen(true)}>
            Tampilkan
          </button>
        </div>
      )}
    </aside>
  );
}
