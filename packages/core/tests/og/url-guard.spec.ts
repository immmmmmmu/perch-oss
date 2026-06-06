import { describe, expect, it } from 'vitest';

import { checkOutboundUrl } from '../../src/_internal/url-guard.js';

describe('checkOutboundUrl', () => {
  const blocked = [
    'http://127.0.0.1/',
    'https://localhost/',
    'http://10.0.0.5/admin',
    'http://192.168.1.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://0.0.0.0/',
    'http://172.16.7.7/',
    'http://172.31.0.1/',
    'http://[::1]/',
    'http://service.local/',
    'http://something.localhost/',
    'http://machine.internal/',
    'ftp://example.com/',
    'file:///etc/passwd',
  ];

  for (const url of blocked) {
    it(`rejects ${url}`, () => {
      const r = checkOutboundUrl(url);
      expect(r.ok).toBe(false);
    });
  }

  const allowed = [
    'https://example.com/',
    'https://note.com/foo/n/abc',
    'http://198.51.100.5/',
    'https://example.org:8443/path',
  ];
  for (const url of allowed) {
    it(`allows ${url}`, () => {
      const r = checkOutboundUrl(url);
      expect(r.ok).toBe(true);
    });
  }
});
