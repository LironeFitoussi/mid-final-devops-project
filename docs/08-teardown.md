# Teardown (required deliverable)

## Goal
Destroy **all** resources cleanly so the account isn't billed after the lab.

## Depends on / Blocks
- **Depends on:** everything created in Layers 1–6.
- **Blocks:** nothing — this is the final step.

## The order matters
`destroy` on EKS frequently fails because the **ELB/ENIs created by the
LoadBalancer Service** block VPC deletion. Delete the Helm-managed Service (and
its LoadBalancer) **before** `terraform destroy`.

> If you skipped the [Layer 2 cleanup](02-smoke-test.md#cleanup-before-layer-3-required),
> there may also be an orphaned smoke-test ELB — remove it too.

## Tasks
1. Uninstall the Helm release (removes the Service → triggers ELB deletion).
2. Confirm no ELB/ENIs created by the Service remain in AWS.
3. Run `terraform destroy`.

## Acceptance Criteria
- [ ] `terraform destroy` runs cleanly and deletes **all** resources

## Verification
```bash
helm uninstall <release> -n <ns>
kubectl get svc -A                 # no LoadBalancer Services remain
# In AWS: confirm the ELB(s) and their ENIs are gone before destroying

terraform destroy
terraform show                     # empty state
aws ecr describe-repositories      # repository gone
```

## Notes / decisions
<!-- Anything that blocked destroy and how you cleared it. -->
