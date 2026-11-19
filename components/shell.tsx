"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Sun,
  Truck,
  Users,
  X,
} from "lucide-react";
import { Mark } from "@/components/brand";
import { NotificationBell } from "@/components/notification-bell";
import { ROLE_META } from "@/lib/labels";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

function navFor(role: string): NavItem[] {
  if (role === "PELANGGAN") {
    return [
      { href: "/portal", label: "Portal", icon: LayoutDashboard },
      { href: "/projects", label: "Proyek saya", icon: ClipboardList },
      { href: "/notifications", label: "Notifikasi", icon: Bell },
    ];
  }
  const items: NavItem[] = [
    { href: "/dashboard", label: "Dasbor", icon: LayoutDashboard },
    { href: "/projects", label: "Proyek", icon: ClipboardList },
  ];
  if (["WAREHOUSE", "SUPER_ADMIN", "ADMIN_PROYEK", "DIREKTUR"].includes(role)) {
    items.push({ href: "/warehouse", label: "Gudang", icon: Package });
    items.push({ href: "/procurement", label: "Pengadaan", icon: Truck });
  }
  items.push({ href: "/notifications", label: "Notifikasi", icon: Bell });
  if (role === "SUPER_ADMIN") items.push({ href: "/users", label: "Pengguna", icon: Users });
  return items;
}

function isActive(href: string, pathname: string) {
  if (href === "/dashboard" || href === "/portal") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Shell({
  user,
  children,
}: {
  user: { name: string; email: string; role: string; department: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navFor(user.role);
  const meta = ROLE_META[user.role];

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <a href="#isi" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-card focus:px-3 focus:py-2">
        Lewati ke isi
      </a>
      <aside className="sticky top-0 hidden h-screen flex-col bg-[var(--sidebar)] text-[var(--sidebar-ink)] lg:flex">
        <SidebarBody items={items} pathname={pathname} user={user} metaLabel={meta?.label ?? user.role} />
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur lg:px-8">
          <button type="button" className="rounded-[6px] p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu">
            <Menu className="size-5" />
          </button>
          <form action="/projects" className="hidden min-w-0 flex-1 md:block">
            <input
              name="q"
              placeholder="Cari kode, rumah sakit, atau nomor PO"
              className="h-9 w-full max-w-md rounded-[6px] border border-line bg-card px-3 text-sm outline-none"
            />
          </form>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <motion.main
          id="isi"
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="px-4 py-6 lg:px-8 lg:py-8"
        >
          {children}
        </motion.main>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-[#102433]/60" aria-label="Tutup menu" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-[260px] flex-col bg-[var(--sidebar)] text-[var(--sidebar-ink)]">
            <button type="button" className="absolute right-3 top-3 p-2" onClick={() => setOpen(false)} aria-label="Tutup">
              <X className="size-4" />
            </button>
            <SidebarBody items={items} pathname={pathname} user={user} metaLabel={meta?.label ?? user.role} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SidebarBody({
  items,
  pathname,
  user,
  metaLabel,
}: {
  items: NavItem[];
  pathname: string;
  user: { name: string; email: string; role: string };
  metaLabel: string;
}) {
  return (
    <>
      <div className="flex items-center gap-3 px-4 py-5">
        <Mark className="size-16" />
        <div>
          <div className="font-display text-[22px] leading-none tracking-tight text-white">Satya Wira</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#9eb0c2]">Mandiri</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Utama">
        {items.map((item) => {
          const active = isActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm text-[#c9d6e2]",
                active && "bg-[#1b3a52] text-white",
              )}
            >
              <span className={cn("h-4 w-0.5 rounded-full", active ? "bg-copper" : "bg-transparent")} />
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="px-2 py-2">
          <div className="truncate text-sm text-white">{user.name}</div>
          <div className="truncate text-[12px] text-[#9eb0c2]">{metaLabel}</div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-sm text-[#c9d6e2] hover:bg-white/5"
        >
          <LogOut className="size-4" />
          Keluar
        </button>
      </div>
    </>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <span className="size-9" />;
  const dark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      className="rounded-[6px] p-2 text-ink hover:bg-[#efe8dc] dark:hover:bg-[#22303c]"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Mode terang" : "Mode gelap"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
