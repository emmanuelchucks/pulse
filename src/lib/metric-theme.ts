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

export const METRIC_TW: Record<MetricKey, { text: string; bg: string }> = {
  water:    { text: "text-water",    bg: "bg-water"    },
  mood:     { text: "text-mood",     bg: "bg-mood"     },
  sleep:    { text: "text-sleep",    bg: "bg-sleep"    },
  exercise: { text: "text-exercise", bg: "bg-exercise" },
};
