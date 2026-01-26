import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: [
          "bg-background text-foreground",
          // Dark mode - Apple card surface
          "dark:bg-[#1C1C1E] dark:text-white dark:border-[#38383A]",
        ].join(" "),
        destructive: [
          "border-destructive/50 text-destructive [&>svg]:text-destructive",
          // Dark mode - Apple red
          "dark:bg-[#FF453A]/10 dark:border-[#FF453A]/30 dark:text-[#FF453A]",
          "dark:[&>svg]:text-[#FF453A]",
        ].join(" "),
        success: [
          "border-green-200 bg-green-50 text-green-700 [&>svg]:text-green-600",
          // Dark mode - Apple green
          "dark:bg-[#30D158]/10 dark:border-[#30D158]/30 dark:text-[#30D158]",
          "dark:[&>svg]:text-[#30D158]",
        ].join(" "),
        warning: [
          "border-amber-200 bg-amber-50 text-amber-700 [&>svg]:text-amber-600",
          // Dark mode - Apple yellow
          "dark:bg-[#FFD60A]/10 dark:border-[#FFD60A]/30 dark:text-[#FFD60A]",
          "dark:[&>svg]:text-[#FFD60A]",
        ].join(" "),
        info: [
          "border-blue-200 bg-blue-50 text-blue-700 [&>svg]:text-blue-600",
          // Dark mode - Apple blue
          "dark:bg-[#0A84FF]/10 dark:border-[#0A84FF]/30 dark:text-[#0A84FF]",
          "dark:[&>svg]:text-[#0A84FF]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
