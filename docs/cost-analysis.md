# Cost Analysis

Which resources are created, what costs money, and how to reduce it. (Required
documentation deliverable.)

> **AWS prices change** — verify against the official AWS Pricing pages before the
> lab and fill in the real numbers for your region. The figures below are
> placeholders to be confirmed.

## Resources created (by layer)

| Resource | Created in | Cost driver |
|----------|-----------|-------------|
| VPC, subnets, route tables, SGs | [Layer 1](01-infrastructure.md) | Mostly free |
| **NAT Gateway** | Layer 1 | **Hourly + data processing** |
| EKS Control Plane | Layer 1 | **Fixed hourly charge** |
| Managed Node Group (`t3.medium` ×2) | Layer 1 | **EC2 hourly** |
| ECR Repository | Layer 1 | Storage per GB + data transfer |
| **LoadBalancer (ELB)** | [Layer 2](02-smoke-test.md) / [Layer 3](03-kubernetes-helm.md) | **Hourly + LCU** |

## What's expensive

1. **EKS Control Plane** — charged per hour the cluster exists, regardless of
   usage. The clock starts at `apply` and stops only at `destroy`.
2. **NAT Gateway** — ongoing hourly charge plus per-GB data processing.
3. **EC2 nodes** — 2 × `t3.medium`, hourly.
4. **LoadBalancer** — hourly charge per ELB. An **orphaned** ELB (from a skipped
   smoke-test cleanup) keeps billing silently.

## How to reduce cost

- **Single NAT Gateway** for the base instead of one per AZ.
- Keep the node group at the **`t3.medium`, 2-node** guardrail; don't scale up.
- **Tear down promptly** — run [`terraform destroy`](08-teardown.md) when done;
  the control plane and NAT bill by the hour even while idle.
- **Delete LoadBalancer Services** you no longer need (and always before destroy)
  to avoid orphaned ELBs.
- Enable **AWS Budgets alerts** so you're notified before a surprise bill.

## Guardrails (enforced for this lab)

- Node group limited to `t3.medium`, **up to 2 nodes**.
- **Budget Alerts** enabled.
- Consider a **single NAT Gateway**.

See [Prerequisites → Cost guardrails](00-prerequisites.md#cost-guardrails).
