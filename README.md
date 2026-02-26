# Pulse

A local-first wellness tracker built with Expo + React Native.

## Demo

<video src="https://github.com/user-attachments/assets/28e8deb4-0bd1-42b9-8e73-83c823d0ff05" controls width="100%" poster="https://github.com/user-attachments/assets/d1d50a5f-72ad-45c3-8e3e-0359ec7db362"></video>

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 767px)" srcset="https://github.com/user-attachments/assets/6b62fa50-86ac-43bd-b310-37fd374fe742">
  <source media="(prefers-color-scheme: dark) and (min-width: 768px)" srcset="https://github.com/user-attachments/assets/faa6a005-15be-4ab0-847d-b3efa336cb32">
  <source media="(prefers-color-scheme: light) and (max-width: 767px)" srcset="https://github.com/user-attachments/assets/acf0f9b8-c5de-4ade-b4e4-9335a4e25cc1">
  <source media="(prefers-color-scheme: light) and (min-width: 768px)" srcset="https://github.com/user-attachments/assets/dc561b63-3364-4a51-a997-d5b59b3bdc68">
  <img alt="Pulse app screenshots in light and dark mode" src="https://github.com/user-attachments/assets/dc561b63-3364-4a51-a997-d5b59b3bdc68" width="100%">
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
