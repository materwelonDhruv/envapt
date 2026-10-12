# Good and bad tests

## Good tests

Integration-style. Test through the real interface, not mocks of internal parts.

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { CooldownManager } from '../src/CooldownManager';

describe('CooldownManager', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    // GOOD: checks observable behavior through the public methods
    it('throws while a key is cooling down and recovers after the window', () => {
        const cooldown = new CooldownManager({ cooldown: 1000 });

        cooldown.check('user');
        expect(() => cooldown.check('user')).toThrow();

        vi.advanceTimersByTime(1000);
        expect(() => cooldown.check('user')).not.toThrow();
    });
});
```

Characteristics:

- Checks behavior the caller cares about.
- Uses the public API only.
- Survives internal refactors.
- Names what it does, not how.
- One logical assertion per test.

## Bad tests

Implementation-detail tests. Coupled to internal structure.

```typescript
// BAD: asserts on an internal call instead of the result
it('check writes to the internal timestamp map', () => {
    const cooldown = new CooldownManager({ cooldown: 1000 });
    const spy = vi.spyOn(cooldown as unknown as { record: () => void }, 'record');
    cooldown.check('user');
    expect(spy).toHaveBeenCalled();
});
```

Red flags:

- Mocking or spying on collaborators you own.
- Reaching into private methods.
- Asserting on call counts or order.
- Test breaks when you refactor with no behavior change.
- Test name describes how, not what.
- Verifying through a side channel instead of the interface.

```typescript
// BAD: reaches past the interface to verify
it('set marks a key active in the internal map', () => {
    const cooldown = new CooldownManager({ cooldown: 1000 });
    cooldown.set('a');
    const internal = cooldown as unknown as { store: Map<string, number> };
    expect(internal.store.has('a')).toBe(true);
});

// GOOD: verifies through the public method
it('reports a key as active after set and inactive after clear', () => {
    const cooldown = new CooldownManager({ cooldown: 1000 });

    cooldown.set('a');
    expect(cooldown.isActive('a')).toBe(true);

    cooldown.clear('a');
    expect(cooldown.isActive('a')).toBe(false);
});
```
