# Document Save Race Conditions

## Summary

The document editing surface had race conditions in autosave flows.

The main symptom was stale data winning over newer local edits when multiple save requests overlapped. This was most visible in editor content, where typed text could briefly revert to an older value after a delayed PATCH response arrived.

## Symptoms

### Content

Example:

1. Content is `val`
2. User types `value`
3. An older PATCH response returns with `val`
4. The editor receives stale `content`
5. The UI appears to revert from `value` back to `val`

### Title

Title changes had the same general risk class: multiple edits can happen while a save is in flight. The title flow already had serialization logic, so it was more protected than content.

## Root Cause

The underlying problem was not debounce by itself. The problem was overlapping save requests plus cache writes from stale responses.

For content:

- saves were debounced, but not serialized
- older PATCH responses could still update the document cache
- the editor treated incoming `document.content` as authoritative
- stale cache state could overwrite fresher local editor state

The critical behavior was in the editor client:

- when `content` prop changed, the editor ran `replaceBlocks(...)`
- that made any stale cache write immediately visible in the editor UI

## Affected Areas

- `apps/app/src/app/[workspaceSlug]/(workspace)/[documentId]/_components/document-screen/document-screen.tsx`
- `apps/app/src/app/[workspaceSlug]/(workspace)/[documentId]/_components/document-screen/_hooks/use-document-title.ts`
- `apps/app/src/components/editor/blocknote-editor-client/blocknote-editor-client.tsx`

## Fix Pattern

Use a latest-wins single-flight save queue.

Rules:

1. Only one save request may be in flight for a document field at a time.
2. New edits replace the pending value instead of starting parallel saves.
3. When the in-flight request finishes, flush the latest pending value.
4. Do not let stale responses restore older content into cache/UI.

This pattern is now shared through:

- `apps/app/src/app/[workspaceSlug]/(workspace)/[documentId]/_components/document-screen/_hooks/use-latest-wins-save-queue.ts`

## Why Content Needs Extra Care

Title and content now share the same queue pattern, but content still needs stricter cache handling.

For title, merging server response back into cache is usually safe.

For content, local editor content must remain authoritative until the newest queued save completes. Otherwise an older response can repaint stale text into the editor.

## Implementation Note

This issue is broader than BlockNote itself. BlockNote made the symptom obvious because it rehydrates from `content` props, but the actual defect was document save ordering and stale cache reconciliation.
