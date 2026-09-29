import axios from 'axios';

export type CatalogImportAction = 'CREATE' | 'UPDATE' | 'SKIPPED' | 'FAILED';

export interface ICatalogImportItem {
  row: number;
  name: string;
  category?: string | null;
  simple: boolean;
  variants: string[];
  taxGroup?: string | null;
  addonGroups: string[];
  action: CatalogImportAction;
  message?: string | null;
}

export interface ICatalogImportAddonGroup {
  name: string;
  created: boolean;
  addonsCreated: number;
  /** Items whose price for an add-on differs from the add-on's own price. */
  priceOverrides: number;
  addonsTotal: number;
}

export interface ICatalogImportIssue {
  /** 1 = the header row, 0 = not tied to a row (an add-on group). */
  row: number;
  name?: string | null;
  message: string;
}

export interface ICatalogImportReport {
  dryRun: boolean;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  taxGroupsCreated: string[];
  categoriesCreated: string[];
  addonGroups: ICatalogImportAddonGroup[];
  items: ICatalogImportItem[];
  errors: ICatalogImportIssue[];
  warnings: ICatalogImportIssue[];
}

export const importRestaurantCatalog = async (file: File, dryRun: boolean): Promise<ICatalogImportReport> => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await axios.post<ICatalogImportReport>('api/catalog-import/restaurant', form, {
    params: { dryRun },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

/** Header-level problems (missing columns) block the whole sheet. */
export const hasSheetErrors = (report: ICatalogImportReport | null) => !!report?.errors.some(e => e.row === 1);
