import { redirect } from "next/navigation";
import { currentActor } from "@/lib/session";
import { getWarehouse } from "@/server/queries";
import { formatDateTime, idr, num } from "@/lib/utils";

export const metadata = { title: "Gudang" };

export default async function WarehousePage() {
  const actor = await currentActor();
  if (actor.role === "PELANGGAN") redirect("/portal");
  const data = await getWarehouse();
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-4xl tracking-tight">Gudang</h1>
        <p className="mt-1 text-sm text-muted">Stok hanya berubah lewat alokasi batch dan penerimaan PR.</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2">
        <article className="panel px-4 py-3">
          <p className="text-[12px] uppercase tracking-[0.12em] text-muted">Nilai persediaan</p>
          <p className="num mt-1 font-display text-4xl tracking-tight">{idr(data.value)}</p>
        </article>
        <article className="panel px-4 py-3">
          <p className="text-[12px] uppercase tracking-[0.12em] text-muted">Di bawah minimum</p>
          <p className={`num mt-1 font-display text-4xl tracking-tight ${data.below ? "text-copper" : ""}`}>{data.below}</p>
        </article>
      </section>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-[12px] text-muted">
            <tr>
              <th className="px-3 py-3 font-medium">Material</th>
              <th className="px-3 py-3 font-medium">Stok</th>
              <th className="px-3 py-3 font-medium">Minimum</th>
              <th className="px-3 py-3 font-medium">Harga</th>
              <th className="px-3 py-3 font-medium">Nilai</th>
            </tr>
          </thead>
          <tbody>
            {data.materials.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-3 py-3">
                  <div className="font-medium">{item.name}</div>
                  <div className="num text-[12px] text-muted">{item.sku} · {item.category}</div>
                </td>
                <td className={`num px-3 py-3 ${item.below ? "text-copper" : ""}`}>{num(item.stockQty, 1)} {item.unit}</td>
                <td className="num px-3 py-3">{num(item.minStock, 1)}</td>
                <td className="num px-3 py-3">{idr(item.unitPrice)}</td>
                <td className="num px-3 py-3">{idr(item.stockQty * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="panel p-4">
        <h2 className="text-sm font-medium">Mutasi terbaru</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {data.movements.length === 0 ? <li className="py-3 text-muted">Belum ada mutasi.</li> : null}
          {data.movements.map((item) => (
            <li key={item.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>{item.name} <span className="text-muted">{item.note}</span></span>
              <span className="num">{item.qty > 0 ? "+" : ""}{num(item.qty, 1)} {item.unit} · {formatDateTime(item.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
