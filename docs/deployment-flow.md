# Deployment Flow — from push to a running pod

A step-by-step narrative of what happens between a `git push` and a new pod
serving traffic. (Required documentation deliverable.)

## The flow

1. **Push** — a developer pushes a commit to the repository. The push event
   triggers the GitHub Actions workflow ([Layer 5](05-cicd.md)).

2. **Authenticate to AWS** — the workflow assumes AWS credentials from GitHub
   Secrets (or via OIDC, bonus). This identity must be mapped to the EKS API
   ([Prereq #3](00-prerequisites.md)), or later `kubectl`/`helm` calls fail with
   `Unauthorized`.

3. **Build** — Docker builds the image **from the provided `Dockerfile`** (not the
   Docker Hub smoke-test image).

4. **Tag** — the image is tagged with the **git SHA**, an immutable tag
   ([Layer 4](04-registry-ecr.md)). This is the contract that guarantees the next
   step actually changes something.

5. **Push to ECR** — the tagged image is pushed to the ECR repository created in
   [Layer 1](01-infrastructure.md).

6. **Configure cluster access** — `aws eks update-kubeconfig` points the runner at
   the cluster (its endpoint must be public/public+private — [Prereq #4](00-prerequisites.md)).

7. **`helm upgrade`** — Helm is invoked with the new tag injected
   (`--set image.tag=<git-sha>`). Because the image reference changed, the
   Deployment's pod template changes too.

8. **Rollout** — Kubernetes performs a rolling update: it creates new pods,
   waits for the **readiness probe** on `/healthz` to pass, then terminates the
   old pods. EKS pulls the image from ECR using the **node IAM role** (no pull
   secret needed — [Prereq #6](00-prerequisites.md)).

9. **Serving** — the `LoadBalancer` Service routes external traffic to the new,
   ready pods on port `8080`. Each app pod connects to **MongoDB** over the
   in-cluster `ClusterIP` Service using `MONGODB_URI` (from a Secret); `/readyz`
   returns `200` once that connection is up.

10. **MongoDB is deployed once, not per release.** The same Helm release includes
    the MongoDB Deployment + PVC. The CI rebuilds and rolls out **only the app**;
    MongoDB keeps running and its data persists on the EBS-backed PVC across app
    rollouts (see [Layer 3](03-kubernetes-helm.md)).

## Why the rollout actually happens

A new git SHA → a new image tag → a changed pod spec → a real rollout. If the tag
were fixed (`latest`), step 7 would be a no-op and **nothing new would deploy** —
the [`latest` trap](06-release.md#the-latest-trap).

## Related
- Visual: [architecture.md](architecture.md)
- Release validation: [Layer 6](06-release.md)
