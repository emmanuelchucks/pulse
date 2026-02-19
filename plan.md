# Pulse Locked Migration Plan (No Ambiguity)

This is the **final execution plan**. No alternatives, no optional branches, no deferred decision points inside implementation.

---

## 1) Locked Decisions (Final)

## 1.1 Product/Architecture

- App remains **local-only**.
- Source of truth is **on-device SQLite**.
- No backend/API/auth/payments/AI work in this migration.

## 1.2 Data Layer

- Keep and standardize: **Expo SQLite + Drizzle + `useLiveQuery`**.
- Adopt and stay on **Drizzle v1 beta** in this migration.
- Standardize on **Relational Queries v2 API surface** (`defineRelations` pattern) for consistency with v1 direction.
- Do **not** introduce TanStack Query/TanStack DB in this migration.
- Do **not** replace SQLite with MMKV.
- MMKV and Secure Store are **not** part of this migration.

## 1.3 Keyboard/List

- `react-native-keyboard-controller`: **not implemented** in this migration.
- Legend List: **not implemented** in this migration.

## 1.4 Icons

- Use `expo-symbols` as primary icon system.
- NativeTabs must use explicit platform mapping: `sf` for iOS, `md` for Android.
- Non-tab icons use `SymbolView` with explicit `ios` + `android` + `web` mapping; if a mapping is unavailable, a fallback node is mandatory.

## 1.5 Tooling/Testing

- Keep Vitest v4.
- Keep pnpm + OXLint + oxfmt.
- Migrate typecheck from `tsc` to `tsgo`.
- Add Turborepo task orchestration.

## 1.6 Migrations/Data Reset

- We will **reset local migration baseline and local app DB once** during migration.
- We are not preserving current local development DB content.

## 1.7 Interaction Policy (Haptics + Animations)

- Haptics are limited to **destructive confirmations only** (`reset day`, `clear all data`).
- No haptic feedback on routine taps (increment/decrement, mood selection, goal steppers, quick-add).
- Replace screen-level `Animated.View` + `FadeInDown` entry animations with Tailwind/NW class-based animations (`tw-animate-css` + NativeWind CSS classes).
- Keep `react-native-reanimated` dependency (required by stack/runtime), but remove direct reanimated screen-entry usage from app screens.

---

## 2) Scope Boundary (Hard)

In scope:

- Tooling alignment
- Styling/icon alignment
- Haptics and animation behavior normalization
- Drizzle schema/migration cleanup
- Store/reactivity cleanup (stays Drizzle reactive)
- Testing completion (Vitest + Maestro)
- Docs and architecture records

Out of scope (must not be implemented):

- Cloudflare/oRPC/Workers
- Better Auth
- RevenueCat/Stripe
- TanStack DB/Query runtime adoption
- MMKV/Secure Store integration
- Keyboard controller
- Legend List

---

## 3) Canonical Technical Standards to Apply

## 3.1 Expo SQLite + Drizzle

- Use `openDatabaseSync("pulse.db", { enableChangeListener: true })`.
- Use `drizzle-orm/expo-sqlite`.
- Keep WAL and foreign keys PRAGMA setup.
- Keep bundled SQL migrations in `drizzle/`.
- Run migrations at app startup.
- Use `useLiveQuery` for reactive reads.

## 3.2 Drizzle Schema

- Convert to callback table schema style.
- Add UUID primary keys.
- Keep domain uniqueness constraints (`date`, `metric`) explicitly.
- Standardize timestamps (`createdAt`, `updatedAt`).
- Add `src/db/relations.ts` using `defineRelations(...)` (v2 pattern), even if current table relations are minimal.

## 3.3 React/UI

- Remove unnecessary `useMemo` / `useCallback` where not required.
- Add `nativewind/theme` + `tw-animate-css` imports in global CSS.
- Replace tab-screen entrance animations from reanimated API (`Animated.View` + `FadeInDown`) to class-based animation utilities.
- Restrict haptics to destructive confirmations only.

---

## 4) Workstream Execution (Locked Order)

## WS-A Tooling (first)

Files:

- `package.json`
- `tsconfig.json`
- `pnpm-workspace.yaml`
- `turbo.json` (new)

Tasks:

