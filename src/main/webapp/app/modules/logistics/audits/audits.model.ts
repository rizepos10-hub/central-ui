import { WholesaleStatusTone } from '../wholesale-ui/wholesale-status-badge';
import { IMemoRow, IRunStop, IRunSummary } from '../delivery/delivery.model';

// ---------------------------------------------------------------- reconciliation

export type DiscrepancyType = 'SHORT' | 'UNEXPLAINED' | 'OVER';

export interface IQuantities {
  ordered: number;
  approved: number;
  delivered: number;
  staleReturned: number;
}

export interface IMoney {
  invoiced: number;
  cash: number;
  checks: number;
  onAccount: number;
  notPaid: number;
  staleCredit: number;
  deliveryChangeCredit: number;
  cashHandedIn: number;
  cashDifference: number;
}

export interface IReconRun {
  runId: string;
  runName?: string | null;
  routeDefinitionId?: string | null;
  factoryId?: string | null;
  deliveryDate: string;
  driverUsername?: string | null;
  submitted: boolean;
  stopsDone: number;
  stopsTotal: number;
  quantities: IQuantities;
  money: IMoney;
  basketsReturned: number;
  handoverClosed: boolean;
  missingCheckNumbers?: string[];
  discrepancies: number;
  unexplained: number;
}

export interface IReconTotals {
  factoryId?: string | null;
  runs: number;
  stopsDone: number;
  stopsTotal: number;
  quantities: IQuantities;
  money: IMoney;
  basketsReturned: number;
  handoversClosed: number;
  discrepancies: number;
  unexplained: number;
}

export interface IReconDay {
  date: string;
  runs: IReconRun[];
  total: IReconTotals;
  factories: IReconTotals[];
}

export interface IReconProduct {
  itemId: string;
  variantId?: string | null;
  name?: string | null;
  ordered: number;
  approved: number;
  delivered: number;
  staleReturned: number;
}

export interface IDiscrepancy {
  orderId: string;
  stopSequence?: number | null;
  customerName?: string | null;
  itemId: string;
  variantId?: string | null;
  name?: string | null;
  approved: number;
  delivered: number;
  difference: number;
  reason?: string | null;
  type: DiscrepancyType;
}

export interface IReconRunDetail {
  run: IReconRun;
  products: IReconProduct[];
  discrepancies: IDiscrepancy[];
}

export const DISCREPANCY_LABEL: Record<DiscrepancyType, { label: string; tone: WholesaleStatusTone }> = {
  SHORT: { label: 'Short', tone: 'amendment' },
  UNEXPLAINED: { label: 'No reason', tone: 'returned' },
  OVER: { label: 'Over', tone: 'new' },
};

// ---------------------------------------------------------------- alerts

export type AlertType = 'CASH_NOT_RECEIVED' | 'UNEXPLAINED_QTY_CHANGE' | 'OVER_DELIVERY' | 'NOT_PAID_CASH_ONLY' | 'STALE_RATE_HIGH';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED';

export interface IAlert {
  id: string;
  type: AlertType;
  status: AlertStatus;
  deliveryDate?: string | null;
  factoryId?: string | null;
  routeRunId?: string | null;
  runName?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  orderId?: string | null;
  driverUsername?: string | null;
  amount?: number | null;
  message?: string | null;
  raisedAt?: string | null;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  acknowledgeNote?: string | null;
}

export interface IAlertFilters {
  from: string;
  to: string;
  status?: AlertStatus | null;
  type?: AlertType | null;
  factoryId?: string | null;
}

export const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  CASH_NOT_RECEIVED: 'Cash not handed in',
  UNEXPLAINED_QTY_CHANGE: 'Quantity changed without a reason',
  OVER_DELIVERY: 'Over-delivery',
  NOT_PAID_CASH_ONLY: 'Cash-only customer not paid',
  STALE_RATE_HIGH: 'High stale return rate',
};

export const ALERT_STATUS_LABEL: Record<AlertStatus, string> = { OPEN: 'Open', ACKNOWLEDGED: 'Acknowledged' };

// ---------------------------------------------------------------- customer accounts

