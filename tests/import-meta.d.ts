/**
 * This makes import.meta.dirname available in both Node.js and Deno environments.
 */
declare global {
  interface ImportMeta {
    dirname: string;
  }
}

export {};
