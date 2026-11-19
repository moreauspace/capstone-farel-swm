import { num } from "@/lib/utils";

export function UnitProgress({
  total,
  produced,
  passed,
  inFlight,
}: {
  total: number;
  produced: number;
  passed: number;
  inFlight: number;
}) {
  const safe = Math.max(total, 1);
  const passedW = Math.min(100, (passed / safe) * 100);
  const qcW = Math.min(100 - passedW, (Math.max(produced - passed, 0) / safe) * 100);
  const flyW = Math.min(100 - passedW - qcW, (inFlight / safe) * 100);
  const percent = total ? Math.round((passed / total) * 100) : 0;

  return (
    <section className="panel p-4">
      <div className="grid gap-4 sm:grid-cols-[148px_1fr] sm:items-end">
        <div>
          <p className="text-[12px] uppercase tracking-[0.14em] text-muted">Unit lolos QC</p>
          <p className="num mt-1 font-display text-5xl leading-none tracking-tight">{percent}%</p>
        </div>
        <div>
          <div className="mb-2 grid grid-cols-3 gap-3 text-sm">
            <Metric label="Diproduksi" value={produced} />
            <Metric label="Lolos QC" value={passed} />
            <Metric label="Total pesanan" value={total} />
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-[#e7e0d6] dark:bg-[#2a3541]" aria-hidden>
            <span className="h-full bg-[#1c7a4d]" style={{ width: `${passedW}%` }} />
            <span className="h-full bg-[#c4a15a]" style={{ width: `${qcW}%` }} />
            <span className="h-full bg-[#1e527f]" style={{ width: `${flyW}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
            <span>Hijau · lolos</span>
            <span>Kuning · produksi selesai, belum lolos</span>
            <span>Biru · batch berjalan</span>
          </div>
          <p className="sr-only">
            {num(produced)} diproduksi, {num(passed)} lolos QC, dari {num(total)} unit.
          </p>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[12px] text-muted">{label}</p>
      <p className="num text-xl font-medium">{value}</p>
    </div>
  );
}
