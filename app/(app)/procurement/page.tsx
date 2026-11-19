import { redirect } from "next/navigation";
import { ProcurementBoard } from "@/components/procurement-board";
import { currentActor } from "@/lib/session";
import { getProcurement } from "@/server/queries";

export const metadata = { title: "Pengadaan" };

export default async function ProcurementPage() {
  const actor = await currentActor();
  if (actor.role === "PELANGGAN") redirect("/portal");
  const rows = await getProcurement();
  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-4xl tracking-tight">Pengadaan</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
          PR terbit saat pemeriksaan material tidak menutup satu unit pun. Setelah barang tiba, stok naik dan gudang memeriksa ulang sisa pesanan.
        </p>
      </header>
      <ProcurementBoard rows={rows} canAct={["WAREHOUSE", "SUPER_ADMIN"].includes(actor.role)} />
    </div>
  );
}
