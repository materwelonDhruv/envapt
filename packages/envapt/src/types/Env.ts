// a single key, or an ordered list where the reader takes the first key that has a value
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
