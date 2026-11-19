"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { LOGIN_NAME, demoPassword, homeFor } from "@/lib/labels";

const DEMOS = [
  { role: "SUPER_ADMIN", label: "Super Admin" },
  { role: "ADMIN_PROYEK", label: "Admin Proyek" },
  { role: "DIREKTUR", label: "Direktur" },
  { role: "WAREHOUSE", label: "Gudang" },
  { role: "PRODUKSI", label: "Produksi" },
  { role: "QC_PRODUKSI", label: "QC Produksi" },
  { role: "INSTALASI", label: "Instalasi" },
  { role: "PELANGGAN", label: "Pelanggan" },
] as const;

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState(LOGIN_NAME.ADMIN_PROYEK);
  const [password, setPassword] = useState(demoPassword("ADMIN_PROYEK"));
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(nextUsername = username, nextPassword = password) {
    setPending(true);
    setError("");
    const result = await signIn("credentials", {
      redirect: false,
      username: nextUsername,
      password: nextPassword,
      remember: remember ? "true" : "false",
    });
    setPending(false);
    if (!result || result.error) {
      setError("Username atau kata sandi tidak sesuai, atau akun nonaktif.");
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
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/\s/g, ""))}
        />
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
          {DEMOS.map((demo) => {
            const name = LOGIN_NAME[demo.role];
            return (
              <button
                key={demo.role}
                type="button"
                disabled={pending}
                onClick={() => {
                  setUsername(name);
                  setPassword(demoPassword(demo.role));
                  void submit(name, demoPassword(demo.role));
                }}
                className="rounded-[8px] border border-line px-2 py-2 text-left text-[12px] hover:border-copper"
              >
                <span className="block font-medium">{demo.label}</span>
                <span className="block truncate text-muted">{name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );
}
