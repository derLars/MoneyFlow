# MoneyFlow Test Anomalies - MF-HUGE-001

## Test Summary
- **Date**: 2026-05-09
- **Status**: COMPLETED
- **Test Plan**: MF-HUGE-001.md (Huge User Test with 50 users, 28 projects, 32 purchases)

---

## Phase 1: User & Project Creation

### Status: COMPLETED (50 users, 28 projects)

All 50 users created successfully via `POST /api/auth/users`
All 28 projects created successfully via `POST /api/projects`
150 participant links added (each user in 3 projects = 50×3 = 150)

---

## Phase 2: Purchase Creation

### Status: COMPLETED (32 purchases)

All purchases created successfully after test plan corrections.

---

## Phase 3: Payment Recording

### Status: COMPLETED (15 payments)

All 15 payments recorded successfully using correct API schema.

---

## Phase 4: User Deletions

### Status: COMPLETED (12 deletions)

12 users deleted across 3 phases.

---

## Phase 5: MoneyFlow Balance Verification

### Status: PASSED

MoneyFlow algorithm correctly handles all scenarios including deleted users.

---

## Anomalies List (5 items)

| # | Description | Resolution |
|---|-------------|------------|
| 1 | **Test Plan Inconsistency - Participant Mismatch**: 4 purchases (PUR-A04, PUR-C05, PUR-D03, PUR-D04) listed incorrect participants in their definitions | **Resolved**: Test plan updated to match actual project participant assignments. Purchases were recreated with correct participants. |
| 2 | **Purchase Validation Strictness**: API correctly rejects purchases where payer/contributors are not project participants | **No resolution needed**: This is expected/correct behavior. The API validates data integrity. |
| 3 | **Payment API Schema Mismatch**: Test plan used `from_user`/`to_project` fields but actual API uses `payer_user_id`/`receiver_user_id`/`project_id` | **Resolved**: Test plan updated with correct API schema documentation (see Section 6). |
| 4 | **Deleted Users Show as "Deleted User XX"**: After deletion, users are anonymized but MoneyFlow still calculates balances correctly | **No resolution needed**: This is expected behavior - system maintains referential integrity while anonymizing deleted users. |
| 5 | **Self-Deletion Not Supported via API**: Only admin can delete users via API; regular users cannot self-delete | **No resolution needed**: This is correct security behavior. Self-deletion requires frontend UI testing. |

---

## Overall Test Result: PASSED

All critical paths tested successfully:
- 50 users created
- 28 projects created with proper participant assignments
- 32 purchases created
- 15 payments recorded
- 12 users deleted in 3 phases
- MoneyFlow algorithm correctly handles deleted users in balance calculations