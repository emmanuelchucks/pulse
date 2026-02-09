import { tv } from "tailwind-variants";

// ── Card surfaces ───────────────────────────────────────────
export const card = tv({
  base: "bg-sf-card overflow-hidden",
  variants: {
    size: {
      default: "rounded-[20px] p-5",
      sm: "rounded-2xl p-3",
      flush: "rounded-[20px]",
    },
  },
  defaultVariants: { size: "default" },
});

// ── Scroll container (outermost ScrollView) ─────────────────
export const scrollContainer = tv({
  slots: {
    root: "flex-1 bg-sf-bg-grouped",
    content: "px-5 pb-10 gap-3",
  },
});

// ── Section header ──────────────────────────────────────────
export const sectionHeader = tv({
  slots: {
    wrapper: "px-1 mt-1",
    title: "text-xl font-bold text-sf-text",
    subtitle: "text-[13px] mt-0.5 text-sf-text-2",
  },
});

// ── Text variants ───────────────────────────────────────────
export const text = tv({
  variants: {
    variant: {
      heading: "text-[17px] font-bold text-sf-text",
      title: "text-[15px] font-semibold text-sf-text",
      body: "text-[13px] text-sf-text-2",
      caption: "text-[11px] text-sf-text-3",
      tiny: "text-[10px] text-sf-text-3",
      value: "text-[13px] font-semibold text-sf-text tabular-nums",
      valueLg: "text-[21px] font-extrabold text-sf-text tabular-nums",
      valueXl: "text-[31.5px] font-extrabold text-sf-text tabular-nums",
    },
  },
  defaultVariants: { variant: "body" },
});

// ── Icon box (colored icon container) ───────────────────────
export const iconBox = tv({
  base: "items-center justify-center",
  variants: {
    size: {
      sm: "w-[38px] h-[38px] rounded-[11px]",
      md: "w-12 h-12 rounded-[14px]",
      lg: "w-[76px] h-[76px] rounded-full",
    },
  },
  defaultVariants: { size: "sm" },
});

// ── Control button (stepper +/- buttons) ────────────────────
export const controlButton = tv({
  base: "items-center justify-center",
  variants: {
    size: {
      sm: "w-[34px] h-[34px] rounded-[10px]",
      md: "w-10 h-10 rounded-xl",
      lg: "w-12 h-12 rounded-[14px]",
    },
    variant: {
      ghost: "",
      filled: "",
      danger: "bg-[rgba(255,59,48,0.12)]",
    },
  },
  defaultVariants: { size: "md", variant: "ghost" },
});

// ── Nav button (chevron arrows) ─────────────────────────────
export const navButton = tv({
  base: "w-9 h-9 rounded-[10px] items-center justify-center",
});

// ── Row layouts ─────────────────────────────────────────────
export const row = tv({
  base: "flex-row items-center",
  variants: {
    gap: {
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
    },
    justify: {
      between: "justify-between",
      around: "justify-around",
      center: "justify-center",
    },
  },
  defaultVariants: { gap: "md" },
});

// ── Stat cell (used in streak/stat rows) ────────────────────
export const statCell = tv({
  base: "items-center gap-1 py-0.5",
});
