'use client';

import Link from 'next/link';

import { cn } from '@/lib/cn';

import type { ReactNode } from 'react';

type Variant = 'solid' | 'ghost' | 'segment';

interface BaseButtonProps {
    href?: string;
    variant?: Variant;
    target?: string;
    className?: string;
    children?: ReactNode;
    onClick?: () => void;
    'aria-label'?: string;
    'aria-expanded'?: boolean;
}

const BASE =
    'inline-flex items-center gap-1.5 font-mono font-semibold leading-none whitespace-nowrap cursor-pointer outline-none transition-[transform,background-color,border-color,color] duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ev-link)';

// Press-scale for the standalone CTAs only. scaling pulls a segment off the rounded corner and reveals the group edge, so they press with a
// background change instead.
const PRESS = 'transform-gpu backface-hidden will-change-transform active:scale-[0.985] motion-reduce:active:scale-100';

const VARIANTS: Record<Variant, string> = {
    solid: `px-5 py-3 rounded-[10px] text-[13px] text-(--ev-on-brand) bg-(--ev-brand) hover:bg-(--ev-link-hover) ${PRESS}`,
    ghost: `px-5 py-3 rounded-[10px] text-[13px] border border-fd-border hover:border-(--ev-link) hover:text-(--ev-link) ${PRESS}`,
    segment:
        'h-[34px] px-3 text-[12.5px] text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent active:bg-fd-accent'
};

export function BaseButton({
    href,
    variant = 'segment',
    target,
    className,
    children,
    onClick,
    'aria-label': ariaLabel,
    'aria-expanded': ariaExpanded
}: BaseButtonProps): ReactNode {
    const classes = cn(BASE, VARIANTS[variant], className);

    if (href !== undefined) {
        if (/^https?:\/\//.test(href)) {
            return (
                <a
                    href={href}
                    target={target}
                    rel={target === '_blank' ? 'noreferrer' : undefined}
                    onClick={onClick}
                    aria-label={ariaLabel}
                    className={classes}
                >
                    {children}
                </a>
            );
        }
        return (
            <Link href={href} onClick={onClick} aria-label={ariaLabel} className={classes}>
                {children}
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} aria-label={ariaLabel} aria-expanded={ariaExpanded} className={classes}>
            {children}
        </button>
    );
}
