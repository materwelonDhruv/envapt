import { Hero } from '@/components/Hero';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: { absolute: 'envapt · Typed config, straight from .env' }
};

export default function HomePage(): ReactNode {
    return (
        <main className="flex flex-1 flex-col">
            <Hero />
        </main>
    );
}
