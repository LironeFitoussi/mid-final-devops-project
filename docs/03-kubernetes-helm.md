# Layer 3 — Kubernetes + Helm

## Goal
Package the deployment as a single **custom Helm chart** that stands up **two
workloads** — the MemeForge app and an in-cluster **MongoDB** — and wires the app
to the database. From here on, **Helm is the only source of deployment** — no
separate raw manifests.

## Depends on / Blocks
- **Depends on:** [Layer 2](02-smoke-test.md) (+ its cleanup), and
  [Layer 1](01-infrastructure.md) — specifically the **EBS CSI driver + a default
  StorageClass** so the MongoDB PVC can bind ([Prereq #2](00-prerequisites.md) /
  [#7](00-prerequisites.md)).
- **Blocks:** [Layer 5](05-cicd.md) (CI runs `helm upgrade`) and
  [Layer 6](06-release.md).

> **Precondition:** smoke-test resources deleted (no orphaned LoadBalancer), and a
> default StorageClass exists (`kubectl get storageclass`) so the Mongo PVC binds.
> See [Layer 2 → Cleanup](02-smoke-test.md#cleanup-before-layer-3-required).

## Architecture — one chart, two Deployments
| Resource | Kind | Notes |
|----------|------|-------|
| `memeforge` app | **Deployment** | Stateless, scalable; reads `MONGODB_URI` |
| app service | **Service** (`LoadBalancer`) | Port `8080` → exposes the UI/API |
| `mongodb` | **Deployment** | **Single replica** (see warning below) |
| mongo service | **Service** (`ClusterIP`) | Port `27017`, internal only |
| mongo data | **PersistentVolumeClaim** | EBS-backed volume |
| connection | **Secret** | Holds `MONGODB_URI` (+ creds if auth on), injected into the app |

> **Keep MongoDB at 1 replica.** A plain Deployment with a single PVC is fine for
> the lab. Scaling a Deployment-based Mongo past 1 corrupts data — multi-node
> MongoDB needs a StatefulSet (see [technical-decisions](technical-decisions.md)
> and the [bonus](00-overview.md#bonus-optional--not-required-for-the-base-timeline)).

## Tasks
1. Create a custom chart under `helm/`.
2. The chart **must** allow configuration via `values.yaml` of:
   - app **image** (`repository` + `tag`), **replicaCount**, **service** type/port
   - **mongodb**: `enabled`, image (`mongo:7`), storage size, (optional) auth
   - app env: `APP_VERSION`
3. Templates produce: a Namespace, the **app Deployment + Service**, the
   **MongoDB Deployment + Service + PVC**, and a **Secret** holding `MONGODB_URI`.
4. Inject `MONGODB_URI` into the app from the Secret, pointing at the Mongo
   Service DNS name — e.g. `mongodb://<release>-mongodb:27017/memeforge`.
5. Set resource **requests/limits** on both workloads.
6. **Readiness probe** on the app `/healthz` (`:8080`); a TCP probe on Mongo `27017`.

## Acceptance Criteria
- [ ] `helm install` creates the Namespace, **two Deployments** (app + MongoDB),
      both Services, the PVC, and the `MONGODB_URI` Secret
- [ ] The MongoDB **PVC binds** (a PersistentVolume is provisioned)
- [ ] The app pod becomes `Ready` and connects to MongoDB (`/readyz` → 200)
- [ ] Changing `replicaCount` scales the **app** pods (MongoDB stays at 1)
- [ ] resource requests/limits defined; readiness probe on `/healthz`

## Common pitfalls
- PVC stuck `Pending` → no EBS CSI driver / no default StorageClass
  ([Layer 1](01-infrastructure.md) / [Prereq #7](00-prerequisites.md)).
- App `CrashLoopBackOff` or `/readyz` 503 → wrong `MONGODB_URI`, or Mongo not
  ready yet (the app retries, but check the Service name and the Secret).
- Scaling the **Mongo** Deployment > 1 → data corruption. Keep it at 1.
- Resource `limits` too low → `OOMKilled`; probe on the wrong path → never
  `Ready`; selector/label mismatch → Service has no endpoints (see
  [Layer 7](07-troubleshooting.md)).

## Verification
```bash
helm lint helm/
helm install <release> helm/ --namespace <ns> --create-namespace
kubectl get deploy,svc,pvc,secret -n <ns>     # 2 deployments; app LB + mongo ClusterIP
kubectl get pvc -n <ns>                        # STATUS = Bound
kubectl rollout status deploy/<release>-memeforge -n <ns>

# app connected to Mongo
curl -s http://<EXTERNAL-IP>:8080/readyz       # {"status":"ready"}

# scaling affects the app only
helm upgrade <release> helm/ -n <ns> --set replicaCount=3
kubectl get pods -n <ns>                        # 3 app pods + 1 mongo pod
```

## Notes / decisions
<!-- Chart structure, mongo auth on/off, storage size, StatefulSet bonus, etc. -->
