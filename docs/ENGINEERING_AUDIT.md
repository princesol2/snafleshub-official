# SnaflesHub Engineering Audit

Last updated: 2026-07-19

## Current Verdict

SnaflesHub has a workable client/server foundation, but the repository is not yet organized like a production-grade web product. The highest-risk issue is deployment packaging. The highest-impact product issue is the lack of a consistent UI system.

## Critical Deployment Issues

1. The Azure workflow previously uploaded `package.json`, `client/dist`, and `server`, but the root start command uses `node startup.js`. That meant Azure could receive a deployment artifact without the file it needs to start the app.
2. The root `postinstall` script rebuilt server and client dependencies. That is unsafe for the partial Azure artifact because the artifact contains `client/dist`, not the full frontend package files.
3. The workflow deploys directly to the Production slot. There is no staging slot, health gate, or swap process.
4. Deployment success and application health were treated as the same thing. They are not the same. The workflow now includes a smoke test for `/api/health`.

## Repository Organization Issues

1. Frontend pages are too large and carry too much responsibility. `Dashboard`, `StoreView`, `CreateStore`, `Checkout`, and `CafeStudy` should be split into smaller sections, forms, hooks, and presentational components.
2. Styling is spread across global CSS, `professional.css`, and page-level CSS files. This makes buttons, cards, spacing, shadows, and responsive behavior inconsistent.
3. There is no shared UI component layer for basic primitives such as Button, Input, Select, Card, PageShell, Alert, Stepper, and EmptyState.
4. The language file is large and centralized. It should be split by page/domain once the product stabilizes.
5. There are no automated lint, format, API smoke, or browser smoke checks in the repo.

## UI/UX Problems

1. The interface feels lightweight because visual hierarchy is inconsistent. Important actions do not always have enough weight, spacing, or contrast.
2. Buttons feel inconsistent because each page styles actions independently.
3. Cards and panels use inconsistent radius, shadow, spacing, and borders.
4. Some pages feel like demos because content density, typography scale, and section rhythm are not aligned.
5. The product does not yet have one visual language. It has multiple local page styles living beside each other.

## Professional Cleanup Plan

### Phase 1: Deployment Discipline

- Keep the Azure package aligned with the root start command.
- Keep frontend build work inside GitHub Actions, not Azure postinstall.
- Add a deployment health check.
- Add a staging slot before production swaps.
- Document required Azure environment variables.

### Phase 2: Design System Foundation

- Create `client/src/components/ui`.
- Add shared primitives: Button, Input, Select, Textarea, Card, PageShell, Alert, Stepper, EmptyState.
- Move design tokens into one canonical style location.
- Standardize button sizes, font weights, border radii, shadows, and mobile spacing.

### Phase 3: Page Refactor

- Refactor Home first because it sets the brand impression.
- Refactor CafeStudy second because it is the current business experiment.
- Refactor Dashboard third because it is large and operationally important.
- Refactor StoreView and Checkout after shared UI components are stable.

### Phase 4: Quality Gates

- Add lint and format scripts.
- Add backend smoke tests for `/api/health` and core APIs.
- Add frontend browser checks for `/`, `/cafe-study`, `/map`, and vendor login.
- Add build-size monitoring or code splitting for large bundles.

