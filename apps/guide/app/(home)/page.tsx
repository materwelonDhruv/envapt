import { ClosingCta } from '@/components/ClosingCta';
import { ConverterShowcase } from '@/components/ConverterShowcase';
import { EnvLoading } from '@/components/EnvLoading';
import { Hero } from '@/components/Hero';
import { TwoWays } from '@/components/TwoWays';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: { absolute: 'envapt · Typed config, straight from .env' }
};

export default function HomePage(): ReactNode {
    return (
        <main className="flex flex-1 flex-col">
            <Hero />
            <TwoWays />
            <ConverterShowcase />
            <EnvLoading />
            <ClosingCta />
        </main>
    );
}
