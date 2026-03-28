import { createElement, type HTMLAttributes, type PropsWithChildren } from "react";

type ClassNameProp = {
  className?: string;
};

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function PageShell({
  children,
  className,
}: PropsWithChildren<ClassNameProp>) {
  return createElement(
    "div",
    {
      className: cn("min-h-screen bg-slate-950 text-slate-50", className),
    },
    createElement("div", { className: "mx-auto max-w-6xl px-6 py-10" }, children)
  );
}

export function SectionCard({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return createElement(
    "div",
    {
      ...props,
      className: cn(
        "rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/20",
        className
      ),
    },
    children
  );
}

export function StatusBadge({
  children,
  className,
}: PropsWithChildren<ClassNameProp>) {
  return createElement(
    "span",
    {
      className: cn(
        "inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200",
        className
      ),
    },
    children
  );
}
