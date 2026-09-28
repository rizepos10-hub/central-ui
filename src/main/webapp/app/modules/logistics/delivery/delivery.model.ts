import { WholesaleStatusTone } from '../wholesale-ui/wholesale-status-badge';

export type RunStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type StopStatus = 'PENDING' | 'VISITED' | 'SKIPPED';
export type DeliveryOutcome = 'CASH' | 'CHECK' | 'ON_ACCOUNT' | 'NOT_PAID';
export type StaleReason = 'STALE' | 'DAMAGED' | 'UNSOLD' | 'OTHER';
export type MemoReason = 'DELIVERY_CHANGE' | 'STALE_RETURN';
export type MemoStatus = 'OPEN' | 'APPLIED' | 'VOID';
export type ProofOfDelivery = 'NONE' | 'SIGNATURE' | 'SIGNATURE_AND_PHOTO';

// ---------------------------------------------------------------- runs

export interface IRunSummary {
  id: string;
  name?: string | null;
  routeDefinitionId?: string | null;
  deliveryDate: string;
  factoryId?: string | null;
  driverUserId?: string | null;
  driverUsername?: string | null;
  status?: RunStatus | null;
  locked: boolean;
  stopsDone: number;
  stopsTotal: number;
  releasedAt?: string | null;
  submittedAt?: string | null;
  submittedBy?: string | null;
  unlockedAt?: string | null;
  unlockedBy?: string | null;
}

export interface IRunStop {
  sequence?: number | null;
  orderId: string;
  customerId?: string | null;
  customerName?: string | null;
  businessName?: string | null;
  status?: StopStatus | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  total?: number | null;
  amountDue?: number | null;
}

export interface IRunDetail {
  run: IRunSummary;
  stops: IRunStop[];
}

export interface IReleaseResult {
  runs: IRunSummary[];
  ordersReleased: number;
  heldRouteDefinitionIds: string[];
}

export interface IStopLine {
  itemId: string;
  variantId?: string | null;
  name?: string | null;
  orderedAmount?: number | null;
  approvedAmount?: number | null;
  amount?: number | null;
  deliveredAmount?: number | null;
  price?: number | null;
  reason?: string | null;
}

export interface IStopBill {
  billId?: string | null;
  total?: number | null;
  paid?: number | null;
  remaining?: number | null;
  invoiceNumber?: number | null;
}

export interface IStaleLine {
  itemId: string;
  variantId?: string | null;
  itemName?: string | null;
  quantity?: number | null;
  reason?: StaleReason | null;
  unitCredit?: number | null;
  sourceOrderId?: string | null;
}

export interface IDeliveryRecord {
  outcome?: DeliveryOutcome | null;
  amountCollected?: number | null;
  checkNumber?: string | null;
  basketsReturned?: number | null;
  deliveredAt?: string | null;
  deliveredBy?: string | null;
  signatureUrl?: string | null;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  noLocationReason?: string | null;
  note?: string | null;
  staleReturns?: IStaleLine[];
}

export interface IStopDetail {
  runId: string;
  runLocked: boolean;
  stop?: IRunStop | null;
  phone?: string | null;
  orderNotes?: string | null;
  lines: IStopLine[];
  bill?: IStopBill | null;
  delivery?: IDeliveryRecord | null;
  rules?: { proofOfDelivery?: ProofOfDelivery | null; staleCreditPercent?: number | null } | null;
  creditMemos?: IMemoRow[];
}

/** Pushed on /topic/wholesale-delivery/{tenant} after every change to a run or stop. */
export interface IDeliverySocketEvent {
  type?: string;
  runId?: string;
  routeDefinitionId?: string;
  deliveryDate?: string;
  driverUserId?: string | null;
  action?: string;
}

// ---------------------------------------------------------------- cash handover

export interface IHandoverCheck {
  orderId?: string | null;
  customerName?: string | null;
  checkNumber?: string | null;
  amount?: number | null;
}

export interface IExpected {
  cash: number;
  checks: IHandoverCheck[];
  checksTotal: number;
  onAccount: number;
  notPaid: number;
  basketsReturned: number;
  staleCredit: number;
  stopsDone: number;
  stopsTotal: number;
}

export interface IHandoverRow {
  runId: string;
  runName?: string | null;
  routeDefinitionId?: string | null;
  factoryId?: string | null;
  deliveryDate: string;
  driverUserId?: string | null;
  driverUsername?: string | null;
  runSubmitted: boolean;
  expected: IExpected;
  closed: boolean;
  cashHandedIn?: number | null;
  cashDifference?: number | null;
  missingCheckNumbers?: string[] | null;
  closedAt?: string | null;
  closedBy?: string | null;
}

export interface IHandoverStop {
  sequence?: number | null;
  orderId: string;
  customerName?: string | null;
  outcome?: DeliveryOutcome | null;
  amountCollected?: number | null;
  checkNumber?: string | null;
  basketsReturned?: number | null;
  staleCredit: number;
  notPaid: number;
}

export interface IHandoverRecord {
  cashHandedIn?: number | null;
  checksHandedIn?: string[];
  basketsHandedIn?: number | null;
  cashDifference?: number | null;
  missingCheckNumbers?: string[];
  closedAt?: string | null;
  closedBy?: string | null;
  note?: string | null;
}

export interface IHandoverDetail {
  row: IHandoverRow;
  stops: IHandoverStop[];
  handover?: IHandoverRecord | null;
}

export interface ICloseHandover {
  cashHandedIn: number;
  checksHandedIn: string[];
  basketsHandedIn?: number | null;
  note?: string | null;
}

// ---------------------------------------------------------------- credit memos and stale returns

