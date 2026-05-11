import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { importData, importRetailData } from 'app/shared/reducers/import-data';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-toastify';
import { ChevronLeft, ChevronRight, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { CATALOG_IMPORT_REQUIRED_FIELDS, CATALOG_IMPORT_SYSTEM_FIELDS } from './catalog-import-system-fields';

type CatalogKind = 'RETAIL' | 'RESTAURANT' | null;
type StepId = 'kind' | 'file' | 'mapping' | 'import';

const PREVIEW_ROWS = 10;
const NONE = '__none__';

const CATALOG_TREE_PATH: Record<Exclude<CatalogKind, null>, string> = {
  RESTAURANT: '/category/restaurant-items/tree',
  RETAIL: '/category/retail-items/tree',
};

function cellToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return String(value).trim();
}

function parseWorkbookFirstSheet(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = e.target?.result;
        if (!data || !(data instanceof ArrayBuffer)) {
          reject(new Error('Could not read file'));
          return;
        }
        const wb = XLSX.read(data, { type: 'array' });
        const name = wb.SheetNames[0];
        const sheet = wb.Sheets[name];
        const aoa = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
          header: 1,
          defval: '',
          raw: false,
        }) as unknown[][];
        if (!aoa.length) {
          reject(new Error('The sheet is empty'));
          return;
        }
        const headerRow = (aoa[0] ?? []).map(cellToString);
        const body = aoa.slice(1).map(row => row.map(cellToString));
        resolve({ headers: headerRow, rows: body });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse Excel file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function buildMappedWorkbook(headers: string[], rows: string[][], mapping: Record<string, string>): Uint8Array {
  const headerToIndex = new Map<string, number>();
  headers.forEach((h, i) => {
    const key = h.trim();
    if (key && !headerToIndex.has(key)) {
      headerToIndex.set(key, i);
    }
  });

  const outputHeaders: string[] = [];
  const sourceIndexes: number[] = [];
  for (const [systemField, sourceHeader] of Object.entries(mapping)) {
    if (!sourceHeader || sourceHeader === NONE) {
      continue;
    }
    const idx = headerToIndex.get(sourceHeader.trim());
    if (idx === undefined) {
      continue;
    }
    outputHeaders.push(systemField);
    sourceIndexes.push(idx);
  }

  const out: string[][] = [outputHeaders];
  for (const row of rows) {
    if (!row.some(c => c.trim() !== '')) {
      continue;
    }
    out.push(sourceIndexes.map(i => (row[i] !== undefined ? row[i] : '')));
  }

  const ws = XLSX.utils.aoa_to_sheet(out);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Import');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: false }) as Uint8Array;
}

function downloadMappedWorkbook(blob: Blob, kind: Exclude<CatalogKind, null>) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = kind === 'RETAIL' ? 'catalog-mapped-import-retail.xlsx' : 'catalog-mapped-import-restaurant.xlsx';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Map system fields to source columns when a trimmed column header equals the system field id. */
function autoMappingFromMatchingColumnNames(
  columns: string[],
  existing: Record<string, string>,
): Record<string, string> {
  const uniqueCols = new Set(columns.map(c => c.trim()).filter(Boolean));
  const next = { ...existing };
  let changed = false;
  for (const field of CATALOG_IMPORT_SYSTEM_FIELDS) {
    const cur = next[field];
    if (cur && cur !== NONE) {
      continue;
    }
    if (uniqueCols.has(field)) {
      next[field] = field;
      changed = true;
    }
  }
  return changed ? next : existing;
}

