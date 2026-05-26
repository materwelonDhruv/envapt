---
name: oop
description: Use this when deciding between classes and functions, designing service layers, or applying OOP principles in seedcord. Covers the class-vs-function rule, SOLID in TypeScript, access modifiers, composition over inheritance, service pattern, and common OOP antipatterns to avoid.
---

# OOP in TypeScript — Seedcord Conventions

The repo's rule (from AGENTS.md): **OOP for complex domain logic** (inheritance + composition); **plain functions for small, stateless utilities.** The line is complexity and statefulness — not a preference for one style.

---

## Rule 1 — When to use a class vs a function

| Situation | Use |
|---|---|
| Stateful domain logic (lifecycle, encapsulated state, polymorphism) | Class |
| Multiple related methods that share private state | Class |
| Implementing an interface that multiple consumers depend on | Class |
| Simple transform, formatter, predicate, or one-off utility | Function |
| React hook | Function |
| Module-level configuration or constants | Named exports |

```ts
// Bad — class wrapping a single stateless transform
export class PriceFormatter {
    static format(cents: number): string {
        return `$${(cents / 100).toFixed(2)}`;
    }
}

// Good — plain function
export function formatCentsToCad(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}
```

```ts
// Good — class for stateful service with lifecycle
export class CartSyncService {
    private readonly queue: SyncOperation[] = [];
    private isFlushing = false;

    enqueue(op: SyncOperation): void { ... }
    async flush(): Promise<void> { ... }
    reset(): void { ... }
}
```

---

## Rule 2 — No static-only classes (namespace antipattern)

A class where every member is `static` is just a module masquerading as a class. Use named exports instead.

```ts
// Bad — static namespace class
export class Utils {
    static parseDate(s: string): Date { ... }
    static formatCurrency(n: number): string { ... }
}

// Good — named exports from a module
export function parseDate(s: string): Date { ... }
export function formatCurrency(n: number): string { ... }
```

---

## Rule 3 — SOLID in practice

### Single Responsibility

Each class has one reason to change. If a class knows how to fetch data AND format it AND validate it, split it.

```ts
// Bad
export class OrderService {
    async fetch(id: string): Promise<Order> { ... }
    formatForDisplay(order: Order): DisplayOrder { ... }
    validate(order: Order): boolean { ... }
}

// Good — each responsibility in its own unit
export class OrderService { async fetch(id: string): Promise<Order> { ... } }
export class OrderPresenter { format(order: Order): DisplayOrder { ... } }
export function validateOrder(order: Order): boolean { ... }
```

### Open/Closed — extend via composition, not modification

Add behavior by composing, not by modifying the class. New use cases should add new code, not rewrite existing classes.

### Liskov Substitution

Subclasses must be usable wherever the base class is expected — without callers knowing which subclass they have. If a subclass throws on a method the base class exposes, that's a violation.

### Interface Segregation

Prefer narrow interfaces over one fat interface.

```ts
// Bad — fat interface; every consumer gets methods they don't need
interface Repository<T> {
    findById(id: string): Promise<T>;
    findAll(): Promise<T[]>;
    save(entity: T): Promise<void>;
    delete(id: string): Promise<void>;
    count(): Promise<number>;
    search(query: string): Promise<T[]>;
}

// Good — segregated interfaces
interface Readable<T> { findById(id: string): Promise<T>; }
interface Writable<T> { save(entity: T): Promise<void>; }
```

### Dependency Inversion

Depend on interfaces/abstractions, not concrete implementations. Pass dependencies in (constructor injection) rather than constructing them inside.

```ts
// Bad — hard-wired dependency
export class OrderService {
    private readonly db = new PostgresDatabase(); // can't be mocked, can't be swapped
}

// Good — injected dependency
export class OrderService {
    constructor(private readonly db: Database) {}
}
```

---

## Rule 4 — Composition over inheritance

