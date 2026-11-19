import { NotificationList } from "@/components/notification-list";
import { currentActor } from "@/lib/session";
import { getNotifications } from "@/server/queries";

export const metadata = { title: "Notifikasi" };

export default async function NotificationsPage() {
  const actor = await currentActor();
  const items = await getNotifications(actor.id);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl tracking-tight">Notifikasi</h1>
      <p className="mb-5 mt-1 text-sm text-muted">Muncul setiap dokumen atau tugas berpindah ke meja Anda.</p>
      <NotificationList items={items} />
    </div>
  );
}
