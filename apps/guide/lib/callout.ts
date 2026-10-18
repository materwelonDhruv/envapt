export type CalloutType = 'info' | 'tip' | 'warn' | 'danger';

export const DEFAULT_CALLOUT_TYPE: CalloutType = 'tip';

export const CALLOUT_LABELS: Record<CalloutType, string> = {
    info: 'NOTE',
    tip: 'TIP',
    warn: 'WARNING',
    danger: 'DANGER'
};