1. Replace `tsc` typecheck script with `tsgo --noEmit`.
2. Remove `typescript` dependency, add `@typescript/native-preview`.
3. Add required TS flags: `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `isolatedModules`.
4. Add package metadata: `type: module`, `engines.node >=24`, `packageManager`.
5. Add turbo tasks and root orchestration script(s).
6. Lock `drizzle-orm` and `drizzle-kit` to Drizzle v1 beta line used by this repo.
7. Remove broken `reset-project` script.

Acceptance:

- `pnpm typecheck` runs via tsgo.
- `pnpm check:all` runs through turbo.
- Drizzle dependencies are pinned to the selected v1 beta line.

---

## WS-B Styling + Icons

Files:

- `src/global.css`
- `src/app/(tabs)/_layout.tsx`
- `src/app/(tabs)/**/index.tsx`
- `src/components/ui/AppIcon.tsx` (new)
- `package.json`
- `src/constants/colors.ts` (remove and replace any remaining references)

Tasks:

1. Add `nativewind/theme` and `tw-animate-css` imports to `global.css`.
2. Implement `AppIcon` wrapper with explicit platform mapping.
3. For `NativeTabs.Trigger.Icon`, enforce `sf` + `md` mapping.
4. Replace direct icon usage where platform mapping is missing.
5. Replace `Animated.View` + `FadeInDown` usage in tab screens with class-based animations.
6. Remove routine haptic calls from metric/goal/mood/quick-add interactions.
7. Keep only destructive-confirmation haptics in reset/clear actions.
8. Remove unused deps: `clsx`, `tailwind-merge`, `react-native-svg`.
9. Remove dead `src/constants/colors.ts`.

Acceptance:

- iOS and Android icons are explicitly mapped and render correctly.
- No direct reanimated entry-animation wrappers remain in tab screens.
- Haptics only fire on destructive confirmations.
- No dead icon/styling dependencies remain.

---

## WS-C Data Layer + Store

Files:

- `src/db/schema.ts`
- `src/db/types.ts`
- `src/db/validation.ts`
- `src/db/relations.ts` (new)
- `src/features/wellness/infra/wellness-repository.ts`
- `src/store/wellness-store.ts`
- `drizzle/**`

Tasks:

1. Rewrite schema to callback style.
2. Add UUID primary keys and explicit unique constraints.
3. Add standardized timestamp columns.
4. Create `src/db/relations.ts` with `defineRelations(...)` (v2 pattern).
5. Reset migration baseline in `drizzle/`.
6. Reset local DB expectation to new baseline.
7. Keep store on Drizzle `useLiveQuery` (no TanStack DB/Query).
8. Remove AsyncStorage dependency from `package.json`.

Acceptance:

- New schema/migrations apply cleanly from empty local DB.
- `relations.ts` compiles and is wired to v2 relation pattern.
- App works end-to-end with local data lifecycle under new schema.

---

## WS-D Testing

Files:

- `src/features/wellness/infra/wellness-repository.test.ts` (new)
- `.maestro/flows/*.yaml` (new)
- `vitest.config.ts` (leave unchanged)

Tasks:

1. Add repository integration test against real local sqlite path.
2. Add Maestro critical flows:
   - quick add metric
   - edit goals
   - reset day
   - history navigation
3. Keep Vitest v4; no version downgrade.

Acceptance:

- Vitest suite passes.
- Maestro critical flows pass.

---

## WS-E Docs

Files:

- `README.md`
- `docs/architecture/local-only-scope.md` (new)
- `docs/architecture/stack-alignment-matrix.md` (new)

Tasks:

1. Document locked architecture and out-of-scope layers.
2. Document why TanStack DB/MMKV/Secure Store/keyboard/Legend List are excluded from this migration.
3. Document Drizzle v1 beta + Expo SQLite + relations v2 pattern decision.
4. Document haptics and animation policies (destructive-only haptics, class-based entry animations).
5. Document migration baseline reset decision.

Acceptance:

- Docs exactly match implementation decisions.

---

## 5) Subagent Coordination (Locked)

- Base branch for all worktrees: **current working branch**.
- Every workstream gets its own worktree + branch.
- Integration order is fixed: **WS-A → WS-B → WS-C → WS-D → WS-E**.
- All merges are done by rebase (no merge commits).
- No workstream edits files outside its ownership.

Worktree commands:

```bash
BASE=$(git branch --show-current)

git worktree add ../pulse-ws-a -b migration/ws-a-tooling $BASE
git worktree add ../pulse-ws-b -b migration/ws-b-styling-icons $BASE
git worktree add ../pulse-ws-c -b migration/ws-c-data-store $BASE
git worktree add ../pulse-ws-d -b migration/ws-d-testing $BASE
git worktree add ../pulse-ws-e -b migration/ws-e-docs $BASE
```

---

## 6) Definition of Done (Strict)

- Tooling switched to tsgo + turbo and passing.
- Icon system fully platform-mapped (`sf`/`md` and mandatory fallback for any unmapped symbol case).
- Global CSS pipeline aligned (`nativewind/theme`, `tw-animate-css`).
- Reanimated screen-entry wrappers replaced with class-based animations in tab screens.
- Haptics limited to destructive confirmations only.
- Drizzle v1 beta line is pinned; schema + migrations reset and standardized.
- Store remains Drizzle reactive and stable.
- AsyncStorage removed.
- Vitest + repository integration tests + Maestro flows passing.
- Architecture docs updated and consistent with code.

If any item above is incomplete, migration is not complete.
