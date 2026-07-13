import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { OgMetadata, OgStore } from '@perch-app/core';

export class FsOgStore implements OgStore {
  constructor(private readonly dir: string) {}

  async get(urlHash: string): Promise<OgMetadata | undefined> {
    const filePath = join(this.dir, `${urlHash}.json`);
    try {
      const raw = await readFile(filePath, 'utf8');
      return JSON.parse(raw) as OgMetadata;
    } catch {
      return undefined;
    }
  }

  async put(urlHash: string, value: OgMetadata, _ttlMs: number): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const filePath = join(this.dir, `${urlHash}.json`);
    await writeFile(filePath, JSON.stringify(value), 'utf8');
  }
}
