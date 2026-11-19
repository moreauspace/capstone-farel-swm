import Image from "next/image";
import { cn } from "@/lib/utils";

export function Mark({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/swm-logo.png"
      alt=""
      width={160}
      height={160}
      priority={priority}
      className={cn("size-12 object-contain", className)}
    />
  );
}
