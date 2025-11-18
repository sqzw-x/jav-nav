# Implementation Plan

## Module Breakdown

1. **Rule Types (`src/rules/types.ts`)**
   - Define `SiteRule`, `UrlMatcher`, `PageGuard`, `Extractor`, `EntryPoint`, and `UiPlacementRule` per design plan.
   - Include helper discriminated unions for guard/extractor methods to ensure input validation and type narrowing.

2. **Rule Store (`src/rules/store.ts`)**
   - Provide async APIs to load/save/import/export `SiteRule[]` using Tampermonkey storage when available, otherwise `localStorage`.
   - Enforce keyword uniqueness and expose validation errors for the Options UI (future work) via `RuleValidationError` objects.

3. **Execution Context (`src/engine/context.ts`)**
   - Create `RuleExecutionContext` encapsulating `URL`, `Document`, cached DOM queries, and memoized regex results.
   - Provide helper methods `querySelector`, `textContent`, and `cacheResult` for reuse by guards/extractors.

4. **Rule Engine (`src/engine/index.ts`)**
   - Implement keyword pre-filtering, URL matcher evaluation, guard execution with priority, identifier extraction, identifier registry, and auto link generation from entry points.
   - Surface detailed tracing hooks for debugging (keyword hits, guard decisions, extractor outputs, link availability).

5. **UI Renderer (`src/ui/renderer.tsx`)**
   - Render a React portal anchored via `UiPlacementRule` with Ant Design components (`Card`, `List`, `Tag`).
   - Display auto-generated cross-site links, target site name, and quick actions.

6. **Content Script (`src/userscript.tsx`)**
   - Initialize rule store, listen to `DOMContentLoaded` and SPA navigations (history API + `popstate`).
   - On each navigation, run the rule engine and send results to the UI renderer.
   - Debounce DOM mutation triggers (200 ms) to avoid redundant work.

7. **Utilities (`src/utils/*`)**
   - Logger, SPA observer, template interpolation, and identifier normalization helpers extracted for reuse.
