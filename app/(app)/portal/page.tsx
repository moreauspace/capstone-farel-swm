import Link from "next/link";
import { redirect } from "next/navigation";
import { BpmnStepper } from "@/components/bpmn-stepper";
import { StatusBadge } from "@/components/status-badge";
import { currentActor } from "@/lib/session";
import { getPortal } from "@/server/queries";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Portal pelanggan" };

export default async function PortalPage() {
  const actor = await currentActor();
  if (actor.role !== "PELANGGAN") redirect("/dashboard");
  const projects = await getPortal(actor);
  const attention = projects.filter((project) => project.needsAction);
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-4xl tracking-tight">Portal pelanggan</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
          Lacak pesanan pintu timbal Anda. Pemeriksaan di lokasi dan tanda tangan BAST dilakukan dari halaman proyek saat tahapnya tiba.
        </p>
      </header>
      {attention.length ? (
        <section className="panel border-copper px-4 py-3">
          <p className="text-sm">
            {attention.length} proyek menunggu pemeriksaan Anda.{" "}
            <Link href={`/projects/${attention[0].id}`} className="text-copper">{attention[0].code}</Link>
          </p>
        </section>
      ) : null}
      <div className="space-y-4">
        {projects.length === 0 ? <p className="text-sm text-muted">Belum ada pesanan yang terhubung ke akun ini.</p> : null}
        {projects.map((project) => (
          <article key={project.id} className="panel p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="num text-[12px] text-muted">{project.code}</p>
                <h2 className="mt-1 text-xl">
                  <Link href={`/projects/${project.id}`}>{project.title}</Link>
                </h2>
                <p className="mt-1 text-sm text-muted">{project.location} · tenggat {formatDate(project.deadline)}</p>
                <p className="mt-2 text-sm">{project.caption}</p>
              </div>
              <StatusBadge status={project.status} />
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#e7e0d6] dark:bg-[#2a3541]">
              <div className="h-full bg-[#1c7a4d]" style={{ width: `${project.total ? (project.passed / project.total) * 100 : 0}%` }} />
            </div>
            <p className="num mb-3 text-[12px] text-muted">{project.passed} dari {project.total} unit lolos QC</p>
            <BpmnStepper lanes={project.lanes} />
          </article>
        ))}
      </div>
    </div>
  );
}
