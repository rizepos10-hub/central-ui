import { WholesaleStatusTone } from '../wholesale-ui/wholesale-status-badge';
import { parseIsoDate, toIsoDate } from '../closures/closure.model';

export type WholesaleSourcing = 'PRODUCED' | 'PURCHASED';
export type OrderSheetStatus = 'NOT_SUBMITTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REOPENED';
export type FactoryOrderStatus = 'DRAFT' | 'SENT' | 'RETURNED' | 'APPROVED' | 'IN_PRODUCTION' | 'READY' | 'DISPATCHED' | 'CANCELLED';
export type ShortageReason = 'CAPACITY' | 'INGREDIENTS' | 'EQUIPMENT' | 'STAFF' | 'OTHER';
export type ProductionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
export type AllocationMethod = 'PROPORTIONAL' | 'PRIORITY' | 'MANUAL';
export type ActionChannel = 'KDS' | 'WEB';

// ---------------------------------------------------------------- order sheets

export interface IOrderSheetRow {
  routeId: string;
  routeName?: string;
  routeCode?: string | null;
  color?: string | null;
  factoryId?: string | null;
  deliveryDate: string;
  orderCount: number;
  customerCount: number;
  quantity: number;
  status: OrderSheetStatus;
  submittedBy?: string | null;
  submittedAt?: string | null;
  submitNote?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  approvalNote?: string | null;
  reopenedBy?: string | null;
  reopenedAt?: string | null;
  reopenReason?: string | null;
  factoryOrderId?: string | null;
  canSubmit: boolean;
  canApprove: boolean;
  canReopen: boolean;
}

// ---------------------------------------------------------------- production and loading lists

export interface IProduct {
  key: string;
  itemId: string;
  variantId?: string | null;
  name: string;
  sourcing?: WholesaleSourcing | null;
  total: number;
}

export interface IProductionRouteRow {
  routeId: string;
  routeName?: string;
  routeCode?: string | null;
  color?: string | null;
  sheetStatus?: OrderSheetStatus | null;
  orderCount: number;
  quantities: Record<string, number>;
  total: number;
}

export interface IProductionMatrix {
  date: string;
  factoryId: string;
  products: IProduct[];
  routes: IProductionRouteRow[];
  total: number;
}

export interface ILoadingLine {
  key: string;
  itemId: string;
  variantId?: string | null;
  name: string;
  sourcing?: WholesaleSourcing | null;
  quantity: number;
  notes?: string | null;
}

export interface ILoadingStop {
  sequence: number;
  customerId: string;
  customerName?: string | null;
  address?: string | null;
  phone?: string | null;
  orderIds: string[];
  lines: ILoadingLine[];
}

export interface ILoadingList {
  date: string;
  routeId: string;
  routeName?: string;
  routeCode?: string | null;
  factoryId?: string | null;
  sheetStatus?: OrderSheetStatus | null;
  stops: ILoadingStop[];
  totals: IProduct[];
}

// ---------------------------------------------------------------- factory orders

export interface IRouteQuantity {
  routeDefinitionId: string;
  qty: number;
  readyAt?: string | null;
  dispatchedAt?: string | null;
}

export interface IFactoryOrderLine {
  itemId: string;
  variantId?: string | null;
  itemName?: string | null;
  sourcing?: WholesaleSourcing | null;
  requestedQty?: number | null;
  availableQty?: number | null;
  approvedQty?: number | null;
  shortageReason?: ShortageReason | null;
  productionStatus?: ProductionStatus | null;
  routeBreakdown?: IRouteQuantity[];
  transferredFromFactoryId?: string | null;
}

export interface ILineChange {
  itemId: string;
  variantId?: string | null;
  itemName?: string | null;
  fromQty?: number | null;
  toQty?: number | null;
  reason?: ShortageReason | null;
}

export interface IShortageAllocation {
  itemId: string;
  variantId?: string | null;
  method?: AllocationMethod | null;
  orderId?: string | null;
  customerId?: string | null;
  fromQty?: number | null;
  toQty?: number | null;
  movedToFactoryId?: string | null;
  substituteItemId?: string | null;
  substituteVariantId?: string | null;
}

