import React from 'react';
import { FileSpreadsheet, FileText, Loader2, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';

type ReportActionBarProps = {
  onExcel: () => void;
  onPdf: () => void;
  onPrint: () => void;
  disabled?: boolean;
  busyAction?: 'excel' | 'pdf' | 'print' | null;
  className?: string;
};

const ReportActionBar = ({ onExcel, onPdf, onPrint, disabled = false, busyAction = null, className }: ReportActionBarProps) => (
  <div className={`report-export-actions flex flex-wrap items-center gap-2 ${className || ''}`}>
    <Button
      type="button"
      variant="outline"
      className="h-7 text-xs"
      onClick={onExcel}
      disabled={disabled}
      data-testid="report-action-excel"
    >
      {busyAction === 'excel' ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <FileSpreadsheet className="mr-2 h-3 w-3" />}
      Excel
    </Button>
    <Button
      type="button"
      variant="outline"
      className="h-7 text-xs"
      onClick={onPdf}
      disabled={disabled}
      data-testid="report-action-pdf"
    >
      {busyAction === 'pdf' ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <FileText className="mr-2 h-3 w-3" />}
      PDF
    </Button>
    <Button
      type="button"
      variant="outline"
      className="h-7 text-xs"
      onClick={onPrint}
      disabled={disabled}
      data-testid="report-action-print"
    >
      {busyAction === 'print' ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Printer className="mr-2 h-3 w-3" />}
      Print
    </Button>
  </div>
);

export default ReportActionBar;