const CatalogImportWizard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, errorMessage } = useAppSelector(state => state.dataImport);

  const [step, setStep] = useState<StepId>('kind');
  const [kind, setKind] = useState<CatalogKind>(null);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importProgress, setImportProgress] = useState(0);
  const [importFinished, setImportFinished] = useState(false);

  const sourceColumnOptions = useMemo(() => {
    const opts = headers.map(h => h.trim()).filter(Boolean);
    return Array.from(new Set(opts));
  }, [headers]);

  const preview = useMemo(() => rows.slice(0, PREVIEW_ROWS), [rows]);

  const resetFileState = useCallback(() => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setParseError(null);
    setMapping({});
  }, []);

  const onPickKind = (value: CatalogKind) => {
    setKind(value);
    setStep('file');
    resetFileState();
  };

  const onFileSelected = async (f: File | null) => {
    if (!f) {
      return;
    }
    setParseError(null);
    setFile(f);
    try {
      const parsed = await parseWorkbookFirstSheet(f);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Invalid file');
      setFile(null);
      setHeaders([]);
      setRows([]);
    }
  };

  const canProceedFromFile = Boolean(file) && headers.length > 0 && !parseError;
  const canProceedFromMapping = useMemo(() => {
    return CATALOG_IMPORT_REQUIRED_FIELDS.every(f => {
      const m = mapping[f];
      return m && m !== NONE;
    });
  }, [mapping]);

  const setFieldMapping = (systemField: string, sourceHeader: string) => {
    setMapping(prev => ({ ...prev, [systemField]: sourceHeader }));
  };

  const runImport = async () => {
    if (!kind || !canProceedFromMapping) {
      return;
    }
    setImportFinished(false);
    setImportProgress(12);
    try {
      const bytes = buildMappedWorkbook(headers, rows, mapping);
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      downloadMappedWorkbook(blob, kind);
      const outFile = new File([blob], 'catalog-mapped-import.xlsx', { type: blob.type });
      setImportProgress(55);
      if (kind === 'RETAIL') {
        await dispatch(importRetailData({ file: outFile })).unwrap();
      } else {
        await dispatch(importData({ file: outFile, type: 'REGULAR_RESTAURANT' })).unwrap();
      }
      setImportProgress(100);
      setImportFinished(true);
      toast.success('Import request completed. Large files may continue processing on the server.');
    } catch {
      setImportProgress(0);
      setImportFinished(false);
    }
  };

  useEffect(() => {
    if (errorMessage && step === 'import') {
      toast.error(errorMessage);
      setImportProgress(0);
    }
  }, [errorMessage, step]);

  useEffect(() => {
    if (step !== 'mapping' || sourceColumnOptions.length === 0) {
      return;
    }
    setMapping(prev => autoMappingFromMatchingColumnNames(sourceColumnOptions, prev));
  }, [step, sourceColumnOptions]);

  const stepIndex = step === 'kind' ? 0 : step === 'file' ? 1 : step === 'mapping' ? 2 : 3;

  return (
    <PageWrapper>
      <div className="mx-auto max-w-5xl space-y-6 p-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Catalog import</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Import retail or restaurant catalog items from Excel. Map your columns to system fields; the file sent to
            the server uses those names in the first row.
          </p>
        </div>

        <div className="flex gap-2 text-xs text-muted-foreground">
          {['Catalog type', 'File & preview', 'Column mapping', 'Import'].map((label, i) => (
            <span
              key={label}
              className={i <= stepIndex ? 'font-medium text-foreground' : ''}
            >{`${i + 1}. ${label}`}</span>
          ))}
        </div>

        {step === 'kind' && (
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <Label className="text-base">Which catalog are you importing?</Label>
            <RadioGroup
              value={kind ?? ''}
              onValueChange={v => onPickKind(v as CatalogKind)}
              className="grid gap-3 sm:grid-cols-2"
            >
              <label
                htmlFor="kind-retail"
                className="flex cursor-pointer items-center gap-3 rounded-md border p-4 hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-muted/30"
              >
                <RadioGroupItem value="RETAIL" id="kind-retail" />
                <div>
                  <div className="font-medium">Retail</div>
                  <div className="text-xs text-muted-foreground">Products, variants, inventory columns</div>
                </div>
              </label>
              <label
                htmlFor="kind-restaurant"
                className="flex cursor-pointer items-center gap-3 rounded-md border p-4 hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-muted/30"
              >
                <RadioGroupItem value="RESTAURANT" id="kind-restaurant" />
                <div>
                  <div className="font-medium">Restaurant</div>
                  <div className="text-xs text-muted-foreground">Menu items, variations, taxes, add-on groups</div>
                </div>
              </label>
            </RadioGroup>
          </div>
        )}

        {step === 'file' && kind && (
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Label className="text-base">Upload Excel (.xlsx)</Label>
                <p className="text-xs text-muted-foreground mt-1">First sheet only. Row 1 must be your column titles.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                  input.onchange = () => {
                    const f = input.files?.[0];
                    void onFileSelected(f ?? null);
                  };
                  input.click();
                }}
              >
                <Upload className="h-4 w-4" />
                Choose file
              </Button>
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                {file.name}
              </div>
            )}
            {parseError && <p className="text-sm text-destructive">{parseError}</p>}
            {canProceedFromFile && (
              <>
                <Label className="text-sm font-medium">Preview (first {PREVIEW_ROWS} data rows)</Label>
                <ScrollArea className="h-[280px] w-full rounded-md border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {headers.map((h, i) => (
                          <th key={i} className="whitespace-nowrap px-2 py-2 text-left font-medium">
                            {h || `(Column ${i + 1})`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((r, ri) => (
                        <tr key={ri} className="border-b last:border-0">
                          {headers.map((_, ci) => (
                            <td key={ci} className="max-w-[180px] truncate px-2 py-1.5">
                              {r[ci] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </>
            )}
            <div className="flex justify-between pt-2">
              <Button type="button" variant="ghost" onClick={() => { setStep('kind'); setKind(null); resetFileState(); }}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button type="button" disabled={!canProceedFromFile} onClick={() => setStep('mapping')}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 'mapping' && kind && (
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div>
              <Label className="text-base">Map columns</Label>
              <p className="text-xs text-muted-foreground mt-1">
                For each system field, choose the matching column from your file. <strong>ITEM_TYPE</strong> and{' '}
                <strong>NAME</strong> are required. Leave others unmapped if unused.
              </p>
            </div>
            <ScrollArea className="h-[min(480px,60vh)] rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium w-[40%]">System field</th>
                    <th className="px-3 py-2 text-left font-medium">Your column</th>
                  </tr>
                </thead>
                <tbody>
                  {CATALOG_IMPORT_SYSTEM_FIELDS.map(field => {
                    const required = (CATALOG_IMPORT_REQUIRED_FIELDS as readonly string[]).includes(field);
                    return (
                      <tr key={field} className="border-b last:border-0">
                        <td className="px-3 py-2 align-middle">
                          <span className="font-mono text-xs">{field}</span>
                          {required && <span className="ml-2 text-xs text-destructive">*</span>}
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <Select
                            value={mapping[field] ?? NONE}
                            onValueChange={v => setFieldMapping(field, v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Not mapped" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE}>Not mapped</SelectItem>
                              {sourceColumnOptions.map(col => (
                                <SelectItem key={`${field}-${col}`} value={col}>
                                  {col}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>
            <div className="flex justify-between pt-2">
              <Button type="button" variant="ghost" onClick={() => setStep('file')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button type="button" disabled={!canProceedFromMapping} onClick={() => setStep('import')}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 'import' && kind && (
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <Label className="text-base">Start import</Label>
            <p className="text-sm text-muted-foreground">
              The server accepts the mapped file and processes it asynchronously. You will see confirmation when the
              request finishes; very large imports may continue in the background.
            </p>
            <Progress value={loading ? Math.max(importProgress, 30) : importProgress} className="h-2" />
            {importFinished && (
              <div className="space-y-2">
                <p className="text-sm text-green-700 dark:text-green-400">Request finished successfully.</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      if (kind) {
                        navigate(CATALOG_TREE_PATH[kind]);
                      }
                    }}
                  >
                    {kind === 'RETAIL' ? 'Open retail catalog' : 'Open restaurant catalog'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep('kind');
                      setKind(null);
                      resetFileState();
                      setImportProgress(0);
                      setImportFinished(false);
                    }}
                  >
                    Start over
                  </Button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap justify-between gap-2 pt-2">
              <Button type="button" variant="ghost" disabled={loading} onClick={() => setStep('mapping')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" disabled={loading || importFinished} onClick={() => void runImport()}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing…
                    </>
                  ) : (
                    'Run import'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default CatalogImportWizard;
