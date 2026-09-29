import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { Download, FileSpreadsheet, Loader2, RotateCcw, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from 'app/modules/logistics/wholesale-ui/wholesale-page';
import { WholesaleStatusBadge, WholesaleStatusTone } from 'app/modules/logistics/wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from 'app/modules/logistics/wholesale-ui/wholesale-error';

import { CatalogImportAction, ICatalogImportIssue, ICatalogImportReport, hasSheetErrors, importRestaurantCatalog } from './restaurant-catalog-import.api';

const TEMPLATE_HEADERS = ['Category', 'Name', 'Item_type', 'Price', 'Tax_profile', 'AddOnGroup1', 'AddOnGroup1Selected', 'AddOnGroup2', 'AddOnGroup2Selected'];

const TEMPLATE_ROWS = [
  ['Burgers', 'Classic Burger', 'Simple', 25, 'VAT', 'Burger Extras', '<Cheese@2>,<Bacon@3.5>', 'Sauces', '<Ketchup@0>,<Mayo@0>'],
  ['Burgers', 'Double Burger', 'Simple', 32, 'VAT', 'Burger Extras', '<Cheese@3>,<Bacon@3.5>', '', ''],
  ['Pizza', 'Margherita', 'Variable', '<Small@30>,<Medium@38>,<Large@45>', 'VAT', 'Pizza Toppings', '<Olives@3>,<Mushrooms@3>', '', ''],
  ['Drinks', 'Cola', 'Simple', 6, 'VAT', '', '', '', ''],
];

const TEMPLATE_NOTES = [
  ['Column', 'How to fill it'],
  ['Category', 'Category name. Use "Parent > Child" for a sub-category. Missing categories are created.'],
  ['Name', 'Item name. Items are matched by name: an existing item is updated, otherwise a new one is created.'],
  ['Item_type', 'Simple (one price) or Variable (has variants).'],
  ['Price', 'Simple: a number. Variable: <variant@price>,<variant@price>,... with as many variants as needed.'],
  ['Tax_profile', 'Tax group name. A missing group is created on a 0% rate that you can change later.'],
  ['AddOnGroupN', 'Add-on group name. Add AddOnGroup3, AddOnGroup4... for more groups.'],
  ['AddOnGroupNSelected', 'The add-ons this item offers: <addon@price>,<addon@price>. Blank = all add-ons of the group.'],
  ['', 'Add-ons are matched by name within their group. A new add-on takes the first price found in the sheet; an existing one keeps its price.'],
  ['', 'When an item lists an add-on at a different price, that price is saved as an override for that item only.'],
  ['', 'Only the first sheet is imported; this sheet is ignored.'],
];

const downloadTemplate = () => {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...TEMPLATE_ROWS]);
  sheet['!cols'] = TEMPLATE_HEADERS.map(h => ({ wch: Math.max(14, h.length + 4) }));
  XLSX.utils.book_append_sheet(book, sheet, 'rest_import');
  const notes = XLSX.utils.aoa_to_sheet(TEMPLATE_NOTES);
  notes['!cols'] = [{ wch: 22 }, { wch: 110 }];
  XLSX.utils.book_append_sheet(book, notes, 'How to');
  XLSX.writeFile(book, 'restaurant-catalog-import.xlsx');
};

const actionTone: Record<CatalogImportAction, WholesaleStatusTone> = {
  CREATE: 'new',
  UPDATE: 'approved',
  SKIPPED: 'neutral',
  FAILED: 'cancelled',
};

const actionLabel = (action: CatalogImportAction, dryRun: boolean) => {
  if (action === 'CREATE') return dryRun ? 'New' : 'Created';
  if (action === 'UPDATE') return dryRun ? 'Update' : 'Updated';
  return action === 'FAILED' ? 'Error' : 'Skipped';
};

const rowLabel = (issue: ICatalogImportIssue) => (issue.row === 0 ? 'Add-on group' : issue.row === 1 ? 'Header' : `Row ${issue.row}`);

const Stat = ({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'danger' | 'primary' }) => (
  <div className="ws-card px-4 py-3">
    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={cn('ws-num mt-1 text-left text-xl font-semibold', tone === 'danger' && 'text-destructive', tone === 'primary' && 'text-primary')}>{value}</div>
  </div>
);

