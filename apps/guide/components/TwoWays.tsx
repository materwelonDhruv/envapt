import { Code } from '@/components/Code';
import { CodeCard } from '@/components/CodeCard';
import { Section } from '@/components/Section';

import type { ReactNode } from 'react';

const FUNCTIONAL = `import { Envapter, Converters } from 'envapt';

const config = {
  port: Envapter.getNumber('PORT', 3000),
  dbUrl: Envapter.getUsing('DATABASE_URL', Converters.Url)
};`;

const DECORATOR = `import { Envapt, Converters } from 'envapt';

class Config {
  @Envapt('PORT', { converter: Converters.Number, fallback: 3000 })
  declare static readonly port: number;
}`;

export function TwoWays(): ReactNode {
    return (
        <Section
            eyebrow="// two ways to read"
            title="Two ways to read, one engine."
            lead={
                <>
                    Read values with <code className="font-mono text-[0.92em] text-fd-foreground">Envapter</code>, or
                    bind them to class fields with{' '}
                    <code className="font-mono text-[0.92em] text-fd-foreground">@Envapt</code>. Both share the same
                    parsing, converters, and cache.
                </>
            }
        >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <CodeCard fileName="app.ts">
                    <Code code={FUNCTIONAL} />
                </CodeCard>
                <CodeCard fileName="config.ts">
                    <Code code={DECORATOR} />
                </CodeCard>
            </div>
            <p className="mt-5 font-mono text-[12.5px] text-fd-muted-foreground">
                A fallback removes <code className="text-fd-foreground">undefined</code> from the return type.
            </p>
        </Section>
    );
}
