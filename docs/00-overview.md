# Overview — Platform Deployment on AWS / EKS

Summative integration lab for the first part of the course. It checks whether you
can connect everything learned so far into **one working DevOps solution** — from
a code push to an automated deployment in the cloud.

---

## Business scenario

A company is moving an application to the cloud and provides **only** source code,
a `Dockerfile`, and a ready-made image. The DevOps team must stand up the entire
platform — Infrastructure, Cluster, Registry, Packaging, and Automated Deployment
— until **a push to code triggers an automatic deployment**.

---

## What is / isn't tested

**Tested:** Terraform · basic AWS · EKS · Kubernetes · Helm · GitHub Actions ·
Troubleshooting · architecture planning · working independently with documentation.

**Not tested (not taught yet):** Jenkins · Monitoring · Observability ·
GitOps / ArgoCD · Service Mesh · advanced Security.

---

## What is provided to you

To keep the project realistic in the available time, you do **not** write the
application or author the `Dockerfile`. Provided:

| Item | Detail |
|------|--------|
| Source code | **MemeForge** — a MERN-stack CMS app (MongoDB · Express · React · Node, TypeScript). See [`app/`](../app/README.md) |
| `Dockerfile` | Ready and valid — multi-stage; used by the CI to build the app image |
| Ready-made image | On Docker Hub, e.g. `course/sample-app:1.0.0` (Layer 2 smoke test only) |
| App spec | **Port:** `8080` · **Health:** `GET /healthz` → 200 · **Readiness:** `GET /readyz` (DB-aware) |
| Datastore | **MongoDB** — deployed **in-cluster** by the Helm chart as a second workload |

### Image lifecycle (read this — it removes most confusion)

There are **three** images in this lab, with distinct roles:

1. **Smoke-test image** (`course/sample-app:1.0.0`, Docker Hub) — used **only**
   for the Layer 2 smoke test, to prove the cluster and exposure work without
   depending on the pipeline.
2. **App image** — the CI (Layer 5) builds it **from the provided `Dockerfile`**
   and pushes it to ECR with an immutable tag. **This is what is actually
   deployed** in Layers 4–6 (the MemeForge app Deployment).
3. **MongoDB image** (`mongo:7`, Docker Hub) — pulled directly by the in-cluster
   MongoDB Deployment. Not built, not in ECR; the same image across releases.

> Pulling from ECR needs no pull secret — the node IAM role handles it. The public
> `mongo:7` image needs no secret either. That's why the real app deployment pulls
> from ECR, not Docker Hub.

> The Helm chart ([Layer 3](03-kubernetes-helm.md)) deploys **two workloads** —
> the app (image #2) and MongoDB (image #3) — and wires the app to the DB via
> `MONGODB_URI`.

---

## Evaluation model

| Area | Weight |
|------|--------|
| Terraform / AWS Infrastructure | 30% |
| Kubernetes | 15% |
| Helm | 20% |
| GitHub Actions (CI/CD) | 25% |
| Troubleshooting | 10% |

> Documentation is a **submission gate**; a significant gap can cost up to 10%
> of the total grade.

---

## Bonus (optional — not required for the base timeline)

- **Tier 1:** standalone Terraform modules · multiple environments · GitHub Environments
- **Tier 2:** Ingress Controller (AWS LB Controller) · External DNS · HTTPS
- **Tier 3:** HPA · IRSA · OIDC for GitHub Actions · Helm dependency charts

---

## Suggested timeline (realistic)

> Even with a ready-made image and official modules, this is a heavy project.
> Plan a buffer — an EKS `apply` alone takes ~15–20 minutes.

**Friday**
- Briefing + requirements + architecture planning
- Layer 1: Infrastructure + EKS (`apply`)
- Layer 2: Smoke test from the ready-made image ← *early win*

**Saturday**
- Layer 3: Helm chart
- Layers 4–5: ECR + CI/CD pipeline
- Layer 6: Release
- Layer 7: Troubleshooting
- Teardown + Documentation

---

## Submission checklist

- [ ] Complete repository
- [ ] Architecture diagram
- [ ] A 5–10 minute video demonstrating **code push → automatic deployment**
- [ ] Confirmation of a clean `terraform destroy`
