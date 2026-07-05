import Link from 'next/link';

import { ConverterTabs } from '@/components/ConverterTabs';
import { Section } from '@/components/Section';

import type { ReactNode } from 'react';

export function ConverterShowcase(): ReactNode {
    return (
        <Section
            title="Every value, validated and typed."
            lead="Pick a converter and read the value back as its real type. All built in, zero validator dependencies."
        >
            <ConverterTabs />
            <p className="mt-6 text-[15px] text-fd-muted-foreground">
                Or pass your own{' '}
                <code className="font-mono text-[0.92em] text-fd-foreground">{'(raw, fallback) => T'}</code> function,
                or validate through a{' '}
                <Link href="/docs/standard-schema" className="text-(--ev-link) hover:underline">
                    Standard Schema
                </Link>{' '}
                validator (zod, valibot, arktype).{' '}
                <Link href="/docs/converters" className="text-(--ev-link) hover:underline">
                    All converters
                </Link>
                .
            </p>
        </Section>
    );
}
