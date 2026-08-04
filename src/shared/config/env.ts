/**
 * Typed access to the runtime environment.
 *
 * Every read of `import.meta.env` happens in this module. The rest of the
 * builder imports the frozen `env` object and stays ignorant of where
 * configuration comes from, so changing the source later touches one file.
 */

/** The runtime configuration this builder reads. */
export interface Env {
  /** The path the builder is served under; Vite's base, "/" in development. */
  readonly baseUrl: string;
}

/** The frozen configuration every other module reads instead of the import. */
export const env: Env = Object.freeze({
  baseUrl: import.meta.env.BASE_URL,
});
