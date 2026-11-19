import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { currentActor } from "@/lib/session";
import { listProjects } from "@/server/queries";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Proyek" };

const FILTERS = [
  { id: "", label: "Semua" },
  { id: "awal", label: "PO & direktur" },
  { id: "material", label: "Material" },
  { id: "produksi", label: "Produksi" },
  { id: "lapangan", label: "Kirim & pasang" },
  { id: "selesai", label: "Selesai" },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const actor = await currentActor();
  const rows = await listProjects(actor, searchParams.q, searchParams.status);
  const canCreate = ["ADMIN_PROYEK", "SUPER_ADMIN"].includes(actor.role);
  return (
    <div>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-tight">{actor.role === "PELANGGAN" ? "Proyek saya" : "Proyek"}</h1>
          <p className="mt-1 text-sm text-muted">{rows.length} berkas pada saringan ini.</p>
        </div>
        {canCreate ? (
          <Link href="/projects/new" className="inline-flex h-10 items-center rounded-[8px] bg-navy px-3.5 text-sm text-white dark:bg-[#d7e6f4] dark:text-[#102433]">
            Catat PO
          </Link>
        ) : null}
      </header>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((filter) => {
          const params = new URLSearchParams();
          if (filter.id) params.set("status", filter.id);
          if (searchParams.q) params.set("q", searchParams.q);
          const href = params.size ? `/projects?${params}` : "/projects";
          const active = (searchParams.status ?? "") === filter.id;
          return (
            <Link key={filter.id || "all"} href={href} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${active ? "bg-navy text-white dark:bg-[#d7e6f4] dark:text-[#102433]" : "text-muted"}`}>
              {filter.label}
            </Link>
          );
        })}
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-[12px] text-muted">
            <tr>
              <th className="px-3 py-3 font-medium">Proyek</th>
              <th className="px-3 py-3 font-medium">Pelanggan</th>
              <th className="px-3 py-3 font-medium">Unit lolos</th>
              <th className="px-3 py-3 font-medium">Tenggat</th>
              <th className="px-3 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-10 text-center text-muted">Tidak ada proyek pada saringan ini.</td></tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="px-3 py-3">
                  <Link href={`/projects/${row.id}`} className="font-medium">{row.title}</Link>
                  <div className="num text-[12px] text-muted">{row.code}</div>
                </td>
                <td className="px-3 py-3">
                  <div>{row.customer}</div>
                  <div className="text-[12px] text-muted">{row.location}</div>
                </td>
                <td className="num px-3 py-3">{row.passed}/{row.total}</td>
                <td className="px-3 py-3">{formatDate(row.deadline)}</td>
                <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
