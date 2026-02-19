# Local-only scope

This migration intentionally keeps Pulse local-first and local-only.

## In scope

- On-device SQLite persistence
- Drizzle ORM schema + migrations
- Reactive reads via `useLiveQuery`
- Mobile UI/styling/tooling alignment
- Tests and documentation

## Out of scope (explicitly not implemented)

- Backend/API layer (including oRPC/Cloudflare workers)
- Auth systems
- Payments/billing
- AI/LLM features
- TanStack DB/Query runtime adoption
- MMKV/Secure Store integration
- Keyboard controller and Legend List

## Why

Pulse currently has single-device product requirements. Adding networked or cloud layers in this migration would increase complexity, operational burden, and failure modes without solving a current product need.

## Data authority

SQLite on device is the canonical source of truth.

- `daily_entries` stores daily metric values.
- `goals` stores per-metric daily targets.
- Migrations run on app boot.

No server reconciliation path exists in this scope.
