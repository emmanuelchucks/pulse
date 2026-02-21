# Pulse → HeroUI Native Migration Plan

Migrate the entire Pulse app from NativeWind + raw RN primitives to HeroUI Native's
compound-component design system. This is not a CSS-class reskin — every screen is
rebuilt to be idiomatic to HeroUI Native's Card, Surface, Button, Chip, Dialog,
and theming primitives. The domain/data layer is preserved exactly as-is.

---

## 0. Pre-flight

### 0.1 Commit & branch

```bash
BASE=$(git branch --show-current)       # main
git worktree add ../pulse-heroui -b feat/heroui-native-migration $BASE
```

All work happens in `../pulse-heroui`. The original worktree stays untouched.

### 0.2 Verify physical iPhone

```bash
xcrun devicectl list devices             # confirm device UDID
eas device:list                          # confirm registered with EAS
```

---

## 1. Foundation — dependency swap & provider wiring

### 1.1 Remove NativeWind, install Uniwind + HeroUI Native

**Remove:**

- `nativewind`
- `react-native-css`
- `@tailwindcss/postcss`
- `postcss.config.mjs`
- `nativewind-env.d.ts`

**Install:**

```bash
pnpm add heroui-native uniwind
pnpm add react-native-svg @gorhom/bottom-sheet
```

Peer deps already present: `react-native-reanimated`, `react-native-gesture-handler`,
`react-native-safe-area-context`.

### 1.2 Metro config

Replace `metro.config.cjs` with Uniwind + Reanimated wrappers:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const {
  wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");

let config = getDefaultConfig(__dirname);

if (!config.resolver.sourceExts.includes("sql")) {
  config.resolver.sourceExts.push("sql");
}

config = wrapWithReanimatedMetroConfig(config);

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind.d.ts",
});
```

### 1.3 Rewrite `src/global.css`

```css
@import "tailwindcss";
@import "uniwind";
@import "heroui-native/styles";

@source "./";
@source "./node_modules/heroui-native/lib";

/* ── Custom semantic colors for metrics ──────────────── */
@layer theme {
  @variant light {
    --color-water: oklch(0.72 0.15 220);
    --color-mood: oklch(0.72 0.18 340);
    --color-sleep: oklch(0.68 0.16 280);
    --color-exercise: oklch(0.72 0.16 160);
  }

  @variant dark {
    --color-water: oklch(0.78 0.13 220);
    --color-mood: oklch(0.78 0.16 340);
    --color-sleep: oklch(0.74 0.14 280);
    --color-exercise: oklch(0.78 0.14 160);
  }
}

@theme inline {
  --color-water: var(--color-water);
  --color-mood: var(--color-mood);
  --color-sleep: var(--color-sleep);
  --color-exercise: var(--color-exercise);
}
```

All previous `--sf-*` custom properties, `@utility` blocks, and `platformColor()`
references are removed. HeroUI Native's own theme variables (`--background`,
`--foreground`, `--surface`, `--accent`, `--danger`, `--muted`, etc.) replace them.

### 1.4 Root layout — provider + gesture handler

```tsx
// src/app/_layout.tsx
import { HeroUINativeProvider } from "heroui-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// ... boot logic stays identical
```

Wrap the entire app:

```tsx
<GestureHandlerRootView style={{ flex: 1 }}>
  <HeroUINativeProvider config={config}>
    <StatusBar style="auto" />
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  </HeroUINativeProvider>
</GestureHandlerRootView>
```

Config object (outside component):

```tsx
const config: HeroUINativeConfig = {
  textProps: { maxFontSizeMultiplier: 1.5 },
  devInfo: { stylingPrinciples: false },
  toast: false,
};
```

### 1.5 Boot/error screens with HeroUI primitives

Replace raw `View`/`Text`/`Pressable` boot screens with `Surface` + `Button`:

```tsx
<Surface className="flex-1 items-center justify-center px-6">
  <Card.Title className="text-lg">Preparing Pulse…</Card.Title>
