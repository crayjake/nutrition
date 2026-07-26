# Crux nutrition tracker

A polished, local-first nutrition and habit tracker built from the canonical
`nutrition-plan.json`. It is a static Next.js App Router application designed
for small phone screens and GitHub Pages.

The Shopping screen builds a practical shopping list from any mix of
climbing/rest and tofu/chicken days. Requirements are rounded up to whole tubs,
bags, bottles, jars and packs, with estimated Morrisons pricing, official
product imagery, and copy/plain-text download actions.

## Start locally

Use Node.js 22.13 or newer and npm:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. No environment variables, account, database or
external service is required.

Useful commands:

```bash
npm run validate:data
npm run lint
npm run typecheck
npm test
npm run test:watch
npm run build
npx playwright install webkit
npm run test:e2e
```

`npm run build` creates the pure static site in `out/`.

## Structure

- `src/app` contains the four primary routes, the legacy nutrition reference,
  install metadata and shared shell.
- `src/features/nutrition` contains typed selectors over precomputed derived
  meals and macros.
- `src/features/tracking` owns the versioned local repository, provider, Today
  controls and settings.
- `src/features/progress` calculates summaries and lazy-loads Recharts.
- `src/components` contains reusable presentation and navigation.
- `src/types`, `src/lib` and `src/data` keep domain types, date/format helpers
  and the build-time JSON import separate.
- `scripts/validate-data.mjs` validates the canonical JSON against
  `nutrition-plan.schema.json` with AJV.

The UI never recalculates nutrition. It selects
`day_plans.{climbing,rest}.derived.{default,chicken_pasta}` and resolves product
names from `products`. Tofu remains the default.

## Local data

Tracking state is stored only in this browser under `nutrition-tracker:v1`.
It uses local `YYYY-MM-DD` keys, stores water as individual undoable entries,
and keeps an optional daily weight. Parsing is defensive: malformed settings
fall back independently and malformed day logs are discarded without losing
valid ones.

Settings → Local data can export a versioned JSON backup, validate and import a
backup, or reset everything after confirmation. Clearing site data in the
browser also removes all check-ins.

## GitHub Pages deployment

The workflow at `.github/workflows/deploy-pages.yml` installs from
`package-lock.json`, validates the nutrition schema, runs lint, type checking,
unit/component tests and mobile WebKit tests, builds `out/`, uploads it with the
official Pages action, and deploys to the `github-pages` environment.

One-time repository setup:

1. Push this project to GitHub with the default branch named `main`.
2. Open the repository’s **Settings**.
3. Select **Pages** under **Code and automation**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Push to `main` or run **Validate and deploy GitHub Pages** manually from the
   Actions tab.

`next.config.ts` derives the repository name from `GITHUB_REPOSITORY` during
Actions builds. A project repository gets `basePath: "/repository-name"`;
`username.github.io` stays at the root. For a local subpath test:

```bash
NEXT_PUBLIC_BASE_PATH=/preview npm run test:e2e
```

The app uses trailing-slash routes so direct requests such as `/shopping/` map to
static `index.html` files.

## Installed iPhone 13 Mini QA

After deployment, test in portrait orientation:

- Open each tab directly and through bottom navigation; confirm the navigation
  clears the browser chrome and safe area.
- At the Today tab, complete and undo a meal, expand ingredients, add and undo
  water, then save/edit/remove weight. Confirm each macro ring advances
  clockwise with completed meals.
- On Shopping, change all four shopping day counters, check that whole-pack
  quantities and estimated prices update, check off an item, and copy/download
  the list.
- Reload while part-way down the page and confirm data persists and no content
  shifts horizontally.
- Visit yesterday and tomorrow, set different plans, then return to Today.
- Check Progress tooltips and axis labels after recording at least two weights.
- Switch system, light and dark themes and verify controls remain readable.
- Export a backup, import it, cancel once, then confirm; verify reset has a
  separate strong confirmation.
- Rotate once, return to portrait, and confirm there is no horizontal overflow
  at 320, 375 or 430 CSS-pixel widths.

The automated mobile WebKit suite is the closest CI analogue; an actual-device
pass remains valuable for installed-app and safe-area behaviour.

## Current scope

There is deliberately no calorie-target editing, automatic food-quantity
scaling, backend sync or service worker. Backups are manual and browser data is
device/profile-specific.
