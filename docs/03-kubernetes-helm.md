# Layer 3 — Kubernetes + Helm

## Goal
Package the deployment as a **custom Helm chart**. From here on, **Helm is the
only source of deployment** — no separate raw manifests.

## Depends on / Blocks
- **Depends on:** [Layer 2](02-smoke-test.md) — and its **cleanup step must be
  done first**. No leftover raw Deployment/Service from the smoke test.
- **Blocks:** [Layer 5](05-cicd.md) (CI runs `helm upgrade`) and
  [Layer 6](06-release.md).

> **Precondition:** confirm the smoke-test resources are deleted and no orphaned
> LoadBalancer remains (`kubectl get svc`). See
> [Layer 2 → Cleanup](02-smoke-test.md#cleanup-before-layer-3-required).

## Tasks
1. Create a custom chart under `helm/`.
2. The chart **must** allow configuration via `values.yaml` of:
   - **image** (`repository` + `tag`)
   - **replicas** (`replicaCount`)
   - **service** type / port
3. Templates produce a Namespace, a Deployment, and a Service.
4. Set resource **requests/limits**.
5. Add a **readiness probe** on `/healthz` (port `8080`).

## Acceptance Criteria
- [ ] `helm install` creates a Namespace, Deployment, and Service
- [ ] Changing `replicaCount` in values changes the number of pods
- [ ] Resource requests/limits are defined
- [ ] Readiness probe on `/healthz`

## Common pitfalls
- Resource `limits` set too low → `OOMKilled` (see [Layer 7](07-troubleshooting.md)).
- Readiness probe pointing at the wrong path → pods never become `Ready`.
- Service selector not matching pod labels → Service has no endpoints.

## Verification
```bash
helm lint helm/
helm install <release> helm/ --namespace <ns> --create-namespace
kubectl get all -n <ns>

# replica change takes effect
helm upgrade <release> helm/ -n <ns> --set replicaCount=3
kubectl get pods -n <ns>            # expect 3 pods

kubectl describe pod <pod> -n <ns>  # confirm readiness probe + limits
```

## Notes / decisions
<!-- Chart structure, values layout, why these defaults, etc. -->
