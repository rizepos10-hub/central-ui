import React from 'react';

import { cn } from '@/src/main/webapp/app/lib/utils';

export const reportTableClassName = 'report-data-table table-fixed';
export const reportTableBodyClassName =
  'report-table-body [&_tr:nth-child(odd)]:bg-white [&_tr:nth-child(even)]:bg-slate-100/80 [&_tr:nth-child(odd):hover]:bg-muted/20 [&_tr:nth-child(even):hover]:bg-muted/30';
export const reportHeaderRowClassName = 'report-header-row bg-muted/30 hover:bg-muted/30';
export const reportHeadClassName = 'report-head-cell h-9 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground';
export const reportCellClassName = 'report-text-cell px-3 py-2 text-xs';
export const reportLabelCellClassName = 'report-text-cell report-label-cell px-3 py-2 text-xs font-medium';
export const reportSubLabelCellClassName = 'report-text-cell report-sub-label-cell px-3 py-2 pl-8 text-xs text-muted-foreground';
export const reportNumericCellClassName = 'report-numeric-cell px-3 py-2 text-right text-xs tabular-nums';
export const reportMutedCellClassName = 'report-text-cell report-muted-cell px-3 py-2 text-xs text-muted-foreground';
export const reportTotalRowClassName = 'report-total-row !bg-muted/20 font-semibold hover:!bg-muted/20';

type ReportSectionProps = {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
};

const ReportSection = ({ title, children, className, contentClassName, headerClassName }: ReportSectionProps) => (
  <section className={cn('report-section-card rounded-md border bg-white', className)}>
    {title ? (
      <div className={cn('report-section-header border-b px-3 py-2.5', headerClassName)}>
        <h3 className="report-section-title text-sm font-semibold">{title}</h3>
      </div>
    ) : null}
    <div className={cn('report-section-content', title ? '' : 'p-3', contentClassName)}>{children}</div>
  </section>
);

export default ReportSection;
