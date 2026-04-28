export type SalesReportTaxes = Record<string, number>;

interface Slot {
  order: number;
  value: number | null;
}

interface RowRecordIcon {
  id?: string | null;
  name?: string | null;
  path?: string | null;
  size?: number | null;
  type?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  url?: string | null;
  storageType?: string | null;
}

interface RowRecord {
  id: string;
  name: string;
  icon?: RowRecordIcon | string | null;
}

interface HeaderSlot {
  order: number | null;
  label: string | null;
}

interface TotalByDateRangeRecord {
  amount?: number | null;
  costOfGoods?: number | null;
  grossProfit?: number | null;
  margin?: number | null;
  returned?: boolean | number | null;
  returns?: number | null;
  revenue?: number | null;
  tax?: number | null;
  taxes?: SalesReportTaxes | null;
  value?: number | null;
  orderCount?: number | null;
}

interface Row {
  revenue?: number | null;
  costOfGoods?: number | null;
  grossProfit?: number | null;
  margin?: number | null;
  tax?: number | null;
  taxes?: SalesReportTaxes | null;
  amount?: number | null;
  returned?: boolean | number | null;
  returns?: number | null;
  value?: number | null;
  rowRecord: RowRecord;
  slots: Slot[];
}

interface DateRange {
  from: string;
  to: string;
  dateSlot: {
    period: string;
    slots: number;
  };
}

export interface ISalesReport {
  headerSlots: HeaderSlot[];
  rows: Row[];
  totalByDateRange: Record<string, TotalByDateRangeRecord> | TotalByDateRangeRecord[];
}

export interface FormRequest {
  dateRange: DateRange;
  measure: string;
  type: string;
}
