"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PR_META } from "@/lib/labels";
import { formatDate, idr, num } from "@/lib/utils";
import { performWorkflowAction } from "@/server/actions";

type Row = {
  id: string;
  code: string;
  status: string;
  notes: string | null;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  customer: string;
  createdAt: string;
  orderedAt: string | null;
  arrivedAt: string | null;
  value: number;
  items: { name: string; sku: string; unit: string; qty: number; receivedQty: number }[];
};

export function ProcurementBoard({ rows, canAct }: { rows: Row[]; canAct: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState<Row | null>(null);
  const [pending, start] = useTransition();

  function act(row: Row, action: string) {
    start(async () => {
      const result = await performWorkflowAction({ projectId: row.projectId, action, payload: {} });
      if (!result.ok) toast.error(result.message);
      else {
        toast.success(result.message);
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="text-[12px] text-muted">
            <tr>
              <th className="px-3 py-3 font-medium">PR</th>
              <th className="px-3 py-3 font-medium">Proyek</th>
              <th className="px-3 py-3 font-medium">Nilai</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted">Belum ada permintaan pembelian.</td></tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="px-3 py-3">
                  <button type="button" className="num font-medium" onClick={() => setCurrent(row)}>{row.code}</button>
                  <div className="text-[12px] text-muted">{formatDate(row.createdAt)}</div>
                </td>
                <td className="px-3 py-3">
                  <Link href={`/projects/${row.projectId}`} className="font-medium">{row.projectCode}</Link>
                  <div className="text-[12px] text-muted">{row.customer}</div>
                </td>
                <td className="num px-3 py-3">{idr(row.value)}</td>
                <td className="px-3 py-3">{PR_META[row.status] ?? row.status}</td>
                <td className="px-3 py-3 text-right">
                  {canAct && (row.status === "DRAFT" || row.status === "DIPROSES") ? (
                    <Button type="button" size="sm" disabled={pending} onClick={() => act(row, "MARK_PR_ORDERED")}>Catat dipesan</Button>
                  ) : null}
                  {canAct && row.status === "DIPESAN" ? (
                    <Button type="button" size="sm" disabled={pending} onClick={() => act(row, "CONFIRM_ARRIVAL")}>Material tiba</Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={Boolean(current)} onOpenChange={(open) => !open && setCurrent(null)} title={current?.code ?? "PR"}>
        {current ? (
          <div className="space-y-3 text-sm">
            <p>{current.projectTitle}</p>
            {current.notes ? <p className="text-muted">{current.notes}</p> : null}
            <ul className="divide-y divide-line">
              {current.items.map((item) => (
                <li key={item.sku} className="flex justify-between py-2">
                  <span>{item.name}</span>
                  <span className="num">{num(item.qty, 1)} {item.unit}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
