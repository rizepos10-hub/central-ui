// SalesReportTypes.ts

interface Slot {
  order: number;
  value: number;
}

interface RowRecord {
  id: string;
  name: string;
  icon: string | null;
}

interface HeaderSlot {
  order: number | null;
  label: string | null;
}

interface TotalByDateRange {
  amount: number | null;
  costOfGoods: number | null;
  grossProfit: number | null;
  margin: number | null;
  returned: boolean | null;
  revenue: number | null;
  tax: number | null;
  value: null | number;
}

interface Row {
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  margin: number;
  tax: number;
  amount: number;
  returned: number;
  value: string | null;
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
  totalByDateRange: TotalByDateRange;
}

export interface FormRequest {
  dateRange: DateRange;
  measure: string;
  type: string;
}
