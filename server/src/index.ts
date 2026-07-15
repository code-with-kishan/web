// Process entrypoint: start the HTTP server, seed baseline operations data,
// and run the crowd-telemetry simulator loop.
import { buildApp } from './app.js';
import { TELEMETRY_TICK_MS } from './config/constants.js';
import { env } from './config/env.js';
import { advanceTelemetry, ensureSeeded } from './features/operations/service.js';
import { logger } from './lib/logger.js';

function startTelemetrySimulator(): void {
  if (!env.TELEMETRY_SIM_ENABLED) {
    logger.info('Telemetry simulator disabled by configuration');
    return;
  }
  setInterval(() => {
    advanceTelemetry().catch((error: unknown) => {
      logger.warn({ err: error }, 'Telemetry tick failed');
    });
  }, TELEMETRY_TICK_MS);
}

const app = buildApp();
app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, 'StadiumIQ server listening');
});

// Seeding is best-effort at startup: if Firestore is briefly unreachable the
// assistant keeps working and operations endpoints report their own errors.
ensureSeeded()
  .then(() => {
    startTelemetrySimulator();
  })
  .catch((error: unknown) => {
    logger.warn({ err: error }, 'Startup seeding failed; operations data may be unavailable');
    startTelemetrySimulator();
  });
