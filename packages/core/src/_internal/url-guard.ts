// SSRF guard. Rejects URLs that target loopback / link-local / private space
// before any fetch is attempted. Used by `fetchOg`; future custom-domain
// verification (TASK-0017) will share the same primitive.
//
// We deliberately keep DNS resolution out of core — Workers' `fetch` does
// not expose a DNS API and would otherwise leak network calls into a
// sync-flavoured guard. Production deployments should layer a DNS-aware
// check at the egress proxy. For URL-shape attacks (which cover most CVEs in
// practice) the host inspection here is sufficient.

const SCHEME_ALLOWLIST: ReadonlySet<string> = new Set(['http:', 'https:']);

const PRIVATE_IPV4_PREFIXES = ['10.', '127.', '169.254.'];
const RESERVED_IPV4_RANGES: readonly (readonly [number, number, number])[] = [
  // 172.16.0.0/12
  [172, 16, 31],
];

const LOCAL_HOSTNAMES: ReadonlySet<string> = new Set([
  'localhost',
  'broadcasthost',
  'ip6-localhost',
  'ip6-loopback',
]);

function ipv4Octets(host: string): readonly number[] | undefined {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return undefined;
  const parts = host.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return undefined;
  return parts;
}

function isLoopbackOrPrivateIpv4(host: string): boolean {
  const parts = ipv4Octets(host);
  if (!parts) return false;
  for (const prefix of PRIVATE_IPV4_PREFIXES) {
    if (host.startsWith(prefix)) return true;
  }
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 100 && parts[1] !== undefined && parts[1] >= 64 && parts[1] <= 127) {
    return true;
  }
  for (const [start, low, high] of RESERVED_IPV4_RANGES) {
    if (parts[0] === start && parts[1] !== undefined && parts[1] >= low && parts[1] <= high) {
      return true;
    }
  }
  if (parts[0] === 0) return true;
  if (parts[0] === 224) return true;
  return false;
}

function isLoopbackIpv6(host: string): boolean {
  // bracketed: [::1] / [fe80::1] etc.
  const stripped = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
  const lower = stripped.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true;
  return false;
}

export interface UrlGuardOk {
  readonly ok: true;
  readonly url: URL;
}
export interface UrlGuardErr {
  readonly ok: false;
  readonly reason: string;
}

/**
 * Inspect a URL string and either accept it (returning the parsed URL) or
 * reject it with a human-readable reason. Caller chooses how to surface the
 * rejection — typically by throwing an `Error` so the surrounding
 * `fetch`-style helper can categorise it as `network`.
 */
export function checkOutboundUrl(input: string): UrlGuardOk | UrlGuardErr {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, reason: 'invalid url' };
  }
  if (!SCHEME_ALLOWLIST.has(url.protocol)) {
    return { ok: false, reason: `disallowed scheme: ${url.protocol}` };
  }
  const host = url.hostname.toLowerCase();
  if (LOCAL_HOSTNAMES.has(host)) {
    return { ok: false, reason: 'loopback hostname' };
  }
  if (host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return { ok: false, reason: `private namespace: ${host}` };
  }
  if (isLoopbackOrPrivateIpv4(host)) {
    return { ok: false, reason: `private ipv4: ${host}` };
  }
  if (host.includes(':') || host.startsWith('[')) {
    if (isLoopbackIpv6(host)) {
      return { ok: false, reason: `private ipv6: ${host}` };
    }
  }
  return { ok: true, url };
}
