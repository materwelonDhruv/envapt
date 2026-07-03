export { Environment } from './engine/Envapter';
export { Converters, isArrayOf } from './converters';
export { PortableSource } from './sources/PortableSource';
export { merge } from './sources/merge';
export type { ConverterToken, CustomElementConverter } from './converters';
export type { DebugLevel } from './infra/Debug';
export type { EnvFileOptions } from './infra/Dotenv';
export type { StandardSchemaV1 } from './infra/StandardSchema';
export * from './infra/Error';

export type {
    ConverterFunction,
    EnvaptConverter,
    JsonValue,
    TimeFallback,
    EnvaptOptions,
    EnvProfile,
    ProfilesConfig,
    FileApiMode,
    Source
} from './types';