export interface IFactoryOrderEvent {
  version?: number | null;
  action: string;
  by?: string | null;
  at?: string | null;
  channel?: ActionChannel | null;
  note?: string | null;
  lineChanges?: ILineChange[];
  shortageAllocations?: IShortageAllocation[];
}

export interface IFactoryOrder {
  id: string;
  factoryId: string;
  deliveryDate: string;
  version: number;
  status: FactoryOrderStatus;
  orderSheetIds?: string[];
  lines: IFactoryOrderLine[];
  history: IFactoryOrderEvent[];
  sentAt?: string | null;
  sentBy?: string | null;
  returnedAt?: string | null;
  returnedBy?: string | null;
  returnNote?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  approvalNote?: string | null;
  productionStartedAt?: string | null;
}

export interface IFactoryOrderDetail {
  order: IFactoryOrder;
  factoryName?: string | null;
  routeNames: Record<string, string>;
}

export interface IFactoryBoardRow {
  factoryId: string;
  factoryName?: string;
  deliveryDate: string;
  factoryOrderId?: string | null;
  version?: number | null;
  status?: FactoryOrderStatus | null;
  approvedRoutes: number;
  pendingRoutes: number;
  routesWithOrders: number;
  sentAt?: string | null;
  returnedAt?: string | null;
  approvedAt?: string | null;
}

export interface IFactoryOrderSummary {
  id: string;
  factoryId: string;
  factoryName?: string | null;
  deliveryDate: string;
  version: number;
  status: FactoryOrderStatus;
  lineCount: number;
  requestedTotal: number;
  routeCount: number;
  sentAt?: string | null;
  returnedAt?: string | null;
  approvedAt?: string | null;
}

export interface ILineAvailability {
  itemId: string;
  variantId?: string | null;
  availableQty: number;
  reason?: ShortageReason | null;
}

export interface IProductAllocation {
  itemId: string;
  variantId?: string | null;
  method?: AllocationMethod | null;
  manualQuantities?: Record<string, number> | null;
  moveToFactoryId?: string | null;
  substituteItemId?: string | null;
  substituteVariantId?: string | null;
}

export interface IAffectedCustomer {
  customerId?: string | null;
  customerName?: string | null;
  orderId: string;
  itemName?: string | null;
  fromQty: number;
  toQty: number;
}

export interface IAllocationResult {
  factoryOrder: IFactoryOrderDetail;
  affected: IAffectedCustomer[];
}

export interface ICustomerQuantity {
  orderId: string;
  customerId?: string | null;
  customerName?: string | null;
  priority?: number | null;
  quantity: number;
}

export interface IProductCustomers {
  key: string;
  itemId: string;
  variantId?: string | null;
  itemName?: string | null;
  requestedQty?: number | null;
  availableQty?: number | null;
  customers: ICustomerQuantity[];
}

export interface IOrderLineChange {
  orderId: string;
  itemId: string;
  variantId?: string | null;
  quantity: number;
}

export interface IInvoiceRow {
  orderId: string;
  customerId?: string | null;
  customerName?: string | null;
  email?: string | null;
  routeId?: string | null;
  total?: number | null;
  billId?: string | null;
  invoiceNumber?: number | null;
  invoiceIssuedAt?: string | null;
  invoiceIssuedBy?: string | null;
  invoiceEmailedAt?: string | null;
}

export interface IInvoiceIssueResult {
  issued: number;
  alreadyIssued: number;
  emailed: number;
  skipped: { orderId: string; customerName?: string | null; reason: string }[];
  invoices: IInvoiceRow[];
}

export interface IFactorySocketEvent {
  type: string;
  id: string;
  factoryId: string;
  deliveryDate: string;
  version: number;
  status: FactoryOrderStatus;
  action: string;
}

// ---------------------------------------------------------------- labels and helpers

export const SHEET_STATUS_LABEL: Record<OrderSheetStatus, string> = {
  NOT_SUBMITTED: 'Not submitted',
  PENDING_APPROVAL: 'Waiting for approval',
  APPROVED: 'Approved',
  REOPENED: 'Reopened',
};

export const sheetTone = (status?: OrderSheetStatus | null): WholesaleStatusTone => {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'new';
    case 'APPROVED':
      return 'approved';
    case 'REOPENED':
      return 'amendment';
    default:
      return 'neutral';
  }
};

