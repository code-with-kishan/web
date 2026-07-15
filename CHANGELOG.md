# Changelog

All notable changes to StadiumIQ are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-07-09

### Added

- Explicit RFC 9116 `/.well-known/security.txt` route with a coordinated
  disclosure contact, plus supertest coverage.
- CodeQL (`security-extended`) static analysis and Dependabot grouped weekly
  dependency updates for npm and GitHub Actions.
- Developer tooling: husky + lint-staged pre-commit hook, Playwright end-to-end
  smoke tests of the critical UI flows (hermetic and live suites, with axe-core
  accessibility scans), and Stryker mutation testing.
- Full-journey API integration test and additional error-path unit tests.
- Project documentation: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `docs/ARCHITECTURE.md`, issue/PR templates, and `CODEOWNERS`.
- README sections for the chosen vertical, approach and logic, how the solution
  works, assumptions made, and an evaluation map.

### Changed

- Raised the enforced coverage thresholds from 90% to 95% (the suite now
  measures 100% line coverage in both workspaces).
- Extracted HTTP security headers and static-client serving from `app.ts` into
  dedicated middleware modules, leaving `app.ts` a thin composition root.
- De-duplicated async route plumbing behind a shared `asyncHandler`.
- Hardened CI with least-privilege `permissions: contents: read` and a
  post-build smoke test of the compiled server.

### Fixed

- `/.well-known/security.txt` previously fell through to the SPA shell; it now
  serves the disclosure contact as plain text.

## [1.0.0] - 2026-07-07

### Added

- Matchday Fan Assistant: multilingual, Gemini-grounded Q&A over the venue
  dataset (navigation, accessibility, transportation, multilingual support).
- Operations Command Center: live zone density, incidents, sustainability
  metrics, and an on-demand AI operations briefing.
- Google Cloud integration: Cloud Run, Gemini (`@google/genai`), Firestore,
  Secret Manager, and Cloud Logging.
- Full test suite with enforced 90% coverage thresholds, CI (lint, typecheck,
  coverage, build, gitleaks, npm audit), and WCAG 2.1 AA accessibility.

[1.1.0]: https://github.com/Auenchanters/Virtual-Prompt-war-Week-4/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Auenchanters/Virtual-Prompt-war-Week-4/releases/tag/v1.0.0
