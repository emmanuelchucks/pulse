# Pulse

A local-first wellness tracker built with Expo + React Native.

## Demo

<video src="https://github.com/user-attachments/assets/bf802555-c0e4-4445-ad4d-65c8ae6e1136" controls width="100%" poster="https://github.com/user-attachments/assets/ff42343f-fb10-492d-88ac-953fa1a6b245"></video>

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 767px)" srcset="https://github.com/user-attachments/assets/f8f54894-23e7-4a69-b44b-e3c20faa5485">
  <source media="(prefers-color-scheme: dark) and (min-width: 768px)" srcset="https://github.com/user-attachments/assets/d48a760a-e104-41f3-bbcd-3406b8b7960a">
  <source media="(prefers-color-scheme: light) and (max-width: 767px)" srcset="https://github.com/user-attachments/assets/b4098c0e-0601-4b8d-9599-cfa07cc06a9c">
  <source media="(prefers-color-scheme: light) and (min-width: 768px)" srcset="https://github.com/user-attachments/assets/aafc4157-a5f8-4821-b3fe-1e334ee68115">
  <img alt="Pulse app screenshots in light and dark mode" src="https://github.com/user-attachments/assets/aafc4157-a5f8-4821-b3fe-1e334ee68115" width="100%">
</picture>

## Tech

- Expo Router
- React Native 0.83
- TypeScript
- Drizzle ORM + SQLite
- pnpm

## Quick start

This project runs in a native dev client (not Expo Go).

```bash
pnpm install
pnpm ios    # or: pnpm android
pnpm dev
```

## Useful scripts

```bash
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm check:all
```

## Environment

Copy `.env.example` to `.env.local` if you need private Expo/EAS overrides.
