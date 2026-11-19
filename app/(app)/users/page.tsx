import { redirect } from "next/navigation";
import { UserManager } from "@/components/user-manager";
import { currentActor } from "@/lib/session";
import { getCustomers, getUsers } from "@/server/queries";

export const metadata = { title: "Pengguna" };

export default async function UsersPage() {
  const actor = await currentActor();
  if (actor.role !== "SUPER_ADMIN") redirect("/dashboard");
  const [users, customers] = await Promise.all([getUsers(), getCustomers()]);
  return (
    <div>
      <h1 className="font-display text-4xl tracking-tight">Pengguna</h1>
      <p className="mb-5 mt-1 text-sm text-muted">Satu akun untuk tiap meja: admin, direktur, gudang, produksi, QC, instalasi, dan pelanggan.</p>
      <UserManager users={users} customers={customers} selfId={actor.id} />
    </div>
  );
}
