import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold",
    "transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "rounded-xl bg-primary text-primary-foreground shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(249,115,22,0.45)]",
        cta:
          "rounded-full bg-gradient-orange text-primary-foreground shadow-[0_6px_20px_rgba(249,115,22,0.42)] hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(249,115,22,0.55)] hover:brightness-110 relative overflow-hidden before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none",
        navy:
          "rounded-full bg-gradient-to-br from-[#0A1628] to-[#1a2f4a] text-white shadow-[0_6px_20px_rgba(10,22,40,0.28)] hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(10,22,40,0.38)]",
        outline:
          "rounded-xl border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-white hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(249,115,22,0.32)]",
        ghost:
          "rounded-lg hover:bg-accent hover:text-accent-foreground",
        blue:
          "rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_6px_20px_rgba(37,99,235,0.42)] hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(37,99,235,0.55)]",
        violet:
          "rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_6px_20px_rgba(124,58,237,0.42)] hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(124,58,237,0.55)]",
      },
      size: {
        default: "h-11 px-5 py-2.5 text-sm [&_svg]:size-4",
        pill:    "h-12 rounded-full px-8 text-sm [&_svg]:size-4",
        lg:      "h-14 rounded-full px-10 text-base [&_svg]:size-5",
        sm:      "h-9 rounded-xl px-4 text-xs [&_svg]:size-3.5",
        icon:    "h-11 w-11 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
