import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark" | "lime";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-[0_2px_0_rgba(9,73,54,0.6)]",
  secondary: "bg-surface text-ink border border-line hover:border-brand-300 hover:bg-brand-50/60",
  ghost: "bg-transparent text-ink-soft hover:bg-ink/5",
  dark: "bg-ink text-paper hover:bg-ink-soft",
  lime: "bg-signal-lime text-ink hover:brightness-95",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-11 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-xl",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside";
}) {
  return (
    <Tag className={cn("rounded-2xl border border-line bg-surface shadow-card", className)}>{children}</Tag>
  );
}

type BadgeTone = "brand" | "lime" | "limeDark" | "amber" | "danger" | "neutral" | "ink";

const BADGE_TONES: Record<BadgeTone, string> = {
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  lime: "bg-signal-lime/25 text-[#41530a] border-[#cbe46a]",
  limeDark: "bg-signal-lime/15 text-signal-lime border-signal-lime/40",
  amber: "bg-[#fbf1e0] text-signal-amber border-[#eed9b4]",
  danger: "bg-[#fbeae7] text-signal-danger border-[#f0cdc7]",
  neutral: "bg-paper text-ink-muted border-line",
  ink: "bg-ink text-paper border-ink",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  title,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-[3px] text-[11.5px] font-medium leading-none",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full resize-y rounded-xl border border-line bg-paper/50 p-3.5 text-[13.5px] leading-relaxed text-ink placeholder:text-ink-muted/60",
          "transition-colors focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/8",
          className,
        )}
        {...props}
      />
    );
  },
);

export function Progress({
  value,
  tone = "brand",
  className,
}: {
  value: number;
  tone?: "brand" | "amber" | "danger" | "lime";
  className?: string;
}) {
  const color =
    tone === "brand"
      ? "bg-brand-500"
      : tone === "amber"
        ? "bg-signal-amber"
        : tone === "danger"
          ? "bg-signal-danger"
          : "bg-signal-lime";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-line/70", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", color)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function FieldLabel({
  step,
  title,
  hint,
}: {
  step: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] font-medium text-brand-500">{step}</span>
        <label className="text-[13.5px] font-semibold text-ink">{title}</label>
      </div>
      <span className="hidden text-[11.5px] text-ink-muted sm:block">{hint}</span>
    </div>
  );
}
