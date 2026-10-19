# When to mock

Mock at system boundaries only:

- The environment. Point `Envapter.envPaths` at a fixture `.env` file, or bind an object with `Envapter.useSource(new PortableSource({ ... }))`.
- Stderr, when a test checks debug output (`vi.spyOn(process.stderr, 'write')`, see `021-debug-mode.test.ts`).
- The filesystem, sometimes (the `basedir-fixtures` and `cascade-fixtures` folders hold real files to read).

Do not mock:

- Your own classes and modules.
- Internal collaborators.
- Anything you control.

## Designing for mockability

At a boundary, design the interface so it is easy to stand in for.

**1. Inject the dependency**

Pass the external dependency in rather than constructing it inside. `useSource` is this rule in envapt's public API.

```typescript
// Easy to substitute
Envapter.useSource(new PortableSource({ PORT: '8080' }));
const port = Envapter.getAs('PORT', Converters.Port, 3000);

// Hard to substitute, reads process.env directly
const port = Number(process.env.PORT ?? 3000);
```

**2. Prefer specific operations over one generic call**

A function per operation is independently substitutable. One generic function pushes conditional logic into the test setup.

```typescript
// GOOD: each method returns one shape, no branching in the stub
const secrets = {
    getDatabaseUrl: () => store.read('db/url'),
    getApiKey: (service: string) => store.read(`api/${service}`)
};

// BAD: the stub needs an if-tree over the path
const secrets = {
    read: (path: string) => store.read(path)
};
```

The specific approach means each stub returns one known shape, the test setup has no branching, and you can see which calls a test exercises.
