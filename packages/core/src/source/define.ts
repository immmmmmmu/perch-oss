import type { Source, SourceSpec } from '../types/index.js';

/**
 * Register a custom feed source. Implementations land alongside the public
 * adapter SDK in TASK-0011; this skeleton exposes the type-level surface
 * required by FR-6 so dependent tasks can compile against it from Wave 3.
 */
export function defineSource<TConfig>(spec: SourceSpec<TConfig>): Source<TConfig> {
  return {
    id: spec.id,
    async fetch(config) {
      const validated = spec.configSchema.parse(config);
      return spec.fetch(validated);
    },
  };
}
