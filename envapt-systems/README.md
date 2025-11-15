# envapt-systems

Small utility to register system decoders for envapt-style system prefixes like `nez:`, `json:`, `b64:`, `file:`.

Usage

- Register custom systems using `registerSystem(prefix, decoder)`
- Normalize values using `decodeSystemValue(key, raw)`

Example

```ts
import { decodeSystemValue, registerSystem } from '@funeste38/envapt-systems';

registerSystem('json', (v) => JSON.parse(v));

const cfg = decodeSystemValue('FEATURE_FLAGS', process.env.FEATURE_FLAGS);
```
