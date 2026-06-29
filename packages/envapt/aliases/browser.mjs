console.warn(
    "[envapt] The 'envapt/browser' subpath is deprecated and will be removed in v8. Import from 'envapt' instead, which resolves the portable build on the browser, Workers, and edge runtimes."
);
export * from '../dist/browser/index.mjs';