export type AgingBucket = 'CURRENT' | 'DAYS_1_30' | 'DAYS_31_60' | 'DAYS_61_90' | 'DAYS_90_PLUS';
export type PaymentMethod = 'CASH' | 'CHECK' | 'BANK_TRANSFER';
export type StatementLineType = 'INVOICE' | 'PAYMENT' | 'OFFICE_PAYMENT' | 'CREDIT_MEMO';
export type InvoiceStatus = 'OPEN' | 'PARTLY_PAID' | 'PAID';

export interface IAging {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
}

export interface IAgingRow {
  customerId: string;
  customerName?: string | null;
  aging: IAging;
  openInvoices: number;
  oldestOpenInvoiceDate?: string | null;
  openCredit: number;
}

export interface IAgingReport {
  asOf: string;
  customers: IAgingRow[];
  total: IAging;
  openCredit: number;
}

export interface IInvoice {
  orderId: string;
  billId?: string | null;
  invoiceNumber?: number | null;
  invoiceDate?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  factoryId?: string | null;
  routeDefinitionId?: string | null;
  total: number;
  paid: number;
  onAccountCharged: number;
  onAccountSettled: number;
  open: number;
  ageDays: number;
  bucket: AgingBucket;
}

export interface IAccountMemo extends IMemoRow {
  remaining?: number | null;
}

export interface IPaymentAllocation {
  orderId?: string | null;
  billId?: string | null;
  invoiceNumber?: number | null;
  amount?: number | null;
  onAccountAmount?: number | null;
}

export interface IPayment {
  id: string;
  paymentDate?: string | null;
  method?: PaymentMethod | null;
  amount?: number | null;
  checkNumber?: string | null;
  reference?: string | null;
  note?: string | null;
  allocations?: IPaymentAllocation[];
  receivedAt?: string | null;
  receivedBy?: string | null;
}

export interface ICustomerAccount {
  customerId: string;
  customerName?: string | null;
  asOf: string;
  aging: IAging;
  openInvoices: IInvoice[];
  openMemos: IAccountMemo[];
  openCredit: number;
  recentPayments: IPayment[];
  onAccountEnabled: boolean;
  onAccountBalance?: number | null;
  onAccountLimit?: number | null;
}

export interface IStatementLine {
  date: string;
  type: StatementLineType;
  reference?: string | null;
  description?: string | null;
  orderId?: string | null;
  debit: number;
  credit: number;
  balance: number;
}

