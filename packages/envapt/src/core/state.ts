import { UnboundSource } from '../sources/UnboundSource';

import type { Environment } from './EnvironmentMethods';
import type { EnvFileOptions } from '../infra/Dotenv';
import type { FileApiMode, ProfilesConfig, Source } from '../types';

// The engine's mutable state that should not be exposed in the package exports map.
export const state = {
    envPaths: ['.env'] as string[],
    envPathsExplicitlySet: false,
    baseDir: undefined as string | undefined,
    userDefinedEnvFileOptions: {} as EnvFileOptions,
    strict: false,
    syncProcessEnv: false,
    fileApiMode: 'warn' as FileApiMode,
    // loader-written keys only (collisions skipped), refilled on every cache rebuild.
    dotenvAddedKeys: new Set<string>(),
    // unbound by default so non-Node builds throw NoSourceBound on read until useSource() runs.
    source: new UnboundSource() as Source,
    environment: undefined as Environment | undefined,
    environmentExplicitlySet: false,
    profiles: undefined as ProfilesConfig | undefined
};

export const cache = new Map<string, unknown>();
