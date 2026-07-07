import { cn } from '@/lib/cn';

import type { ReactNode } from 'react';

interface CodeCardProps {
    fileName: string;
    className?: string;
    children: ReactNode;
}

export function CodeCard({ fileName, className, children }: CodeCardProps): ReactNode {
    return (
        <div className={cn('ev-editor relative min-w-0 bg-(--ev-panel) ring-1 ring-fd-border ring-inset', className)}>
            <div className="ev-editor-fold absolute top-0 right-0 size-7" aria-hidden="true" />
            <div className="flex items-center gap-2 border-b border-fd-border px-4 py-3">
                <span className="size-2.5 rounded-full bg-(--ev-dot-red)" />
                <span className="size-2.5 rounded-full bg-(--ev-dot-amber)" />
                <span className="size-2.5 rounded-full bg-(--ev-dot-teal)" />
                <span className="ml-1.5 font-mono text-xs text-fd-muted-foreground">{fileName}</span>
            </div>
            {children}
        </div>
    );
}
