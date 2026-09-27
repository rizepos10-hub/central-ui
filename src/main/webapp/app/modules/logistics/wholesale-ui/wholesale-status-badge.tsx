import React from 'react';

import { cn } from '@/src/main/webapp/app/lib/utils';

export type WholesaleStatusTone = 'new' | 'approved' | 'returned' | 'cancelled' | 'amendment' | 'neutral';

const toneClass: Record<WholesaleStatusTone, string> = {
  new: 'text-primary bg-primary/[0.12]',
  approved: 'text-[hsl(var(--ws-approved))] bg-[hsl(var(--ws-approved)/0.12)]',
  returned: 'text-[hsl(var(--ws-returned))] bg-[hsl(var(--ws-returned)/0.14)]',
  cancelled: 'text-[hsl(var(--ws-cancelled))] bg-[hsl(var(--ws-cancelled)/0.12)]',
  amendment: 'text-[hsl(var(--ws-amendment))] bg-[hsl(var(--ws-amendment)/0.12)]',
  neutral: 'text-muted-foreground bg-muted',
};

const statusTones: Record<string, WholesaleStatusTone> = {
  NEW: 'new',
  SENT: 'new',
  OPEN: 'new',
  APPROVED: 'approved',
  CONFIRMED: 'approved',
  DELIVERED: 'approved',
  PAID: 'approved',
  RETURNED: 'returned',
  SHORT: 'returned',
  PARTIAL: 'returned',
  OVERDUE: 'returned',
  CANCELLED: 'cancelled',
  CANCELED: 'cancelled',
  REJECTED: 'cancelled',
  VOID: 'cancelled',
  AMENDMENT: 'amendment',
  AMENDED: 'amendment',
};

/** The tone for a backend status name; unknown statuses are neutral. */
export const wholesaleStatusTone = (status?: string | null): WholesaleStatusTone =>
  statusTones[(status ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_')] ?? 'neutral';

const humanize = (status: string) => {
  const words = status.trim().replace(/[_-]+/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

interface WholesaleStatusBadgeProps {
  status?: string | null;
  /** Overrides the tone derived from [status]. */
  tone?: WholesaleStatusTone;
  children?: React.ReactNode;
  className?: string;
}

/** Status pill with a colored dot, in the Wholesale status colors. */
export const WholesaleStatusBadge = ({ status, tone, children, className }: WholesaleStatusBadgeProps) => {
  const resolved = tone ?? wholesaleStatusTone(status);
  return (
    <span
      data-tone={resolved}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold',
        "before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-['']",
        toneClass[resolved],
        className,
      )}
    >
      {children ?? (status ? humanize(status) : '-')}
    </span>
  );
};

export default WholesaleStatusBadge;
