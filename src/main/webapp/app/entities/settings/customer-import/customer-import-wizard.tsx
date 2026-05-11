import React, { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { cleanEntity } from 'app/shared/util/entity-utils';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-toastify';
import { FileSpreadsheet, Loader2, Play, RotateCcw, Square, Upload } from 'lucide-react';

const NONE = '__none__';
const PREVIEW_ROWS = 10;
const IMPORT_PROGRESS_STORAGE_KEY = 'customer-import-progress-v1';

type CustomerFieldKey =
  | 'id'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'mobileNumber'
  | 'fax'
  | 'accountNumber'
  | 'onAccountEnabled'
  | 'onAccountDebitLimit'
  | 'onAccountDebitUsed'
  | 'businessName'
  | 'address'
  | 'addressType'
  | 'country'
  | 'city'
  | 'street';

type ImportAction = 'created' | 'updated';

type ImportResultRow = {
  rowIndex: number;
  summary: string;
  action?: ImportAction;
  message?: string;
};

type StoredImportProgress = {
  fileSignature: string;
  nextIndex: number;
  totalRows: number;
  updatedAt: string;
};

const CUSTOMER_IMPORT_FIELDS: { key: CustomerFieldKey; label: string; required?: boolean }[] = [
  { key: 'id', label: 'Customer ID (for updates; blank = create)' },
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'mobileNumber', label: 'Mobile number' },
  { key: 'fax', label: 'Fax' },
  { key: 'accountNumber', label: 'Account number' },
  { key: 'businessName', label: 'Business name' },
  { key: 'address', label: 'Address' },
  { key: 'addressType', label: 'Address type (Home/Office/Other)' },
  { key: 'country', label: 'Country' },
  { key: 'city', label: 'City' },
  { key: 'street', label: 'Street' },
  { key: 'onAccountEnabled', label: 'On account enabled (true/false)' },
  { key: 'onAccountDebitLimit', label: 'On account debit limit' },
  { key: 'onAccountDebitUsed', label: 'On account debit used' },
];

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
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
        const firstSheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[firstSheetName];
        const aoa = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
          header: 1,
          defval: '',
          raw: false,
        }) as unknown[][];
        if (!aoa.length) {
          reject(new Error('The sheet is empty'));
          return;
        }
        const headers = (aoa[0] ?? []).map(cellToString);
        const rows = aoa.slice(1).map(row => row.map(cellToString));
        resolve({ headers, rows });
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse Excel file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function parseBoolean(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return undefined;
}

function parseNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function parseAddressType(value: string): 'Home' | 'Office' | 'Other' | undefined {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === 'home') return 'Home';
  if (normalized === 'office' || normalized === 'work') return 'Office';
  if (normalized === 'other') return 'Other';
  return undefined;
}

function buildFileSignature(file: File): string {
  return `${file.name}__${file.size}__${file.lastModified}`;
}

