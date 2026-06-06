import { join, dirname } from 'node:path';

import { loadConfig } from '../config-loader.js';

import { runBuild } from './build.js';

export interface DevOptions {
  readonly configPath: string;
  readonly port?: number;
  readonly outDir?: string;
}

async function serveStaticDir(dir: string, port: number): Promise<void> {
  const http = await import('node:http');
  const fsPromises = await import('node:fs/promises');
  const nodePath = await import('node:path');

  const mimeTypes: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };

  const server = http.createServer((req, res) => {
    const urlPath = req.url === '/' ? '/index.html' : (req.url ?? '/index.html');
    const filePath = nodePath.join(dir, urlPath);
    fsPromises
      .stat(filePath)
      .then(() => fsPromises.readFile(filePath))
      .then((content) => {
        const ext = nodePath.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] ?? 'text/plain' });
        res.end(content);
      })
      .catch(() => {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      });
  });

  server.listen(port, () => {
    process.stderr.write(`perch dev server running at http://localhost:${String(port)}\n`);
  });

  process.on('SIGINT', () => {
    server.close();
    process.exit(0);
  });
}

export async function runDev(opts: DevOptions): Promise<void> {
  const port = opts.port ?? 3000;
  const configPath = opts.configPath;
  const config = await loadConfig(configPath);
  const outDir = opts.outDir ?? join(dirname(configPath), 'dist');
  const cacheDir = join(dirname(configPath), '.perch', 'cache');

  await runBuild({ config, outDir, cacheDir });

  await serveStaticDir(outDir, port);
}
