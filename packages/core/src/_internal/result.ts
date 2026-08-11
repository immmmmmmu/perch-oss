// Internal Result helpers — re-exported `neverthrow` is intentionally kept
// out of the public API so that `@perch-app/core` consumers don't need to add
// `neverthrow` as a peer dependency.
//
// If we ever want to expose Result-typed helpers we'll re-export under a
// stable name from `src/index.ts`.

export { ok, err, Ok, Err, Result } from 'neverthrow';