export const FACTORY_ORDER_STATUS_LABEL: Record<FactoryOrderStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Waiting for the factory',
  RETURNED: 'Returned with shortages',
  APPROVED: 'Approved',
  IN_PRODUCTION: 'In production',
  READY: 'Ready',
  DISPATCHED: 'Dispatched',
  CANCELLED: 'Cancelled',
};

export const factoryOrderTone = (status?: FactoryOrderStatus | null): WholesaleStatusTone => {
  switch (status) {
    case 'SENT':
      return 'new';
    case 'RETURNED':
      return 'returned';
    case 'APPROVED':
    case 'IN_PRODUCTION':
    case 'READY':
    case 'DISPATCHED':
      return 'approved';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'neutral';
  }
};

export const SHORTAGE_REASONS: { value: ShortageReason; label: string }[] = [
  { value: 'CAPACITY', label: 'Not enough capacity' },
  { value: 'INGREDIENTS', label: 'Missing ingredients' },
  { value: 'EQUIPMENT', label: 'Equipment problem' },
  { value: 'STAFF', label: 'Not enough staff' },
  { value: 'OTHER', label: 'Other' },
];

export const shortageReasonLabel = (reason?: ShortageReason | null) => SHORTAGE_REASONS.find(r => r.value === reason)?.label ?? '';

export const ALLOCATION_METHODS: { value: AllocationMethod; label: string; description: string }[] = [
  { value: 'PROPORTIONAL', label: 'Proportional', description: 'Every customer loses the same share' },
  { value: 'PRIORITY', label: 'By priority', description: 'Customers with the best priority are filled first' },
  { value: 'MANUAL', label: 'Manual', description: 'Enter the quantity for each customer' },
];

export const PRODUCTION_STATUS_LABEL: Record<ProductionStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
};

export const ACTION_LABEL: Record<string, string> = {
  BUILT: 'Built',
  SENT: 'Sent to the factory',
  RETURNED: 'Returned by the factory',
  ALLOCATED: 'Shortages allocated',
  RESUBMITTED: 'Re-submitted',
  APPROVED: 'Approved by the factory',
  AMENDED: 'Amended',
  PRODUCTION_STARTED: 'Production started',
  READY: 'Route ready',
  DISPATCHED: 'Route dispatched',
  INVOICED: 'Invoiced',
  CANCELLED: 'Cancelled',
};

/** Orders that were sent and are still with the factory or later; the factory can no longer be sent a first version. */
export const WAS_SENT: FactoryOrderStatus[] = ['SENT', 'RETURNED', 'APPROVED', 'IN_PRODUCTION', 'READY', 'DISPATCHED'];
export const INVOICEABLE: FactoryOrderStatus[] = ['APPROVED', 'IN_PRODUCTION', 'READY', 'DISPATCHED'];
export const AMENDABLE: FactoryOrderStatus[] = ['APPROVED', 'IN_PRODUCTION'];
export const TRACKABLE: FactoryOrderStatus[] = ['APPROVED', 'IN_PRODUCTION', 'READY'];

export const productKey = (itemId: string, variantId?: string | null) => `${itemId}|${variantId ?? ''}`;

export const lineKey = (line: { itemId: string; variantId?: string | null }) => productKey(line.itemId, line.variantId);

export const formatQty = (value?: number | null) => {
  if (value == null) return '-';
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
};

export const formatTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

export const tomorrow = (from = new Date()) => {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
  return toIsoDate(date);
};

export const shiftDay = (day: string, delta: number) => {
  const date = parseIsoDate(day);
  date.setDate(date.getDate() + delta);
  return toIsoDate(date);
};

export const isShort = (line: IFactoryOrderLine) =>
  line.availableQty != null && line.requestedQty != null && line.availableQty < line.requestedQty - 0.0001;

/** Every route on the order, in the order they first appear. */
export const routeIdsOf = (order: IFactoryOrder) => {
  const ids: string[] = [];
  order.lines.forEach(line => (line.routeBreakdown ?? []).forEach(part => !ids.includes(part.routeDefinitionId) && ids.push(part.routeDefinitionId)));
  return ids;
};

