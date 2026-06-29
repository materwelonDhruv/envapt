console.warn(
    "[envapt] The 'envapt/workerd' subpath is deprecated and will be removed in v8. Import from 'envapt' instead, which resolves the portable build on Workers, the browser, and edge runtimes."
);
export * from '../dist/workerd/index.mjs';
