# When to mock

Mock at system boundaries only:

- The Discord gateway and REST client (the seedcord tests stub the client; `mock/` runs a real one for integration).
- Time and randomness (`vi.useFakeTimers()`, see the CooldownManager tests).
- The filesystem, sometimes (the command/event loaders read from a temp dir via `TestEnvironment`).

Do not mock:

- Your own classes and modules.
- Internal collaborators.
- Anything you control.

## Designing for mockability

At a boundary, design the interface so it is easy to stand in for.

**1. Inject the dependency**

Pass the external dependency in rather than constructing it inside.

```typescript
// Easy to substitute
function registerCommands(client: Client, commands: Command[]) {
    return client.application.commands.set(commands);
}

// Hard to substitute, constructs its own client
function registerCommands(commands: Command[]) {
    const client = new Client({ intents: [] });
    return client.application.commands.set(commands);
}
```

**2. Prefer specific operations over one generic call**

A function per operation is independently substitutable. One generic function pushes conditional logic into the test setup.

```typescript
// GOOD: each method returns one shape, no branching in the stub
const rest = {
    getGuild: (id: string) => client.rest.get(`/guilds/${id}`),
    getMember: (guildId: string, userId: string) => client.rest.get(`/guilds/${guildId}/members/${userId}`)
};

// BAD: the stub needs an if-tree over the route
const rest = {
    get: (route: string) => client.rest.get(route)
};
```

The specific approach means each stub returns one known shape, the test setup has no branching, and you can see which calls a test exercises.
