import { join, resolve, dirname } from 'node:path';

import { runBuild } from './commands/build.js';
import { runDev } from './commands/dev.js';
import { runNewPost } from './commands/new-post.js';
import { runNew } from './commands/new.js';
import { listThemes } from './commands/theme.js';
import { loadConfig } from './config-loader.js';

const args = process.argv.slice(2);
const command = args[0];

async function main(): Promise<void> {
  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  switch (command) {
    case 'new': {
      const projectName = args[1];
      if (!projectName) {
        process.stderr.write('Usage: perch new <project-name> [--yes]\n');
        process.exit(1);
      }
      const projectDir = resolve(process.cwd(), projectName);
      const useDefaults = args.includes('--yes') || args.includes('-y');
      await runNew({ projectDir, defaults: useDefaults });
      process.stdout.write(`Created project at ${projectDir}\n`);
      break;
    }

    case 'build': {
      const configFlagIdx = args.indexOf('--config');
      const outFlagIdx = args.indexOf('--out');
      const configPath =
        configFlagIdx !== -1 && args[configFlagIdx + 1]
          ? resolve(process.cwd(), args[configFlagIdx + 1]!)
          : resolve(process.cwd(), 'perch.config.yaml');
      const outDir =
        outFlagIdx !== -1 && args[outFlagIdx + 1]
          ? resolve(process.cwd(), args[outFlagIdx + 1]!)
          : join(dirname(configPath), 'dist');
      const cacheDir = join(dirname(configPath), '.perch', 'cache');
      const publicDir = join(dirname(configPath), 'public');
      const config = await loadConfig(configPath);
      await runBuild({ config, configPath, outDir, cacheDir, publicDir });
      process.stdout.write(`Build complete: ${outDir}/index.html\n`);
      break;
    }

    case 'dev': {
      const configFlagIdx = args.indexOf('--config');
      const portFlagIdx = args.indexOf('--port');
      const configPath =
        configFlagIdx !== -1 && args[configFlagIdx + 1]
          ? resolve(process.cwd(), args[configFlagIdx + 1]!)
          : resolve(process.cwd(), 'perch.config.yaml');
      const port = portFlagIdx !== -1 ? parseInt(args[portFlagIdx + 1] ?? '3000', 10) : 3000;
      await runDev({ configPath, port });
      break;
    }

    case 'new-post': {
      const slug = args[1];
      if (!slug) {
        process.stderr.write('Usage: perch new-post <slug> [--locale en]\n');
        process.exit(1);
      }
      const localeFlagIdx = args.indexOf('--locale');
      const locale =
        localeFlagIdx !== -1 && args[localeFlagIdx + 1]
          ? (args[localeFlagIdx + 1] as 'ja' | 'en')
          : undefined;
      if (locale && locale !== 'ja' && locale !== 'en') {
        process.stderr.write(`Invalid locale: ${String(locale)}. Use ja or en.\n`);
        process.exit(1);
      }
      const result = await runNewPost({ projectDir: process.cwd(), slug, locale });
      process.stdout.write(`Created post at ${result.path}\n`);
      break;
    }

    case 'theme': {
      const subCommand = args[1];
      if (subCommand === 'list' || !subCommand) {
        const themes = listThemes();
        for (const t of themes) {
          process.stdout.write(`${t.id.padEnd(12)} ${t.displayName.en.padEnd(16)} [${t.plan}]\n`);
        }
      } else if (subCommand === 'add') {
        const themeName = args[2];
        if (!themeName) {
          process.stderr.write('Usage: perch theme add <theme-name>\n');
          process.exit(1);
        }
        process.stdout.write(`Theme add is not yet supported in this version.\n`);
      } else {
        process.stderr.write(`Unknown theme subcommand: ${subCommand}\n`);
        process.exit(1);
      }
      break;
    }

    default: {
      process.stderr.write(`Unknown command: ${command}\n`);
      printHelp();
      process.exit(1);
    }
  }
}

function printHelp(): void {
  process.stdout.write(
    `@perch/cli — self-hosted profile page generator

Usage:
  perch new <project-name> [--yes]
  perch new-post <slug> [--locale en]
  perch build [--config perch.config.yaml] [--out dist]
  perch dev [--config perch.config.yaml] [--port 3000]
  perch theme list
  perch theme add <theme-name>
`,
  );
}

main().catch((err: unknown) => {
  process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
