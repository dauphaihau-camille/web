# Co-Located Files

Use route-local placement by default.

Rules:
- Components, hooks, providers, and other files that are specific to one page or route segment belong inside that route tree under `app/`.
- Shared UI that is reused across pages belongs in [`src/components/`](../src/components/).
- Use private route helpers such as `_components/` and `_hooks/` when the code is only meant for that route subtree.

Example:

```text
app/
  (app)/
    layout.tsx
    _hooks/
    _components/
      app-shell.tsx
      app-sidebar.tsx
      app-topbar.tsx
      user-menu.tsx
      layout/
        header.tsx
        footer.tsx

    dashboard/
      page.tsx

    workspace/
      [workspaceId]/
        layout.tsx
        _components/
          workspace-shell.tsx
          workspace-sidebar.tsx
          page-tree.tsx
          workspace-provider.tsx

        page.tsx
        [pageId]/
          page.tsx
```
