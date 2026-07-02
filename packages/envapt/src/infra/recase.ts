import type { KeyCasing } from '../types';

// underscore-delimited words, kept in step with the RecaseKey type transforms in types/Casing.ts.
export function recase(name: string, casing?: KeyCasing): string {
    if (casing === undefined) return name;
    const words = name.split('_').filter((word) => word.length > 0);
    if (casing === 'kebab-case') return words.map((word) => word.toLowerCase()).join('-');
    const pascal = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
    return casing === 'PascalCase' ? pascal : pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
