import Link from 'next/link';

import { Code } from '@/components/Code';
import { CodeCard } from '@/components/CodeCard';
import { Section } from '@/components/Section';

import type { ReactNode } from 'react';

const CHECK = `import { Envapter, Converters } from 'envapt';

export const config = Envapter.getRequiredAll({
  DATABASE_URL: Converters.Url,
  PORT: Converters.Port,
  CACHE_TTL: Converters.Time
});`;

const OUTPUT = `$ DATABASE_URL=postgres://db/app \\
  PORT=99999 CACHE_TTL=soon node config.ts

EnvaptError [210]: Validation failed for PORT, CACHE_TTL.
    at …
  code: 210,
  issues: [
    { message: 'could not be converted', path: [ 'PORT' ] },
    { message: 'could not be converted', path: [ 'CACHE_TTL' ] }
  ]
}`;

export function StartupCheck(): ReactNode {
    return (
        <Section
            title="Stop at startup, with every bad key."
            lead={
                <>
                    <code className="font-mono text-[0.92em] text-fd-foreground">getRequiredAll</code> reads a group of
                    variables in one call. If any are missing, it throws one error that lists every missing key. If
                    they&apos;re all set but some can&apos;t be converted, one error lists those.
                </>
            }
        >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <CodeCard fileName="config.ts">
                    <Code code={CHECK} />
                </CodeCard>
                <CodeCard fileName="terminal">
                    <Code code={OUTPUT} lang="txt" />
                </CodeCard>
            </div>
            <p className="mt-5 font-mono text-[12.5px] text-fd-muted-foreground">
                Each issue gives the key and why it failed.{' '}
                <Link href="/docs/required-values" className="text-(--ev-link) hover:underline">
                    Required values
                </Link>
                .
            </p>
        </Section>
    );
}
