import { Container, Separator, TextDisplay } from 'discord-component-embed';

import type { ReactElement } from 'react';

export interface PreviewLink {
    label: string;
    url: string;
}

export interface PreviewCardProps {
    accent: number;
    breadcrumb?: readonly string[];
    title: string;
    body: string;
    subtext?: readonly string[];
    links: readonly PreviewLink[];
}

const EMOJI = {
    envapt: '<:envapt:1550818194422374460>',
    caret: '<:sc_caret_lg:1555958640525975572>',
    dot: '<:sc_dot:1555958638395396148>'
} as const;

export function PreviewCard({ accent, breadcrumb, title, body, subtext, links }: PreviewCardProps): ReactElement {
    return (
        <Container accentColor={accent}>
            {breadcrumb ? <TextDisplay>{`-# ${breadcrumb.join(EMOJI.caret)}`}</TextDisplay> : null}
            <TextDisplay>{`## ${EMOJI.envapt} ${title}\n${body}`}</TextDisplay>
            {subtext ? <TextDisplay>{`-# ${subtext.join(EMOJI.dot)}`}</TextDisplay> : null}
            <Separator divider spacing="small" />
            <TextDisplay>{links.map(({ label, url }) => `[${label}](${url})`).join(EMOJI.dot)}</TextDisplay>
        </Container>
    );
}
