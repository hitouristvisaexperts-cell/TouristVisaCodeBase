import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}

export const SectionHeading = ({ eyebrow, title, subtitle, align = "center", className }: Props) => (
  <div
    className={cn(
      "max-w-3xl",
      align === "center" ? "mx-auto text-center" : "text-left",
      className,
    )}
  >
    {eyebrow && (
      <div
        className={cn(
          "mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary",
          align === "center" && "justify-center",
        )}
      >
        <span className="h-px w-6 bg-primary/60" />
        {eyebrow}
        <span className="h-px w-6 bg-primary/60" />
      </div>
    )}
    <h2 className="text-4xl font-bold leading-[1.1] text-navy md:text-5xl">{title}</h2>
    {subtitle && (
      <p
        className={cn(
          "mt-4 text-base text-muted-foreground md:text-lg",
          align === "left" && "max-w-xl",
        )}
      >
        {subtitle}
      </p>
    )}
  </div>
);