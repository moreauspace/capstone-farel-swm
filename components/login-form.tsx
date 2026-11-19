"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { homeFor } from "@/lib/labels";

export const DEMO_PASSWORD = "SatyaWira#2026";

const DEMOS = [
  { role: "Super Admin", email: "superadmin@satyawira.co.id" },
  { role: "Admin Proyek", email: "admin.proyek@satyawira.co.id" },
  { role: "Direktur", email: "direktur@satyawira.co.id" },
  { role: "Gudang", email: "gudang@satyawira.co.id" },
  { role: "Produksi", email: "produksi@satyawira.co.id" },
  { role: "QC Produksi", email: "qc@satyawira.co.id" },
  { role: "Instalasi", email: "instalasi@satyawira.co.id" },
  { role: "Pelanggan", email: "pelanggan@rssentosa.id" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin.proyek@satyawira.co.id");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(nextEmail = email, nextPassword = password) {
    setPending(true);
    setError("");
    const result = await signIn("credentials", {
      redirect: false,
      email: nextEmail,
      password: nextPassword,
      remember: remember ? "true" : "false",
    });
    setPending(false);
    if (!result || result.error) {
      setError("Email atau kata sandi tidak sesuai, atau akun nonaktif.");
      return;
    }
    const session = await getSession();
    router.push(homeFor(session?.user.role ?? ""));
    router.refresh();
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label htmlFor="password" className="mb-0">Kata sandi</Label>
          <Link href="/forgot-password" className="text-[13px] text-copper">Lupa kata sandi</Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="pr-16"
          />
          <button type="button" className="absolute right-3 top-2.5 text-[12px] text-muted" onClick={() => setShow((value) => !value)}>
            {show ? "Sembunyi" : "Lihat"}
          </button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
        Ingat saya di perangkat ini
      </label>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Memeriksa…" : "Masuk"}
      </Button>
      <div>
        <p className="mb-2 text-[12px] uppercase tracking-[0.14em] text-muted">Akun demo</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMOS.map((demo) => (
            <button
              key={demo.email}
              type="button"
              disabled={pending}
              onClick={() => {
                setEmail(demo.email);
                setPassword(DEMO_PASSWORD);
                void submit(demo.email, DEMO_PASSWORD);
              }}
              className="rounded-[8px] border border-line px-2 py-2 text-left text-[12px] hover:border-copper"
            >
              <span className="block font-medium">{demo.role}</span>
              <span className="block truncate text-muted">{demo.email.split("@")[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