/** A route is ready (or dispatched) when every product on it is. */
export const routeProgress = (order: IFactoryOrder, routeId: string) => {
  const parts = order.lines.flatMap(line => (line.routeBreakdown ?? []).filter(part => part.routeDefinitionId === routeId));
  return {
    ready: parts.length > 0 && parts.every(part => part.readyAt),
    dispatched: parts.length > 0 && parts.every(part => part.dispatchedAt),
  };
};

/** The factory's answer: lines not changed are available in full; a short line needs a reason. */
export const validateAvailability = (lines: IFactoryOrderLine[], answers: Record<string, ILineAvailability>) => {
  const errors: Record<string, string> = {};
  lines.forEach(line => {
    const answer = answers[lineKey(line)];
    if (!answer) return;
    const requested = line.requestedQty ?? 0;
    if (answer.availableQty == null || Number.isNaN(answer.availableQty) || answer.availableQty < 0 || answer.availableQty > requested) {
      errors[lineKey(line)] = `Enter 0 to ${formatQty(requested)}`;
    } else if (answer.availableQty < requested && !answer.reason) {
      errors[lineKey(line)] = 'Choose why it is short';
    }
  });
  return errors;
};

export const hasShortage = (lines: IFactoryOrderLine[], answers: Record<string, ILineAvailability>) =>
  lines.some(line => {
    const answer = answers[lineKey(line)];
    return answer != null && answer.availableQty < (line.requestedQty ?? 0);
  });

export type ShortageOption = AllocationMethod | 'MOVE' | 'SUBSTITUTE';

export interface IShortageChoice {
  option: ShortageOption;
  manual?: Record<string, number>;
  moveToFactoryId?: string;
  /** productKey of the replacement product. */
  substituteKey?: string;
}

/** The request entry for one short line, or an error message when the choice is incomplete. */
export const toAllocation = (
  line: IFactoryOrderLine,
  choice: IShortageChoice,
  product?: IProductCustomers,
): { allocation?: IProductAllocation; error?: string } => {
  const base = { itemId: line.itemId, variantId: line.variantId ?? null };
  switch (choice.option) {
    case 'MOVE':
      return choice.moveToFactoryId ? { allocation: { ...base, moveToFactoryId: choice.moveToFactoryId } } : { error: 'Choose the factory' };
    case 'SUBSTITUTE': {
      if (!choice.substituteKey) return { error: 'Choose the replacement product' };
      const [substituteItemId, substituteVariantId] = choice.substituteKey.split('|');
      return { allocation: { ...base, method: 'PROPORTIONAL', substituteItemId, substituteVariantId: substituteVariantId || null } };
    }
    case 'MANUAL': {
      const error = product ? validateManual({ ...product, availableQty: line.availableQty }, choice.manual) : 'Enter the quantity for each customer';
      return error ? { error } : { allocation: { ...base, method: 'MANUAL', manualQuantities: choice.manual } };
    }
    default:
      return { allocation: { ...base, method: choice.option } };
  }
};

/** Amendment changes: only customer quantities that differ from what they have now. */
export const amendmentChanges = (products: IProductCustomers[], edits: Record<string, Record<string, number>>): IOrderLineChange[] =>
  products.flatMap(product =>
    product.customers
      .filter(c => edits[product.key]?.[c.orderId] != null && Math.abs(edits[product.key][c.orderId] - c.quantity) > 0.0001)
      .map(c => ({ orderId: c.orderId, itemId: product.itemId, variantId: product.variantId ?? null, quantity: edits[product.key][c.orderId] })),
  );

/** Manual quantities must cover every customer, stay within what each ordered, and not exceed what is available. */
export const validateManual = (product: IProductCustomers, quantities: Record<string, number> | undefined) => {
  if (!quantities) return 'Enter the quantity for each customer';
  let total = 0;
  for (const customer of product.customers) {
    const quantity = quantities[customer.orderId];
    if (quantity == null || Number.isNaN(quantity)) return 'Enter the quantity for each customer';
    if (quantity < 0 || quantity > customer.quantity) return `${customer.customerName ?? 'A customer'} can get 0 to ${formatQty(customer.quantity)}`;
    total += quantity;
  }
  const available = product.availableQty ?? product.requestedQty ?? 0;
  if (total > available + 0.0001) return `The quantities add up to ${formatQty(total)}, more than the ${formatQty(available)} available`;
  return null;
};
