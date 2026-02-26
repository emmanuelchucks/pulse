# Pulse

A local-first wellness tracker built with Expo + React Native.

## Demo

<video src="https://github.com/user-attachments/assets/28e8deb4-0bd1-42b9-8e73-83c823d0ff05" controls width="100%" poster="https://github.com/user-attachments/assets/d1d50a5f-72ad-45c3-8e3e-0359ec7db362"></video>

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 767px)" srcset="https://github.com/user-attachments/assets/d89ea218-4d8c-4631-b86e-3c43b38de3ee">
  <source media="(prefers-color-scheme: dark) and (min-width: 768px)" srcset="https://github.com/user-attachments/assets/1c04bf5d-edb0-4672-837d-0654a7cb4872">
  <source media="(prefers-color-scheme: light) and (max-width: 767px)" srcset="https://github.com/user-attachments/assets/4e81440f-6f14-4622-b01a-b1f03ff670e7">
  <source media="(prefers-color-scheme: light) and (min-width: 768px)" srcset="https://github.com/user-attachments/assets/702af28e-6205-48ca-996b-6df36e4719df">
  <img alt="Pulse app screenshots in light and dark mode" src="https://github.com/user-attachments/assets/702af28e-6205-48ca-996b-6df36e4719df" width="100%">
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
