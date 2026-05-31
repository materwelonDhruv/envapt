/**
 * Accepted shape for environment variable lookups. Either a single key or an ordered list of keys.
 * @public
 */
type EnvKeyInput = string | readonly [string, ...string[]];

/**
 * @internal
 */
interface EnvapterService {
    getRaw(key: EnvKeyInput): string | undefined;
    get(key: EnvKeyInput, def?: string): string | undefined;
    isStrict(): boolean;
}

export type { EnvKeyInput, EnvapterService };
