import { CALLOUT_LABELS, DEFAULT_CALLOUT_TYPE } from '@/lib/callout';
import { cn } from '@/lib/cn';

import type { CalloutType } from '@/lib/callout';
import type { ReactNode } from 'react';

const VARIANTS: Record<CalloutType, { surface: string; label_color: string }> = {
    info: { surface: 'border-(--ev-info) bg-(--ev-info-soft)', label_color: 'text-(--ev-info)' },
    tip: { surface: 'border-(--ev-tip) bg-(--ev-tip-soft)', label_color: 'text-(--ev-tip)' },
    warn: { surface: 'border-(--ev-warn) bg-(--ev-warn-soft)', label_color: 'text-(--ev-warn)' },
    danger: { surface: 'border-(--ev-danger) bg-(--ev-danger-soft)', label_color: 'text-(--ev-danger)' }
};

export function Callout({
    type = DEFAULT_CALLOUT_TYPE,
    title,
    children
}: {
    type?: CalloutType;
    title?: ReactNode;
    children?: ReactNode;
}): ReactNode {
    const variant = VARIANTS[type];
    return (
        <div className={cn('my-4 rounded-[9px] border px-3.5 py-3 text-[13px]/relaxed', variant.surface)}>
            <span className={cn('mb-0.5 block font-mono text-[11px] font-bold tracking-wider', variant.label_color)}>
                {title ?? CALLOUT_LABELS[type]}
            </span>
            <div className="text-fd-foreground *:first:mt-0 *:last:mb-0 [&_a]:text-(--ev-link)">{children}</div>
        </div>
    );
}
