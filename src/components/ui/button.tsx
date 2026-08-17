import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Pink Cake buttons. `font-medium` is the base weight. It was `font-bold`, set
 * to match headings that were themselves set at 800 — with the display ramp
 * pulled back to the logotype's thin geometric register, bold CTAs became the
 * heaviest thing on screen and read as shouting.
 *
 * The `brand*` / `roseOnDark` / `onDark` variants are the storefront's CTA
 * vocabulary, lifted out of ~14 hand-written class strings so the storefront
 * and the staff console use literally the same component.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",

        /** The anchor CTA — one per screen. Near-solid rose-ink, lifted on ink. */
        brand:
          "gradient-pink text-primary-foreground shadow-[0_10px_24px_-10px_hsl(var(--ink-black)/0.45)] hover:shadow-[0_16px_30px_-10px_hsl(var(--ink-black)/0.5)] hover:brightness-110 active:scale-[.98]",
        /** Flat rose-ink — the workhorse CTA for secondary sections. */
        brandFlat: "bg-primary text-primary-foreground hover:bg-rose",
        /** The logo's own pairing: ink on the brand rose. Hero and dark bands. */
        roseOnDark: "bg-brand-rose text-brand-ink hover:bg-white",
        /** Rose-ink outline pill on light surfaces. */
        outlineBrand:
          "border border-primary/25 bg-transparent text-primary hover:border-primary hover:bg-blush",
        /** Translucent outline for use over photography / dark bands. */
        onDark:
          "border border-white/45 bg-transparent text-white backdrop-blur-sm hover:-translate-y-0.5 hover:border-white hover:bg-white/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        /** Storefront CTA scale — taller and rounder than console buttons. */
        cta: "h-[46px] rounded-xl px-7 text-sm",
        pill: "h-11 rounded-full px-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
