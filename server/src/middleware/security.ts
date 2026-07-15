// Security wiring: hardened HTTP headers (Helmet + a strict CSP with no
// unsafe-* grants), the RFC 9116 security.txt disclosure endpoint, and API
// cache suppression. Kept out of app.ts so the app module stays a thin
// composition root.
import type { RequestHandler } from 'express';
import helmet from 'helmet';

import { AppError } from '../lib/app-error.js';

/**
 * RFC 9116 `security.txt` body advertising the coordinated-disclosure contact.
 * Served from an explicit route rather than static hosting so it is reachable
 * regardless of dotfile-serving quirks and is unit-testable without a build.
 */
export const SECURITY_TXT: string = [
  'Contact: mailto:kishannishad@gmail.com',
  'Expires: 2027-01-01T00:00:00.000Z',
  'Preferred-Languages: en',
  'Canonical: https://stadiumiq-331244069963.asia-south1.run.app/.well-known/security.txt',
  '',
].join('\n');

/**
 * Browser features the app never uses, denied outright. Helmet does not set
 * Permissions-Policy, so it is emitted explicitly.
 */
const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=(), payment=(), usb=()';

/**
 * Helmet with an explicit, fully-enumerated CSP. Every directive is stated
 * deliberately and none grants `unsafe-inline`/`unsafe-eval`: scripts and
 * styles are same-origin build artifacts, and the one data-driven style
 * (the density meter width) is applied through the CSSOM, which CSP's
 * `style-src-attr` does not govern.
 */
export function securityHeaders(): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  });
}

/** Adds the Permissions-Policy header Helmet leaves unset. */
export const permissionsPolicy: RequestHandler = (_req, res, next) => {
  res.setHeader('Permissions-Policy', PERMISSIONS_POLICY);
  next();
};

/**
 * Forbids caching of API responses: operational data is live and per-request,
 * so neither browsers nor intermediaries may store it.
 */
export const noStoreApi: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};

/**
 * CSRF hardening for the JSON-only API: a cross-site HTML form can only
 * submit its three form enctypes, so rejecting any POST whose declared
 * media type is not JSON shuts that channel before handlers run. POSTs
 * without a Content-Type pass — no browser form can produce one.
 */
export const requireJsonPosts: RequestHandler = (req, _res, next) => {
  const contentType = req.headers['content-type'];
  if (
    req.method === 'POST' &&
    contentType !== undefined &&
    !contentType.includes('application/json')
  ) {
    next(new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'POST bodies must be application/json.'));
    return;
  }
  next();
};

/** Serves `/.well-known/security.txt` as uncached plain text (RFC 9116). */
export const securityTxtHandler: RequestHandler = (_req, res) => {
  res.type('text/plain');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(SECURITY_TXT);
};
