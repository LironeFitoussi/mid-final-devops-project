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

## Packaging: a single custom Helm chart, two Deployments

- **Decision:** one custom chart is the **only** deployment source (no raw
  manifests after the smoke test), and it deploys **two workloads** — the
  MemeForge app and MongoDB.
- **Why:** one source of truth and one `helm upgrade` for the whole release,
  parameterised via `values.yaml` (app image, replicas, service, plus a
  `mongodb` block) so the CI can drive upgrades cleanly.

## Datastore: in-cluster MongoDB (vs Atlas)

- **Decision:** run MongoDB **in the cluster** via the same Helm chart, backed by
  a PVC, rather than using managed MongoDB Atlas.
- **Why:** keeps the whole stack self-contained and reproducible with one
  `helm install`/`helm uninstall`, and makes teardown a single, demonstrable
  flow. Atlas is the better production choice (offloads HA/backups) and is a valid
  alternative — see [app/README.md → Deployment note](../app/README.md#deployment-note--mongodb-dependency).

## MongoDB topology: single-replica Deployment

- **Decision:** MongoDB is a **single-replica Deployment** with one PVC.
- **Why:** simplest thing that works for the lab. A multi-node MongoDB requires a
  **StatefulSet** (stable network IDs + per-replica volumes); scaling a
  Deployment-based Mongo past 1 corrupts data. StatefulSet/replica-set MongoDB is
  a [bonus](00-overview.md#bonus-optional--not-required-for-the-base-timeline).

## App ↔ DB wiring: `MONGODB_URI` via Secret

- **Decision:** the app reads `MONGODB_URI` from a Kubernetes **Secret**, pointing
  at the MongoDB `ClusterIP` Service (`mongodb://<release>-mongodb:27017/memeforge`).
- **Why:** keeps connection details (and any credentials) out of the image and out
  of `values.yaml` plaintext; the DB is internal-only (never a LoadBalancer).

## Persistent storage: EBS CSI driver + gp3

- **Decision:** install the `aws-ebs-csi-driver` EKS addon (IRSA) with a default
  `gp3` StorageClass; MongoDB's PVC provisions an EBS volume dynamically.
- **Why:** EKS does not ship dynamic EBS provisioning by default — without the
  driver the PVC stays `Pending`. `gp3` is cheaper/faster than `gp2`.

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
