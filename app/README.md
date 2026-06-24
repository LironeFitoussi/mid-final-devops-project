# MemeForge — MERN sample app

A **MERN-stack** CMS-style web app used as the deployable artifact for the EKS
platform-deployment lab. It looks and behaves like a real content management
dashboard (stat cards, content table, create/edit/delete, search + status
filters), built with:

- **M**ongoDB — content store (Mongoose ODM)
- **E**xpress — REST API (TypeScript)
- **R**eact — dashboard UI (TypeScript, Vite)
- **N**ode.js — runtime

This is the app referenced throughout the [lab workbook](../README.md): the CI
([Layer 5](../docs/05-cicd.md)) builds the deployed image from the `Dockerfile`
here.

## Layout

```
app/
├── client/             # React + TypeScript (Vite) dashboard
│   ├── src/
│   │   ├── components/ # Sidebar, StatCards, MemeTable, MemeModal
│   │   ├── api.ts      # typed fetch client
│   │   ├── types.ts
│   │   └── App.tsx
│   └── vite.config.ts  # dev proxy -> Express on :8080
├── server/             # Express + TypeScript + Mongoose API
│   └── src/
│       ├── models/Meme.ts
│       ├── routes/memes.ts
│       ├── config/db.ts
│       ├── app.ts      # routes + health + static client
│       └── index.ts    # entrypoint
├── Dockerfile          # multi-stage: build client + server -> slim runtime
├── docker-compose.yml  # app + MongoDB for local dev
└── .env.example
```

In the production image, the Express server serves the **built React assets** as
static files **and** the API — one container on port `8080`.

## App contract (matches the lab spec)

| Property | Value |
|----------|-------|
| Port | `8080` (override with `PORT`) |
| Health endpoint | `GET /healthz` → `200 {"status":"ok"}` (liveness; independent of DB) |
| Readiness | `GET /readyz` → `200` when Mongo is connected, else `503` |
| Version endpoint | `GET /version` → reports `APP_VERSION` (used for the Layer 6 release demo) |

> `/healthz` returns `200` as soon as the process is up, even before Mongo
> connects — the server starts immediately and connects to Mongo in the
> background with retry/backoff, so the pod doesn't crash-loop while the database
> becomes reachable. Use `/readyz` if you want to gate traffic on the DB.

## Content API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/stats` | Dashboard totals |
| GET | `/api/memes` | List (supports `?status=` and `?q=`) |
| GET | `/api/memes/:id` | Single item |
| POST | `/api/memes` | Create |
| PUT | `/api/memes/:id` | Update |
| DELETE | `/api/memes/:id` | Delete |
| GET | `/api/categories` | Category list |

## Run locally

### Option A — Docker Compose (app + MongoDB)

```bash
cd app
docker compose up --build
# open http://localhost:8080
```

### Option B — run client & server directly (needs a local MongoDB)

```bash
# terminal 1 — API (http://localhost:8080)
cd app/server && npm install && npm run dev

# terminal 2 — client dev server (http://localhost:5173, proxies /api -> :8080)
cd app/client && npm install && npm run dev
```

Set `MONGODB_URI` (see [`.env.example`](.env.example)); defaults to
`mongodb://localhost:27017/memeforge`. Seed content is inserted automatically when
the collection is empty.

## Build the container

```bash
docker build -t memeforge:dev ./app
docker run --rm -p 8080:8080 \
  -e MONGODB_URI="<your-mongo-uri>" -e APP_VERSION=1.0.0 memeforge:dev
curl -i http://localhost:8080/healthz
```

## Deployment note — MongoDB dependency

Unlike a stateless app, this MERN app needs a MongoDB it can reach from the
cluster. When you build the Helm chart ([Layer 3](../docs/03-kubernetes-helm.md))
you have two options:

1. **Managed MongoDB Atlas** — pass the connection string via a Kubernetes Secret
   → `MONGODB_URI`. Simplest; keeps the cluster stateless.
2. **In-cluster MongoDB** — deploy MongoDB (e.g. a StatefulSet / the Bitnami
   chart as a Helm dependency) and point `MONGODB_URI` at its Service.

The chart should expose `MONGODB_URI` and `APP_VERSION` through `values.yaml`
(via env/Secret), in addition to image, replicas, and service settings.

## Notes for the lab

- **Readiness probe** ([Layer 3](../docs/03-kubernetes-helm.md)): `/healthz` on
  `:8080` satisfies the lab contract; `/readyz` is the DB-aware alternative.
- **Release demo** ([Layer 6](../docs/06-release.md)): bump the version (edit
  `server/package.json` or set `APP_VERSION` via Helm values) and watch
  `/version` change after the rollout. The CI tags the image with the git SHA, so
  each push produces a real rollout — see the
  [`latest` trap](../docs/06-release.md#the-latest-trap).
- Runs as a **non-root** user and handles `SIGTERM` for clean rollout draining.
