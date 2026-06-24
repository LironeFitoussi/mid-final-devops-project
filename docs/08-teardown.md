# Teardown (required deliverable)

## Goal
Destroy **all** resources cleanly so the account isn't billed after the lab.

## Depends on / Blocks
- **Depends on:** everything created in Layers 1–6.
- **Blocks:** nothing — this is the final step.

## The order matters
Two cluster-created resources block a clean `terraform destroy` and keep billing
if left behind:

1. The **ELB/ENIs** created by the app's `LoadBalancer` Service block VPC deletion.
2. The **EBS volume** behind MongoDB's PVC keeps costing money and can linger if
   the PVC isn't removed.

Uninstall the Helm release (which removes the Service → ELB, and the PVC → EBS
volume if the chart doesn't mark it `keep`) **before** `terraform destroy`, and
verify both are actually gone.

> If you skipped the [Layer 2 cleanup](02-smoke-test.md#cleanup-before-layer-3-required),
> there may also be an orphaned smoke-test ELB — remove it too.

## Tasks
1. Uninstall the Helm release (removes the app + MongoDB workloads, the Service →
   ELB, and the PVC → EBS volume).
2. Confirm no LoadBalancer ELB/ENIs **and** no leftover PVC/EBS volume remain.
3. Run `terraform destroy`.

## Acceptance Criteria
- [ ] `terraform destroy` runs cleanly and deletes **all** resources
- [ ] No orphaned ELB, ENI, or EBS volume remains in the account

## Verification
```bash
helm uninstall <release> -n <ns>
kubectl get svc -A                 # no LoadBalancer Services remain
kubectl get pvc -A                 # no MongoDB PVC remains (delete it if it lingers)
# In AWS: confirm the ELB(s)/ENIs and the EBS volume are gone before destroying
aws ec2 describe-volumes --filters Name=tag:kubernetes.io/created-for/pvc/name,Values=* \
  --query 'Volumes[].VolumeId'    # should be empty

terraform destroy
terraform show                     # empty state
aws ecr describe-repositories      # repository gone
```

## Notes / decisions
<!-- Anything that blocked destroy and how you cleared it. -->
