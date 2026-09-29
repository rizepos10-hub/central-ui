import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Download, Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from 'app/modules/logistics/wholesale-ui/wholesale-page';
import { wholesaleErrorMessage } from 'app/modules/logistics/wholesale-ui/wholesale-error';

const MAX_CARDS = 5000;

type Mode = 'range' | 'excel';

interface BranchOption {
  id: string;
  name: string;
}

interface CardRow {
  referenceNumber: string;
  code?: string;
  cardHolderName?: string;
}

interface CreatedCard {
  id: string;
  referenceNumber: string;
  code: string;
}

/** Numbers from start, keeping the start's width so leading zeros stay (0100, 0101, ...). */
export const buildRange = (prefix: string, start: string, quantity: number): string[] => {
  const digits = start.trim();
  if (!/^\d+$/.test(digits) || !Number.isInteger(quantity) || quantity < 1) return [];
  const first = BigInt(digits);
  const numbers: string[] = [];
  for (let i = 0; i < Math.min(quantity, MAX_CARDS); i++) {
    numbers.push(`${prefix}${(first + BigInt(i)).toString().padStart(digits.length, '0')}`);
  }
  return numbers;
};

const cellText = (value: unknown) => (value == null ? '' : String(value).trim());

/** Reads the first sheet. A header row naming a number/card column is used when present; otherwise the first column holds the numbers. */
export const readCardRows = (rows: unknown[][]): CardRow[] => {
  const header = (rows[0] ?? []).map(cell => cellText(cell).toLowerCase());
  const find = (pattern: RegExp) => header.findIndex(cell => pattern.test(cell));
  const numberColumn = find(/number|card|reference/);
  const hasHeader = numberColumn >= 0 || header.some(cell => /pin|code|holder|name/.test(cell));
  const pinColumn = hasHeader ? find(/pin|code/) : -1;
  const holderColumn = hasHeader ? find(/holder|name/) : -1;
  const column = numberColumn >= 0 ? numberColumn : 0;
  return rows
    .slice(hasHeader ? 1 : 0)
    .map(row => ({
      referenceNumber: cellText(row[column]),
      code: pinColumn >= 0 ? cellText(row[pinColumn]) || undefined : undefined,
      cardHolderName: holderColumn >= 0 ? cellText(row[holderColumn]) || undefined : undefined,
    }))
    .filter(row => row.referenceNumber);
};

const problemsOf = (rows: CardRow[]) => {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  const badPins: string[] = [];
  rows.forEach(row => {
    if (seen.has(row.referenceNumber)) repeated.add(row.referenceNumber);
    seen.add(row.referenceNumber);
    if (row.code && !/^\d{4}$/.test(row.code)) badPins.push(row.referenceNumber);
  });
  const problems: string[] = [];
  if (repeated.size) problems.push(`Repeated numbers: ${[...repeated].slice(0, 5).join(', ')}${repeated.size > 5 ? ` and ${repeated.size - 5} more` : ''}.`);
  if (badPins.length) problems.push(`PINs must be 4 digits: ${badPins.slice(0, 5).join(', ')}${badPins.length > 5 ? ` and ${badPins.length - 5} more` : ''}.`);
  if (rows.length > MAX_CARDS) problems.push(`At most ${MAX_CARDS} cards at a time.`);
  return problems;
};

const downloadCsv = (cards: CreatedCard[]) => {
  const csv = ['Number,PIN', ...cards.map(card => `"${card.referenceNumber.replace(/"/g, '""')}",${card.code}`)].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gift-cards.csv';
  link.click();
  URL.revokeObjectURL(url);
};

