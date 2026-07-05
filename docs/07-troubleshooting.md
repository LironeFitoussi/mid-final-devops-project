# Layer 7 — Troubleshooting (injected fault)

## Goal
The instructor injects **one predefined fault** (the same set for every student,
for fairness). You must identify it, explain the root cause, and fix it.

## Depends on / Blocks
- **Depends on:** a working deployment from [Layer 6](06-release.md).
- **Blocks:** nothing.

## Fault catalog (one of these)
| Injected fault | Symptom |
|----------------|---------|
| Wrong image tag | `ImagePullBackOff` |
| `limits` too low | `OOMKilled` |
| Readiness probe on wrong path | pod never reaches `Ready` |
| Selector not matching labels | Service has no endpoints |
| Wrong `MONGODB_URI` / Mongo Service name | app runs but `/readyz` → `503`, logs show DB connection errors |
| MongoDB PVC unbound | mongo pod stuck `Pending`, app can't connect |

## Acceptance Criteria
- [ ] Identify the fault (`kubectl describe` / `logs` / `get events`)
- [ ] Describe the root cause in words
- [ ] Fix it and bring the application back to a healthy state

## Diagnosis workflow
```bash
kubectl get pods -n <ns>                    # status: Pending / CrashLoop / ImagePullBackOff?
kubectl describe pod <pod> -n <ns>          # events: pull errors, OOMKilled, probe failures
kubectl logs <pod> -n <ns>                  # app-level errors
kubectl get events -n <ns> --sort-by=.lastTimestamp
kubectl get endpoints <svc> -n <ns>         # empty? selector/label mismatch
kubectl get pvc -n <ns>                     # Pending? Mongo storage not provisioned
curl -s http://<EXTERNAL-IP>:8080/readyz    # 503? app can't reach MongoDB
```

### Symptom → likely cause
- `ImagePullBackOff` → wrong/nonexistent image tag (fix the tag in values/CI).
- `OOMKilled` → memory `limits` too low (raise limits in the chart).
- Pod `Running` but never `Ready` → readiness probe path/port wrong (point it at
  `/healthz:8080`).
- Service reachable but 503 / no endpoints → Service `selector` doesn't match pod
  labels (align them).
- App `Running` but `/readyz` 503 → wrong `MONGODB_URI` / Mongo Service name, or
  MongoDB not running (check the mongo pod, its Service, and the Secret).
- Mongo pod stuck `Pending` → PVC unbound: no EBS CSI driver or default
  StorageClass ([Layer 1](01-infrastructure.md) / [Prereq #7](00-prerequisites.md)).

## Verification
```bash
kubectl get pods -n <ns>                    # all Running and Ready
kubectl get endpoints <svc> -n <ns>         # populated
curl -i http://<EXTERNAL-IP>:8080/healthz   # 200
```

## Notes / decisions
<!-- Which fault, how you spotted it, the exact fix applied. -->
