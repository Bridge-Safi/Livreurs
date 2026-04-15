# Bridge — Safi Logistique

## Overview

Application logistique marocaine pour Safi, Maroc avec deux rôles : **Livreur de Repas** (coursiers food delivery) et **Taxi Confort** (chauffeurs taxi). pnpm workspace monorepo TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Push notifications**: web-push (VAPID)
- **Frontend**: React + Vite, TailwindCSS, shadcn/ui, Wouter, TanStack Query

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## App Features

- **Dispatch 7 minutes simultané** : toutes les livraisons broadcastées à tous les livreurs en même temps, 7 min chrono
- **Login PIN 4 chiffres** : livreurs (default `1234`), chauffeurs (default `5678`), sélection + PIN numpad
- **4 langues** : FR, AR (RTL), EN, Amazigh Tifinagh
- **Thème marocain** : terracotta `#C14B2A`, or `#D4880C`, vert `#2A7A48`, sable `#FAF6EF`
- **Web Push notifications** : service worker `/sw.js`, VAPID keys stockées en env vars, abonnement après login
- **PWA** : manifest.json, meta tags iOS, theme-color

## Architecture

```
artifacts/
  api-server/        — Express API (port 8080)
    src/routes/
      dispatch.ts    — dispatch 7 min broadcast + push notifications
      auth.ts        — PIN login deliverers/drivers
      push.ts        — VAPID push subscribe/send endpoints
  driver-app/        — React Vite frontend (port 18861 → ext 3000)
    public/
      sw.js          — Service worker (push events)
      manifest.json  — PWA manifest
    src/
      lib/
        auth.tsx     — AuthProvider, useAuth hook
        push.ts      — SW registration + push subscription
        i18n.tsx     — 4 langues translations
      pages/
        livreur/     — login, dashboard, livraisons, livraison
        chauffeur/   — login, dashboard, trajets, trajet
      components/
        DispatchAlert.tsx — alerte 7 min avec timer mm:ss
lib/
  db/src/schema/
    deliverers.ts      — livreurs (avec colonne pin)
    drivers.ts         — chauffeurs (avec colonne pin)
    deliveries.ts      — livraisons
    trips.ts           — trajets VTC
    push-subscriptions.ts — subscriptions Web Push
```

## Env Vars

- `VAPID_PUBLIC_KEY` — clé publique VAPID pour push
- `VAPID_PRIVATE_KEY` — clé privée VAPID
- `VAPID_SUBJECT` — email contact VAPID (default: mailto:admin@bridge-safi.ma)
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — secret pour sessions Express

## Notes

- Après codegen Orval: `lib/api-zod/src/index.ts` se réinitialise → remettre `export * from "./generated/api";`
- Refuse livraison = local-only via `localStorage` (clé `bridge_refused_deliveries`)
- iOS push = requiert PWA installée (iOS 16.4+) ; Android Chrome fonctionne directement
- Port API : 8080 ; routes sous prefix `/api/`
