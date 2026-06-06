import { describe, expect, it } from 'vitest';

import { defineSource, type NormalizedFeed, type Validator } from '../src/index.js';

const numberValidator: Validator<number> = {
  parse(input: unknown) {
    if (typeof input !== 'number') throw new TypeError('number required');
    return input;
  },
};

const stubFeed: NormalizedFeed = {
  source: { url: 'https://example.com/feed.xml' },
  items: [],
  fetchedAt: '2026-05-01T00:00:00.000Z',
};

describe('defineSource', () => {
  it('validates config before delegating to fetch()', async () => {
    const source = defineSource<number>({
      id: 'numeric',
      configSchema: numberValidator,
      fetch: () => Promise.resolve(stubFeed),
    });

    await expect(source.fetch(42)).resolves.toBe(stubFeed);
    await expect(source.fetch('not-a-number' as unknown as number)).rejects.toThrow(
      'number required',
    );
  });

  it('preserves the provided id verbatim', () => {
    const source = defineSource({
      id: 'youtube',
      configSchema: numberValidator,
      fetch: () => Promise.resolve(stubFeed),
    });
    expect(source.id).toBe('youtube');
  });
});
