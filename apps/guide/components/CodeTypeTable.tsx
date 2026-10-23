import { TypeTable } from 'fumadocs-ui/components/type-table';

import type { ComponentProps, ReactNode } from 'react';

type TypeTableProps = ComponentProps<typeof TypeTable>;

function code(text: ReactNode): ReactNode {
    return text === undefined ? undefined : <span className="font-mono text-[0.9em]">{text}</span>;
}

export function CodeTypeTable({ type, ...props }: TypeTableProps): ReactNode {
    const rows: TypeTableProps['type'] = Object.fromEntries(
        Object.entries(type).map(([name, row]) => [
            name,
            { ...row, type: code(row.type), typeDescription: code(row.typeDescription), default: code(row.default) }
        ])
    );
    return <TypeTable type={rows} {...props} />;
}
