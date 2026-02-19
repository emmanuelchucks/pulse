# Pulse

Local-only Expo wellness tracker for water, mood, sleep, and exercise.

## Architecture (locked)

- **Local-only app**: no backend/API/auth/payments/AI services.
- **Source of truth**: on-device SQLite.
- **Data access**: Drizzle ORM + Expo SQLite + `useLiveQuery`.
- **Drizzle line**: v1 beta with relations v2 pattern (`defineRelations`).

See:

- `docs/architecture/local-only-scope.md`
- `docs/architecture/stack-alignment-matrix.md`

## Tech stack

- Expo SDK 55 preview + React Native 0.83
- Expo Router (native tabs)
- NativeWind + `tw-animate-css`
- Drizzle ORM + expo-sqlite
- Vitest v4 + Maestro
- OXLint + oxfmt + tsgo + Turbo

## Setup

```bash
pnpm install
pnpm dev
```

## Scripts

```bash
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm check:all
pnpm db:generate
pnpm db:studio
```

## Data + migrations

- Migrations are in `drizzle/`.
- App startup runs migrations before rendering tabs.
- This migration reset the local migration baseline once; old local dev data is not preserved.

## Testing

### Unit/integration (Vitest)

```bash
pnpm test
```

### Maestro flows

Flows are in `.maestro/flows`:

- `quick-add-metric.yaml`
- `edit-goal.yaml`
- `reset-day.yaml`
- `history-navigation.yaml`

Run with Maestro CLI, for example:

```bash
maestro test .maestro/flows/quick-add-metric.yaml
```

## Interaction policy

- Haptics are used **only** for destructive confirmations (`Reset Day`, `Clear All Data`).
- Routine taps (increment/decrement/mood/goal steppers/quick-add) do not trigger haptics.
- Screen entry animations are class-based (`tw-animate-css` + NativeWind), not Reanimated wrappers.
