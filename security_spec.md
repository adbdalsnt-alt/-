# Security Specification - Sumer Platform

## 1. Data Invariants
- **Identity Integrity**: All user-specific data (interactions) must match the `request.auth.uid`.
- **Relational Integrity**: `ChatInteraction` docs must link to a valid student if applicable.
- **Administrative Control**: Academic records (`students`) are read-only for public/students and writeable only by identified administrators.
- **Audit Immutability**: `activities` logs cannot be edited or deleted once written.
- **Temporal Integrity**: All `createdAt` and `updatedAt` fields must align with `request.time`.

## 2. The "Dirty Dozen" Payloads (Shadow Attacks)

### Attack 1: Identity Spoofing (Interactions)
```json
{
  "studentId": "victim_uid_123",
  "message": "malicious message",
  "response": "fake response",
  "timestamp": "server_timestamp"
}
```
*Expected: PERMISSION_DENIED (UID Mismatch)*

### Attack 2: Privilege Escalation (Results)
```json
{
  "results": { "math": 100 },
  "updatedAt": "server_timestamp"
}
```
*Expected: PERMISSION_DENIED (Non-Admin)*

### Attack 3: Shadow Field Injection
```json
{
  "name": "John Doe",
  "isVerified": true, // Ghost field
  "grade": "1st Primary",
  "createdAt": "server_timestamp"
}
```
*Expected: PERMISSION_DENIED (Unauthorized Keys)*

### Attack 4: Timestamp Manipulation
```json
{
  "message": "hi",
  "timestamp": "2020-01-01T00:00:00Z"
}
```
*Expected: PERMISSION_DENIED (Must be request.time)*

## 3. Test Runner (Conceptual)
Tests will verify that any write to `/students/` by a non-admin is blocked, and any write to `/chatInteractions/` where `studentId != auth.uid` is blocked.
