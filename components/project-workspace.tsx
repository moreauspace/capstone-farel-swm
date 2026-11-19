"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ActionPanel } from "@/components/action-panel";
import { BpmnStepper } from "@/components/bpmn-stepper";
import { DocumentCenter } from "@/components/document-center";
import { UnitProgress } from "@/components/unit-progress";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { BATCH_META, GATEWAY_META, PR_META, STATUS_META, UNIT_STATUS } from "@/lib/labels";
import { formatDate, formatDateTime, num } from "@/lib/utils";
import { updateDraftProject } from "@/server/actions";
import type { ProjectDTO } from "@/lib/types";

const TABS = [
  { id: "ringkas", label: "Ringkasan" },
  { id: "batch", label: "Batch" },
  { id: "dokumen", label: "Dokumen" },
  { id: "jejak", label: "Jejak" },
] as const;

export function ProjectWorkspace({ project, canEdit }: { project: ProjectDTO; canEdit: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("ringkas");
  const [open, setOpen] = useState(false);
  const tabs = TABS.filter((item) => project.audience === "internal" || item.id !== "jejak");

  return (
    <div className="pb-24 xl:pb-0">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href={project.audience === "client" ? "/portal" : "/projects"} className="hover:text-ink">
          {project.audience === "client" ? "Portal" : "Proyek"}
        </Link>
        <span>/</span>
        <span className="num text-ink">{project.code}</span>
      </div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="num text-[12px] uppercase tracking-[0.14em] text-muted">{project.code}</p>
            <StatusBadge status={project.status} />
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-4xl tracking-tight">{project.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{project.caption}</p>
        </div>
      </div>
      <dl className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Meta label="Pelanggan" value={project.customer.companyName} />
        <Meta label="Lokasi" value={project.location} />
        <Meta label="Produk" value={project.productName} />
        <Meta label="Tenggat" value={formatDate(project.deadline)} />
      </dl>
      <div className="space-y-4">
        <UnitProgress total={project.total} produced={project.produced} passed={project.passed} inFlight={project.inFlight} />
        <section className="panel p-4">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium">Peta 7 divisi</h2>
            <p className="text-[12px] text-muted">Bottleneck: {project.stage.owner}</p>
          </div>
          <BpmnStepper lanes={project.lanes} />
        </section>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="mb-3 flex gap-1 overflow-x-auto">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-full px-3 py-1.5 text-sm ${tab === item.id ? "bg-navy text-white dark:bg-[#d7e6f4] dark:text-[#102433]" : "text-muted"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <section className="panel p-4">
            {tab === "ringkas" ? <Summary project={project} canEdit={canEdit} /> : null}
            {tab === "batch" ? <Batches project={project} /> : null}
            {tab === "dokumen" ? <DocumentCenter documents={project.documents} /> : null}
            {tab === "jejak" ? <Trail project={project} /> : null}
          </section>
        </div>
        <div className="hidden xl:block">
          <div className="sticky top-20">
            <ActionPanel projectId={project.id} actions={project.actions} stage={project.stage} />
          </div>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card p-3 xl:hidden">
        <Button type="button" className="w-full" onClick={() => setOpen(true)}>
          {project.actions.length ? `Tindakan (${project.actions.length})` : "Posisi tahap"}
        </Button>
      </div>
      <Modal open={open} onOpenChange={setOpen} title="Tindakan">
        <ActionPanel projectId={project.id} actions={project.actions} stage={project.stage} />
      </Modal>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel px-3 py-3">
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className="mt-1 text-sm leading-5">{value}</dd>
    </div>
  );
}

function Summary({ project, canEdit }: { project: ProjectDTO; canEdit: boolean }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium">Kebutuhan</h3>
          <p className="mt-2 text-sm leading-6">{project.description}</p>
          <p className="mt-3 text-sm leading-6 text-muted">{project.specification}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium">Kontak pelanggan</h3>
          <p className="mt-2 text-sm">{project.customer.contactName}</p>
          <p className="text-sm text-muted">{project.customer.email}</p>
          <p className="text-sm text-muted">{project.customer.phone || "—"}</p>
          <p className="mt-2 text-sm text-muted">{project.customer.address || project.location}</p>
          {project.poNumber ? <p className="num mt-3 text-sm">PO {project.poNumber}</p> : null}
        </div>
      </div>
      {project.directorNotes ? (
        <blockquote className="border-l-2 border-copper pl-3 text-sm leading-6">
          <span className="text-[12px] uppercase tracking-[0.12em] text-muted">Arahan direktur</span>
          <p className="mt-1">{project.directorNotes}</p>
        </blockquote>
      ) : null}
      {project.readiness ? (
        <div>
          <h3 className="text-sm font-medium">Kesiapan material untuk sisa {project.readiness.remaining} unit</h3>
          <p className="mt-1 text-[13px] text-muted">
            Dapat dikerjakan sekarang: {project.readiness.canBuild} unit. Produksi berjalan per batch sesuai angka ini, bukan menunggu stok penuh.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[12px] text-muted">
                <tr>
                  <th className="py-2 font-medium">Material</th>
                  <th className="py-2 font-medium">Stok</th>
                  <th className="py-2 font-medium">Per unit</th>
                  <th className="py-2 font-medium">Muat unit</th>
                  <th className="py-2 font-medium">Kurang untuk sisa</th>
                </tr>
              </thead>
              <tbody>
                {project.readiness.lines.map((line) => (
                  <tr key={line.sku} className="border-t border-line">
                    <td className="py-2">{line.name}<span className="num ml-2 text-[12px] text-muted">{line.sku}</span></td>
                    <td className="num py-2">{num(line.stock, 1)} {line.unit}</td>
                    <td className="num py-2">{num(line.perUnit, 1)}</td>
                    <td className="num py-2">{line.possible}</td>
                    <td className="num py-2">{line.shortage > 0 ? `${num(line.shortage, 1)} ${line.unit}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {project.purchaseRequests.length ? (
        <div>
          <h3 className="text-sm font-medium">Permintaan pembelian</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {project.purchaseRequests.map((pr) => (
              <li key={pr.id} className="flex flex-wrap justify-between gap-2 border-t border-line py-2">
                <span className="num">{pr.code}</span>
                <span>{PR_META[pr.status] ?? pr.status}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {canEdit && project.status === "DRAFT" ? <DraftEditor project={project} /> : null}
    </div>
  );
}

function DraftEditor({ project }: { project: ProjectDTO }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-3 border-t border-line pt-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await updateDraftProject({
            projectId: project.id,
            title: String(form.get("title") ?? ""),
            location: String(form.get("location") ?? ""),
            specification: String(form.get("specification") ?? ""),
            description: String(form.get("description") ?? ""),
            units: Number(form.get("units") ?? project.total),
            deadline: String(form.get("deadline") ?? ""),
            poNumber: String(form.get("poNumber") ?? ""),
          });
          if (!result.ok) toast.error(result.message);
          else {
            toast.success(result.message);
            router.refresh();
          }
        });
      }}
    >
      <h3 className="text-sm font-medium md:col-span-2">Perbarui draft</h3>
      <div>
        <Label htmlFor="title">Judul</Label>
        <Input id="title" name="title" defaultValue={project.title} required />
      </div>
      <div>
        <Label htmlFor="po">Nomor PO</Label>
        <Input id="po" name="poNumber" defaultValue={project.poNumber ?? ""} required />
      </div>
      <div>
        <Label htmlFor="location">Lokasi</Label>
        <Input id="location" name="location" defaultValue={project.location} required />
      </div>
      <div>
        <Label htmlFor="units">Jumlah unit</Label>
        <Input id="units" name="units" type="number" min={1} defaultValue={project.total} required />
      </div>
      <div>
        <Label htmlFor="deadline">Tenggat</Label>
        <Input id="deadline" name="deadline" type="date" defaultValue={project.deadline?.slice(0, 10)} required />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="spec">Spesifikasi</Label>
        <Textarea id="spec" name="specification" defaultValue={project.specification} required />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="desc">Kebutuhan</Label>
        <Textarea id="desc" name="description" defaultValue={project.description} required />
      </div>
      <div>
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan draft"}</Button>
      </div>
    </form>
  );
}

function Batches({ project }: { project: ProjectDTO }) {
  if (!project.batches.length) {
    return <p className="text-sm text-muted">Belum ada batch. Gudang mengalokasikan unit sesuai stok yang cukup.</p>;
  }
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <caption className="sr-only">Riwayat batch produksi</caption>
          <thead className="text-[12px] text-muted">
            <tr>
              <th className="py-2 font-medium">Batch</th>
              <th className="py-2 font-medium">Unit</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Mulai</th>
              <th className="py-2 font-medium">QC</th>
            </tr>
          </thead>
          <tbody>
            {project.batches.map((batch) => (
              <tr key={batch.id} className="border-t border-line">
                <td className="num py-2">#{batch.batchNo}</td>
                <td className="num py-2">{batch.plannedQty}</td>
                <td className="py-2">{BATCH_META[batch.status] ?? batch.status}</td>
                <td className="py-2">{formatDateTime(batch.startedAt)}</td>
                <td className="py-2">{formatDateTime(batch.qcAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {project.units.length ? (
        <div>
          <h3 className="text-sm font-medium">Nomor seri</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {project.units.map((unit) => (
              <li key={unit.serialNo} className="flex justify-between rounded-[6px] border border-line px-2 py-1.5 text-sm">
                <span className="num">{unit.serialNo}</span>
                <span className="text-muted">{UNIT_STATUS[unit.status] ?? unit.status}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Trail({ project }: { project: ProjectDTO }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-medium">Keputusan gateway</h3>
        <ol className="mt-3 space-y-3">
          {project.decisions.length === 0 ? <li className="text-sm text-muted">Belum ada keputusan Ya/Tidak.</li> : null}
          {project.decisions.map((item) => (
            <li key={item.id} className="border-l-2 border-line pl-3">
              <p className="text-sm">{GATEWAY_META[item.gateway] ?? item.gateway}</p>
              <p className={`text-sm font-medium ${item.decision === "YA" ? "text-[#176b42]" : "text-bad"}`}>{item.decision === "YA" ? "Ya" : "Tidak"}</p>
              {item.notes ? <p className="text-[13px] leading-5 text-muted">{item.notes}</p> : null}
              <p className="mt-1 text-[12px] text-muted">
                {STATUS_META[item.fromStatus]?.label ?? item.fromStatus} → {STATUS_META[item.toStatus]?.label ?? item.toStatus}
                {" · "}{item.actorName} · {formatDateTime(item.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className="text-sm font-medium">Jejak aktivitas</h3>
        <ol className="mt-3 space-y-3">
          {project.audits.map((item) => (
            <li key={item.id}>
              <p className="text-sm font-medium">{item.action}</p>
              <p className="text-[13px] leading-5 text-muted">{item.detail}</p>
              <p className="text-[12px] text-muted">{item.actorName} · {formatDateTime(item.createdAt)}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
