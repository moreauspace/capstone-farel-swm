"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { LaneView } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATE_LABEL: Record<LaneView["state"], string> = {
  current: "Sekarang",
  rework: "Perbaikan",
  done: "Selesai",
  idle: "Siaga",
  wait: "Menunggu",
};

export function BpmnStepper({ lanes }: { lanes: LaneView[] }) {
  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-[860px] gap-2">
        {lanes.map((lane, index) => (
          <motion.li
            key={lane.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            aria-current={lane.state === "current" || lane.state === "rework" ? "step" : undefined}
            className={cn(
              "relative min-w-0 flex-1 rounded-card border bg-card px-3 py-3",
              lane.state === "current" && "border-[#16324a] dark:border-[#d5e4f2]",
              lane.state === "rework" && "border-bad",
              lane.state === "done" && "border-line",
              lane.state === "wait" && "border-line opacity-60",
              lane.state === "idle" && "border-line",
            )}
          >
            <span
              className={cn(
                "absolute left-3 top-0 h-1 w-8 rounded-b-full",
                lane.state === "current" && "bg-copper",
                lane.state === "rework" && "bg-bad",
                lane.state === "done" && "bg-[#1c7a4d]",
                (lane.state === "wait" || lane.state === "idle") && "bg-line",
              )}
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="num text-[11px] tracking-[0.14em] text-muted">0{index + 1}</span>
              {lane.state === "done" ? <Check className="size-3.5 text-[#1c7a4d]" /> : null}
              {lane.state === "current" ? <span className="size-2 rounded-full bg-copper" /> : null}
            </div>
            <p className="mt-2 text-sm font-medium leading-tight">{lane.short}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-muted">{STATE_LABEL[lane.state]}</p>
            <p className="mt-2 text-[12px] leading-5 text-muted">{lane.detail}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
