# ADR-001: Use IndexedDB for Local Document Draft Persistence

## Status

Proposed

## Date

2026-07-19

## Context

The app needs client-side draft persistence for document editing.

Requirements:

- Persist unsaved document content across refreshes and browser crashes
- Support offline recovery of in-progress edits
- Survive browser restarts
- Avoid blocking the editor on network availability
- Keep the server as the source of truth for canonical document state

Current behavior before this decision:

- Document edits rely on in-memory editor state plus remote autosave
- A refresh or tab/browser crash before autosave can lose recent edits
- The app has no durable local recovery layer for document content

Constraints:

- Persistence must work in the browser without introducing a backend dependency
- The solution must handle structured editor content
- The first version should be minimal and focused on recovery, not full offline collaboration
- The implementation should fit the route-local structure used by the document screen

## Options Considered

### Option A: No local persistence

- Pros:
  - Simplest implementation
  - No client-side storage complexity
- Cons:
  - Unsaved edits can be lost on refresh, crash, or offline interruption
  - Does not meet recovery requirements

### Option B: localStorage

- Pros:
  - Very simple browser API
  - Easy to inspect during development
- Cons:
  - Poor fit for larger structured document payloads
  - Synchronous API can block the main thread
  - Weak querying and lifecycle support
  - Less suitable for scaling beyond trivial draft storage

### Option C: IndexedDB with a small wrapper library

- Pros:
  - Durable browser storage designed for larger structured data
  - Asynchronous API
  - Survives refreshes, crashes, and browser restarts
  - Good fit for document draft recovery and future offline features
- Cons:
  - More implementation complexity than localStorage
  - Requires careful handling of timing, recovery, and sync state

### Option D: Full offline-first local database and sync engine

- Pros:
  - Strong long-term foundation for advanced offline workflows
  - Can support queued mutations and broader local caching
- Cons:
  - Significantly more complexity than current requirements justify
  - Higher risk of introducing sync and conflict bugs
  - Over-scoped for initial recovery needs

## Decision

We choose **IndexedDB** as the client-side persistence layer for local document drafts.

For the initial implementation:

- IndexedDB is used only for **document draft recovery**
- The server remains the **source of truth**
- We store **one draft record per document**
- We do not implement a full offline mutation queue in v1
- We use **Dexie** as a small wrapper over IndexedDB for schema management and ergonomics

The first version focuses on:

- persisting unsaved document content locally
- restoring recoverable drafts after refresh, crash, or restart
- supporting offline recovery
- clearing local drafts after successful remote save
- warning the user if they try to leave before local persistence completes

## Rationale

IndexedDB is the best fit because it meets the persistence requirements without forcing the app into a full offline-first architecture.

This decision keeps scope narrow:

- durable local recovery is added now
- broader sync, outbox, and conflict workflows remain optional later
- the implementation can evolve without replacing the storage foundation

Dexie is preferred over raw IndexedDB because it reduces boilerplate and makes versioned schema changes easier to maintain.

## Consequences

### Positive

- Unsaved drafts can survive refreshes and browser restarts
- The editor becomes more resilient to crashes and connectivity issues
- The app has a clear foundation for future offline improvements

### Negative

- The client now has additional persistence and recovery state to manage
- Recovery flows must distinguish between:
  - not yet persisted locally
  - persisted locally but not synced remotely
  - fully synced
- Incorrect handling can cause false restore prompts or stale draft behavior

### Neutral

- The initial design is intentionally limited to draft persistence, not full offline editing semantics
- Additional ADRs may be needed if we later add:
  - mutation outbox
  - attachment/blob persistence
  - multi-device conflict resolution
  - broader offline browsing support

## Implementation Notes

Initial scope:

- database: `camilleDrafts`
- table/store: `documentDrafts`
- key: `{workspaceSlug}:{documentId}`

Stored fields:

- `id`
- `workspaceSlug`
- `documentId`
- `content`
- `baseVersion`
- `updatedAt`
- `syncState`
- `lastError` (optional)

Operational rules:

- Persist local draft before remote autosave completes
- Delete draft after confirmed successful remote save
- If local draft content matches server content on reload, discard it silently
- If local draft differs, offer recovery
- Warn on page unload when local changes have not yet been durably written

## Follow-up

Potential future work, if requirements grow:

- add retryable outbox for offline mutations
- improve conflict handling beyond simple restore prompt
- add stale draft cleanup policy and observability
- add integration and end-to-end coverage for refresh, crash, and offline recovery flows
