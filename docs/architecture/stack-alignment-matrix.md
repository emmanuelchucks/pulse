# Stack alignment matrix

| Area                    | Decision                                                     | Status |
| ----------------------- | ------------------------------------------------------------ | ------ |
| Package manager         | pnpm                                                         | ✅     |
| Task runner             | Turbo (`check:all`)                                          | ✅     |
| Typecheck               | `tsgo --noEmit`                                              | ✅     |
| Lint/format             | OXLint + oxfmt                                               | ✅     |
| Runtime module type     | ESM (`type: module`)                                         | ✅     |
| Mobile framework        | Expo SDK 55 preview + RN 0.83                                | ✅     |
| Routing                 | Expo Router + NativeTabs                                     | ✅     |
| Styling                 | NativeWind + `tw-animate-css`                                | ✅     |
| Icons                   | `expo-symbols` with explicit `sf`/`md` mappings and fallback | ✅     |
| Haptics policy          | Destructive confirmations only                               | ✅     |
| Screen entry animations | Class-based; no Reanimated entry wrappers                    | ✅     |
| Persistence             | Expo SQLite local DB                                         | ✅     |
| ORM                     | Drizzle ORM v1 beta line                                     | ✅     |
| Relations API           | v2 `defineRelations` pattern                                 | ✅     |
| Query reactivity        | `useLiveQuery`                                               | ✅     |
| Migrations              | `drizzle/` baseline reset (one-time local reset)             | ✅     |
| Testing                 | Vitest v4 + Maestro critical flows                           | ✅     |

## Locked exclusions for this migration

- TanStack DB/Query runtime adoption
- MMKV/Secure Store integration
- Keyboard controller
- Legend List
- Backend/auth/payments/AI/cloud stack work
