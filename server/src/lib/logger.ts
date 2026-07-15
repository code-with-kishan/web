// Structured JSON logger. On Cloud Run these lines land in Cloud Logging;
// the `severity` field lets Cloud Logging classify them natively.
import { pino } from 'pino';

import { env } from '../config/env.js';

/** Application-wide structured logger (never use console.log). */
export const logger = pino({
  level: env.LOG_LEVEL,
  messageKey: 'message',
  formatters: {
    level: (label) => ({ severity: label.toUpperCase(), level: label }),
  },
});