export interface IStatement {
  customerId: string;
  customerName?: string | null;
  from: string;
  to: string;
  openingBalance: number;
  lines: IStatementLine[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  openMemos: IAccountMemo[];
}

export interface IAllocationRequest {
  orderId: string;
  billId?: string | null;
  amount: number;
}

export interface IPaymentRequest {
  paymentDate: string;
  method: PaymentMethod;
  amount: number;
  checkNumber?: string | null;
  reference?: string | null;
  note?: string | null;
  allocations: IAllocationRequest[];
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = { CASH: 'Cash', CHECK: 'Check', BANK_TRANSFER: 'Bank transfer' };

export const LINE_TYPE_LABEL: Record<StatementLineType, string> = {
  INVOICE: 'Invoice',
  PAYMENT: 'Paid at delivery',
  OFFICE_PAYMENT: 'Payment',
  CREDIT_MEMO: 'Credit memo',
};

export const AGING_COLUMNS: { key: keyof Omit<IAging, 'total'>; label: string }[] = [
  { key: 'current', label: 'Current' },
  { key: 'days1to30', label: '1-30' },
  { key: 'days31to60', label: '31-60' },
  { key: 'days61to90', label: '61-90' },
  { key: 'days90plus', label: '90+' },
];

export const invoiceLabel = (invoice: { invoiceNumber?: number | null }) => (invoice.invoiceNumber != null ? `#${invoice.invoiceNumber}` : 'Not issued');

const cents = (value: number) => Math.round(value * 100) / 100;

export const invoiceKey = (invoice: IInvoice) => invoice.billId ?? invoice.orderId;

/**
 * Spreads [amount] over the open invoices oldest first, keyed by [invoiceKey], the way the server does when no invoices
 * are chosen. Whatever is left over stays unallocated; the server rejects more than the customer owes.
 */
export const allocateOldestFirst = (invoices: IInvoice[], amount: number): Record<string, number> => {
  const result: Record<string, number> = {};
  let left = cents(amount);
  [...invoices]
    .sort((a, b) => (a.invoiceDate ?? '').localeCompare(b.invoiceDate ?? '') || (a.invoiceNumber ?? 0) - (b.invoiceNumber ?? 0))
    .forEach(invoice => {
      if (left <= 0) return;
      const part = cents(Math.min(left, invoice.open));
      if (part > 0) {
        result[invoiceKey(invoice)] = part;
        left = cents(left - part);
      }
    });
  return result;
};

export const sumAllocations = (allocations: Record<string, number>) => cents(Object.values(allocations).reduce((sum, v) => sum + (v || 0), 0));

// ---------------------------------------------------------------- invoices

export interface IInvoiceRow extends IInvoice {
  status: InvoiceStatus;
}

export interface IInvoiceTotals {
  count: number;
  total: number;
  paid: number;
  onAccountCharged: number;
  open: number;
}

export interface IInvoicePage {
  from: string;
  to: string;
  rows: IInvoiceRow[];
  page: number;
  size: number;
  totalRows: number;
  totals: IInvoiceTotals;
}

export interface IInvoiceFilters {
  from: string;
  to: string;
  factoryId?: string | null;
  routeDefinitionId?: string | null;
  customerId?: string | null;
  number?: string | null;
  status?: InvoiceStatus | null;
  page: number;
  size: number;
}

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: WholesaleStatusTone }> = {
  OPEN: { label: 'Open', tone: 'returned' },
  PARTLY_PAID: { label: 'Partly paid', tone: 'amendment' },
  PAID: { label: 'Paid', tone: 'approved' },
};

// ---------------------------------------------------------------- live route

export interface IPosition {
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  recordedAt?: string | null;
}

export interface ILiveRun {
  run: IRunSummary;
  lastPosition?: IPosition | null;
  ageSeconds?: number | null;
  stale: boolean;
  stops: IRunStop[];
}

export interface ILiveDay {
  date: string;
  intervalSeconds: number;
  runs: ILiveRun[];
}

export interface ITrail {
  runId: string;
  points: IPosition[];
}

/** Pushed on /topic/wholesale-live-route/{tenant} for every position a driver shares. */
export interface ILiveRouteEvent {
  type?: string;
  runId?: string;
  deliveryDate?: string;
  factoryId?: string | null;
  driverUserId?: string | null;
  position?: IPosition | null;
}

export const hasPosition = (p?: IPosition | null): p is IPosition & { latitude: number; longitude: number } =>
  p?.latitude != null && p?.longitude != null;

export const ageLabel = (seconds?: number | null) => {
  if (seconds == null) return 'No location yet';
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min ago`;
};

// ---------------------------------------------------------------- dashboard

export interface IDashboard {
  from: string;
  to: string;
  factoryId?: string | null;
  orders: { count: number; customers: number; value: number };
  quantities: IQuantities;
  staleRatePercent?: number | null;
  money: IMoney;
  runs: { total: number; notStarted: number; inProgress: number; submitted: number; stopsDone: number; stopsTotal: number; handoversClosed: number };
  shortages: { factoryOrders: number; lines: number; quantity: number };
  openAlerts: number;
  receivables: { total: number; overdue: number; openCredit: number; customers: number };
  topStaleCustomers: { customerId: string; customerName?: string | null; delivered: number; staleReturned: number; ratePercent: number }[];
  trend: IDayPoint[];
}

export interface IDayPoint {
  date: string;
  orders: number;
  orderValue: number;
  invoiced: number;
  cash: number;
  checks: number;
  onAccount: number;
  notPaid: number;
  delivered: number;
  staleReturned: number;
}

export const MAX_DASHBOARD_DAYS = 31;

export const percent = (value?: number | null) => (value == null ? '-' : `${Number(value).toFixed(1)}%`);