const LoyaltyCardBulkCreate = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('range');
  const [prefix, setPrefix] = useState('');
  const [start, setStart] = useState('1000');
  const [quantity, setQuantity] = useState('100');
  const [excelRows, setExcelRows] = useState<CardRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [pin, setPin] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [printed, setPrinted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<CreatedCard[]>([]);

  useEffect(() => {
    axios
      .get<BranchOption[]>('api/branches', { params: { page: 0, size: 500, sort: 'name,asc' } })
      .then(({ data }) => setBranches((data ?? []).filter(branch => branch?.id).map(branch => ({ id: branch.id, name: branch.name || branch.id }))))
      .catch(() => setBranches([]));
  }, []);

  const rows: CardRow[] = useMemo(
    () => (mode === 'range' ? buildRange(prefix.trim(), start, Number(quantity)).map(referenceNumber => ({ referenceNumber })) : excelRows),
    [mode, prefix, start, quantity, excelRows],
  );
  const problems = useMemo(() => problemsOf(rows), [rows]);
  const rangeError =
    mode === 'range' && !/^\d+$/.test(start.trim())
      ? 'The start number must be digits only.'
      : mode === 'range' && !(Number(quantity) >= 1 && Number(quantity) <= MAX_CARDS && Number.isInteger(Number(quantity)))
        ? `Enter a quantity from 1 to ${MAX_CARDS}.`
        : null;

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const workbook = XLSX.read(new Uint8Array(event.target?.result as ArrayBuffer), { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' });
        const parsed = readCardRows(aoa);
        setExcelRows(parsed);
        setFileName(file.name);
        if (parsed.length === 0) toast.error('No card numbers were found in the first sheet.');
      } catch {
        setExcelRows([]);
        toast.error('The file could not be read. Use an Excel or CSV file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleBranch = (branchId: string, checked: boolean) =>
    setBranchIds(current => (checked ? [...current, branchId] : current.filter(id => id !== branchId)));

  const create = async () => {
    if (rangeError) return void toast.error(rangeError);
    if (rows.length === 0) return void toast.error(mode === 'excel' ? 'Choose a file with card numbers.' : 'There are no numbers to create.');
    if (problems.length) return void toast.error(problems[0]);
    if (branchIds.length === 0) return void toast.error('Choose at least one branch.');
    if (pin && !/^\d{4}$/.test(pin)) return void toast.error('The PIN must be 4 digits.');
    setSaving(true);
    try {
      const { data } = await axios.post<{ created: CreatedCard[] }>('api/loyalty-cards/bulk', {
        cards: rows,
        branchIds,
        code: pin || null,
        expiryDate: expiryDate ? new Date(`${expiryDate}T23:59:59`).toISOString() : null,
        printed,
      });
      setCreated(data?.created ?? []);
      toast.success(`${data?.created?.length ?? 0} cards created.`);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The cards could not be created.'));
    } finally {
      setSaving(false);
    }
  };

  const preview = rows.length > 6 ? [...rows.slice(0, 3), null, ...rows.slice(-2)] : rows;

  return (
    <WholesalePage
      title="Bulk Create Gift Cards"
      context="Create many gift cards with your own numbers: a numbered range with a prefix, or a list imported from Excel."
      actions={
        <Button variant="outline" className="ws-control" onClick={() => navigate('/loyalty-cards')}>
          <ArrowLeft className="h-3 w-3" /> Back
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="ws-card grid content-start gap-3 p-4">
          <div className="flex gap-2" role="tablist" aria-label="How to enter the numbers">
            {(['range', 'excel'] as Mode[]).map(option => (
              <Button
                key={option}
                role="tab"
                aria-selected={mode === option}
                variant={mode === option ? 'default' : 'outline'}
                className="ws-control"
                onClick={() => setMode(option)}
              >
                {option === 'range' ? 'Number range' : 'Import from Excel'}
              </Button>
            ))}
          </div>

          {mode === 'range' ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Prefix" hint="Optional, e.g. GC-">
                <Input className="ws-control ws-mono" value={prefix} onChange={event => setPrefix(event.target.value)} />
              </Field>
              <Field label="Start number" hint="Leading zeros are kept.">
                <Input className="ws-control ws-mono" inputMode="numeric" value={start} onChange={event => setStart(event.target.value.replace(/\D+/g, ''))} />
              </Field>
              <Field label="Quantity" hint={`Up to ${MAX_CARDS}.`}>
                <Input className="ws-control ws-num" type="number" min={1} max={MAX_CARDS} value={quantity} onChange={event => setQuantity(event.target.value)} />
              </Field>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label className="text-xs">Excel or CSV file</Label>
              <label className="ws-control inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-xs">
                <Upload className="h-3 w-3" />
                {fileName || 'Choose a file'}
                <input
                  type="file"
                  className="sr-only"
                  accept=".xlsx,.xls,.csv"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) readFile(file);
                    event.target.value = '';
                  }}
                />
              </label>
              <p className="m-0 text-xs text-muted-foreground">
                The first sheet is read. Put the card numbers in a column named Number, or in the first column. Optional columns: PIN and Card holder.
              </p>
            </div>
          )}

          <div className="ws-card overflow-auto">
            <table className="ws-table" aria-label="Cards to create">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>PIN</th>
                  <th>Card holder</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-muted-foreground">
                      {rangeError || 'No numbers yet.'}
                    </td>
                  </tr>
                )}
                {preview.map((row, index) =>
                  row ? (
                    <tr key={`${row.referenceNumber}-${index}`}>
                      <td className="ws-mono">{row.referenceNumber}</td>
                      <td className="ws-mono">{row.code || (pin ? pin : 'Random')}</td>
                      <td>{row.cardHolderName || ''}</td>
                    </tr>
                  ) : (
                    <tr key="gap">
                      <td colSpan={3} className="text-center text-muted-foreground">
                        … {rows.length - 5} more …
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          <p className="m-0 text-xs">
            <span className="ws-num font-semibold">{rows.length}</span> cards
          </p>
          {problems.map(problem => (
            <p key={problem} className="m-0 text-xs text-destructive">
              {problem}
            </p>
          ))}
        </section>

        <section className="ws-card grid content-start gap-3 p-4">
          <h2 className="m-0 text-sm font-semibold">For every card</h2>
          <div className="grid gap-1">
            <Label className="text-xs">Branches</Label>
            <p className="m-0 text-xs text-muted-foreground">The cards can only be used at these branches. Pick one to keep them to that branch.</p>
            <div className="grid max-h-48 gap-1 overflow-auto">
              {branches.map(branch => (
                <label key={branch.id} className="flex items-center gap-2 text-xs">
                  <Checkbox checked={branchIds.includes(branch.id)} onCheckedChange={checked => toggleBranch(branch.id, checked === true)} />
                  {branch.name}
                </label>
              ))}
            </div>
            {branches.length > 1 && (
              <Button
                variant="outline"
                className="ws-control w-fit"
                onClick={() => setBranchIds(branchIds.length === branches.length ? [] : branches.map(branch => branch.id))}
              >
                {branchIds.length === branches.length ? 'Clear all' : 'Select all'}
              </Button>
            )}
          </div>
          <Field label="PIN" hint="Leave blank to give each card its own random PIN. A PIN column in the file wins.">
            <Input className="ws-control ws-mono w-24" inputMode="numeric" maxLength={4} value={pin} onChange={event => setPin(event.target.value.replace(/\D+/g, '').slice(0, 4))} />
          </Field>
          <Field label="Expiry date" hint="Optional.">
            <Input className="ws-control w-44" type="date" value={expiryDate} onChange={event => setExpiryDate(event.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-xs">
            <Checkbox checked={printed} onCheckedChange={checked => setPrinted(checked === true)} />
            Already printed
          </label>
          <Button className={cn('ws-control')} disabled={saving || rows.length === 0} onClick={() => void create()}>
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            Create {rows.length} cards
          </Button>
          {created.length > 0 && (
            <div className="grid gap-2 rounded-md border p-3">
              <p className="m-0 text-xs">
                <span className="ws-num font-semibold">{created.length}</span> cards were created.
              </p>
              <Button variant="outline" className="ws-control w-fit" onClick={() => downloadCsv(created)}>
                <Download className="h-3 w-3" /> Download numbers and PINs
              </Button>
            </div>
          )}
        </section>
      </div>
    </WholesalePage>
  );
};

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="grid gap-1">
    <Label className="text-xs">{label}</Label>
    {children}
    {hint && <p className="m-0 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export default LoyaltyCardBulkCreate;
