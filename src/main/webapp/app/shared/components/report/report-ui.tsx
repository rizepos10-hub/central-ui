import React from 'react';

import { cn } from '@/src/main/webapp/app/lib/utils';

export const reportTableClassName = 'table-fixed';
export const reportTableBodyClassName =
  '[&_tr:nth-child(odd)]:bg-white [&_tr:nth-child(even)]:bg-slate-100/80 [&_tr:nth-child(odd):hover]:bg-muted/20 [&_tr:nth-child(even):hover]:bg-muted/30';
export const reportHeaderRowClassName = 'bg-muted/30 hover:bg-muted/30';
export const reportHeadClassName = 'h-9 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground';
export const reportCellClassName = 'px-3 py-2 text-xs';
export const reportLabelCellClassName = 'px-3 py-2 text-xs font-medium';
export const reportSubLabelCellClassName = 'px-3 py-2 pl-8 text-xs text-muted-foreground';
export const reportNumericCellClassName = 'px-3 py-2 text-right text-xs tabular-nums';
export const reportMutedCellClassName = 'px-3 py-2 text-xs text-muted-foreground';
export const reportTotalRowClassName = '!bg-muted/20 font-semibold hover:!bg-muted/20';

type ReportSectionProps = {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
};

const ReportSection = ({ title, children, className, contentClassName, headerClassName }: ReportSectionProps) => (
  <section className={cn('rounded-md border bg-white', className)}>
    {title ? (
      <div className={cn('border-b px-3 py-2.5', headerClassName)}>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
    ) : null}
    <div className={cn(title ? '' : 'p-3', contentClassName)}>{children}</div>
  </section>
);

export default ReportSection;
