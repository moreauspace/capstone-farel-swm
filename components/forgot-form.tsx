"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { maskEmail } from "@/lib/utils";
import { passwordScore } from "@/lib/password";

const STEPS = ["Email", "Kirim", "Kode", "Sandi baru"];

export function ForgotForm() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [devCode, setDevCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const left = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0;
  const clock = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;

  async function requestCode() {
    setPending(true);
    setError("");
    const response = await fetch("/api/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(data.message ?? "Gagal mengirim kode.");
      return;
    }
    setExpiresAt(new Date(data.expiresAt).getTime());
    setDevCode(data.devCode ?? "");
    setMessage(`Kode 6 digit dikirim ke ${maskEmail(email)}.`);
    setStep(1);
  }

  async function verify(nextCode = code) {
    setPending(true);
    setError("");
    const response = await fetch("/api/otp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: nextCode }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(data.message ?? "Kode tidak sesuai.");
      return;
    }
    setResetToken(data.resetToken);
    setStep(3);
  }

  async function reset(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }
    setPending(true);
    setError("");
    const response = await fetch("/api/otp", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToken, password }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(data.message ?? "Gagal memperbarui kata sandi.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="space-y-5">
      <ol className="grid grid-cols-4 gap-2 text-[11px] uppercase tracking-[0.12em] text-muted">
        {STEPS.map((label, index) => (
          <li key={label} className={index <= step ? "text-ink" : ""}>
            <span className={`mb-1 block h-0.5 ${index <= step ? "bg-copper" : "bg-line"}`} />
            {label}
          </li>
        ))}
      </ol>

      {done ? (
        <div className="space-y-4">
          <p>Kata sandi diperbarui. Masuk dengan kata sandi baru.</p>
          <Button asChild>
            <Link href="/login">Ke halaman masuk</Link>
          </Button>
        </div>
      ) : null}

      {!done && step === 0 ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void requestCode();
          }}
        >
          <div>
            <Label htmlFor="email">Email terdaftar</Label>
            <Input id="email" type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          {error ? <p className="text-sm text-bad">{error}</p> : null}
          <Button type="submit" disabled={pending}>{pending ? "Memeriksa…" : "Kirim kode OTP"}</Button>
        </form>
      ) : null}

      {!done && step === 1 ? (
        <div className="space-y-4">
          <p className="text-sm leading-6">{message} Kode berlaku 5 menit.</p>
          {devCode ? (
            <p className="rounded-[8px] border border-line bg-[#fbf6ee] px-3 py-2 text-sm text-[#6a4a2e] dark:bg-[#2a241c] dark:text-[#f0d7c4]">
              SMTP belum diisi. Kode lokal: <span className="num font-semibold">{devCode}</span>
            </p>
          ) : null}
          <Button type="button" onClick={() => setStep(2)}>Masukkan kode</Button>
        </div>
      ) : null}

      {!done && step === 2 ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void verify();
          }}
        >
          <OtpInput value={code} onChange={setCode} onComplete={(value) => void verify(value)} />
          <p className="num text-sm text-muted">Berlaku {clock}</p>
          {error ? <p className="text-sm text-bad">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending || code.length < 6}>{pending ? "Memeriksa…" : "Verifikasi"}</Button>
            <Button type="button" variant="secondary" disabled={pending || left > 240} onClick={() => void requestCode()}>
              Kirim ulang
            </Button>
          </div>
        </form>
      ) : null}

      {!done && step === 3 ? (
        <form className="space-y-4" onSubmit={reset}>
          <div>
            <Label htmlFor="password">Kata sandi baru</Label>
            <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            <Strength value={password} />
          </div>
          <div>
            <Label htmlFor="confirm">Ulangi kata sandi</Label>
            <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </div>
          {error ? <p className="text-sm text-bad">{error}</p> : null}
          <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan kata sandi"}</Button>
        </form>
      ) : null}

      <Link href="/login" className="inline-block text-sm text-muted">Kembali masuk</Link>
    </div>
  );
}

function OtpInput({ value, onChange, onComplete }: { value: string; onChange: (value: string) => void; onComplete: (value: string) => void }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? "");

  function write(next: string) {
    const clean = next.replace(/\D/g, "").slice(0, 6);
    onChange(clean);
    if (clean.length === 6) onComplete(clean);
  }

  return (
    <div className="flex gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => { refs.current[index] = node; }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1}`}
          className="num h-12 w-11 rounded-[6px] border border-line bg-card text-center text-lg"
          value={digit}
          onChange={(event) => {
            const text = event.target.value.replace(/\D/g, "");
            if (text.length > 1) {
              write(text);
              return;
            }
            const chars = digits.slice();
            chars[index] = text;
            const joined = chars.join("").replace(/\s/g, "");
            onChange(joined);
            if (text && refs.current[index + 1]) refs.current[index + 1]?.focus();
            if (chars.join("").length === 6 && chars.every(Boolean)) onComplete(chars.join(""));
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && refs.current[index - 1]) {
              refs.current[index - 1]?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            write(event.clipboardData.getData("text"));
          }}
        />
      ))}
    </div>
  );
}

function Strength({ value }: { value: string }) {
  const score = passwordScore(value);
  const labels = ["Kosong", "Lemah", "Cukup", "Baik", "Kuat"];
  return (
    <div className="mt-2">
      <div className="grid grid-cols-4 gap-1">
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={`h-1 rounded-full ${index < score ? "bg-copper" : "bg-line"}`} />
        ))}
      </div>
      <p className="mt-1 text-[12px] text-muted">{labels[score]} · minimal 8 karakter, huruf besar, huruf kecil, dan angka.</p>
    </div>
  );
}
