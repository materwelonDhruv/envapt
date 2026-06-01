'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

import type { ReactNode } from 'react';

interface RevealProps {
    className?: string;
    children: ReactNode;
}

// The .ev-reveal entrance and its reduced-motion fallback live in global.css; this only toggles data-shown.
export function Reveal({ className, children }: RevealProps): ReactNode {
    const ref = useRef<HTMLElement>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setShown(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '0px 0px -80px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={ref} data-shown={shown} className={cn('ev-reveal', className)}>
            {children}
        </section>
    );
}
