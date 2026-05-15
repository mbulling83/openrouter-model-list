# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server — registers extension with Raycast and hot-reloads on file changes
npm run build    # Build without dev server — updates the registered extension in place
npm run lint     # Run ESLint via Raycast's config
```

Type-check only (no Raycast CLI needed):
```bash
node node_modules/typescript/bin/tsc --noEmit
```

There are no tests.

## Architecture

Single-command Raycast extension. Everything lives in `src/list-models.tsx`.

The extension fetches `https://openrouter.ai/api/v1/models` (public, no auth) on launch via `useFetch` from `@raycast/utils`, which handles loading state and caches results for the session. The response shape is `{ data: OpenRouterModel[] }`.

Each list row shows the model name (provider prefix stripped), provider slug as subtitle, and three inline tag accessories: context window, input cost, output cost. Pricing values from the API are per-token strings — multiply by 1,000,000 to get per-million-token cost. Price tags are color-coded green/orange/red by cost tier.

Primary action (`↵`): copy model ID to clipboard. Secondary action (`⌘O`): open `https://openrouter.ai/models/{id}` in browser.

## Key compatibility note

`@types/react` must stay at `^19.x` to match the version bundled inside `@raycast/api`. Using `18.x` causes JSX type errors across all Raycast components. `skipLibCheck: true` is set in `tsconfig.json` for the same reason.
