// Lightweight, deterministic hash for fallback ids when feeds omit guid/id.
// We use a synchronous FNV-1a 32-bit so that core stays free of native crypto
// dependencies that aren't universally available (Workers / Bun / Node share
// SubtleCrypto but it's async; we want a sync helper for parse loops).

const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

export function fnv1aHex(input: string): string {
  let hash = FNV_OFFSET;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  // Force unsigned 32-bit and pad.
  return (hash >>> 0).toString(16).padStart(8, '0');
}
