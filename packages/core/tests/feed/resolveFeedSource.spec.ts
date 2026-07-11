import { describe, expect, it, vi } from 'vitest';

import { resolveFeedSource } from '../../src/index.js';

import type { FeedSource } from '../../src/index.js';

const CHANNEL_ID = 'UC1234567890123456789012';

describe('resolveFeedSource', () => {
  it('leaves non-YouTube feed URLs unchanged without fetching', async () => {
    const source: FeedSource = { url: 'https://zenn.dev/example/feed', name: 'Zenn' };
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(resolveFeedSource(source, { fetchImpl })).resolves.toEqual(source);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('leaves existing YouTube feed URLs unchanged without fetching', async () => {
    const source: FeedSource = {
      url: `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
      name: 'YouTube',
    };
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(resolveFeedSource(source, { fetchImpl })).resolves.toEqual(source);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('converts YouTube /channel URLs to the Atom feed URL without fetching', async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      resolveFeedSource(
        { url: `https://www.youtube.com/channel/${CHANNEL_ID}`, name: 'YouTube' },
        { fetchImpl },
      ),
    ).resolves.toEqual({
      url: `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
      name: 'YouTube',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('resolves YouTube handle URLs by extracting channelId from the page', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        `<!doctype html><html><head>
          <meta itemprop="channelId" content="${CHANNEL_ID}">
        </head></html>`,
        { status: 200, headers: { 'content-type': 'text/html' } },
      ),
    );

    await expect(
      resolveFeedSource({ url: 'https://youtube.com/@sample', name: 'YouTube' }, { fetchImpl }),
    ).resolves.toEqual({
      url: `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
      name: 'YouTube',
    });
    expect(fetchImpl).toHaveBeenCalledWith('https://youtube.com/@sample', {
      headers: { accept: 'text/html, */*;q=0.8' },
    });
  });

  it('keeps unresolved YouTube page URLs unchanged', async () => {
    const source: FeedSource = { url: 'https://youtube.com/@missing', name: 'YouTube' };
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('<!doctype html><html><head></head></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );

    await expect(resolveFeedSource(source, { fetchImpl })).resolves.toEqual(source);
  });
});
