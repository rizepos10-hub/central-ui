import React from 'react';

import { cn } from '@/src/main/webapp/app/lib/utils';
import type { ReportFilterInfo } from 'app/shared/util/report-export-utils';
import { useReportBranding } from './use-report-branding';

type ReportExportHeaderProps = {
  reportTitle: string;
  filters?: ReportFilterInfo[];
  meta?: ReportFilterInfo[];
  className?: string;
  hiddenOnScreen?: boolean;
  forceVisible?: boolean;
};

const isVisibleValue = (value: ReportFilterInfo['value']) => value !== null && value !== undefined && `${value}`.trim() !== '';

const ReportExportHeader = ({
  reportTitle,
  filters = [],
  meta = [],
  className,
  hiddenOnScreen = false,
  forceVisible = false,
}: ReportExportHeaderProps) => {
  const { businessName, logoUrl } = useReportBranding();
  const visibleMeta = meta.filter(item => isVisibleValue(item.value));
  const visibleFilters = filters.filter(item => isVisibleValue(item.value));

  return (
    <section
      className={cn(
        'report-export-header rounded-md border bg-white p-4',
        hiddenOnScreen && !forceVisible ? 'hidden print:block' : 'block',
        className
      )}
      data-testid="report-export-header"
    >
      <div className="flex items-start gap-4">
        <div className="flex min-w-[88px] justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Business logo"
              className="max-h-16 max-w-[88px] object-contain"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-1 text-center">
          {businessName ? <div className="text-sm font-semibold">{businessName}</div> : null}
          <h2 className="text-xl font-bold leading-tight">{reportTitle}</h2>
          {visibleMeta.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 pt-1 text-xs text-muted-foreground">
              {visibleMeta.map(item => (
                <div key={`${item.label}-${item.value}`} className="flex items-center gap-1">
                  <span className="font-semibold text-foreground">{item.label}:</span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {visibleFilters.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-2 border-t pt-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleFilters.map(item => (
            <div key={`${item.label}-${item.value}`} className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
              <div className="mt-1 break-words text-sm font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default ReportExportHeader;
