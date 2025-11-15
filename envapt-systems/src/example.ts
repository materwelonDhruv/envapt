import { decodeSystemValue, registerSystem } from './systems';

// Example: wire a simple mock nez system that resolves id: tokens
registerSystem('nez', (value: string) => {
  // value may be "id:xxx" or a path
  if (value.startsWith('id:')) {
    const id = value.slice('id:'.length);
    // mock resolver: map 'db/prod' to a secret string for demo
    if (id === 'db/prod') return 'super-secret-from-id-db-prod';
    // unknown id -> return raw pointer so callers can handle it
    return `nez:id:${id}`;
  }

  // plain path or pointer -> return raw pointer for demo
  return `nez:${value}`;
});

export function getNormalized<T = unknown>(raw: string | undefined): T | undefined {
  return decodeSystemValue('', raw) as T;
}

// Demo usage (will print the resolved value or raw pointer)
if (require.main === module) {
  const examples = ['json:{"beta":true}', 'b64:aGVsbG8=', 'file:README.md', 'nez:id:db/prod', 'plain-value'];

  for (const ex of examples) {
    // eslint-disable-next-line no-console
    console.log(ex, '->', getNormalized(ex));
  }
}
