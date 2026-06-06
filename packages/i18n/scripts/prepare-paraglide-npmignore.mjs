import { readFile, writeFile } from 'node:fs/promises';

const outDir = new URL('../src/paraglide/', import.meta.url);

await writeFile(
  new URL('.npmignore', outDir),
  `*

# npm package consumers need the generated Paraglide runtime.
!.npmignore
!README.md
!*.js
!*.d.ts
!messages
!messages/**
`,
  'utf8',
);

const readmeUrl = new URL('README.md', outDir);
const readme = await readFile(readmeUrl, 'utf8');
await writeFile(
  readmeUrl,
  readme.replace(
    /^Compiled from: `.*`$/m,
    "Compiled from this package's `project.inlang` directory.",
  ),
  'utf8',
);
