# NEXI Preproduction Recovery and Rollback Runbook

## Scope

This runbook applies only to isolated local or approved non-production environments until the user explicitly approves staging or production actions.

## Preconditions

1. Confirm the target environment and deployment version.
2. Confirm PostgreSQL backup freshness and restore destination.
3. Confirm Redis is disposable and is not treated as financial authority.
4. Confirm the migration receipt and current application health evidence.
5. Record a correlation ID, operator, reason, and before-state evidence.

## Recovery sequence

1. Stop accepting new traffic through the approved edge/runtime control.
2. Preserve logs, health responses, migration output, and database metadata.
3. Restore PostgreSQL only into the approved recovery database.
4. Apply only the reviewed forward migration set; never rewrite historical migrations or use Prisma db push.
5. Start the backend with runtime-injected secrets and verify /healthz, /readyz, /ops/live, and /ops/ready.
6. Verify ledger reconciliation, idempotency replay, authorization boundaries, and affected domain smoke flows.
7. Reconnect realtime transport only after PostgreSQL readiness passes.
8. Re-enable traffic after an independent operator confirms the evidence.

## Rollback decision

Rollback is permitted only for an approved non-production or staging operation. Production rollback requires explicit current-turn approval.

The rollback record must include:

- target version and replacement version;
- migration compatibility decision;
- backup identifier and restore result;
- health/readiness evidence;
- financial reconciliation evidence;
- authorization and realtime smoke results;
- operator, reason, timestamp, and approval record.

## Prohibited actions

- No destructive reset of a shared or production database.
- No direct balance mutation.
- No Cloudflare, DNS, credential, secret, or production mutation without explicit approval.
- No claim of rollback proof until a disposable or explicitly approved environment has completed the sequence and produced dated evidence.
