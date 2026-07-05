# Layer 6 — Release Process

## Goal
Perform a version update through the pipeline and prove a new version actually
rolls out. **This is the core of the whole project.**

## Depends on / Blocks
- **Depends on:** [Layer 5](05-cicd.md) (working pipeline) and
  [Layer 4](04-registry-ecr.md) (immutable tags).
- **Blocks:** nothing — this is the payoff.

## Tasks
1. Make a change in the application code.
2. Push it.
3. Watch the pipeline build a new image (new git SHA), push to ECR, and
   `helm upgrade`.
4. Validate the new version is serving traffic.

## Acceptance Criteria
- [ ] Code change → push → a new deployment automatically
- [ ] The new version is running (a rollout occurs)
- [ ] Validation: the new version's `/healthz` returns `200`

## The `latest` trap
If the image reference doesn't change between versions, `helm upgrade` produces
**no new rollout** — Kubernetes sees the same spec and does nothing. This is
exactly why [Layer 4](04-registry-ecr.md#why-immutable-tags-the-core-contract)
mandates an immutable tag (git SHA / semver). Using `latest` is the single most
common reason a "successful" pipeline deploys nothing new.

## Verification
```bash
git commit -am "release: <change>" && git push      # triggers the pipeline

kubectl rollout status deployment/<name> -n <ns>     # a new rollout occurs
kubectl get pods -n <ns> -o jsonpath='{.items[*].spec.containers[*].image}'
# image tag == the new git SHA

curl -i http://<EXTERNAL-IP>:8080/healthz            # expect 200 from the new version
```

## Notes / decisions
<!-- What changed, observed rollout time, before/after image tags, etc. -->
