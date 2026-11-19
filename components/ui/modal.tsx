"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#102433]/55" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[min(860px,calc(100vh-2rem))] w-[min(640px,calc(100%-1.5rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-modal border border-line bg-card p-5 shadow-panel",
            wide && "w-[min(880px,calc(100%-1.5rem))]",
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <Dialog.Title className="font-display text-2xl leading-none tracking-tight">{title}</Dialog.Title>
            <Dialog.Close className="rounded-[6px] p-1 text-muted hover:bg-[#efe8dc] hover:text-ink dark:hover:bg-[#22303c]" aria-label="Tutup">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
