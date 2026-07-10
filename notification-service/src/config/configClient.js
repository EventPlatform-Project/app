'use strict';

/**
 * Minimal Spring Cloud Config client for Node.js.
 *
 * Fetches `${CONFIG_SERVER_URL}/${APP_NAME}/${PROFILE}` at boot, then merges
 * every property into `process.env` (uppercased, dots -> underscores) so
 * downstream modules (env.js) can consume them like any other env var.
 *
 * We only reach out to the config-server if CONFIG_SERVER_URL is set — in
 * pure local dev (no infra), the service still boots on plain defaults.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_RETRIES = 5;
const DEFAULT_RETRY_DELAY_MS = 3000;

const APP_NAME = process.env.CONFIG_APP_NAME || 'notification-service';
const PROFILE = process.env.CONFIG_PROFILE || 'default';
const LABEL = process.env.CONFIG_LABEL || 'main';

function log(msg) {
  console.log(`[config-client] ${msg}`);
}

function fetchJson(urlStr, timeoutMs) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.get(u, { timeout: timeoutMs }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${urlStr}`));
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`Invalid JSON from ${urlStr}: ${err.message}`));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error(`Timeout after ${timeoutMs}ms`));
    });
    req.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Convert a property key ("notification.rabbitmq.url") to an env var
 * name ("NOTIFICATION_RABBITMQ_URL").
 */
function keyToEnv(key) {
  return key.replace(/[.\-]/g, '_').toUpperCase();
}

/**
 * Resolve Spring-style placeholders `${VAR}` / `${VAR:default}` against
 * `process.env`. In native mode, config-server returns values verbatim
 * (with placeholders unresolved), so we do the substitution ourselves.
 * Handles nested placeholders by iterating until stable (max 5 passes).
 */
function resolvePlaceholders(value) {
  if (typeof value !== 'string' || !value.includes('${')) return value;
  const re = /\$\{([^${}:]+)(?::([^}]*))?\}/g;
  let out = value;
  for (let i = 0; i < 5; i++) {
    const next = out.replace(re, (_m, name, def) => {
      const v = process.env[name];
      if (v !== undefined && v !== '') return v;
      return def !== undefined ? def : '';
    });
    if (next === out) break;
    out = next;
  }
  return out;
}

/**
 * Merge Spring Cloud Config `propertySources` into process.env.
 * Precedence: earlier sources override later ones (Spring's convention).
 * Existing env vars ALWAYS win — so a value set via docker-compose or a
 * shell export overrides the config-server value.
 */
function applyConfig(response) {
  const sources = response.propertySources || [];
  const merged = {};

  // Iterate from LAST to FIRST so earlier sources overwrite (higher priority).
  for (let i = sources.length - 1; i >= 0; i--) {
    const src = sources[i];
    if (src && src.source && typeof src.source === 'object') {
      Object.assign(merged, src.source);
    }
  }

  let applied = 0;
  let skipped = 0;
  for (const [key, rawValue] of Object.entries(merged)) {
    const envName = keyToEnv(key);
    if (process.env[envName] !== undefined && process.env[envName] !== '') {
      skipped++;
      continue; // explicit env wins
    }
    const resolved = resolvePlaceholders(String(rawValue));
    process.env[envName] = resolved;
    applied++;
  }
  return { applied, skipped, total: Object.keys(merged).length };
}

/**
 * Load properties from the config-server. Retries a few times so we don't
 * die if the config-server is still coming up. Returns silently on total
 * failure — the service falls back to built-in defaults.
 */
async function load() {
  const base = process.env.CONFIG_SERVER_URL;
  if (!base) {
    log('CONFIG_SERVER_URL not set — skipping remote config, using defaults.');
    return { loaded: false, reason: 'CONFIG_SERVER_URL not set' };
  }

  const retries = parseInt(process.env.CONFIG_RETRIES || `${DEFAULT_RETRIES}`, 10);
  const delayMs = parseInt(
    process.env.CONFIG_RETRY_DELAY_MS || `${DEFAULT_RETRY_DELAY_MS}`,
    10
  );
  const timeoutMs = parseInt(
    process.env.CONFIG_TIMEOUT_MS || `${DEFAULT_TIMEOUT_MS}`,
    10
  );

  const clean = base.replace(/\/+$/, '');
  const url = `${clean}/${APP_NAME}/${PROFILE}/${LABEL}`;
  const fallbackUrl = `${clean}/${APP_NAME}/${PROFILE}`;

  let lastErr = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log(`fetching ${url} (attempt ${attempt}/${retries})`);
      let json;
      try {
        json = await fetchJson(url, timeoutMs);
      } catch (err) {
        // In native profile the label segment can 404 — retry without label.
        log(`labeled URL failed (${err.message}); trying ${fallbackUrl}`);
        json = await fetchJson(fallbackUrl, timeoutMs);
      }
      const stats = applyConfig(json);
      log(
        `loaded ${stats.applied} keys (skipped ${stats.skipped} already-set) ` +
          `from ${json.name || APP_NAME} profiles=[${(json.profiles || []).join(',')}]`
      );
      return { loaded: true, stats };
    } catch (err) {
      lastErr = err;
      log(`fetch failed: ${err.message}`);
      if (attempt < retries) {
        await sleep(delayMs);
      }
    }
  }

  log(
    `could not load remote config after ${retries} attempts (${lastErr && lastErr.message}). ` +
      `Falling back to local defaults.`
  );
  return { loaded: false, reason: lastErr && lastErr.message };
}

module.exports = { load };