</Surface>
```

Error screen uses `Button variant="danger"` for retry.

### 1.6 Delete obsolete files

- `postcss.config.mjs`
- `nativewind-env.d.ts`
- `babel.config.js` (if only nativewind preset was there)
- `src/lib/styles.ts` (entire file — replaced by HeroUI components + local variants)

### 1.7 Verification checkpoint

```bash
pnpm install
npx expo start --clear       # metro bundles without errors
```

Screenshot the boot screen on simulator via `agent-device` to confirm HeroUI
provider renders.

---

## 2. Design system layer — replacing `src/lib/styles.ts`

The current codebase centralizes all styling in `src/lib/styles.ts` via
`tailwind-variants` (`tv()`) calls: `card()`, `heading()`, `caption()`,
`iconBadge()`, `stepperButton()`, `row()`, `numericDisplay()`, `statLabel()`,
`METRIC_CLASSES`, etc.

**These are all deleted.** HeroUI Native provides the primitives natively:

| Old `styles.ts` token   | HeroUI Native replacement                                |
|--------------------------|-----------------------------------------------------------|
| `card()`                 | `<Card>` with `<Card.Body>` / `<Card.Header>`            |
| `heading()`              | `<Card.Title>` or `<Label>` with font class               |
| `caption()`              | `<Card.Description>` or `<Description>`                   |
| `sectionHeader/Title`    | `<Label>` with custom className                           |
| `statLabel()`            | `<Description>` or `<Card.Description>`                   |
| `numericDisplay()`       | Custom `tv()` — one small variant (kept as `numericText`) |
| `iconBadge()`            | `<Avatar>` with `<Avatar.Fallback>` or inline `<View>`   |
| `stepperButton()`        | `<Button size="sm">` with variant                         |
| `row()`                  | Plain `<View className="flex-row ...">`                   |
| `METRIC_CLASSES`         | Computed from `METRIC_CONFIG[key].color` at render time    |
| `scrollContent()`        | Inline `className="px-5 pb-10 gap-3"`                    |

### 2.1 New file: `src/lib/metric-theme.ts`

Small utility to derive metric-specific classes from the theme:

```ts
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
```

This is the only styling file in the entire app. Everything else uses HeroUI
components directly.

---

## 3. Component mapping — icon system

### 3.1 Keep `AppIcon` wrapper

The existing `AppIcon` component wrapping `SymbolView` (expo-symbols) with
Material Icons fallback is kept as-is. HeroUI Native does not dictate an icon
system — it's orthogonal.

No changes to `src/components/ui/app-icon.tsx`.

---

## 4. Screen-by-screen rebuild

Each screen is rebuilt to use HeroUI Native compound components idiomatically.
No 1:1 class mapping — the UI is re-expressed through HeroUI's component model.

### 4.1 Tab layout (`src/app/(tabs)/_layout.tsx`)

**No change.** `NativeTabs` from `expo-router/unstable-native-tabs` is navigation
infrastructure, not UI components. Kept exactly as-is.

### 4.2 Tab sub-layouts (`(today|track|history|settings)/_layout.tsx`)

**No change.** These use `expo-router/stack` for native header with
`headerLargeTitle`. Kept exactly as-is.

### 4.3 Today (Dashboard) screen

**File:** `src/app/(tabs)/(today)/index.tsx`

Current structure → HeroUI Native structure:

```
ScrollView
├── date caption → <Description>
├── Summary card (ring + greeting + stats)
│   └── <Card>
│       └── <Card.Body>
│           ├── circular progress ring (custom View — kept, no HeroUI equivalent)
│           ├── <Card.Title> for greeting
│           ├── <Card.Description> for "X/Y goals met"
│           └── stat chips: <Chip variant="default"> for weekly % + streak
├── Streak bar card
│   └── <Card>
│       └── <Card.Body>
│           └── flex-row of <View> per metric with <AppIcon> + streak count
├── Section header → <Label className="text-xl font-bold">
├── Metric cards (per METRIC_KEY)
│   └── <Card>
│       └── <Card.Body className="flex-row">
│           ├── icon: <Avatar size="md" color="default"><Avatar.Fallback className="bg-water/10">…
│           ├── metric label: <Card.Title>
│           ├── value + unit: numericText() + <Description>
│           └── quick-add: <Button size="sm" variant="ghost" onPress={…}>
│               └── <Button.Label>+</Button.Label>
│           └── progress bar: <View> pair (track + fill) — no HeroUI progress component
```

Key decisions:
- The circular progress ring stays as a custom `View` with border — HeroUI Native
  has no circular progress component.
- Progress bars stay as custom `View` pairs — HeroUI Native has no linear progress
  component.
- `Chip` is used for stat badges (weekly %, best streak) to replace raw styled Views.
- All text uses `Card.Title`, `Card.Description`, `Description`, or `Label` instead
  of raw `Text` with custom classes.

### 4.4 Track screen

**File:** `src/app/(tabs)/(track)/index.tsx`

```
ScrollView
├── Header right reset button → <Button size="sm" variant="danger">
│   └── <Button.Label> with <AppIcon> + "Reset"
├── Description "Log your daily wellness"
├── Per-metric cards:
│   ├── NumericCard → <Card>
│   │   └── <Card.Body>
│   │       ├── header row: <Avatar.Fallback> icon + <Card.Title> + <Description> "Goal: X"
│   │       ├── <Chip> for percentage
│   │       ├── progress bar (custom View pair)
│   │       └── stepper row:
│   │           ├── <Button size="sm" variant="ghost"> for decrement (−)
│   │           ├── numericText() display + <Description> unit
│   │           └── <Button size="sm" variant="primary"> for increment (+)
│   └── MoodCard → <Card>
│       └── <Card.Body>
│           ├── header: icon + <Card.Title> "How are you feeling?"
│           └── mood selector row:
│               └── per mood: <Button variant={selected ? "primary" : "ghost"}>
│                   └── emoji + <Description> label
```

Key decisions:
- Stepper buttons use `Button` with `size="sm"` instead of raw `Pressable`.
- Mood selection uses `Button` with conditional variant, not raw `Pressable` + manual border.
- Reset button in header uses `Button variant="danger"` with `size="sm"`.
- `Alert.alert` for reset confirmation stays (native API, not HeroUI Dialog) —
  it's already idiomatic and works correctly.

### 4.5 History screen

**File:** `src/app/(tabs)/(history)/index.tsx`

```
ScrollView
├── <Description> "Track your progress over time"
├── Stats row:
│   ├── <Card className="flex-1">
│   │   └── <Card.Body className="flex-row">
│   │       ├── <AppIcon> + <Card.Title> completion % + <Card.Description> "Completion"
│   ├── <Card className="flex-1">
│   │   └── similar for best streak
├── Week navigator:
│   ├── <Button variant="ghost" size="sm"> ← chevron
│   ├── <Description> "Jan 1 – Jan 7"
│   └── <Button variant="ghost" size="sm"> → chevron
├── Per-metric WeekChart:
│   └── <Card>
│       └── <Card.Header> icon + <Card.Title>
│       └── <Card.Body>
│           └── bar chart (custom Views — no HeroUI chart)
│       └── <Card.Footer>
│           └── <Description> goal + avg
├── Section header → <Label>
├── Weekly averages grid:
│   └── <Card className="w-[47%]">
│       └── <Card.Body className="flex-row"> icon + label + value
```

Key decisions:
- Week navigation arrows use `Button variant="ghost"` instead of raw `Pressable`.
- Bar chart bars stay as custom Views (no chart component in HeroUI Native).
- Stats cards use `Card` compound pattern with `Card.Body`, `Card.Title`,
  `Card.Description`.

### 4.6 Settings screen

**File:** `src/app/(tabs)/(settings)/index.tsx`

```
ScrollView
├── <Description> "Customize your goals"
├── Section header → <Label>
├── Per-metric GoalCard:
│   └── <Card>
│       └── <Card.Body className="flex-row">
│           ├── <Avatar.Fallback> icon
│           ├── <Card.Title> + <Card.Description> "Daily goal"
│           └── stepper: <Button> − + numericText + <Button> +
├── Data section:
│   └── <Card>
│       └── <Card.Body>
│           ├── <View className="flex-row justify-between">
│           │   ├── <Description> "Days tracked"
│           │   └── numericText count
│           └── <Button variant="danger"> "Clear All Data"
├── About section:
│   └── <Card>
│       └── <Card.Body>
│           ├── <Card.Title> "Pulse"
│           ├── <Card.Description> app description
│           └── <Description> "Version 1.0.0"
```

Key decisions:
- Goal steppers use `Button` with `size="sm"` and appropriate variants.
- Clear Data uses `Button variant="danger"` — full width, prominent.
- `Alert.alert` for destructive confirmation stays (native, correct).

---

## 5. Theme alignment

### 5.1 Background

Current app uses `bg-sf-bg-grouped` (iOS system grouped background). HeroUI Native
uses `bg-background`. The visual result is equivalent — both resolve to a grouped
background tone that adapts to light/dark.

Mapping:
- `bg-sf-bg-grouped` → `bg-background`
- `bg-sf-card` → card default (automatic via `<Card>`)
- `text-sf-text` → `text-foreground`
- `text-sf-text-2` → `text-muted` or `<Description>`
- `text-sf-text-3` → `text-muted` with lower opacity or `<Description>`
- `bg-sf-fill` → `bg-default`

### 5.2 Dark mode

HeroUI Native auto-switches via Uniwind. No manual `useColorScheme()` logic needed
in tab layouts. The `isDark` variable in sub-layouts is used only for
`headerTintColor` — this stays because it's navigation config, not HeroUI.

### 5.3 Metric colors

Metric colors (`water`, `mood`, `sleep`, `exercise`) are defined as custom theme
colors in `global.css` (see §1.3). They work with Tailwind opacity modifiers:
`bg-water/10`, `text-mood`, etc.

---

## 6. Preserved layers (zero changes)

These modules are not modified at all:

- `src/constants/metrics.ts` — metric config, types, date utils
- `src/db/*` — schema, client, migrations, relations, types, validation
- `src/features/wellness/*` — domain analytics, service, repository
- `src/store/wellness-store.ts` — Drizzle reactive store
- `src/components/ui/app-icon.tsx` — icon wrapper
- `drizzle/*` — SQL migrations
- `vitest.config.ts`, `drizzle.config.ts` — tooling configs
- `*.test.ts` — all existing tests

---

## 7. Visual verification protocol

Every screen is verified on a real device/simulator via `agent-device` after
implementation. This is not optional — each checkpoint must produce a screenshot
that confirms correct rendering.

### 7.1 Checkpoints

| # | Checkpoint                        | What to verify                                                    |
|---|-----------------------------------|-------------------------------------------------------------------|
| 1 | Provider boots                    | App loads, splash hides, no crash                                 |
| 2 | Today tab                         | Summary card renders with ring, greeting, stats                   |
| 3 | Today tab — metric cards          | All 4 metric cards show icon, value, progress bar, quick-add      |
| 4 | Today tab — quick-add             | Tap +, value increments, progress bar updates                     |
| 5 | Track tab                         | All stepper cards render, increment/decrement work                |
| 6 | Track tab — mood                  | Mood selector shows 5 emojis, selection highlights correctly      |
| 7 | Track tab — reset                 | Reset button triggers native alert, reset zeroes values           |
| 8 | History tab                       | Week charts render bars, week nav arrows work                     |
| 9 | History tab — weekly averages     | Grid of average cards renders                                     |
| 10| Settings tab — goal steppers      | All goal cards render, stepper buttons adjust values              |
| 11| Settings tab — clear data         | Alert fires, data clears, counts reset                            |
| 12| Settings tab — about              | App name, description, version render                             |
| 13| Dark mode — all tabs              | Switch to dark mode, verify all 4 tabs look correct               |
| 14| Metric colors                     | Each metric (water/mood/sleep/exercise) shows distinct color      |
| 15| Typography hierarchy              | Title > Label > Description > muted text reads correctly          |

### 7.2 Iteration loop

```
agent-device open Pulse --platform ios
agent-device snapshot -i
# screenshot each tab
# if anything is wrong → fix → rebuild → re-verify
# repeat until all 15 checkpoints pass
```

### 7.3 Fix criteria

- No layout overflow or clipping
- No missing text or icons
- No wrong colors in light or dark mode
- No broken touch targets (buttons must be ≥ 44pt)
- No placeholder/debug text visible
- Card shadows/elevation match HeroUI defaults
- Spacing is consistent (no double padding from nesting Card.Body in Card)

---

## 8. Release build

### 8.1 Pre-build checks

```bash
pnpm lint                   # oxlint clean
pnpm typecheck              # tsgo clean
pnpm test                   # vitest passes
```

### 8.2 Build for physical iPhone

```bash
# Development build for testing on device
eas build --profile development --platform ios

# Or local build (faster iteration)
npx expo run:ios --device --configuration Release
```

### 8.3 Install on device

```bash
# If using EAS
eas build:run --platform ios

# If local build, Xcode auto-installs to connected device
```

### 8.4 Final on-device verification

Run through all 15 checkpoints on the physical iPhone. Pay special attention to:
- Haptic feedback on reset/clear (must fire on real hardware)
- Safe area insets (notch, home indicator)
- Keyboard avoidance (not applicable — no text inputs on current screens)
- Scroll behavior with large content

---

## 9. Execution order

```
Step 1 — Foundation (§1)
  └─ Remove NativeWind, install Uniwind + HeroUI Native
  └─ Metro config, global.css, root layout provider
  └─ Delete obsolete files
  └─ Verify: app boots with HeroUI provider

Step 2 — Design system (§2)
  └─ Delete src/lib/styles.ts
  └─ Create src/lib/metric-theme.ts (tiny)
  └─ Verify: app still compiles (screens will have errors — expected)

Step 3 — Screen rebuilds (§4)
  └─ Today screen → HeroUI components
  └─ Verify: screenshot today tab
  └─ Track screen → HeroUI components
  └─ Verify: screenshot track tab
  └─ History screen → HeroUI components
  └─ Verify: screenshot history tab
  └─ Settings screen → HeroUI components
  └─ Verify: screenshot settings tab

Step 4 — Theme + dark mode (§5)
  └─ Verify light + dark on all tabs
  └─ Tune metric colors if needed

Step 5 — Full verification (§7)
  └─ All 15 checkpoints pass on simulator
  └─ Fix any issues, re-verify

Step 6 — Release build (§8)
  └─ Lint, typecheck, test
  └─ Build release for physical iPhone
  └─ On-device verification of all 15 checkpoints
```

---

## 10. What this plan does NOT do

- Does not change the data layer, database schema, or store
- Does not add new features or screens
- Does not change navigation structure
- Does not adopt Toast, Dialog, BottomSheet, Popover, or Select from HeroUI
  (the app has no use cases for them currently)
- Does not change the icon system (expo-symbols stays)
- Does not add or remove haptic feedback points
- Does not modify tests (they test domain logic, not UI)
- Does not introduce web support (HeroUI Native is mobile-only)
