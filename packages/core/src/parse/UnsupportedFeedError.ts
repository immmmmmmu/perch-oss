/**
 * Thrown by `parseFeed` when the body is neither RSS 2.0 / Atom 1.0 / JSON Feed.
 * Callers translate this to a `FetchFailureKind = "unsupported"` record.
 */
export class UnsupportedFeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedFeedError';
  }
}
