# Envapt - The apt way to handle env

A powerful TypeScript-first environment configuration library that provides type detection, template variable resolution, and decorator-based class property configuration by extending dotenv.

## Features

- 🔧 **Automatic Type Detection** - Types inferred from fallback values
- 🔗 **Template Variables** - `${VAR}` syntax with circular reference protection
- 🎯 **Class Properties** - Decorator-based configuration for class members
- 🏷️ **Built-in & Custom Converters** - Ready-to-use converters for common patterns + custom transformations
- 🌍 **Environment Detection** - Built-in development/staging/production handling
- 📂 **Multiple .env Files** - Load from multiple sources
- 💪 **Edge Case Handling** - Robust parsing for all scenarios
- 🛡️ **Type Safety** - Full TypeScript support with proper type inference

## Table of Contents

- [Requirements](#requirements)
- [Quick Start](#quick-start)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
  - [Decorator API](#decorator-api)
  - [Built-in Converters](#built-in-converters)
  - [Custom Array Converters](#custom-array-converters)
  - [Custom Converters](#custom-converters)
  - [Handling Missing Values](#handling-missing-values)
  - [Functional API](#functional-api)
- [Environment Detection](#environment-detection)
- [Template Variables](#template-variables)
- [Advanced Examples](#advanced-examples)

## Requirements

- **Node.js**: v18 or later (recommended for ESM and nodenext support)
- **TypeScript**: v5.8 or later
- **Dependencies**:
  - `dotenv` (runtime dependency | bundled)
  - `reflect-metadata` (peer dependency, required for decorators)
- **TypeScript Compiler Options**:
  - `experimentalDecorators: true`
  - `emitDecoratorMetadata: true`
  - `module: nodenext`
  - `moduleResolution: nodenext`
  - `target: esnext`
  - `lib: ESNext`
- **ESM Support**: Project uses ESM (`nodenext`), so your environment and tooling should support ES modules.

## Quick Start

### Installation

```bash
# npm
npm install @seedcord/envapt reflect-metadata

# pnpm
pnpm add @seedcord/envapt reflect-metadata

# yarn
yarn add @seedcord/envapt reflect-metadata
```

### Basic Usage

Create a `.env` file:

```env
APP_PORT=8443
APP_URL=http://localhost:${APP_PORT}
DATABASE_URL=postgres://localhost:5432/mydb
IS_PRODUCTION=false
MAX_CONNECTIONS=100
ALLOWED_ORIGINS=https://app.com,https://admin.com
```

Use with decorators (recommended):

```ts
import { Envapt, Envapter } from '@seedcord/envapt';

// Global app configuration (static properties)
class AppConfig extends Envapter {
  @Envapt('APP_PORT', 3000)
  static readonly port: number;

  @Envapt('APP_URL', 'http://localhost:3000', 'url')
  static readonly url: URL;

  @Envapt('ALLOWED_ORIGINS', {
    fallback: ['http://localhost:3000'],
    converter: 'array'
  })
  static readonly allowedOrigins: string[];
}

// Service configuration (instance properties)
class DatabaseService {
  @Envapt('DATABASE_URL', 'sqlite://memory')
  declare readonly databaseUrl: string;

  @Envapt('MAX_CONNECTIONS', { converter: 'number', fallback: 10 })
  declare readonly maxConnections: number;

  @Envapt('REQUEST_TIMEOUT', { converter: 'time', fallback: 5000 })
  declare readonly timeout: number; // Converts "5s" to 5000ms

  async connect() {
    console.log(`Connecting to ${this.databaseUrl}`);
    // Connection logic here
  }
}

// Usage
console.log(AppConfig.port); // 8443 (number)
console.log(AppConfig.url.href); // "http://localhost:8443" (templated!)

const dbService = new DatabaseService();
await dbService.connect();
```

Or use functionally:\
<sub>Limited to primitives, String, Number, Boolean, Symbol, and BigInt. Does not support converters.</sub>

```ts
import { Envapter } from '@seedcord/envapt';

const port = Envapter.getNumber('APP_PORT', 3000);
const url = Envapter.get('APP_URL', 'http://localhost:3000');
const isProduction = Envapter.getBoolean('IS_PRODUCTION', false);
```

## API Reference

### Decorator API

The `@Envapt` decorator can be used on both **static** and **instance** class properties:

- **Static properties**: Use for global configuration that's shared across your entire application (e.g., app port, global features, environment settings)
- **Instance properties**: Use for service-specific configuration that may vary per service or when you want the configuration tied to a specific class instance (e.g., database connections, service endpoints, per-service settings)

**Important**: Instance properties must be declared with `declare` keyword or `!` assertion since they're populated by the decorator rather than set in a constructor.

#### Modern Syntax (Recommended)

```ts
@Envapt('ENV_VAR', { fallback?: T, converter?: EnvConverter<T> })
```

#### Classic Syntax

```ts
@Envapt('ENV_VAR', fallback?, converter?)
```

#### Automatic Type Detection

Types are automatically inferred from fallback values. Use static properties for app-wide config and instance properties for service-specific config:

```ts
class Config extends Envapter {
  // Static properties for global settings
  @Envapt('APP_NAME', 'MyApp') // string
  static readonly appName: string;

  @Envapt('APP_PORT', 3000) // number
  static readonly port: number;

  @Envapt('DEBUG_MODE', false) // boolean
  static readonly debugMode: boolean;

  // Instance properties for service-specific settings
  @Envapt('SMTP_HOST', 'localhost') // string
  declare readonly smtpHost: string;

  @Envapt('SMTP_PORT', 587) // number
  declare readonly smtpPort: number;

  @Envapt('SMTP_SECURE', true) // boolean
  declare readonly smtpSecure: boolean;

  sendEmail(to: string, subject: string) {
    console.log(`Sending via ${this.smtpHost}:${this.smtpPort}`);
  }
}
```

#### Built-in Converters

Envapt provides many built-in converters for common patterns:

```ts
class Config extends Envapter {
  // Basic types
  @Envapt('APP_NAME', { converter: 'string', fallback: 'MyApp' })
  static readonly appName: string;

  @Envapt('PORT', { converter: 'number', fallback: 3000 })
  static readonly port: number;

  @Envapt('PRODUCTION_MODE', { converter: 'boolean', fallback: false })
  static readonly productionMode: boolean;

  // Advanced types
  @Envapt('CORS_ORIGINS', { converter: 'array', fallback: [] })
  static readonly corsOrigins: string[];

  @Envapt('CONFIG_JSON', { converter: 'json', fallback: {} })
  static readonly config: object;

  @Envapt('API_URL', { converter: 'url', fallback: new URL('http://localhost') })
  static readonly apiUrl: URL;

  @Envapt('TIMEOUT', { converter: 'time', fallback: 5000 })
  static readonly timeout: number; // Converts "30s" to 30000ms

  // Instance properties work the same way
  @Envapt('CACHE_TTL', { converter: 'time', fallback: 3600000 })
  declare readonly cacheTtl: number; // "1h" becomes 3600000ms
}
```

**Available Built-in Converters:**

- `'string'` - String values
- `'number'` - Numeric values (integers and floats)
- `'integer'` - Integer values only
- `'float'` - Float values only
- `'boolean'` - Boolean values (true/false, yes/no, on/off, 1/0)
- `'bigint'` - BigInt values for large integers
- `'symbol'` - Symbol values (creates symbols from string descriptions)
- `'time'` - Time values (converts "5s", "30m", "2h" to milliseconds)
- `'json'` - JSON objects/arrays (safe parsing with fallback)
- `'array'` - Comma-separated string arrays
- `'url'` - URL objects
- `'regexp'` - Regular expressions (supports `/pattern/flags` syntax)
- `'date'` - Date objects (supports ISO strings and timestamps)
- `'time'` - Values denoting time. Such as 100, 30ms, 5s, 10m, 1.5h. (parsed to ms)

#### Custom Array Converters

For more control over array parsing:

```ts
class Config extends Envapter {
  // Basic array (comma-separated strings)
  @Envapt('TAGS', { converter: 'array', fallback: [] })
  static readonly tags: string[];

  // Custom delimiter
  @Envapt('ALLOWED_METHODS', { converter: { delimiter: '|' }, fallback: ['GET'] })
  declare readonly allowedMethods: string[];

  // Custom delimiter with type conversion
  @Envapt('RATE_LIMITS', { converter: { delimiter: ',', type: 'number' }, fallback: [100] })
  declare readonly rateLimits: number[];

  @Envapt('FEATURE_FLAGS', { converter: { delimiter: ';', type: 'boolean' }, fallback: [false] })
  declare readonly featureFlags: boolean[];
}
```

**ArrayConverter Interface:**

- `delimiter: string` - The string used to split array elements
- `type?: BuiltInConverter` - Optional type to convert each element to (excludes 'array', 'json', and 'regexp')

#### Custom Converters

Transform environment values to any type:

```ts
class Config extends Envapter {
  @Envapt('TAGS', {
    fallback: new Set(['default']),
    converter: (raw, fallback) => {
      if (!raw) return fallback;
      return new Set(raw.split(',').map((s) => s.trim()));
    }
  })
  static readonly tags: Set<string>;

  @Envapt('NOTIFICATION_CHANNELS', {
    fallback: new Map([['email', 'enabled']]),
    converter: (raw, fallback) => {
      if (!raw) return fallback;
      const map = new Map();
      raw.split(',').forEach((pair) => {
        const [key, value] = pair.split(':');
        map.set(key?.trim(), value?.trim() || 'enabled');
      });
      return map;
    }
  })
  declare readonly channels: Map<string, string>;
}
```

#### Handling Missing Values

Control what happens when environment variables don't exist:

```ts
class Config extends Envapter {
  // Returns undefined if not found
  @Envapt('OPTIONAL_FEATURE', { fallback: undefined })
  static readonly optionalFeature: string | undefined;

  // Returns null if not found (no fallback provided)
  @Envapt('MISSING_CONFIG', { converter: 'string' })
  static readonly missingConfig: string | null;

  // Uses fallback if not found
  @Envapt('DEFAULT_THEME', { fallback: 'light' })
  static readonly defaultTheme: string;

  // Instance properties work the same way
  @Envapt('LOG_FILE_PATH', { fallback: undefined })
  declare readonly logFilePath: string | undefined;
}
```

### Functional API

```ts
import { Envapter } from '@seedcord/envapt';

// Type-specific getters
const str = Envapter.get('STRING_VAR', 'default');
const num = Envapter.getNumber('NUMBER_VAR', 42);
const bool = Envapter.getBoolean('BOOLEAN_VAR', false);

// Instance methods (same API)
const envapter = new Envapter();
const value = envapter.get('VAR', 'default');
```

## Environment Detection

Envapt automatically detects your environment from these variables (in order):

1. `ENVIRONMENT`
2. `ENV`
3. `NODE_ENV`

Supported values: `development`, `staging`, `production` (case-sensitive)

### Environment Management

```ts
import { Envapter, EnvaptEnvironment } from '@seedcord/envapt';

// Check current environment
console.log(Envapter.environment); // Environment.Development
console.log(Envapter.isProduction); // false
console.log(Envapter.isDevelopment); // true
console.log(Envapter.isStaging); // false

// Set environment
Envapter.environment = EnvaptEnvironment.Production;
Envapter.environment = 'staging'; // string also works
```

### Multiple .env Files

```ts
import { resolve } from 'node:path';
import { Envapter } from '@seedcord/envapt';

// Load from multiple files
Envapter.envPaths = [resolve(__dirname, '.env.local'), resolve(__dirname, '.env.production')];

// Or single file
Envapter.envPaths = resolve(__dirname, '.env.production');

// Or just don't set a path for it to default to .env at the root of your project
```

## Template Variables

Envapt supports variable interpolation with `${VARIABLE}` syntax:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_URL=postgres://${DATABASE_HOST}:${DATABASE_PORT}/mydb

API_VERSION=v1
API_BASE=https://api.example.com
API_ENDPOINT=${API_BASE}/${API_VERSION}/users
```

### Circular Reference Protection

```env
CIRCULAR_A=${CIRCULAR_B}
CIRCULAR_B=${CIRCULAR_A}
```

Circular references are detected and preserved as-is rather than causing infinite loops.

## Advanced Examples

### Complex Configuration

```ts
import { Envapt, Envapter } from '@seedcord/envapt';

class AppConfig extends Envapter {
  // Global settings (static)
  @Envapt('PORT', 3000)
  static readonly port: number;

  @Envapt('REQUEST_TIMEOUT', { converter: 'time', fallback: 10000 })
  static readonly requestTimeout: number; // "5s" -> 5000ms (if env is set to "5s")

  @Envapt('FEATURE_FLAGS', {
    fallback: new Set(['basic']),
    converter: (raw, fallback) => {
      if (!raw) return fallback;
      return new Set(raw.split(',').map((s) => s.trim()));
    }
  })
  static readonly featureFlags: Set<string>;

  // Service settings (instance)
  @Envapt('DB_URL', 'sqlite://memory')
  declare readonly databaseUrl: string;

  @Envapt('CACHE_TTL', { converter: 'time', fallback: 3600000 })
  declare readonly cacheTtl: number; // "1h" -> 3600000ms

  @Envapt('REDIS_URLS', {
    fallback: [new URL('redis://localhost:6379')],
    converter: (raw, fallback) => (raw ? raw.split(',').map((s) => new URL(s)) : fallback)
  })
  declare readonly redisUrls: URL[];

  async initialize() {
    console.log(`App running on port ${AppConfig.port}`);
    console.log(`Database: ${this.databaseUrl}`);
    console.log(`Cache TTL: ${this.cacheTtl}ms`);
  }
}
```
