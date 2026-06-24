# Layer 4 — Registry (ECR)

## Goal
Push the application image to ECR (the repository was created in
[Layer 1](01-infrastructure.md)) using **immutable** tags.

## Depends on / Blocks
- **Depends on:** [Layer 1](01-infrastructure.md) (ECR repository + URL output).
- **Blocks:** [Layer 5](05-cicd.md) (CI pushes here) and the rollout behaviour in
  [Layer 6](06-release.md).

## Tasks
1. Authenticate Docker to ECR.
2. Build the image **from the provided `Dockerfile`**.
3. Tag it with an **immutable** tag — git SHA or semver.
4. Push to the ECR repository.

## Acceptance Criteria
- [ ] Authentication to ECR works
- [ ] **Immutable tagging** — git SHA or semver. **Do not use `latest`**

## Why immutable tags (the core contract)
An immutable tag is the contract that makes automated releases work. If the image
reference doesn't change between versions, `helm upgrade` produces **no new
rollout**. This is exactly why [Layer 6](06-release.md#the-latest-trap) calls
`latest` a trap. Decide the tagging scheme here; the CI in Layer 5 will set the
tag = git SHA.

## Common pitfalls
- Reusing `latest` (or any fixed tag) → no rollout on the next release.
- Auth token expiry → re-run `aws ecr get-login-password` before pushing.

## Verification
```bash
aws ecr get-login-password --region <region> \
  | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

docker build -t <ecr-url>:<git-sha> ./app
docker push <ecr-url>:<git-sha>

aws ecr list-images --repository-name <repo> --region <region>
```

## Notes / decisions
<!-- Tagging scheme (SHA vs semver), repo immutability setting, scan-on-push, etc. -->
