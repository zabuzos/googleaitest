# Security Specification - Animal War

## Data Invariants

1.  **Identity Integrity**: The `userId` or `ownerId` field in any document MUST match the `request.auth.uid` of the user performing the write (create/update).
2.  **Relational Sync**: Players can only exist within the context of an existing match.
3.  **Progression Ownership**: `UserStats` documents are strictly private and can only be accessed or modified by the owner (`userId` in path matches `auth.uid`).
4.  **Temporal Integrity**: All `updatedAt`, `timestamp`, and `startTime` fields MUST use `request.time` (server timestamp).
5.  **State Immortality**: Once a match status is `FINISHED`, further updates to match data (winner, capturePoints) are restricted.
6.  **Schema Strictness**: All writes must conform to the defined set of keys and types. No "ghost fields" or type poisoning.
7.  **Match Access**: Any authenticated user can create or join a match, but they can only modify their own sub-resource (their own player document).

## The "Dirty Dozen" Payloads (Red Team Test Cases)

| ID | Target | Intent | Payload | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| D1 | `/matches/{mID}/players/{pID}` | Identity Spoofing | `{ "userId": "attacker", "name": "Fake", "team": "NATO", ... }` | `PERMISSION_DENIED` |
| D2 | `/matches/{mID}/players/{victimID}` | Permission Escalation | `{ "x": 500, "y": 500 }` (where victimID != auth.uid) | `PERMISSION_DENIED` |
| D3 | `/users/{targetID}/stats/main` | Progression Theft | `{ "xp": 999999, "level": 100 }` | `PERMISSION_DENIED` |
| D4 | `/matches/{mID}` | Resource Poisoning | `{ "capturePoints": [{ "id": "massive", "progress": 100 }, ... x 1000] }` | `PERMISSION_DENIED` |
| D5 | `/matches/{mID}` | State Corruption | `{ "status": "INVALID_STATE" }` | `PERMISSION_DENIED` |
| D6 | `/matches/{mID}/projectiles/{pID}` | Value Poisoning | `{ "damage": -1000, "ownerId": "auth_uid", ... }` | `PERMISSION_DENIED` |
| D7 | `/matches/{mID}/players/{pID}` | Ghost Field Injection | `{ ..., "isVerifiedAdmin": true }` | `PERMISSION_DENIED` |
| D8 | `/users/{auth_uid}/stats/main` | Type Poisoning | `{ "unlockedWeapons": "not-an-array", ... }` | `PERMISSION_DENIED` |
| D9 | `/matches/{mID}` | Batch Overflow | Creating 500 matches in one batch. | Rate Limited / Rejected |
| D10 | `/matches/{mID}/projectiles/{pID}` | Identity Masking | `{ "ownerId": "someone_else", ... }` | `PERMISSION_DENIED` |
| D11 | `/matches/{mID}` | Read Blanket | Reading all matches without filters. | Restricted (only active) |
| D12 | `/users/{auth_uid}/stats/main` | Immutable Field Update | Changing `userId` if it was in the data. | `PERMISSION_DENIED` |

## Test Runner (firestore.rules Bureau)

I will use standard Firestore rules testing patterns to verify these.
