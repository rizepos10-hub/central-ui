import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { ArrowLeft, CheckCircle2, FileDown, Inbox, Package, Printer, Ruler, Tag, TriangleAlert, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Select from 'app/shared/components/select/select';
import { findLabelBarcodeIssues } from '../util/label-data';
import { useLabelTemplates } from '../store/useLabelTemplates';
import { useLabelFlow } from '../store/label-flow-context';
import { useQz } from '../store/useQz';
import { LabelCanvasPreview } from '../components/LabelCanvas';
import { PrintSheet } from '../print/PrintSheet';
import { exportLabelsPdf, labelsPdfBase64 } from '../print/labels-pdf';

const PreviewScreen = () => {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const { getTemplate } = useLabelTemplates();
  const { template, setTemplate, entries, flatLabels, totalLabels } = useLabelFlow();
  const qz = useQz();

  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!template && templateId) {
      const found = getTemplate(templateId);
      if (found) setTemplate(found);
    }
  }, [template, templateId, getTemplate, setTemplate]);

  const pageStyle = useMemo(
    () =>
      template
        ? `@page { size: ${template.widthMm}mm ${template.heightMm}mm; margin: 0; } ` +
          `@media print { html, body { margin: 0 !important; padding: 0 !important; } }`
        : '',
    [template]
  );

  const browserPrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: template ? `${template.name} Labels` : 'Labels',
    pageStyle,
  });

  const handleExport = async () => {
    if (!template) return;
    setError(null);
    setIsExporting(true);
    try {
      await exportLabelsPdf(template, flatLabels);
    } catch (e) {
      setError('Could not generate the PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    if (!template) return;
    setError(null);
    if (!qz.available || !qz.selected) {
      browserPrint();
      return;
    }
    setIsPrinting(true);
    try {
      const base64 = await labelsPdfBase64(template, flatLabels);
      await qz.printPdf(qz.selected, base64, { widthMm: template.widthMm, heightMm: template.heightMm });
    } catch (e) {
      setError('Direct printing failed — opening the system print dialog instead.');
      browserPrint();
    } finally {
      setIsPrinting(false);
    }
  };

  const printerOptions = useMemo(() => qz.printers.map(p => ({ value: p, label: p })), [qz.printers]);

  const barcodeIssues = useMemo(
    () => (template ? findLabelBarcodeIssues(template, flatLabels.map(l => l.datum)) : []),
    [template, flatLabels]
  );

  if (!template || totalLabels === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-10 text-center">
        <Inbox className="mb-3 h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No labels to preview.</p>
        <Button variant="link" onClick={() => navigate('/labels')}>
          Go back to templates
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col pb-28">
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" className="mb-2 gap-1" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h2 className="m-0 text-lg font-bold text-foreground">
          {totalLabels} label{totalLabels === 1 ? '' : 's'} · {template.name}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <SummaryChip icon={<Tag className="h-3 w-3" />} label={template.name} className="bg-sky-500/10 text-sky-600" />
          <SummaryChip
            icon={<Ruler className="h-3 w-3" />}
            label={`${template.widthMm.toFixed(0)} × ${template.heightMm.toFixed(0)} mm`}
            className="bg-violet-500/10 text-violet-600"
          />
          <SummaryChip
            icon={<Package className="h-3 w-3" />}
            label={`${entries.length} product${entries.length === 1 ? '' : 's'}`}
            className="bg-slate-500/10 text-slate-600"
          />
          <SummaryChip
            icon={<Printer className="h-3 w-3" />}
            label={`${totalLabels} label${totalLabels === 1 ? '' : 's'}`}
            className="bg-amber-500/10 text-amber-600"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 bg-emerald-500/8 px-4 py-2 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Each page is exactly {template.widthMm.toFixed(0)} × {template.heightMm.toFixed(0)} mm — the print and PDF match this preview.
      </div>

      {barcodeIssues.length > 0 && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-700">
          <div className="flex items-center gap-2 font-semibold">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
            {barcodeIssues.length} barcode/QR issue{barcodeIssues.length === 1 ? '' : 's'} — these will print blank:
          </div>
          <ul className="mt-1 ml-6 list-disc space-y-0.5">
            {barcodeIssues.slice(0, 5).map((issue, i) => (
              <li key={i}>
                <span className="font-medium">{issue.productName}</span> {issue.message}
              </li>
            ))}
            {barcodeIssues.length > 5 && <li>+{barcodeIssues.length - 5} more…</li>}
          </ul>
        </div>
      )}

      <div className="flex flex-col items-center gap-6 bg-muted/40 px-4 py-6">
        {flatLabels.map((label, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-bold text-sky-600">
                {label.copyNum} / {label.totalCopies}
              </span>
              <span className="max-w-[260px] truncate text-xs font-semibold text-muted-foreground">{label.datum.product.name}</span>
            </div>
            <div className="shadow-lg">
              <LabelCanvasPreview template={template} datum={label.datum} maxWidthPx={520} maxHeightPx={360} />
            </div>
            <span className="mt-1.5 text-[11px] text-muted-foreground">
              {template.widthMm.toFixed(0)} × {template.heightMm.toFixed(0)} mm
            </span>
          </div>
        ))}
      </div>

      <PrintSheet ref={printRef} template={template} labels={flatLabels} />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {qz.available ? <Wifi className="h-3 w-3 text-emerald-600" /> : <WifiOff className="h-3 w-3 text-muted-foreground" />}
              Printer
            </span>
            {qz.available ? (
              <div className="min-w-[220px]">
                <Select
                  value={printerOptions.find(o => o.value === qz.selected) || null}
                  options={printerOptions}
                  onChange={(opt: { value: string } | null) => qz.selectPrinter(opt?.value ?? null)}
                  placeholder="Choose a printer…"
                />
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                {qz.connecting
                  ? 'Looking for QZ Tray…'
                  : 'QZ Tray not detected — Print uses the system dialog. Install QZ Tray for direct printing.'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-12 gap-2" disabled={isExporting} onClick={handleExport}>
              <FileDown className="h-5 w-5" />
              {isExporting ? 'Generating…' : 'Export PDF'}
            </Button>
            <Button className="h-12 gap-2 px-6 text-base font-bold" disabled={isPrinting} onClick={handlePrint}>
              <Printer className="h-5 w-5" />
              {isPrinting ? 'Printing…' : qz.available && qz.selected ? 'Print' : 'Print…'}
            </Button>
          </div>
        </div>
        {error && <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p>}
      </div>
    </div>
  );
};

const SummaryChip = ({ icon, label, className }: { icon: React.ReactNode; label: string; className: string }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${className}`}>
    {icon}
    {label}
  </span>
);

export default PreviewScreen;