const IssueList = ({ title, issues, tone }: { title: string; issues: ICatalogImportIssue[]; tone: 'danger' | 'warning' }) =>
  issues.length === 0 ? null : (
    <section className="ws-card p-4" aria-label={title}>
      <h2 className={cn('m-0 text-sm font-semibold', tone === 'danger' ? 'text-destructive' : 'text-[hsl(var(--ws-returned))]')}>
        {title} ({issues.length})
      </h2>
      <ul className="mt-2 grid gap-1 text-[13px]">
        {issues.map((issue, i) => (
          <li key={`${issue.row}-${i}`} className="flex gap-2">
            <span className="ws-mono w-24 shrink-0 text-muted-foreground">{rowLabel(issue)}</span>
            {issue.name && <span className="font-medium">{issue.name}:</span>}
            <span>{issue.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );

const RestaurantCatalogImport = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ICatalogImportReport | null>(null);
  const [busy, setBusy] = useState<'preview' | 'import' | null>(null);

  const imported = report != null && !report.dryRun;
  const blocked = hasSheetErrors(report);
  const toImport = report ? report.itemsCreated + report.itemsUpdated : 0;

  const run = async (selected: File, dryRun: boolean) => {
    setBusy(dryRun ? 'preview' : 'import');
    try {
      const result = await importRestaurantCatalog(selected, dryRun);
      setReport(result);
      if (!dryRun) {
        const saved = result.itemsCreated + result.itemsUpdated;
        if (result.itemsFailed > 0) toast.warn(`${saved} items imported, ${result.itemsFailed} with errors.`);
        else toast.success(`${saved} items imported.`);
      }
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, dryRun ? 'The file could not be checked.' : 'The import failed.'));
    } finally {
      setBusy(null);
    }
  };

  const pick = (selected?: File | null) => {
    if (!selected) return;
    setFile(selected);
    setReport(null);
    void run(selected, true);
  };

  const reset = () => {
    setFile(null);
    setReport(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const newAddons = useMemo(() => report?.addonGroups.reduce((sum, g) => sum + g.addonsCreated, 0) ?? 0, [report]);

  return (
    <WholesalePage
      title="Restaurant Catalog Import"
      context="One row per item. Items, add-on groups, add-ons and tax groups are matched by name: existing ones are updated, the rest are created."
      actions={
        <>
          <Button variant="outline" className="ws-control" onClick={downloadTemplate}>
            <Download className="mr-1 h-4 w-4" />
            Template
          </Button>
          <Button className="ws-control" disabled={busy != null} onClick={() => inputRef.current?.click()}>
            <Upload className="mr-1 h-4 w-4" />
            {file ? 'Choose another file' : 'Choose Excel file'}
          </Button>
        </>
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        data-testid="catalog-import-file"
        onChange={e => pick(e.target.files?.[0])}
      />

      {!file && (
        <button
          type="button"
          className="ws-card flex flex-col items-center gap-2 border-dashed px-6 py-12 text-center hover:bg-accent/40"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            pick(e.dataTransfer.files?.[0]);
          }}
        >
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <span className="text-sm font-semibold">Drop the Excel file here or click to choose it</span>
          <span className="max-w-xl text-xs text-muted-foreground">
            Columns: Category, Name, Item_type, Price, Tax_profile, AddOnGroup1, AddOnGroup1Selected, AddOnGroup2... The file is checked first;
            nothing is saved until you confirm.
          </span>
        </button>
      )}

      {file && (
        <div className="ws-card flex flex-wrap items-center gap-3 px-4 py-3">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{file.name}</div>
            <div className="text-xs text-muted-foreground">
              {busy === 'preview' && 'Checking the file...'}
              {busy === 'import' && 'Importing...'}
              {!busy && report && (imported ? 'Import finished.' : blocked ? 'The sheet cannot be imported.' : 'Preview: nothing has been saved yet.')}
            </div>
          </div>
          <div className="flex-1" />
          {imported ? (
            <>
              <Button variant="outline" className="ws-control" onClick={reset}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Import another file
              </Button>
              <Button className="ws-control" onClick={() => navigate('/restaurant/regular')}>
                Open products
              </Button>
            </>
          ) : (
            <Button className="ws-control" disabled={busy != null || !report || blocked || toImport === 0} onClick={() => file && void run(file, false)}>
              {busy === 'import' && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Import {toImport} {toImport === 1 ? 'item' : 'items'}
            </Button>
          )}
        </div>
      )}

      {report && !blocked && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label={report.dryRun ? 'New items' : 'Created'} value={report.itemsCreated} tone="primary" />
          <Stat label={report.dryRun ? 'Items to update' : 'Updated'} value={report.itemsUpdated} />
          <Stat label="Rows with errors" value={report.itemsFailed} tone={report.itemsFailed ? 'danger' : undefined} />
          <Stat label="New add-ons" value={newAddons} />
          <Stat label="New tax groups" value={report.taxGroupsCreated.length} />
        </div>
      )}

      {report && <IssueList title="Errors" issues={report.errors} tone="danger" />}
      {report && <IssueList title="Warnings" issues={report.warnings} tone="warning" />}

      {report && (report.taxGroupsCreated.length > 0 || report.categoriesCreated.length > 0) && (
        <section className="ws-card grid gap-3 p-4 md:grid-cols-2">
          {report.taxGroupsCreated.length > 0 && (
            <div>
              <h2 className="m-0 text-sm font-semibold">{report.dryRun ? 'Tax groups to create' : 'Tax groups created'}</h2>
              <p className="mt-1 text-xs text-muted-foreground">Each gets its own tax profile on a 0% rate. Set the real rate under Taxes.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {report.taxGroupsCreated.map(name => (
                  <WholesaleStatusBadge key={name} tone="returned">
                    {name}
                  </WholesaleStatusBadge>
                ))}
              </div>
            </div>
          )}
          {report.categoriesCreated.length > 0 && (
            <div>
              <h2 className="m-0 text-sm font-semibold">{report.dryRun ? 'Categories to create' : 'Categories created'}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {report.categoriesCreated.map(name => (
                  <WholesaleStatusBadge key={name} tone="new">
                    {name}
                  </WholesaleStatusBadge>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {report && report.addonGroups.length > 0 && (
        <div className="ws-card overflow-hidden">
          <table className="ws-table" aria-label="Add-on groups">
            <thead>
              <tr>
                <th>Add-on group</th>
                <th>Group</th>
                <th className="ws-num">New add-ons</th>
                <th className="ws-num">Item price overrides</th>
                <th className="ws-num">Add-ons in group</th>
              </tr>
            </thead>
            <tbody>
              {report.addonGroups.map(g => (
                <tr key={g.name}>
                  <td className="font-medium">{g.name}</td>
                  <td>
                    <WholesaleStatusBadge tone={g.created ? 'new' : 'neutral'}>{g.created ? (report.dryRun ? 'New' : 'Created') : 'Existing'}</WholesaleStatusBadge>
                  </td>
                  <td className="ws-num">{g.addonsCreated}</td>
                  <td className="ws-num">{g.priceOverrides}</td>
                  <td className="ws-num">{g.addonsTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {report && report.items.length > 0 && (
        <div className="ws-card max-h-[60vh] overflow-auto">
          <table className="ws-table" aria-label="Items">
            <thead>
              <tr>
                <th className="ws-num">Row</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Tax group</th>
                <th>Add-on groups</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.items.map(item => (
                <tr key={item.row}>
                  <td className="ws-num text-muted-foreground">{item.row}</td>
                  <td className="font-medium">{item.name}</td>
                  <td>{item.category || '-'}</td>
                  <td className="ws-mono text-[12.5px]">{item.variants.join(', ')}</td>
                  <td>{item.taxGroup || '-'}</td>
                  <td className="text-[12.5px]">{item.addonGroups.length ? item.addonGroups.join(', ') : '-'}</td>
                  <td title={item.message ?? undefined}>
                    <WholesaleStatusBadge tone={actionTone[item.action]}>{actionLabel(item.action, report.dryRun)}</WholesaleStatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WholesalePage>
  );
};

export default RestaurantCatalogImport;
