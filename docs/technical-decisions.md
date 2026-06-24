# Technical Decisions

Why these modules and approaches were chosen, and how updates work. (Required
documentation deliverable. Fill in / adjust as you build — the entries below are
the recommended defaults and their rationale.)

## Infrastructure: official Terraform modules

- **Decision:** use `terraform-aws-modules/vpc` and `terraform-aws-modules/eks`.
- **Why:** they encode AWS best practices (subnet layout, IAM, tagging) and let
  the project finish within the lab timebox. Writing VPC + EKS from scratch is a
  bonus exercise, not a base requirement.

## State management

- **Decision:** remote state preferred (e.g. S3 + DynamoDB lock); local acceptable
  for the base.
- **Why:** remote state is required for any team/CI scenario; local keeps the base
  simple if working solo.

## Networking: single vs multi NAT

- **Decision:** single NAT Gateway for the base.
- **Why:** cost. Multi-AZ NAT is a production HA concern, not needed for the lab.
  See [cost-analysis.md](cost-analysis.md).

## Cluster endpoint: public

- **Decision:** public (or public + private) endpoint.
- **Why:** the GitHub Actions runner must reach the EKS API. A private-only
  endpoint breaks CI ([Prereq #4](00-prerequisites.md)).

## EKS access: Access Entries

- **Decision:** EKS **Access Entries** for the CI identity (over `aws-auth`).
- **Why:** Access Entries are the current recommended mechanism and are managed as
  first-class API resources. The CI identity differs from the cluster creator and
  must be mapped explicitly ([Prereq #3](00-prerequisites.md)).

## Packaging: a single custom Helm chart

- **Decision:** one custom chart is the **only** deployment source; no raw
  manifests after the smoke test.
- **Why:** one source of truth, parameterised via `values.yaml` (image, replicas,
  service) so the CI can drive upgrades cleanly.

## Image tagging: immutable (git SHA)

- **Decision:** tag images with the git SHA; **never** `latest`.
- **Why:** a changing image reference is what makes `helm upgrade` produce a real
  rollout. This is the core mechanism of the project — see the
  [`latest` trap](06-release.md#the-latest-trap).

## CI auth: GitHub Secrets (OIDC as bonus)

- **Decision:** static AWS keys in GitHub Secrets for the base; **OIDC** is the
  recommended production approach (bonus).
- **Why:** static keys are simplest to get working; OIDC removes long-lived
  credentials but adds setup. Noted explicitly so the trade-off is clear.

## How an update works (the deploy mechanism)

Push → CI builds from the `Dockerfile` → tags with the git SHA → pushes to ECR →
`helm upgrade --set image.tag=<sha>` → changed pod spec → rolling update gated by
the `/healthz` readiness probe. Full narrative in
[deployment-flow.md](deployment-flow.md).
