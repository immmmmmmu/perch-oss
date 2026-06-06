// Compile-time type assertions verified by `tsd` in CI.
// Spec: TASK-0003 acceptance — public types are readonly and resolve cleanly
// from a downstream `type: "module"` consumer.
//
// NOTE: This file uses `expectError` from `tsd` to assert that certain
// expressions are TYPE errors. `tsc --noEmit` would also flag those lines,
// so it is excluded from the package `tsconfig.json` and only consumed by
// the `tsd` runner (which handles `expectError` semantically).

import { expectAssignable, expectError, expectType } from 'tsd';

import type {
  FetchFailure,
  FetchFailureKind,
  FetchOk,
  FetchResult,
  NormalizedFeed,
  NormalizedItem,
  OgMetadata,
  OgStore,
  Source,
  SourceSpec,
} from '../src/index.js';

declare const item: NormalizedItem;
declare const feed: NormalizedFeed;
declare const result: FetchResult;
declare const ok: FetchOk;
declare const failure: FetchFailure;
declare const og: OgMetadata;

// readonly-ness: every field assignment must fail.
expectError((item.title = 'mutate'));
expectError((feed.items = []));
expectError((result.successes = []));
expectError((og.title = 'mutate'));

// Tagged-union narrowing.
expectType<'ok'>(ok.kind);
expectType<FetchFailureKind>(failure.kind);

// Source type parameterisation.
declare const numericSpec: SourceSpec<number>;
const numericSource: Source<number> = {
  id: numericSpec.id,
  fetch: (config) => numericSpec.fetch(config),
};
expectAssignable<Source<number>>(numericSource);

// OgStore preserves Promise return types — assert via assignability.
declare const store: OgStore;
expectAssignable<Promise<OgMetadata | undefined>>(store.get('hash'));
