import type { PerchConfig } from '../../src/config-loader.js';

const config: PerchConfig = {
  profile: {
    name: 'Fixture User',
    bio: 'A fixture profile for integration testing.',
  },
  locale: 'ja',
  theme: 'minimal',
  feeds: [],
  posts: {
    enabled: false,
    dir: './posts',
    assetsDir: './assets',
    perPage: 10,
    showInTimeline: true,
  },
  timeline: {
    maxItems: undefined,
  },
};

export default config;