function getStoredProgress(): StoredImportProgress | null {
  try {
    const raw = localStorage.getItem(IMPORT_PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredImportProgress;
  } catch {
    return null;
  }
}

function saveProgress(progress: StoredImportProgress) {
  localStorage.setItem(IMPORT_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

function clearStoredProgress() {
  localStorage.removeItem(IMPORT_PROGRESS_STORAGE_KEY);
}

function buildRowSummary(payload: Record<string, any>, fallback: number): string {
  const business = payload.businessDetails?.businessName;
  const fullName = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim();
  const email = payload.email;
  const phone = payload.phone || payload.mobileNumber;
  return business || fullName || email || phone || `Row ${fallback}`;
}

function toCustomerPayload(row: string[], headers: string[], mapping: Record<CustomerFieldKey, string>) {
  const headerToIndex = new Map<string, number>();
  headers.forEach((header, index) => {
    const trimmed = header.trim();
    if (trimmed && !headerToIndex.has(trimmed)) {
      headerToIndex.set(trimmed, index);
    }
  });

  const readMappedValue = (fieldKey: CustomerFieldKey): string => {
    const mappedHeader = mapping[fieldKey];
    if (!mappedHeader || mappedHeader === NONE) return '';
    const index = headerToIndex.get(mappedHeader);
    if (index === undefined) return '';
    return row[index] ?? '';
  };

  const payload: Record<string, any> = {};
  const id = readMappedValue('id');
  if (id) payload.id = id;
  const firstName = readMappedValue('firstName');
  const lastName = readMappedValue('lastName');
  const email = readMappedValue('email');
  const phone = readMappedValue('phone');
  const mobileNumber = readMappedValue('mobileNumber');
  const fax = readMappedValue('fax');
  const accountNumber = readMappedValue('accountNumber');
  const businessName = readMappedValue('businessName');
  const address = readMappedValue('address');
  const addressType = parseAddressType(readMappedValue('addressType'));
  const country = readMappedValue('country');
  const city = readMappedValue('city');
  const street = readMappedValue('street');
  const onAccountEnabled = parseBoolean(readMappedValue('onAccountEnabled'));
  const onAccountDebitLimit = parseNumber(readMappedValue('onAccountDebitLimit'));
  const onAccountDebitUsed = parseNumber(readMappedValue('onAccountDebitUsed'));

  if (firstName) payload.firstName = firstName;
  if (lastName) payload.lastName = lastName;
  if (email) payload.email = email;
  if (phone) payload.phone = phone;
  if (mobileNumber) payload.mobileNumber = mobileNumber;
  if (fax) payload.fax = fax;
  if (accountNumber) payload.accountNumber = accountNumber;
  if (businessName) payload.businessDetails = { businessName };
  if (address || country || city || street || addressType) {
    const deliveryAddress: Record<string, unknown> = {
      addressType: addressType ?? 'Home',
      contactPersonName: [firstName, lastName].filter(Boolean).join(' ').trim() || undefined,
      phoneNumber: phone || mobileNumber || undefined,
    };
    if (address) deliveryAddress.address = address;
    if (country) deliveryAddress.country = country;
    if (city) deliveryAddress.city = city;
    if (street) deliveryAddress.street = street;
    payload.deliveryAddresses = [deliveryAddress];
  }
  if (typeof onAccountEnabled === 'boolean') payload.onAccountEnabled = onAccountEnabled;
  if (typeof onAccountDebitLimit === 'number') payload.onAccountDebitLimit = onAccountDebitLimit;
  if (typeof onAccountDebitUsed === 'number') payload.onAccountDebitUsed = onAccountDebitUsed;

  return payload;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    if (typeof data === 'string' && data.trim()) return data;
    if (data?.message) return String(data.message);
    if (data?.error) return String(data.error);
    return error.message || 'Request failed';
  }
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

const CustomerImportWizard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<CustomerFieldKey, string>>({} as Record<CustomerFieldKey, string>);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [successRows, setSuccessRows] = useState<ImportResultRow[]>([]);
  const [failedRows, setFailedRows] = useState<ImportResultRow[]>([]);
  const [resumeIndex, setResumeIndex] = useState<number>(0);

  const stopRequestedRef = useRef(false);

  const sourceColumnOptions = useMemo(() => Array.from(new Set(headers.map(h => h.trim()).filter(Boolean))), [headers]);
  const preview = useMemo(() => rows.slice(0, PREVIEW_ROWS), [rows]);
  const fileSignature = useMemo(() => (file ? buildFileSignature(file) : ''), [file]);
  const hasAnyMapping = useMemo(
    () => CUSTOMER_IMPORT_FIELDS.some(field => (mapping[field.key] ?? NONE) !== NONE),
    [mapping],
  );

  const onFileSelected = async (selected: File | null) => {
    if (!selected) return;
    setParseError(null);
    setFile(selected);
    setProgress(0);
    setProcessedRows(0);
    setSuccessRows([]);
    setFailedRows([]);
    try {
      const parsed = await parseWorkbookFirstSheet(selected);
      setHeaders(parsed.headers);
      const nonEmptyRows = parsed.rows.filter(row => row.some(cell => cell.trim() !== ''));
      setRows(nonEmptyRows);
      const stored = getStoredProgress();
      const signature = buildFileSignature(selected);
      if (stored && stored.fileSignature === signature && stored.nextIndex < nonEmptyRows.length) {
        setResumeIndex(stored.nextIndex);
      } else {
        setResumeIndex(0);
      }
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Invalid file');
      setHeaders([]);
      setRows([]);
      setResumeIndex(0);
    }
  };

  const setFieldMapping = (fieldKey: CustomerFieldKey, sourceHeader: string) => {
    setMapping(prev => ({ ...prev, [fieldKey]: sourceHeader }));
  };

  const runImport = async (startIndex: number) => {
    if (!file || rows.length === 0 || !hasAnyMapping) return;
    stopRequestedRef.current = false;
    setIsImporting(true);
    setProcessedRows(startIndex);
    setProgress(rows.length > 0 ? Math.round((startIndex / rows.length) * 100) : 0);

    const newSuccessRows: ImportResultRow[] = [];
    const newFailedRows: ImportResultRow[] = [];

    for (let i = startIndex; i < rows.length; i += 1) {
      if (stopRequestedRef.current) {
        saveProgress({
          fileSignature,
          nextIndex: i,
          totalRows: rows.length,
          updatedAt: new Date().toISOString(),
        });
        setResumeIndex(i);
        toast.info(`Import paused at row ${i + 1}. You can resume from this point.`);
        break;
      }

      const row = rows[i];
      const payload = toCustomerPayload(row, headers, mapping);
      const summary = buildRowSummary(payload, i + 2);
      const existingId = typeof payload.id === 'string' ? payload.id.trim() : '';
      const action: ImportAction = existingId ? 'updated' : 'created';
      try {
        if (existingId) {
          await axios.put(`api/customers/${encodeURIComponent(existingId)}`, cleanEntity(payload));
        } else {
          await axios.post('api/customers', cleanEntity(payload));
        }
        newSuccessRows.push({ rowIndex: i + 2, summary, action });
      } catch (error) {
        newFailedRows.push({
          rowIndex: i + 2,
          summary,
          action,
          message: getErrorMessage(error),
        });
      }

      const nextIndex = i + 1;
      setProcessedRows(nextIndex);
      setProgress(Math.round((nextIndex / rows.length) * 100));
      saveProgress({
        fileSignature,
        nextIndex,
        totalRows: rows.length,
        updatedAt: new Date().toISOString(),
      });
    }

    setSuccessRows(prev => [...prev, ...newSuccessRows]);
    setFailedRows(prev => [...prev, ...newFailedRows]);
    setIsImporting(false);

    if (!stopRequestedRef.current) {
      clearStoredProgress();
      setResumeIndex(0);
      const createdCount = newSuccessRows.filter(r => r.action === 'created').length;
      const updatedCount = newSuccessRows.filter(r => r.action === 'updated').length;
      toast.success(
        `Import finished. Created: ${createdCount}, Updated: ${updatedCount}, Failed: ${newFailedRows.length}`,
      );
    }
  };

  const onRestartImport = () => {
    clearStoredProgress();
    setResumeIndex(0);
    setProcessedRows(0);
    setProgress(0);
    setSuccessRows([]);
    setFailedRows([]);
  };

  return (
    <PageWrapper>
      <div className="mx-auto max-w-6xl space-y-6 p-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Customer import (Excel)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload an Excel file, map columns, and import customers row by row. Progress is saved locally so you can
            resume from the last reached row if something interrupts the process.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Label className="text-base">Upload customer file (.xlsx)</Label>
              <p className="text-xs text-muted-foreground mt-1">Only first sheet is used. Row 1 should contain headers.</p>
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
                  const selected = input.files?.[0];
                  void onFileSelected(selected ?? null);
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

          {headers.length > 0 && (
            <>
              <Label className="text-sm font-medium">Preview (first {PREVIEW_ROWS} rows)</Label>
              <ScrollArea className="h-[260px] w-full rounded-md border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {headers.map((header, index) => (
                        <th key={`${header}-${index}`} className="whitespace-nowrap px-2 py-2 text-left font-medium">
                          {header || `(Column ${index + 1})`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b last:border-0">
                        {headers.map((_, columnIndex) => (
                          <td key={columnIndex} className="max-w-[180px] truncate px-2 py-1.5">
                            {row[columnIndex] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </>
          )}
        </div>

        {headers.length > 0 && (
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div>
              <Label className="text-base">Map customer fields</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Choose which Excel column maps to each customer field. You can leave unused fields as not mapped.
              </p>
            </div>

            <ScrollArea className="h-[min(460px,60vh)] rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium w-[40%]">Customer field</th>
                    <th className="px-3 py-2 text-left font-medium">Excel column</th>
                  </tr>
                </thead>
                <tbody>
                  {CUSTOMER_IMPORT_FIELDS.map(field => (
                    <tr key={field.key} className="border-b last:border-0">
                      <td className="px-3 py-2 align-middle">{field.label}</td>
                      <td className="px-3 py-2 align-middle">
                        <Select value={mapping[field.key] ?? NONE} onValueChange={value => setFieldMapping(field.key, value)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Not mapped" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Not mapped</SelectItem>
                            {sourceColumnOptions.map(column => (
                              <SelectItem key={`${field.key}-${column}`} value={column}>
                                {column}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        )}

        {rows.length > 0 && (
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Label className="text-base">Import execution</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Records are posted one by one to the customer API endpoint.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled={isImporting} onClick={onRestartImport}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset results
                </Button>
                <Button
                  type="button"
                  disabled={isImporting || !hasAnyMapping}
                  onClick={() => {
                    void runImport(0);
                  }}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Start from beginning
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isImporting || !hasAnyMapping || resumeIndex <= 0 || resumeIndex >= rows.length}
                  onClick={() => {
                    void runImport(resumeIndex);
                  }}
                >
                  Resume from row {resumeIndex + 2}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!isImporting}
                  onClick={() => {
                    stopRequestedRef.current = true;
                  }}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </div>
            </div>

            <Progress value={progress} className="h-2" />
            <div className="grid gap-3 md:grid-cols-5">
              <div>
                <p className="text-xs text-muted-foreground">Processed</p>
                <p className="text-sm font-medium">
                  {processedRows}/{rows.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {successRows.filter(r => r.action !== 'updated').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  {successRows.filter(r => r.action === 'updated').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-sm font-medium text-destructive">{failedRows.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Resume index (saved locally)</p>
                <p className="text-sm font-medium">{resumeIndex > 0 ? resumeIndex + 2 : '-'}</p>
              </div>
            </div>
          </div>
        )}

        {(successRows.length > 0 || failedRows.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold">Imported records ({successRows.length})</h2>
              <ScrollArea className="h-[300px] rounded-md border">
                <div className="divide-y">
                  {successRows.map(item => (
                    <div key={`success-${item.rowIndex}-${item.summary}`} className="p-2 text-xs">
                      <span className="font-medium">Row {item.rowIndex}:</span> {item.summary}
                      {item.action && (
                        <span
                          className={
                            item.action === 'updated'
                              ? 'ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                              : 'ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          }
                        >
                          {item.action}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold">Failed records ({failedRows.length})</h2>
              <ScrollArea className="h-[300px] rounded-md border">
                <div className="divide-y">
                  {failedRows.map(item => (
                    <div key={`failed-${item.rowIndex}-${item.summary}`} className="p-2 text-xs space-y-1">
                      <p>
                        <span className="font-medium">Row {item.rowIndex}:</span> {item.summary}
                      </p>
                      <p className="text-destructive">{item.message || 'Failed without error message'}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default CustomerImportWizard;
