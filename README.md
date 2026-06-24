# mid-final-devops-project

**Integration Lab — Platform Deployment on AWS / EKS**

A summative lab for the first part of the course. The goal: connect everything
learned so far into one working DevOps solution — from a code **push** all the
way to an automated **deployment** in the cloud.

> A company is moving an application to the cloud and provides only source code,
> a `Dockerfile`, and a ready-made image. The DevOps team must stand up the
> entire platform — Infrastructure, Cluster, Registry, Packaging, and Automated
> Deployment — until a push to code triggers an automatic deployment.

---

## How to use this repo

This repository currently contains the **lab workbook** (`docs/`). Each layer of
the project has its own document with a goal, ordered tasks, an acceptance
checklist, common pitfalls, and verification commands. Work through them in
order — the numbering matches the build order.

The code directories (`terraform/`, `helm/`, `app/`, `.github/workflows/`) are
**not** created yet; you build them as you complete each layer.

## Documentation index

Read these in order:

| # | Document | What it covers |
|---|----------|----------------|
| — | [Overview](docs/00-overview.md) | Scenario, scope, what's provided, evaluation, timeline, submission |
| — | [Prerequisites & Guardrails](docs/00-prerequisites.md) | The 6 critical failure points + cost guardrails — **read first** |
| 1 | [Infrastructure (Terraform)](docs/01-infrastructure.md) | VPC, subnets, IAM, EKS, node group, ECR |
| 2 | [Smoke Test](docs/02-smoke-test.md) | First deploy from the ready-made image — *early win* |
| 3 | [Kubernetes + Helm](docs/03-kubernetes-helm.md) | Custom, values-driven Helm chart |
| 4 | [Registry (ECR)](docs/04-registry-ecr.md) | ECR auth + immutable tagging |
| 5 | [CI/CD (GitHub Actions)](docs/05-cicd.md) | build → push → `helm upgrade` |
| 6 | [Release Process](docs/06-release.md) | Versioned release via the pipeline; the `latest` trap |
| 7 | [Troubleshooting](docs/07-troubleshooting.md) | Injected-fault diagnosis workflow |
| — | [Teardown](docs/08-teardown.md) | Clean `terraform destroy` (delete the LB Service first) |

### Documentation deliverables

| Document | What it covers |
|----------|----------------|
| [Architecture](docs/architecture.md) | Diagram + traffic flow |
| [Deployment Flow](docs/deployment-flow.md) | Push → running pod narrative |
| [Cost Analysis](docs/cost-analysis.md) | Resources created, what's expensive, how to reduce |
| [Technical Decisions](docs/technical-decisions.md) | Why these modules/approaches; how updates work |

---

## Target repository layout

```
project/
├── terraform/          # VPC, EKS, node group, ECR
├── helm/               # Custom chart
├── app/                # source code + Dockerfile (provided)
├── .github/
│   └── workflows/      # CI/CD pipeline
├── docs/               # architecture, costs, decisions (this workbook)
└── README.md
```

## Application spec (provided)

- **Port:** `8080`
- **Health endpoint:** `GET /healthz` (returns `200`)
- **Ready-made image:** `course/sample-app:1.0.0` (Docker Hub) — smoke test only
- **`Dockerfile`:** provided and valid — the CI builds from it
