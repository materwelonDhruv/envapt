import type { ReactNode } from 'react';

// The envapt mark (rounded square + gold folded corner). Size via className (e.g. size-6).
export function Glyph({ className }: { className?: string }): ReactNode {
    return (
        <svg viewBox="0 0 100 110" className={className} fill="none" aria-hidden="true">
            <path d="M15 0H68L100 32V95Q100 110 85 110H15Q0 110 0 95V15Q0 0 15 0Z" fill="#e35d28" />
            <path d="M68 0L100 32L68 32Z" fill="#f7cc88" />
        </svg>
    );
}
