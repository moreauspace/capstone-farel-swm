"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { markAllNotificationsRead, markNotificationRead } from "@/server/actions";

export function NotificationList({
  items,
}: {
  items: { id: string; title: string; body: string; href: string | null; read: boolean; createdAt: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          className="text-sm text-copper"
          disabled={pending}
          onClick={() => {
            start(async () => {
              const result = await markAllNotificationsRead();
              if (result.ok && result.message) toast.success(result.message);
              router.refresh();
            });
          }}
        >
          Tandai semua terbaca
        </button>
      </div>
      <ul className="panel divide-y divide-line">
        {items.length === 0 ? <li className="px-4 py-8 text-sm text-muted">Belum ada serah terima untuk Anda.</li> : null}
        {items.map((item) => (
          <li key={item.id} className="px-4 py-3">
            <a
              href={item.href || "/notifications"}
              className="block"
              onClick={() => {
                void markNotificationRead(item.id);
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{item.title}</p>
                {!item.read ? <span className="mt-1 size-1.5 rounded-full bg-copper" /> : null}
              </div>
              <p className="mt-1 text-sm leading-6 text-muted">{item.body}</p>
              <p className="mt-1 text-[12px] text-muted">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
