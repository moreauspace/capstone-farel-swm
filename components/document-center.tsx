"use client";

import { useState } from "react";
import { Mark } from "@/components/brand";
import { DOC_META } from "@/lib/labels";
import { formatDateTime } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import type { DocumentDTO } from "@/lib/types";

export function DocumentCenter({ documents }: { documents: DocumentDTO[] }) {
  const [current, setCurrent] = useState<DocumentDTO | null>(null);
  if (!documents.length) {
    return <p className="text-sm text-muted">Belum ada dokumen pada tahap ini.</p>;
  }
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {documents.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => setCurrent(doc)}
            className="rounded-card border border-dashed border-[#e0c7ae] bg-card px-3 py-3 text-left hover:border-copper"
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-copper">{DOC_META[doc.type] ?? doc.type}</p>
            <p className="mt-1 font-medium">{doc.title}</p>
            <p className="num mt-1 text-[12px] text-muted">{doc.number}</p>
            <p className="mt-2 text-[12px] text-muted">{formatDateTime(doc.createdAt)}{doc.author ? ` · ${doc.author}` : ""}</p>
          </button>
        ))}
      </div>
      <Modal open={Boolean(current)} onOpenChange={(open) => !open && setCurrent(null)} title={current?.title ?? "Dokumen"} wide>
        {current ? <Paper doc={current} /> : null}
      </Modal>
    </>
  );
}

function Paper({ doc }: { doc: DocumentDTO }) {
  const payload = read(doc.payload);
  const signature = typeof payload.signature === "string" ? payload.signature : "";
  const attachment = typeof payload.attachment === "string" ? payload.attachment : "";
  const entries = Object.entries(payload).filter(([key, value]) => !["signature", "attachment"].includes(key) && value != null && value !== "");
  return (
    <article className="ticket rounded-[10px] p-6">
      <div className="flex items-center gap-3">
        <Mark className="size-12" />
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#a35b32]">PT Satya Wira Mandiri</p>
      </div>
      <h3 className="mt-2 font-display text-3xl tracking-tight">{doc.title}</h3>
      <p className="num mt-1 text-sm text-[#6d6256]">{doc.number} · {formatDateTime(doc.createdAt)}</p>
      <div className="my-4 border-t border-dashed border-[#e0c7ae]" />
      <dl className="space-y-3 text-sm">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-[12px] uppercase tracking-[0.08em] text-[#8a7b6b]">{labelOf(key)}</dt>
            <dd className="mt-1 whitespace-pre-wrap leading-6">{renderValue(value)}</dd>
          </div>
        ))}
      </dl>
      {signature.startsWith("data:image/") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={signature} alt="Tanda tangan" className="mt-4 h-28 object-contain" />
      ) : null}
      {attachment.startsWith("data:image/") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={attachment} alt="Lampiran" className="mt-4 max-h-64 object-contain" />
      ) : null}
      {attachment.startsWith("data:application/pdf") ? (
        <a className="mt-4 inline-block text-sm text-[#8a4b2a]" href={attachment} download={`${doc.number}.pdf`}>
          Unduh pindaian PDF
        </a>
      ) : null}
    </article>
  );
}

function read(raw: string) {
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function labelOf(key: string) {
  const map: Record<string, string> = {
    poNumber: "Nomor PO",
    customer: "Pelanggan",
    contact: "Kontak",
    product: "Produk",
    units: "Jumlah unit",
    location: "Lokasi",
    notes: "Catatan",
    specification: "Spesifikasi",
    deadline: "Tenggat",
    description: "Kebutuhan",
    bom: "Kebutuhan material / unit",
    summary: "Ringkasan",
    submittedBy: "Diajukan oleh",
    decision: "Keputusan",
    director: "Direktur",
    prCode: "Nomor PR",
    items: "Item",
    batchNo: "Batch",
    qty: "Jumlah",
    result: "Hasil",
    inspector: "Pemeriksa",
    destination: "Tujuan",
    serials: "Nomor seri",
    issuedBy: "Diterbitkan oleh",
    message: "Pesan",
    requestedBy: "Diminta oleh",
    by: "Oleh",
    company: "Instansi",
    signerName: "Penandatangan",
    signedAt: "Waktu tanda tangan",
    statement: "Pernyataan",
    project: "Proyek",
  };
  return map[key] ?? key;
}

function renderValue(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) return value.join("\n");
    return value
      .map((item) => {
        if (!item || typeof item !== "object") return String(item);
        return Object.entries(item as Record<string, unknown>)
          .map(([key, inner]) => `${labelOf(key)}: ${inner}`)
          .join(" · ");
      })
      .join("\n");
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value);
  return String(value);
}
