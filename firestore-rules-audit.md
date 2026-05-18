# Firestore Rules Audit

Date: 2026-05-19

Database: `projects/cognitive-kinetic/databases/(default)`
Edition: `STANDARD`
Type: `FIRESTORE_NATIVE`

## Client paths found

- `users/{uid}`: auth profile metadata from `AuthContext`.
- `users/{uid}/profile/main`: saved business profile.
- `users/{uid}/settings/newsFeed`: news prompt and source setup.
- `users/{uid}/feedItems/{itemId}`: active feed cache, manual paste items, saved/status updates, dismiss delete.
- `users/{uid}/archivedFeedItems/{itemId}`: archive modal read.
- `users/{uid}/analysisRuns/{runId}`: report history read, ordered by `createdAt desc`.
- `users/{uid}/analysisRuns/{runId}/logs/{logId}`: execution log read, ordered by `timestamp asc`.
- `users/{uid}/mockState/main`: dashboard/simulation state read.

## Admin-only writes

Cloud Functions use Admin SDK, so security rules do not block:

- `users/{uid}/feedItems/{itemId}` agent-selected feed writes.
- `users/{uid}/archivedFeedItems/{itemId}` lifecycle archive writes/deletes.
- `users/{uid}/analysisRuns/{runId}` and nested logs.
- `users/{uid}/mockState/main`.
- `users/{uid}/simulations/{simId}`.

## Rules change needed

Existing rules allow owner `read, write` on every nested user path. Functional, but too broad.
New prototype rules should keep owner isolation while limiting client writes to known editable docs.
