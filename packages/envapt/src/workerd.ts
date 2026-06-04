// Cloudflare Workers entry: the same node-free surface as the browser build (bare Envapter + the
// throwing file-API stubs). Workers bind their request `env` via Envapter.useSource(new WorkerEnvSource(env)).
export * from './browser';
