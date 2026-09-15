import type { KeyCasing } from '../types';

// if you change this, change the RecaseKey type in types/Casing.ts to match
export function recase(name: string, casing?: KeyCasing): string {
    if (casing === undefined) return name;
    const words = name.split('_').filter((word) => word.length > 0);
    if (casing === 'kebab-case') return words.map((word) => word.toLowerCase()).join('-');
    const pascal = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
    return casing === 'PascalCase' ? pascal : pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
