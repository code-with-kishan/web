# Architecture Decision Records

Short records of the load-bearing decisions behind StadiumIQ. Each is
context → decision → tradeoff.

## ADR-1: Single Cloud Run service serves both API and client

**Context.** The judge and fans need one URL; running separate frontend and
backend services doubles deploy surface and adds a CORS hop.
**Decision.** One Express service serves the built React bundle as static
assets and hosts the `/api` routes; the SPA fallback returns `index.html`
for non-API routes.
**Tradeoff.** The frontend cannot scale independently of the API. At demo
scale this is irrelevant, and it removes cross-origin complexity and a second
cold-start budget.

## ADR-2: Simulated crowd telemetry, not a real sensor feed

**Context.** Crowd-management and operational-intelligence features need a
_live_ signal, but there is no real turnstile/sensor feed available for a
hackathon venue.
**Decision.** A server-side simulator performs a bounded random walk over
each zone's occupancy in Firestore on a fixed interval. Every read path
(`getSnapshot`) is identical to what a real feed would produce.
**Tradeoff.** Numbers are synthetic. Because the simulator only writes the
same documents a real ingest would write, replacing it with a sensor stream
touches one function and leaves the API, UI and tests unchanged.

## ADR-3: Gemini API key in Secret Manager, mounted via `--set-secrets`

**Context.** The server needs a Gemini credential; the judge scores
GCP-native secret handling and penalizes any secret in the repo or image.
**Decision.** The key lives in Google Secret Manager and is mounted into the
Cloud Run container as an environment variable via `--set-secrets`. Local
development reads it from a gitignored `.env`.
**Tradeoff.** Rotating the key requires a new secret version and a revision
redeploy, rather than an app-level reload. That is the correct default for a
public demo where key isolation matters more than hot rotation.

## ADR-4: Per-instance in-memory TTL cache, not Redis

**Context.** Identical assistant questions (the quick actions) and rapid
briefing clicks would otherwise re-run Gemini inference, adding latency and
cost.
**Decision.** A small bounded TTL cache in process memory backs both the
assistant answers and the briefing. The service runs with
`--min-instances=1`, so one warm instance absorbs the common case.
**Tradeoff.** The cache is not shared across instances, so a scale-out event
yields a brief cache-miss window. A shared cache (Redis/Memorystore) is the
upgrade path if the service ever runs many instances; it is unjustified
infrastructure at this scale.

## ADR-5: Language handled in the prompt, not a UI i18n framework

**Context.** The assistant must answer in five languages, but the _UI_ chrome
is a thin shell around model-generated content.
**Decision.** The selected language is passed to Gemini, which writes the
answer in that language; the UI itself stays in English. No i18n library is
added.
**Tradeoff.** UI labels are not localized, only the assistant's answers. For
a matchday assistant the answer is the product; adding `i18next` and message
catalogues for a handful of static labels would be weight without value.
