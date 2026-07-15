# Contributing to StadiumIQ

Thanks for your interest. This document explains how to set up the project, the
quality bar every change must clear, and how to open a pull request.

## Prerequisites

- **Node.js ≥ 22** (see `engines` in `package.json`) and npm 10+.
- A Google Gemini API key for running the assistant/briefing locally.

## Setup

```bash
npm install                 # installs both workspaces (npm workspaces monorepo)
cp .env.example .env        # add your GEMINI_API_KEY and ALLOWED_ORIGINS
npm run dev:server          # API on :8080
npm run dev:client          # client on :5173 (proxies /api to the server)
```

## Project layout

Feature-folder monorepo: `server/` (Node · Express · TypeScript) and `client/`
(React · Vite · TypeScript). Route handlers dispatch, feature **services** hold
logic, and `lib/` holds pure utilities. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full picture and
[docs/decisions.md](docs/decisions.md) for the reasoning behind key choices.

## Quality bar (all enforced in CI)

Run these before pushing — CI fails on any of them:

| Command                 | What it checks                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `npm run lint`          | ESLint (strict type-checked + jsx-a11y), **zero warnings**                             |
| `npm run typecheck`     | `tsc --noEmit` across both workspaces                                                  |
| `npm run test:coverage` | Vitest with **≥ 95%** line/branch/function/statement thresholds (currently 100% lines) |
| `npm run build`         | Production build of client + server                                                    |
| `npm run format:check`  | Prettier formatting                                                                    |
| `npm run test:e2e`      | Playwright smoke test of the critical UI flow                                          |

A pre-commit hook (husky + lint-staged) runs lint/format on staged files
automatically, so most issues are caught before they reach CI.

## Tests

- Add tests next to the code they cover (`tests/` tree mirrors `src/`).
- Cover the **happy path, edge cases, and error paths** — a new service or
  endpoint without an error-path test will not be merged.
- Optional: `npm run test:mutation` runs Stryker to check the suite actually
  catches regressions, not just executes lines.

## Commit and PR conventions

- **Conventional Commits**, imperative mood, scoped where useful:
  `feat(assistant): add Portuguese language option`,
  `fix(operations): guard empty snapshot`.
- One logical change per commit; no `wip`/`asdf`/`final2`.
- Open a PR against `main`, fill in the template, and ensure CI is green.
- Keep everything on a single branch per the event constraints; do not commit
  generated artifacts (`dist/`, `coverage/`, `node_modules/`, `.env`).

## Reporting security issues

Do **not** open a public issue with exploit details. Follow
[SECURITY.md](SECURITY.md).
