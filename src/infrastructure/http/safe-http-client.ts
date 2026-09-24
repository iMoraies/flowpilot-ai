import { isIP } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const PRIVATE_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const MAX_RESPONSE_BYTES = 512_000;

type HttpRequestConfig = {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
};

export type HttpResponseSummary = {
  status: number;
  ok: boolean;
  body: unknown;
};

function isPrivateIPv4(hostname: string): boolean {
  const parts = hostname.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 169 && parts[1] === 254)
  );
}

export function validateSafeUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP and HTTPS protocols are allowed');
  }

  const hostname = url.hostname.toLowerCase();
  if (PRIVATE_HOSTS.has(hostname) || isPrivateIPv4(hostname) || isIP(hostname) === 6) {
    throw new Error('Private or local network targets are not allowed');
  }

  return url;
}

function sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
  const safeHeaders: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers ?? {})) {
    if (['authorization', 'cookie', 'x-api-key'].includes(key.toLowerCase())) {
      continue;
    }
    safeHeaders[key] = value;
  }

  return safeHeaders;
}

export async function executeHttpRequest(config: HttpRequestConfig): Promise<HttpResponseSummary> {
  const method = config.method.toUpperCase();
  if (!ALLOWED_METHODS.has(method)) {
    throw new Error('Unsupported HTTP method');
  }

  const url = validateSafeUrl(config.url);
  const attempts = Math.max(1, Math.min(config.retries ?? 1, 3));
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.min(config.timeoutMs ?? 5000, 10000));

    try {
      const response = await fetch(url, {
        method,
        headers: sanitizeHeaders(config.headers),
        body: config.body === undefined ? undefined : JSON.stringify(config.body),
        signal: controller.signal,
      });
      const text = (await response.text()).slice(0, MAX_RESPONSE_BYTES);
      let body: unknown = text;

      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }

      if (!response.ok && response.status >= 500 && attempt < attempts) {
        await delay(100 * attempt);
        continue;
      }

      return {
        status: response.status,
        ok: response.ok,
        body,
      };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await delay(100 * attempt);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('HTTP request failed');
}
