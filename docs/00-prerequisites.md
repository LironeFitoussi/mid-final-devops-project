# Prerequisites & Guardrails — read before you start

These are the most common failure points. Ignoring them will get you stuck at
`apply` or at deploy time. Each note says **which layer it blocks**.

---

## Critical failure points

1. **At least two AZs.** *(blocks Layer 1)*
   EKS requires subnets in two different Availability Zones. Building in a single
   AZ fails at `apply`.

2. **Subnet tagging (critical for LoadBalancer).** *(blocks Layer 2)*
   - On **all** subnets: `kubernetes.io/cluster/<cluster-name> = shared`
   - On **public** subnets: `kubernetes.io/role/elb = 1`

   Without these tags, a `LoadBalancer` Service simply never gets an external
   address.

3. **EKS API permission mapping.** *(set up in Layer 1; required by Layer 5)*
   The IAM identity the CI authenticates with is **not** the same as the cluster
   creator, so it has no automatic access. Map it explicitly via **EKS Access
   Entries** (recommended) or the `aws-auth` ConfigMap. Without it, `kubectl` /
   `helm` return `Unauthorized` even though `update-kubeconfig` succeeded.

4. **Cluster endpoint = public** (or public + private). *(blocks Layer 5)*
   If the endpoint is private-only, the GitHub runner cannot reach it.

5. **Account permissions.** *(blocks Layer 1)*
   Creating IAM Roles and EKS requires broad permissions. Confirm in advance that
   the training account has them.

6. **Pulling images from ECR needs no pull secret.** *(informational; Layers 4–6)*
   The node IAM role handles it automatically. This is why the real deployment
   pulls from ECR rather than Docker Hub.

---

## Cost guardrails

Limit costs and stay aware of them:

- **EKS Control Plane** — fixed hourly charge, regardless of usage.
- **NAT Gateway** — ongoing cost (consider a single NAT for the base).
- **LoadBalancer** — hourly cost.
- Limit: `t3.medium`, up to **2 nodes**. Enable **Budget Alerts**.

> AWS prices change — verify against the official pricing page before starting the
> lab. See [cost-analysis.md](cost-analysis.md) for the full breakdown.
