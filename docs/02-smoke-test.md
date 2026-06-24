# Layer 2 — Smoke Test (first deploy from the ready-made image)

## Goal
Before building the pipeline, prove the cluster and external exposure work — using
the ready-made Docker Hub image. This isolates infrastructure/exposure problems
from pipeline problems.

## Depends on / Blocks
- **Depends on:** [Layer 1](01-infrastructure.md) (cluster + subnet tags from
  Prereq #2).
- **Blocks:** nothing — but its resources **must be cleaned up before**
  [Layer 3](03-kubernetes-helm.md) (see *Cleanup* below).

> **Image lifecycle reminder:** this layer uses `course/sample-app:1.0.0` from
> Docker Hub **only**. The real deployment (Layers 4–6) uses the ECR image built
> from the `Dockerfile`. See [Overview → Image lifecycle](00-overview.md#image-lifecycle-read-this--it-removes-most-confusion).

## Tasks
This is a throwaway, raw-`kubectl` deploy — not Helm (Helm starts in Layer 3).

1. Confirm nodes are `Ready`.
2. Deploy the image `course/sample-app:1.0.0` (Deployment, container port `8080`).
3. Expose it with a `Service` of type `LoadBalancer` (port `8080`).
4. Wait for the external address and hit the health endpoint.

## Acceptance Criteria
- [ ] `kubectl get nodes` shows nodes in `Ready` state
- [ ] The image `course/sample-app:1.0.0` is running on the cluster
- [ ] A `LoadBalancer` Service returns an external address
- [ ] `http://<EXTERNAL-IP>:8080/healthz` returns `200`

## Common pitfalls
- No external address → missing subnet tags from Layer 1 (Prereq #2).
- If something here doesn't work, the problem is **infrastructure/exposure, not
  CI**. Fix it before moving on.

## Verification
```bash
kubectl get nodes
kubectl get pods
kubectl get svc                              # note EXTERNAL-IP (may take a minute)
curl -i http://<EXTERNAL-IP>:8080/healthz    # expect HTTP/1.1 200
```

## Cleanup before Layer 3 (required)
Layer 3 makes **Helm the only source of deployment** — no stray raw manifests.
Delete the smoke-test resources and confirm the cloud LoadBalancer is gone, or
you'll have an orphaned ELB (extra cost + a teardown blocker later).

```bash
kubectl delete service <smoke-svc>           # deletes the ELB it created
kubectl delete deployment <smoke-deploy>
kubectl get svc                              # confirm no LoadBalancer remains
# In AWS: confirm the ELB/ENIs created by the Service are gone
```

## Notes / decisions
<!-- Manifest snippets used, time-to-provision for the LB, etc. -->
