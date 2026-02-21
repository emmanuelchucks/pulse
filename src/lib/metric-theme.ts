import { tv } from "tailwind-variants";

import type { MetricKey } from "@/constants/metrics";

export const numericText = tv({
  base: "font-extrabold text-foreground tabular-nums",
  variants: {
    size: {
      xl: "text-[32px]",
      lg: "text-[21px]",
      md: "text-[17px]",
      sm: "text-[15px]",
      xs: "text-[13px]",
    },
  },
  defaultVariants: { size: "md" },
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
