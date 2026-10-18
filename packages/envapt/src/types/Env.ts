// a single key, or an ordered list where the reader takes the first key that has a value
type EnvKeyInput = string | readonly [string, ...string[]];

// the value is non-missing with its templates resolved
interface PresentValue {
    key: string;
    value: string;
}

export type { EnvKeyInput, PresentValue };
