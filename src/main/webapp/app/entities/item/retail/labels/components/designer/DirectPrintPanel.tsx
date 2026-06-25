import React, { useMemo, useState } from 'react';
import { Check, Code2, Copy, PlugZap, Printer, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Select from 'app/shared/components/select/select';
import { Input } from '@/components/ui/input';
import { DirectPrintSettings, DirectPrintLanguage, DIRECT_PRINT_LANGUAGE_LABELS, LabelTemplate } from '../../model/label-template.model';
import { SAMPLE_DATUM } from '../../util/label-data';
import { compileDirectPrintTemplate } from '../../util/direct-print-compiler';
import { visualizeDirectPrintScript } from '../../util/label-script';
import { useQz } from '../../store/useQz';

const SUPPORTED_DIRECT_PRINT_LANGUAGES: DirectPrintLanguage[] = ['zpl'];

type DirectPrintPanelProps = {
  template: LabelTemplate;
  onChange: (patch: Partial<LabelTemplate>) => void;
};

export const DirectPrintPanel = ({ template, onChange }: DirectPrintPanelProps) => {
  const qz = useQz();
  const [copied, setCopied] = useState(false);
  const settings: DirectPrintSettings = template.directPrint ?? { language: 'zpl', printerName: null, dpi: 203 };
  const printerOptions = useMemo(() => qz.printers.map(printer => ({ value: printer, label: printer })), [qz.printers]);
  const compiled = useMemo(
    () => compileDirectPrintTemplate(template, SAMPLE_DATUM, settings.language, settings.dpi ?? 203),
    [settings.dpi, settings.language, template]
  );

  const updateSettings = (patch: Partial<DirectPrintSettings>) =>
    onChange({
      directPrint: {
        ...settings,
        ...patch,
      },
    });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compiled.script || '');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <section className="shrink-0 rounded-xl border border-border bg-card p-3">
        <div className="mb-3 flex items-start gap-2">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <Printer className="h-4 w-4" />
          </span>
          <div>
            <h4 className="m-0 text-sm font-bold text-foreground">Direct Print Output</h4>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Keep designing on the canvas. We compile this same template into native printer commands for preview and QZ printing.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Field label="Language">
            <select
              value={settings.language}
              onChange={e => updateSettings({ language: e.target.value as DirectPrintLanguage })}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {SUPPORTED_DIRECT_PRINT_LANGUAGES.map(value => (
                <option key={value} value={value}>
                  {DIRECT_PRINT_LANGUAGE_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Printer DPI">
            <div className="flex gap-2">
              {[203, 300, 600].map(dpi => (
                <Button
                  key={dpi}
                  type="button"
                  variant={(settings.dpi ?? 203) === dpi ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 flex-1"
                  onClick={() => updateSettings({ dpi })}
                >
                  {dpi}
                </Button>
              ))}
            </div>
          </Field>

          <Field label="Preferred Printer">
            <div className="space-y-2">
              {qz.available ? (
                <>
                  <Select
                    value={printerOptions.find(option => option.value === (settings.printerName ?? null)) || null}
                    options={printerOptions}
                    onChange={(opt: { value: string } | null) => updateSettings({ printerName: opt?.value ?? null })}
                    isClearable
                    placeholder="Use any selected printer"
                  />
                  <div className="flex flex-wrap gap-2">
                    {qz.selected && (
                      <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={() => updateSettings({ printerName: qz.selected })}>
                        <PlugZap className="h-3.5 w-3.5" />
                        Use current QZ printer
                      </Button>
                    )}
                    <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" onClick={qz.refresh}>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Refresh
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {qz.connecting ? 'Looking for QZ Tray...' : 'QZ Tray is not connected yet. Once it is available, bind a printer directly to this template.'}
                </div>
              )}
            </div>
          </Field>

          <Field label="Description">
            <Input
              value={template.description ?? ''}
              onChange={e => onChange({ description: e.target.value })}
              className="h-9 text-sm"
              placeholder="Optional note for this printer-native template"
            />
          </Field>
        </div>
      </section>

      {compiled.warnings.length > 0 && (
        <section className="shrink-0 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-700">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
            Native output warnings
          </div>
          <ul className="ml-5 list-disc space-y-1">
            {compiled.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="min-h-0 flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="shrink-0 border-b border-border px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-sky-600" />
              <h4 className="m-0 text-sm font-bold text-foreground">Generated Script Preview</h4>
            </div>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            This is the command stream compiled from the canvas design using sample product data.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-950 p-3">
          <pre className="m-0 whitespace-pre-wrap font-mono text-[11px] leading-5 text-slate-100">
            {visualizeDirectPrintScript(compiled.script) || 'The generated printer script will appear here once the template has visible elements.'}
          </pre>
        </div>
      </section>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex min-w-0 flex-col gap-1.5">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
    {children}
  </label>
);
