"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { markNotificationRead } from "@/server/actions";
import { formatDateTime } from "@/lib/utils";

type Note = { id: string; title: string; body: string; href: string | null; read: boolean; createdAt: string };

export function NotificationBell() {
  const queryClient = useQueryClient();
  const seen = useRef<number | null>(null);
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error("Gagal memuat notifikasi");
      return (await response.json()) as { unread: number; items: Note[] };
    },
    refetchInterval: 12000,
  });

  useEffect(() => {
    if (!query.data) return;
    if (seen.current === null) {
      seen.current = query.data.unread;
      return;
    }
    if (query.data.unread > seen.current && query.data.items[0]) {
      toast(query.data.items[0].title, { description: query.data.items[0].body });
    }
    seen.current = query.data.unread;
  }, [query.data]);

  const unread = query.data?.unread ?? 0;

  return (
    <Menu>
      <MenuTrigger className="relative rounded-[6px] p-2 text-ink hover:bg-[#efe8dc] dark:hover:bg-[#22303c]" aria-label="Notifikasi">
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-copper px-1 text-[10px] leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </MenuTrigger>
      <MenuContent align="end" className="w-[340px]">
        <div className="flex items-center justify-between px-2 py-1.5">
          <p className="text-[13px] font-medium">Serah terima</p>
          <Link href="/notifications" className="text-[12px] text-copper">
            Lihat semua
          </Link>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {(query.data?.items ?? []).length === 0 ? (
            <p className="px-2 py-6 text-center text-[13px] text-muted">Belum ada perpindahan tugas.</p>
          ) : (
            query.data?.items.map((item) => (
              <MenuItem
                key={item.id}
                className="block"
                onSelect={() => {
                  void markNotificationRead(item.id).then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }));
                }}
              >
                <Link href={item.href || "/notifications"} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium">{item.title}</span>
                    {!item.read ? <span className="mt-1 size-1.5 shrink-0 rounded-full bg-copper" /> : null}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-muted">{item.body}</p>
                  <p className="mt-1 text-[11px] text-muted">{formatDateTime(item.createdAt)}</p>
                </Link>
              </MenuItem>
            ))
          )}
        </div>
      </MenuContent>
    </Menu>
  );
}
