# Layer 1 — Infrastructure (Terraform)

## Goal
Stand up the full AWS environment with Terraform so the rest of the lab has a
cluster, a registry, and a correctly-tagged network to run on.

## Depends on / Blocks
- **Depends on:** [Prerequisites](00-prerequisites.md) #1 (two AZs), #5 (account
  permissions).
- **Blocks:** every later layer. Layer 2 depends on the subnet tags (Prereq #2)
  being applied here.
- **Must also set up here:** the EKS API permission mapping for the CI identity
  (Prereq #3) — used later by [Layer 5](05-cicd.md). Set it up now so the
  pipeline isn't blocked by `Unauthorized` later.

## Tasks
You **may and should** use the official modules (`terraform-aws-modules/vpc`,
`terraform-aws-modules/eks`) to finish in time.

1. **VPC + Subnets** — across **2 AZs**. Apply the required tags (Prereq #2):
   - all subnets: `kubernetes.io/cluster/<cluster-name> = shared`
   - public subnets: `kubernetes.io/role/elb = 1`
2. **Security Groups & IAM Roles** — for the cluster and node group.
3. **EKS Cluster** — endpoint **public** (or public + private) so the GitHub
   runner can reach it (Prereq #4).
4. **Managed Node Group** — `t3.medium`, **2 nodes** (cost guardrail).
5. **ECR Repository** — created here; pushed to in [Layer 4](04-registry-ecr.md).
6. **EBS CSI driver** — install the `aws-ebs-csi-driver` EKS addon and its IAM
   role (IRSA), and ensure a default `gp3` StorageClass exists. Required so the
   in-cluster MongoDB PVC in [Layer 3](03-kubernetes-helm.md) can bind
   ([Prereq #7](00-prerequisites.md)).
7. **EKS access mapping** — add an Access Entry (or `aws-auth` entry) for the IAM
   identity the CI will use.
8. **Variables & outputs** — expose at least: cluster name, ECR URL, region.

## Acceptance Criteria
- [ ] `terraform apply` runs cleanly with no manual intervention
- [ ] Uses `variables` and `outputs` (at least: cluster name, ECR URL, region)
- [ ] State is managed (remote preferred; local acceptable for the base)
- [ ] Node group is limited to `t3.medium`, 2 nodes
- [ ] `aws-ebs-csi-driver` addon installed and a default StorageClass is present

## Common pitfalls
- Single-AZ build → `apply` fails (Prereq #1).
- Missing subnet tags → LoadBalancer never gets an address in Layer 2 (Prereq #2).
- Forgetting the CI access mapping now → `Unauthorized` in Layer 5 even though
  `update-kubeconfig` worked (Prereq #3).
- Private-only endpoint → the GitHub runner can't reach the API (Prereq #4).
- No EBS CSI driver / default StorageClass → the MongoDB PVC stays `Pending` in
  Layer 3 (Prereq #7).

## Verification
```bash
terraform validate
terraform plan
terraform apply
terraform output            # cluster name, ECR URL, region

aws eks update-kubeconfig --name <cluster-name> --region <region>
kubectl get nodes           # nodes should appear (Ready confirmed in Layer 2)
kubectl get storageclass    # a default StorageClass (gp3) should be present
kubectl get pods -n kube-system | grep ebs-csi   # EBS CSI driver running
aws ecr describe-repositories --region <region>
```

## Notes / decisions
<!-- Module versions, remote-state backend choice, single vs multi NAT, etc. -->
