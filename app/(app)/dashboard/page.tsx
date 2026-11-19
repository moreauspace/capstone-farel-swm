import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardCharts } from "@/components/dashboard-charts";
import { StatusBadge } from "@/components/status-badge";
import { currentActor } from "@/lib/session";
import { getDashboard } from "@/server/queries";

export const metadata = { title: "Dasbor" };

export default async function DashboardPage() {
  const actor = await currentActor();
  if (actor.role === "PELANGGAN") redirect("/portal");
  const data = await getDashboard(actor);
  const hottest = data.bottlenecks.reduce((best, lane) => (lane.count > best.count ? lane : best), data.bottlenecks[0]);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Dasbor operasional</h1>
          <p className="mt-1 text-sm text-muted">Antrian di bawah hanya memuat pekerjaan yang memang menunggu {actor.name.split(" ")[0]}.</p>
        </div>
        {["ADMIN_PROYEK", "SUPER_ADMIN"].includes(actor.role) ? (
          <Link href="/projects/new" className="inline-flex h-10 items-center rounded-[8px] bg-navy px-3.5 text-sm text-white dark:bg-[#d7e6f4] dark:text-[#102433]">
            Catat PO baru
          </Link>
        ) : null}
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.kpis.map((kpi) => (
          <article key={kpi.id} className="panel px-4 py-3">
            <p className="text-[12px] uppercase tracking-[0.12em] text-muted">{kpi.label}</p>
            <p className={`num mt-1 font-display text-4xl tracking-tight ${kpi.id === "pr" ? "text-copper" : ""}`}>{kpi.value}</p>
            <p className="mt-1 text-[13px] text-muted">{kpi.hint}</p>
          </article>
        ))}
      </section>
      <section className="panel p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Di meja siapa</h2>
          <p className="text-[13px] text-muted">Paling banyak: {hottest.label}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {data.bottlenecks.map((lane) => (
            <div key={lane.id} className="rounded-[8px] border border-line px-3 py-2">
              <p className={`num text-2xl ${lane.id === hottest.id && lane.count > 0 ? "text-copper" : ""}`}>{lane.count}</p>
              <p className="text-[12px] text-muted">{lane.label}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="panel p-4">
        <h2 className="text-sm font-medium">Antrian saya</h2>
        {data.queue.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Tidak ada tindakan di meja Anda. Proyek yang berjalan berada di divisi lain.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {data.queue.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/projects/${item.id}`} className="font-medium">{item.code} · {item.title}</Link>
                  <p className="text-[13px] text-muted">{item.customer} · {item.action}{item.extra ? ` · +${item.extra} tindakan` : ""}</p>
                </div>
                <StatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <DashboardCharts data={data} />
    </div>
  );
}