Inheritance is appropriate for genuine "is-a" relationships (a `PulsesProduct` is a `Product`). Use composition for "has-a" or "does-a" (a service that has a logger, does retries).

```ts
// Fragile inheritance — adding behavior by subclassing
class BaseService {
    protected log(msg: string): void { console.log(msg); }
}
class OrderService extends BaseService {
    fetch() { this.log('fetching'); }
}

// Better — compose the logger in
class OrderService {
    constructor(private readonly logger: Logger) {}
    fetch() { this.logger.info('fetching'); }
}
```

Max inheritance depth: 2 (base + one subclass). If you're 3 levels deep, refactor to composition.

---

## Rule 5 — Access modifiers

Use the narrowest access modifier that satisfies the requirement:

```ts
export class ProductService {
    // Public — part of the API contract
    async findById(id: string): Promise<Product> { ... }

    // Private — implementation detail, not part of the contract
    private buildQuery(id: string): string { ... }

    // Readonly — set once in the constructor, never reassigned
    constructor(private readonly client: ApiClient) {}
}
```

**`#name` (ECMAScript private)** vs **`private` (TypeScript keyword):**

- `private` is erased at runtime — still accessible via `(obj as any).name`
- `#name` is a true runtime private field — use it for genuinely sensitive state

```ts
class AuthSession {
    #token: string; // truly private at runtime

    constructor(token: string) { this.#token = token; }

    getAuthHeader(): string { return `Bearer ${this.#token}`; }
}
```

---

## Rule 6 — Interface vs abstract class

**Use an interface** when you want to define a contract that multiple unrelated classes can implement, and you don't need any shared implementation:

```ts
interface Logger {
    info(msg: string): void;
    error(msg: string, err?: unknown): void;
}

class ConsoleLogger implements Logger { ... }
class PinoLogger implements Logger { ... }
```

**Use an abstract class** when you have shared implementation alongside the contract:

```ts
abstract class BaseRepository<T> {
    constructor(protected readonly db: Database) {}

    // Shared implementation
    protected async query(sql: string): Promise<unknown[]> {
        return this.db.execute(sql);
    }

    // Contract — subclasses must implement
    abstract findById(id: string): Promise<T>;
}

class OrderRepository extends BaseRepository<Order> {
    findById(id: string): Promise<Order> {
        return this.query(`SELECT * FROM orders WHERE id = '${id}'`).then(parseOrder);
    }
}
```

Do not use abstract classes just to share a logger or config — that's what constructor injection is for.

---

## Rule 7 — Service pattern (how this repo uses it)

Services encapsulate business logic around an entity or domain concept. They are injected where needed; they don't create their own dependencies.

```ts
export class AddressService {
    constructor(private readonly api: ApiClient) {}

    async list(userId: string): Promise<Address[]> {
        const response = await this.api.get(`/users/${userId}/addresses`);
        return response.data;
    }

    async setDefault(addressId: string): Promise<void> {
        await this.api.patch(`/addresses/${addressId}`, { is_default: true });
    }
}
```

Conventions:

- One service per domain entity or bounded context
- Services are instantiated once (singletons in DI or module-level instances)
- No presentation logic inside services — they return domain types, not display strings
- No state that leaks between requests/users

---

## Antipatterns to refuse

```ts
// ❌ Static namespace class
export class MathUtils { static add(a, b) { return a + b; } }

// ❌ God class — one class doing everything
export class AppService { /* auth, products, cart, checkout, analytics */ }

// ❌ Constructor doing async work
constructor() { this.data = await fetchData(); } // use an init() method or factory

// ❌ Mutating props or injected references
class Service {
    update(config: Config) { config.timeout = 5000; } // mutate the caller's object
}

// ❌ Inheritance for code reuse only (no is-a relationship)
class CoffeeProduct extends DatabaseRecord { } // just inject the DB client

// ❌ Abstract class with no shared implementation
abstract class Animal { abstract speak(): void; } // use an interface instead
```
