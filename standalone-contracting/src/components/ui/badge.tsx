import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: [
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
          // Dark mode - Apple blue
          "dark:bg-[#0A84FF] dark:text-white dark:hover:bg-[#409CFF]",
        ].join(" "),
        secondary: [
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
          // Dark mode - elevated surface
          "dark:bg-[#2C2C2E] dark:text-[#EBEBF5] dark:border-[#38383A] dark:hover:bg-[#3A3A3C]",
        ].join(" "),
        destructive: [
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
          // Dark mode - Apple red with subtle background
          "dark:bg-[#FF453A]/20 dark:text-[#FF453A] dark:border-[#FF453A]/30",
        ].join(" "),
        outline: [
          "text-foreground",
          // Dark mode - subtle border
          "dark:text-[#EBEBF5] dark:border-[#38383A]",
        ].join(" "),
        success: [
          "border-transparent bg-green-100 text-green-700",
          // Dark mode - Apple green
          "dark:bg-[#30D158]/20 dark:text-[#30D158] dark:border-[#30D158]/30",
        ].join(" "),
        warning: [
          "border-transparent bg-amber-100 text-amber-700",
          // Dark mode - Apple yellow
          "dark:bg-[#FFD60A]/20 dark:text-[#FFD60A] dark:border-[#FFD60A]/30",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
