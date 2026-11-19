import { STATUS_META, statusToneClass } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status] ?? { label: status, tone: "neutral" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium", statusToneClass(meta.tone), className)}>
      {meta.label}
    </span>
  );
}