export interface IMemoRow {
  id: string;
  number?: number | null;
  reason?: MemoReason | null;
  status?: MemoStatus | null;
  customerId?: string | null;
  customerName?: string | null;
  orderId?: string | null;
  invoiceNumber?: number | null;
  routeDefinitionId?: string | null;
  routeRunId?: string | null;
  factoryId?: string | null;
  deliveryDate?: string | null;
  total?: number | null;
  createdAt?: string | null;
  createdBy?: string | null;
}

export interface IMemoLine {
  itemId?: string | null;
  variantId?: string | null;
  itemName?: string | null;
  quantity?: number | null;
  unitCredit?: number | null;
  total?: number | null;
  reason?: string | null;
}

export interface IMemoDetail {
  memo: IMemoRow;
  lines: IMemoLine[];
  note?: string | null;
  sourceInvoice?: { orderId?: string | null; billId?: string | null; invoiceNumber?: number | null; issuedAt?: string | null; billTotal?: number | null } | null;
}

export interface IStaleRow {
  id: string;
  deliveryDate?: string | null;
  routeDefinitionId?: string | null;
  routeRunId?: string | null;
  factoryId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  orderId?: string | null;
  driverUsername?: string | null;
  itemId?: string | null;
  variantId?: string | null;
  itemName?: string | null;
  quantity?: number | null;
  reason?: StaleReason | null;
  unitCredit?: number | null;
  totalCredit?: number | null;
  sourceOrderId?: string | null;
  creditMemoId?: string | null;
}

export interface IStaleReport {
  rows: IStaleRow[];
  byProduct: { itemId: string; variantId?: string | null; itemName?: string | null; quantity: number; credit: number }[];
  totalQuantity: number;
  totalCredit: number;
}

export interface ICreditFilters {
  from: string;
  to: string;
  routeDefinitionId?: string | null;
  customerId?: string | null;
  itemId?: string | null;
  status?: MemoStatus | null;
  reason?: MemoReason | null;
}

// ---------------------------------------------------------------- labels and helpers

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  PLANNED: 'Not started',
  IN_PROGRESS: 'On the road',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const OUTCOME_LABEL: Record<DeliveryOutcome, string> = {
  CASH: 'Cash',
  CHECK: 'Check',
  ON_ACCOUNT: 'On account',
  NOT_PAID: 'Not paid',
};

export const STALE_REASON_LABEL: Record<StaleReason, string> = {
  STALE: 'Stale',
  DAMAGED: 'Damaged',
  UNSOLD: 'Unsold',
  OTHER: 'Other',
};

export const MEMO_REASON_LABEL: Record<MemoReason, string> = {
  DELIVERY_CHANGE: 'Delivery change',
  STALE_RETURN: 'Stale return',
};

export const MEMO_STATUS_LABEL: Record<MemoStatus, string> = {
  OPEN: 'Open',
  APPLIED: 'Applied',
  VOID: 'Void',
};

/** A submitted run is locked until a manager unlocks it; before that, done stops show progress. */
export const runState = (run: IRunSummary): { label: string; tone: WholesaleStatusTone } => {
  if (run.locked) return { label: 'Submitted', tone: 'approved' };
  if (run.status === 'CANCELLED') return { label: RUN_STATUS_LABEL.CANCELLED, tone: 'cancelled' };
  if (run.stopsTotal > 0 && run.stopsDone >= run.stopsTotal) return { label: 'All stops done', tone: 'amendment' };
  if (run.stopsDone > 0 || run.status === 'IN_PROGRESS') return { label: RUN_STATUS_LABEL.IN_PROGRESS, tone: 'new' };
  return { label: RUN_STATUS_LABEL.PLANNED, tone: 'neutral' };
};

export const money = (value?: number | null) => (value == null ? '-' : `$${Number(value).toFixed(2)}`);

/** A signed difference: "+$2.00" over, "-$2.00" short, "$0.00" when it matches. */
export const signedMoney = (value?: number | null) => {
  if (value == null) return '-';
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) return '$0.00';
  return `${rounded > 0 ? '+' : '-'}$${Math.abs(rounded).toFixed(2)}`;
};

export const stopName = (stop?: { businessName?: string | null; customerName?: string | null } | null) => stop?.businessName || stop?.customerName || 'Customer';

export const mapLink = (latitude?: number | null, longitude?: number | null) =>
  latitude == null || longitude == null ? null : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

/** What the delivered quantity is compared with: the factory-approved amount, else the ordered one. */
export const expectedQty = (line: IStopLine) => line.approvedAmount ?? line.orderedAmount ?? line.amount ?? 0;

export const lineChanged = (line: IStopLine) => line.deliveredAmount != null && Math.abs(line.deliveredAmount - expectedQty(line)) > 0.0001;

export const staleCredit = (lines?: IStaleLine[] | null) =>
  Math.round((lines ?? []).reduce((sum, l) => sum + (l.unitCredit ?? 0) * (l.quantity ?? 0), 0) * 100) / 100;

/** The bookkeeper's count before closing, worked out the way central stores it. */
export const handoverPreview = (expected: IExpected, cashHandedIn: number | null, checksHandedIn: string[]) => {
  const handed = new Set(checksHandedIn.map(n => n.trim()).filter(Boolean));
  return {
    cashDifference: cashHandedIn == null || Number.isNaN(cashHandedIn) ? null : Math.round((cashHandedIn - expected.cash) * 100) / 100,
    missingChecks: expected.checks.filter(c => c.checkNumber && !handed.has(c.checkNumber.trim())),
  };
};

export const differenceTone = (value?: number | null) => (value == null || Math.abs(value) < 0.005 ? 'even' : value < 0 ? 'short' : 'over');
