import React from 'react';

import { cn } from '@/src/main/webapp/app/lib/utils';

type ReportErrorStateProps = {
  message: string;
  title?: string;
  compact?: boolean;
  className?: string;
  dataTestId?: string;
};

const ReportErrorState = ({
  message,
  title = 'API Error',
  compact = false,
  className,
  dataTestId,
}: ReportErrorStateProps) => (
  <div
    className={cn(
      'rounded-xl border border-destructive/30 bg-destructive/5 text-destructive',
      compact ? 'px-3 py-3 text-xs' : 'px-4 py-6 text-sm',
      className
    )}
    data-testid={dataTestId}
    role="alert"
  >
    <div className="font-semibold">{title}</div>
    <div className={compact ? 'mt-1' : 'mt-2'}>{message}</div>
  </div>
);

export default ReportErrorState;
