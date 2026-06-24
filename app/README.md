# MemeForge — sample CMS app

A small, self-contained **CMS-style web app** used as the deployable artifact for
the EKS platform-deployment lab. It looks and behaves like a real content
management dashboard (stat cards, a content table, create/edit/delete, search and
status filters) but stores everything **in memory** — no database — so it runs
standalone for the Layer 2 smoke test and starts clean on every pod.

This is the app referenced throughout the [lab workbook](../README.md): the CI
([Layer 5](../docs/05-cicd.md)) builds the deployed image from the `Dockerfile`
here.

## App contract (matches the lab spec)

| Property | Value |
|----------|-------|
| Port | `8080` (override with `PORT`) |
| Health endpoint | `GET /healthz` → `200 {"status":"ok"}` |
| Version endpoint | `GET /version` → reports `APP_VERSION` (used for the Layer 6 release demo) |

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/healthz` | Liveness/readiness — returns `200` |
| GET | `/version` | App version + uptime (set `APP_VERSION` env var) |
| GET | `/api/stats` | Dashboard totals |
| GET | `/api/memes` | List (supports `?status=` and `?q=`) |
| GET | `/api/memes/:id` | Single item |
| POST | `/api/memes` | Create |
| PUT | `/api/memes/:id` | Update |
| DELETE | `/api/memes/:id` | Delete |
| GET | `/api/categories` | Category list |
| GET | `/` | CMS dashboard UI |

## Run locally

```bash
cd app
npm install
npm start
# open http://localhost:8080  — health: curl http://localhost:8080/healthz
```

## Build & run the container

```bash
docker build -t memeforge:dev ./app
docker run --rm -p 8080:8080 -e APP_VERSION=1.0.0 memeforge:dev
curl -i http://localhost:8080/healthz
```

## Notes for the lab

- **Readiness probe** ([Layer 3](../docs/03-kubernetes-helm.md)) should target
  `GET /healthz` on port `8080`.
- **Release demo** ([Layer 6](../docs/06-release.md)): bump the version (e.g. edit
  `package.json` or pass `APP_VERSION` via Helm values) and watch `/version`
  change after the rollout. The CI tags the image with the git SHA, so each push
  produces a real rollout — see the [`latest` trap](../docs/06-release.md#the-latest-trap).
- Runs as a **non-root** user and handles `SIGTERM` for clean rollout draining.
