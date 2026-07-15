// Post-build smoke test: boots the built server and asserts that the three
// serving paths that unit tests cannot exercise (they run before the client is
// built) actually work — the health endpoint, the RFC 9116 security.txt route,
// and the SPA shell fallback. This guards the client-dist path wiring, whose
// breakage returns HTTP 200 for the API but 500 for every page.
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 8099;
const BASE = `http://localhost:${PORT}`;

const server = spawn(process.execPath, ['server/dist/index.js'], {
  env: {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: 'production',
    GEMINI_API_KEY: 'smoke-dummy-key',
    TELEMETRY_SIM_ENABLED: 'false',
  },
  stdio: 'inherit',
});

/** Polls the health endpoint until the server accepts connections. */
async function waitForReady(attempts = 30) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  throw new Error('server did not become ready in time');
}

/** Asserts a path returns 200 with the expected content-type. */
async function expectServed(pathname, contentType) {
  const res = await fetch(`${BASE}${pathname}`);
  const type = res.headers.get('content-type') ?? '';
  if (res.status !== 200 || !type.includes(contentType)) {
    throw new Error(`${pathname} → ${String(res.status)} ${type} (wanted 200 ${contentType})`);
  }
  console.log(`ok  ${pathname} → 200 ${type}`);
}

try {
  await waitForReady();
  await expectServed('/api/health', 'application/json');
  await expectServed('/.well-known/security.txt', 'text/plain');
  await expectServed('/assistant', 'text/html');
  await expectServed('/', 'text/html');
  console.log('smoke: all checks passed');
} catch (error) {
  console.error('smoke: FAILED —', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  server.kill();
}
