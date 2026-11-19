"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const Menu = Dropdown.Root;
export const MenuTrigger = Dropdown.Trigger;

export function MenuContent({ className, ...props }: Dropdown.DropdownMenuContentProps) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content
        sideOffset={8}
        className={cn(
          "z-50 min-w-56 rounded-card border border-line bg-card p-1.5 text-sm shadow-panel",
          className,
        )}
        {...props}
      />
    </Dropdown.Portal>
  );
}

export function MenuItem({ className, ...props }: Dropdown.DropdownMenuItemProps) {
  return (
    <Dropdown.Item
      className={cn(
        "cursor-pointer rounded-[6px] px-2.5 py-2 outline-none data-[highlighted]:bg-[#f3ece3] dark:data-[highlighted]:bg-[#243140]",
        className,
      )}
      {...props}
    />
  );
}
