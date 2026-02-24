import { tv } from "tailwind-variants";

import type { MetricKey } from "@/constants/metrics";

export const numericText = tv({
  base: "font-extrabold tabular-nums text-foreground",
  variants: {
    size: {
      xl: "text-4xl",
      lg: "text-2xl",
      md: "text-xl",
      sm: "text-lg",
      xs: "text-base",
    },
  },
  defaultVariants: { size: "md" },
});

export const panel = tv({
  slots: {
    base: "rounded-3xl border border-foreground/10 bg-foreground/5",
    body: "p-4",
  },
  variants: {
    density: {
      sm: { body: "p-3" },
      md: { body: "p-4" },
    },
  },
  defaultVariants: {
    density: "md",
  },
});

export const iconBadge = tv({
  base: "rounded-2xl items-center justify-center",
  variants: {
    size: {
      sm: "size-10",
      md: "size-11",
      lg: "size-12",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const stepperButton = tv({
  base: "size-11 rounded-2xl items-center justify-center",
  variants: {
    disabled: {
      true: "opacity-35",
      false: "opacity-100",
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

type MetricColors = {
  text: string;
  bg: string;
  bg10: string;
  bg15: string;
  bg40: string;
  border: string;
};

export const METRIC_TW: Record<MetricKey, MetricColors> = {
  water: {
    text: "text-water",
    bg: "bg-water",
    bg10: "bg-water/10",
    bg15: "bg-water/15",
    bg40: "bg-water/40",
    border: "border-water",
  },
  mood: {
    text: "text-mood",
    bg: "bg-mood",
    bg10: "bg-mood/10",
    bg15: "bg-mood/15",
    bg40: "bg-mood/40",
    border: "border-mood",
  },
  sleep: {
    text: "text-sleep",
    bg: "bg-sleep",
    bg10: "bg-sleep/10",
    bg15: "bg-sleep/15",
    bg40: "bg-sleep/40",
    border: "border-sleep",
  },
  exercise: {
    text: "text-exercise",
    bg: "bg-exercise",
    bg10: "bg-exercise/10",
    bg15: "bg-exercise/15",
    bg40: "bg-exercise/40",
    border: "border-exercise",
  },
};
