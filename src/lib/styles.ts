import { tv } from "tailwind-variants";

import type { MetricKey } from "@/constants/metrics";

// ── Card ────────────────────────────────────────────────────
export const card = tv({
  base: "bg-sf-card rounded-[20px] overflow-hidden corner-squircle",
  variants: {
    size: {
      md: "rounded-[20px] p-5",
      sm: "rounded-2xl",
    },
    padded: {
      true: "p-4",
      false: "",
    },
  },
  defaultVariants: {
    size: "md",
    padded: false,
  },
});

// ── Section header ──────────────────────────────────────────
export const sectionHeader = tv({
  base: "px-1 mt-1",
});

export const sectionTitle = tv({
  base: "text-xl font-bold text-sf-text",
});

export const sectionSubtitle = tv({
  base: "text-[13px] mt-0.5 text-sf-text-2",
});

// ── Subtitle / caption ─────────────────────────────────────
export const caption = tv({
  base: "text-[13px] text-sf-text-2",
});

// ── Scroll container ────────────────────────────────────────
export const scrollContent = tv({
  base: "px-5 pb-10 gap-3",
});

// ── Text styles ─────────────────────────────────────────────
export const heading = tv({
  base: "text-[17px] font-bold text-sf-text",
});

export const label = tv({
  base: "text-[13px] font-medium text-sf-text-2",
});

export const statLabel = tv({
  base: "text-[11px] text-sf-text-3",
});

export const statValue = tv({
  base: "text-[13px] font-semibold text-sf-text tabular-nums",
});

// ── Numeric display (large counters, percentages) ───────────
export const numericDisplay = tv({
  base: "font-extrabold text-sf-text tabular-nums",
  variants: {
    size: {
      xl: "text-[31.5px]",
      lg: "text-[21px]",
      md: "text-[17px]",
      sm: "text-[15px]",
      xs: "text-[13px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

// ── Icon badge ──────────────────────────────────────────────
export const iconBadge = tv({
  base: "items-center justify-center corner-squircle",
  variants: {
    size: {
      md: "w-12 h-12 rounded-[14px]",
      sm: "w-[38px] h-[38px] rounded-[11px]",
    },
  },
  defaultVariants: {
    size: "sm",
  },
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
  defaultVariants: {
    gap: "md",
  },
});

// ── Stepper button ──────────────────────────────────────────
export const stepperButton = tv({
  base: "items-center justify-center corner-squircle",
  variants: {
    size: {
      md: "w-12 h-12 rounded-[14px]",
      sm: "w-[34px] h-[34px] rounded-[10px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

type MetricColorClasses = {
  text: string;
  bg: string;
  border: string;
  bg10: string;
  bg15: string;
  bg25: string;
  bg40: string;
};

// ── Metric color map (className tokens keyed by metric) ─────
// Maps metric keys to their Tailwind @theme color classes
export const METRIC_CLASSES: Record<MetricKey, MetricColorClasses> = {
  water: {
    text: "text-water",
    bg: "bg-water",
    border: "border-water",
    bg10: "bg-water/10",
    bg15: "bg-water/15",
    bg25: "bg-water/25",
    bg40: "bg-water/40",
  },
  mood: {
    text: "text-mood",
    bg: "bg-mood",
    border: "border-mood",
    bg10: "bg-mood/10",
    bg15: "bg-mood/15",
    bg25: "bg-mood/25",
    bg40: "bg-mood/40",
  },
  sleep: {
    text: "text-sleep",
    bg: "bg-sleep",
    border: "border-sleep",
    bg10: "bg-sleep/10",
    bg15: "bg-sleep/15",
    bg25: "bg-sleep/25",
    bg40: "bg-sleep/40",
  },
  exercise: {
    text: "text-exercise",
    bg: "bg-exercise",
    border: "border-exercise",
    bg10: "bg-exercise/10",
    bg15: "bg-exercise/15",
    bg25: "bg-exercise/25",
    bg40: "bg-exercise/40",
  },
};
