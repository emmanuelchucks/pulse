import { tv } from "tailwind-variants";

// ── Card ────────────────────────────────────────────────────
export const card = tv({
  base: "bg-sf-card rounded-[20px] overflow-hidden",
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
  base: "text-[13px] font-semibold text-sf-text",
});

// ── Icon badge ──────────────────────────────────────────────
// Dynamic color background requires inline style
export const iconBadge = tv({
  base: "items-center justify-center",
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
  base: "items-center justify-center",
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

// ── Native style constants (borderCurve not in TW) ─────────
export const BORDER_CURVE = { borderCurve: "continuous" as const };
