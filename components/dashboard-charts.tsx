"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "next-themes";
import type { DashboardData } from "@/lib/types";

export function DashboardCharts({ data }: { data: Pick<DashboardData, "units" | "qc" | "lead" | "leadAvg"> }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const grid = dark ? "rgba(255,255,255,0.08)" : "rgba(16,32,51,0.08)";
  const tick = dark ? "#c5ced6" : "#5e6b78";
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <article className="panel p-4 xl:col-span-2">
        <h2 className="text-sm font-medium">Target dan realisasi unit</h2>
        <p className="mt-1 text-[13px] text-muted">Batang terang adalah pesanan. Batang tembaga adalah unit yang sudah lolos QC.</p>
        <div className="mt-3 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.units} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid stroke={grid} horizontal={false} />
              <XAxis type="number" tick={{ fill: tick, fontSize: 12 }} />
              <YAxis type="category" dataKey="code" width={72} tick={{ fill: tick, fontSize: 12 }} />
              <Tooltip cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(16,32,51,0.04)" }} />
              <Bar dataKey="target" name="Pesanan" fill={dark ? "#8ea4b8" : "#8aa0b3"} radius={[0, 4, 4, 0]} />
              <Bar dataKey="passed" name="Lolos QC" fill="#c47a4a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
      <div className="grid gap-4">
        <article className="panel p-4">
          <h2 className="text-sm font-medium">QC pass rate</h2>
          <ul className="mt-3 space-y-3">
            {data.qc.map((row) => {
              const total = row.pass + row.fail;
              const rate = total ? Math.round((row.pass / total) * 100) : 0;
              return (
                <li key={row.stage}>
                  <div className="flex justify-between text-sm">
                    <span>{row.stage}</span>
                    <span className="num">{total ? `${rate}%` : "—"}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e7e0d6] dark:bg-[#2a3541]">
                    <div className="h-full bg-[#1c7a4d]" style={{ width: `${rate}%` }} />
                  </div>
                  <p className="mt-1 text-[12px] text-muted">{row.pass} lolos · {row.fail} tidak sesuai</p>
                </li>
              );
            })}
          </ul>
        </article>
        <article className="panel p-4">
          <h2 className="text-sm font-medium">Lead time sampai BAST</h2>
          <p className="mt-1 text-[13px] text-muted">
            {data.leadAvg != null ? `Rata-rata ${data.leadAvg} hari dari PO diterima sampai proyek ditutup.` : "Belum ada proyek yang ditutup."}
          </p>
          <div className="mt-3 h-36">
            {data.lead.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.lead}>
                  <CartesianGrid stroke={grid} vertical={false} />
                  <XAxis dataKey="code" tick={{ fill: tick, fontSize: 11 }} />
                  <YAxis tick={{ fill: tick, fontSize: 12 }} width={28} />
                  <Tooltip />
                  <Bar dataKey="days" name="Hari" fill="#16324a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}
