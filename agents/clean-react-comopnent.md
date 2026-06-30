# Clean React Components

Rule: keep React components focused on rendering, event wiring, and small view-specific state. Move static catalogs, data shaping, normalization rules, and reusable state orchestration into nearby modules, hooks, or domain code.

Bad:

```tsx
'use client'

const currencyLabelById = {
  USD: '$ United States Dollar (USD)',
  EUR: 'EUR Euro (EUR)',
}

function localeToLanguageOption(locale: string) {
  // mapping logic
}

export function UserPreferenceDialog() {
  const [state, setState] = useState({
    region: 'US',
    language: 'en',
    currency: 'USD',
  })

  useEffect(() => {
    // hydrate state from current user preferences
  }, [currentUserPreferences])

  useEffect(() => {
    // normalize language and currency from selected market
  }, [selectedMarket])

  const onSubmit = async () => {
    // persist
    // invalidate queries
    // close modal
  }

  return <Dialog>{/* full form */}</Dialog>
}
```

Use this instead:

```tsx
'use client'

import { useUserPreferenceForm } from './_hooks/use-user-preference-form'
import { currencyOptionsById } from './preference-options'

export function UserPreferenceDialog() {
  const {
    state,
    regionOptions,
    currencyOptions,
    selectedCurrencyOption,
    submit,
  } = useUserPreferenceForm({
    currentUserPreferences,
    marketConfig,
  })

  return <Dialog>{/* render and bind only */}</Dialog>
}
```

Preferred split:
- component `.tsx`: JSX, prop wiring, event handlers, accessibility attributes, and minimal view state
- local hook: hydration, derived options, normalization rules, async submit flow, query invalidation
- local constants/module: static labels, option catalogs, formatter helpers, schema helpers
- domain module: API requests, validation, transforms, and cross-feature business rules
- shared module: only promote logic to [`src/components/`](../src/components/) or shared hooks when multiple routes actually use it

Local file structure:
- if a route-specific component needs support files, keep them under that route tree in `src/app/...`
- use private folders like `_components/`, `_hooks/`, and `_forms/` for route-local code
- keep reusable cross-route UI in [`src/components/`](../src/components/)
- do not move route-private helpers into global shared folders just to avoid creating a local folder
- if a shared component needs several private support files, convert it into a local folder under `src/components/`

Guidelines:
- if a component starts carrying large constant maps, transformation helpers, multiple `useEffect` blocks, and submit side effects together, split it
- prefer computing derived values in hooks or helpers instead of inside large JSX expressions
- avoid parsing display values back into state; store explicit fields like `id`, `label`, and `symbol`
- prefer one explicit state transition path over multiple effects mutating the same state indirectly
- server components should stay server-first; add `'use client'` only when the component truly needs browser interactivity
- keep dead commented code only when intentionally preserved for imminent work; otherwise remove it

Performance and delivery:
- extracting logic into hooks improves readability, but it does not reduce bundle size by itself
- lazy load client-only or heavy UI when it is not needed for initial render, especially dialogs, drawers, editors, admin panels, and secondary sidebars
- prefer dynamic `import()` at interaction boundaries or large route surfaces
- avoid pulling heavy client dependencies into always-mounted layouts and shells
- do not confuse hook extraction with code splitting: eagerly imported hooks still ship eagerly

Examples:

```tsx
import dynamic from 'next/dynamic'

const PreferencesDialog = dynamic(() => import('./_components/preferences-dialog'))
```

```tsx
const handleOpen = async () => {
  const { openPreferencesDialog } = await import('./_lib/open-preferences-dialog')
  openPreferencesDialog()
}
```

```tsx
// Cleaner structure, but still eager in the bundle
import { useProductEditorForm } from './_hooks/use-product-editor-form'
```

Reason:
- keeps components easy to scan
- reduces effect-driven state coupling
- makes business rules testable outside JSX
- keeps route-specific refactors local by default
- aligns with the co-located file rule for `src/app/`
- makes the boundary between code cleanup and bundle optimization explicit
