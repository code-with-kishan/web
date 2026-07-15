# Security Policy

## Threat model

StadiumIQ is a public, read-mostly demo: the only user inputs are a free-text
question to the fan assistant and a button that requests an operations
briefing. The assets worth protecting are the Gemini API key, the Firestore
dataset, and service availability. The realistic threats are prompt-injection
attempts through the question field, abuse of the LLM endpoints (cost/DoS),
and leakage of stack traces or credentials.

## Controls in place

- **Secrets**: the Gemini API key lives in Google Secret Manager and is
  mounted into Cloud Run via `--set-secrets`. Nothing sensitive exists in the
  repo, the image, or git history; CI runs a gitleaks scan on every push.
- **Input validation**: every request body and query string is parsed with a
  strict zod schema before any logic runs; unknown keys are rejected and the
  assistant question is capped at 500 characters.
- **HTTP hardening**: helmet with a fully-enumerated CSP that grants no
  `unsafe-inline`/`unsafe-eval` anywhere, an explicit CORS origin allowlist,
  `express.json` body limit of 100 kB, `Cache-Control: no-store` on every API
  response, a JSON-only content-type gate on API POSTs (rejects cross-site
  form submissions before any handler runs), and layered rate limits — a general API limit plus a stricter
  limit on the two Gemini-backed endpoints. The limiter counts per instance,
  so the deploy pins `--max-instances=3` to keep the global Gemini spend
  bounded even under scale-out; a shared store (e.g. Memorystore) is the
  production upgrade path.

  | Header                    | Value                                                                                                                                                                                    | Purpose                                    |
  | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
  | Content-Security-Policy   | `default/script/style/font/connect-src 'self'`, `img-src 'self' data:`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'` — **no unsafe-\* grants** | Blocks injected scripts/styles and framing |
  | Strict-Transport-Security | max-age 1y, includeSubDomains                                                                                                                                                            | Forces HTTPS                               |
  | Permissions-Policy        | camera, microphone, geolocation, payment, usb all `()`                                                                                                                                   | Denies unused browser features             |
  | X-Content-Type-Options    | `nosniff`                                                                                                                                                                                | Stops MIME sniffing                        |
  | Referrer-Policy           | `no-referrer`                                                                                                                                                                            | No URL leakage                             |
  | Cache-Control (API)       | `no-store`                                                                                                                                                                               | Live data never cached                     |

- **Prompt containment and output sanitization**: user text is embedded in a
  system-framed prompt that instructs the model to answer only from the venue
  dataset, and every model response passes through `sanitizeModelText()`
  (HTML tags and control characters stripped, length capped) before leaving
  the API — so even a successfully injected prompt cannot smuggle markup or
  unbounded output to the client, where answers are rendered as plain text,
  never HTML.
- **Error hygiene**: one central error handler returns sanitized
  `{ code, message }` bodies; internal messages and stack traces are logged
  server-side only.

## Authentication decision

The demo is deliberately account-free: it exposes no personal data, no write
APIs beyond the rate-limited briefing trigger, and no privileged actions.
Adding accounts would enlarge the attack surface (credential storage,
session handling) without protecting anything. Firestore is reached only from
the server through its service account; no database credentials or rules are
exposed to clients.

## Reporting a vulnerability

Open a GitHub issue titled `[security]` (no exploit details), or email
kishannishad@gmail.com. You will get a response within 48 hours. The same contact
is published for machine discovery at
[`/.well-known/security.txt`](https://stadiumiq-331244069963.asia-south1.run.app/.well-known/security.txt)
(RFC 9116).

## Automated security checks

Every push runs, in CI: a gitleaks secret scan, `npm audit --omit=dev
--audit-level=high`, and CodeQL static analysis with the `security-extended`
query pack (also weekly). Dependabot monitors every ecosystem weekly; its
update PRs are intentionally disabled for the event window (the submission
rules require a single-branch repository), so findings surface as Security-tab
alerts instead
for npm and GitHub Actions. All workflows run with least-privilege
`permissions` (`contents: read` by default).
