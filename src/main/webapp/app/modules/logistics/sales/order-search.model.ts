import { WholesaleStatusTone } from '../wholesale-ui/wholesale-status-badge';

export type OrderStage = 'OPEN' | 'WITH_FACTORY' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type OrderStatusFilter = 'UNFULFILLED' | OrderStage | 'ALL';
export type OrderPaymentFilter = 'ANY' | 'UNPAID' | 'PAID';

export interface IOrderLine {
  name: string;
  quantity: number;
  price?: number | null;
}

export interface IOrderRow {
  id: string;
  sequenceNumber?: number | null;
  customerId: string;
  customerName: string;
  accountNumber?: string | null;
  deliveryDate?: string | null;
  routeId?: string | null;
  routeName?: string | null;
  stage: OrderStage;
  processingStatus?: string | null;
  paymentStatus?: string | null;
  source?: string | null;
  total?: number | null;
  amountDue?: number | null;
  createdDate?: string | null;
  lines: IOrderLine[];
  cancellable: boolean;
  cancelBlockedReason?: string | null;
}

export interface IOrderPage {
  rows: IOrderRow[];
  total: number;
}

export interface IOrderSearch {
  status: OrderStatusFilter;
  payment: OrderPaymentFilter;
  customerId?: string;
  search?: string;
  from?: string;
  to?: string;
  page: number;
  size: number;
}

export const STATUS_FILTERS: { value: OrderStatusFilter; label: string }[] = [
  { value: 'UNFULFILLED', label: 'Unfulfilled' },
  { value: 'OPEN', label: 'Open' },
  { value: 'WITH_FACTORY', label: 'With factory' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'ALL', label: 'All' },
];

export const PAYMENT_FILTERS: { value: OrderPaymentFilter; label: string }[] = [
  { value: 'ANY', label: 'Any payment' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PAID', label: 'Paid' },
];

export const STAGE_LABEL: Record<OrderStage, string> = {
  OPEN: 'Open',
  WITH_FACTORY: 'With factory',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const STAGE_TONE: Record<OrderStage, WholesaleStatusTone> = {
  OPEN: 'new',
  WITH_FACTORY: 'amendment',
  SHIPPED: 'neutral',
  DELIVERED: 'approved',
  CANCELLED: 'cancelled',
};

const PAYMENT_LABEL: Record<string, string> = {
  UNPAID: 'Unpaid',
  PARTIALLY_PAID: 'Partly paid',
  BILL_PRINTED: 'Bill printed',
  PAID: 'Paid',
};

export const paymentLabel = (status?: string | null) => (status ? PAYMENT_LABEL[status] ?? status : 'Unpaid');

export const orderLabel = (row: Pick<IOrderRow, 'id' | 'sequenceNumber'>) => (row.sequenceNumber != null ? `#${row.sequenceNumber}` : row.id);

const STATUS_VALUES = STATUS_FILTERS.map(s => s.value);
const PAYMENT_VALUES = PAYMENT_FILTERS.map(p => p.value);

/** Reads the filters from the page address, so Order Entry can link to a customer's unpaid or unfulfilled orders. */
export const searchFromParams = (params: URLSearchParams, size: number): IOrderSearch => {
  const status = params.get('status') as OrderStatusFilter;
  const payment = params.get('payment') as OrderPaymentFilter;
  return {
    status: STATUS_VALUES.includes(status) ? status : 'UNFULFILLED',
    payment: PAYMENT_VALUES.includes(payment) ? payment : 'ANY',
    customerId: params.get('customerId') || undefined,
    search: params.get('search') || undefined,
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
    page: 0,
    size,
  };
};

/** The page address for a search, leaving out defaults. */
export const ordersLink = (search: Partial<IOrderSearch>) => {
  const params = new URLSearchParams();
  if (search.status && search.status !== 'UNFULFILLED') params.set('status', search.status);
  if (search.payment && search.payment !== 'ANY') params.set('payment', search.payment);
  if (search.customerId) params.set('customerId', search.customerId);
  if (search.search) params.set('search', search.search);
  if (search.from) params.set('from', search.from);
  if (search.to) params.set('to', search.to);
  const query = params.toString();
  return `/logistics/orders${query ? `?${query}` : ''}`;
};

/** Sent after an order is placed or cancelled, so the menu counter refreshes. */
export const ORDERS_CHANGED_EVENT = 'wholesale:orders-changed';

export const notifyOrdersChanged = () => window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));
