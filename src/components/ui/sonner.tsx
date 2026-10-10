import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      // Ensure the toaster container never blocks clicks on the page.
      // Individual toasts can still receive pointer events.
      className="toaster group pointer-events-none"
      toastOptions={{
        classNames: {
          toast:
            // Avoid legacy `.toast` CSS from public styles and allow clicks on toast itself.
            "group sonner-toast pointer-events-auto group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.sonner-toast]:text-muted-foreground",
          actionButton:
            "group-[.sonner-toast]:bg-primary group-[.sonner-toast]:text-primary-foreground",
          cancelButton:
            "group-[.sonner-toast]:bg-muted group-[.sonner-toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
