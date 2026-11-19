import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-navy text-white hover:bg-[#0f283c] dark:bg-[#d7e6f4] dark:text-[#102433] dark:hover:bg-white",
        copper: "bg-copper text-white hover:bg-[#8d4c28] dark:text-[#2a160e]",
        danger: "bg-[#9d3b34] text-white hover:bg-[#7f2e29]",
        secondary: "border border-line bg-card text-ink hover:bg-[#f6f1e8] dark:hover:bg-[#22303c]",
        ghost: "text-ink hover:bg-[#efe8dc] dark:hover:bg-[#22303c]",
      },
      size: {
        sm: "h-8 rounded-[6px] px-2.5 text-[13px]",
        md: "h-10 rounded-[8px] px-3.5 text-sm",
        lg: "h-11 rounded-[8px] px-4 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
