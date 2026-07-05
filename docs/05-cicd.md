# Layer 5 — CI/CD (GitHub Actions)

## Goal
Full automation: a push to code builds the image from the `Dockerfile`, pushes it
to ECR, and deploys it via Helm — with no manual intervention.

## Depends on / Blocks
- **Depends on:** [Layer 1](01-infrastructure.md) (cluster + the **EKS access
  mapping for the CI identity**, Prereq #3), [Layer 3](03-kubernetes-helm.md)
  (chart to upgrade), [Layer 4](04-registry-ecr.md) (tagging scheme).
- **Blocks:** [Layer 6](06-release.md).

> **Image lifecycle reminder:** the CI builds from the provided `Dockerfile` and
> pushes to **ECR** — not the Docker Hub smoke-test image. See
> [Overview → Image lifecycle](00-overview.md#image-lifecycle-read-this--it-removes-most-confusion).

## Pipeline
```
Push to code  →  Build (from Dockerfile)  →  Push to ECR (tag = git SHA)
              →  helm upgrade with the new tag  →  Cluster updates
```

## Tasks
1. Configure AWS credentials from **GitHub Secrets** (never committed).
2. Build the **app image** from the `Dockerfile`.
3. Push to ECR with `tag = git SHA` (the [Layer 4](04-registry-ecr.md) scheme).
4. `aws eks update-kubeconfig`, then `helm upgrade` injecting the **new** tag
   (e.g. `--set image.tag=$GITHUB_SHA`) — not a fixed value.

> The CI builds and pushes **only the app image**. The same `helm upgrade` manages
> **both** workloads (app + MongoDB), but only the app's image tag changes between
> runs — MongoDB keeps running and its data persists on the PVC across rollouts.

## Acceptance Criteria
- [ ] Credentials managed via GitHub Secrets (not in the repo)
- [ ] The workflow runs end-to-end with no manual intervention
- [ ] The built tag is injected into `helm upgrade` (not a constant)

## Common pitfalls
- `Unauthorized` from `kubectl`/`helm` despite a successful `update-kubeconfig`
  → the CI IAM identity wasn't mapped in Layer 1 (Prereq #3).
- Private-only cluster endpoint → the runner can't reach the API (Prereq #4).
- Hardcoding the tag → defeats the rollout in Layer 6.

## Best practice
Prefer **OIDC** between GitHub and AWS (no static keys). Static keys are
acceptable for the base, but note they are **not** the right approach for
production. OIDC is in the [bonus](00-overview.md#bonus-optional--not-required-for-the-base-timeline).

## Verification
```bash
# After a push, watch the workflow run in the Actions tab.
kubectl rollout status deployment/<name> -n <ns>
kubectl get pods -n <ns> -o jsonpath='{.items[*].spec.containers[*].image}'
# the image tag should equal the pushed git SHA
```

## Notes / decisions
<!-- OIDC vs static keys, secret names, workflow triggers, etc. -->
