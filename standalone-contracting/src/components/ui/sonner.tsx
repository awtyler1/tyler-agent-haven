import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-[#2C2C2E] dark:group-[.toaster]:text-white dark:group-[.toaster]:border-[#48484A] dark:group-[.toaster]:shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
          description: "group-[.toast]:text-muted-foreground dark:group-[.toast]:text-[#8E8E93]",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground dark:group-[.toast]:bg-[#0A84FF] dark:group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground dark:group-[.toast]:bg-[#3A3A3C] dark:group-[.toast]:text-[#EBEBF5]",
          success: "dark:group-[.toaster]:border-[#30D158]/30 dark:group-[.toaster]:text-[#30D158]",
          error: "dark:group-[.toaster]:border-[#FF453A]/30 dark:group-[.toaster]:text-[#FF453A]",
          warning: "dark:group-[.toaster]:border-[#FFD60A]/30 dark:group-[.toaster]:text-[#FFD60A]",
          info: "dark:group-[.toaster]:border-[#0A84FF]/30 dark:group-[.toaster]:text-[#0A84FF]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
