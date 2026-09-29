export const PORTAL_ROLE = 'ROLE_WHOLESALE_CUSTOMER';

export type ClosedReason = 'BLOCKED' | 'CUTOFF_PASSED' | 'LOCKED' | 'NOT_SET_UP';

export interface IPortalMe {
  customerId: string;
  name: string;
  accountNumber?: string | null;
  deliveryAddress?: string | null;
  orderingReady: boolean;
  mustChangePassword: boolean;
}

export interface IPortalDay {
  /** yyyy-MM-dd */
  date: string;
  cutoffAt?: string | null;
  closedReason?: ClosedReason | null;
  orderId?: string | null;
}

export interface IPortalCategory {
  id: string;
  name: string;
}

export interface IPortalVariant {
  id?: string | null;
  name?: string | null;
  price?: number | null;
}

export interface IPortalItem {
  itemId: string;
  name: string;
  imageUrl?: string | null;
  categoryIds: string[];
  variants: IPortalVariant[];
}

export interface IPortalLine {
  itemId: string;
  variantId?: string | null;
  quantity: number;
}

export interface IPortalCatalog {
  date: string;
  categories: IPortalCategory[];
  items: IPortalItem[];
  usualLines: IPortalLine[];
}

export interface IPortalOrderLine {
  itemId: string;
  variantId?: string | null;
  name: string;
  quantity: number;
  unitPrice?: number | null;
}

export interface IPortalOrder {
  id: string;
  deliveryDate: string;
  status?: string | null;
  source?: string | null;
  lines: IPortalOrderLine[];
  total?: number | null;
  closedReason?: ClosedReason | null;
  cutoffAt?: string | null;
}

export interface IPortalTotals {
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
}

export interface IPortalAccess {
  customerId: string;
  enabled: boolean;
  email?: string | null;
  login?: string | null;
  categoryIds: string[];
  lastInviteSentAt?: string | null;
}

export interface IPortalAccessRequest {
  email?: string | null;
  password?: string | null;
  enabled?: boolean | null;
  categoryIds?: string[] | null;
  sendInvite?: boolean;
  portalUrl?: string | null;
}

export interface IPortalFeedOrder {
  orderId: string;
  customerId: string;
  customerName: string;
  deliveryDate: string;
  status?: string | null;
  placedAt?: string | null;
  updatedAt?: string | null;
  lineCount: number;
  total?: number | null;
}

/** The "Your usual items" category, shown first. */
export const USUAL = '__usual';
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_QUANTITY = 10000;

/** A portal customer only: staff who also hold the customer role keep the back office. */
export const isPortalCustomer = (authorities?: string[] | null) =>
  !!authorities?.includes(PORTAL_ROLE) && authorities.every(a => a === PORTAL_ROLE || !a.startsWith('ROLE_'));

export const money = (value?: number | null) => (value == null ? '-' : `$${Number(value).toFixed(2)}`);

export const lineKey = (itemId: string, variantId?: string | null) => `${itemId}|${variantId ?? ''}`;

/** Quantities by line key. */
export type Cart = Record<string, number>;

export const cartFromLines = (lines: { itemId: string; variantId?: string | null; quantity: number }[]): Cart =>
  lines.reduce<Cart>((cart, line) => {
    const key = lineKey(line.itemId, line.variantId);
    cart[key] = (cart[key] ?? 0) + line.quantity;
    return cart;
  }, {});

export const setQuantity = (cart: Cart, key: string, quantity: number): Cart => {
  const next = { ...cart };
  const whole = Math.min(MAX_QUANTITY, Math.max(0, Math.floor(Number.isFinite(quantity) ? quantity : 0)));
  if (whole === 0) delete next[key];
  else next[key] = whole;
  return next;
};

export const cartLines = (cart: Cart): IPortalLine[] =>
  Object.entries(cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([key, quantity]) => {
      const [itemId, variantId] = key.split('|');
      return { itemId, variantId: variantId || null, quantity };
    });

export const cartCount = (cart: Cart) => Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

export const sameCart = (a: Cart, b: Cart) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return Array.from(keys).every(key => (a[key] ?? 0) === (b[key] ?? 0));
};

/** Estimated total from the catalog prices, before tax; lines without a price are left out. */
export const estimateTotal = (cart: Cart, items: IPortalItem[]) => {
  const prices = new Map<string, number | null | undefined>();
  items.forEach(item => item.variants.forEach(v => prices.set(lineKey(item.itemId, v.id), v.price)));
  return Object.entries(cart).reduce((sum, [key, quantity]) => sum + (prices.get(key) ?? 0) * quantity, 0);
};

/** Items of a category (or the usual items), filtered by the search text on the item and option names. */
export const visibleItems = (catalog: IPortalCatalog | null, category: string, search: string): IPortalItem[] => {
  if (!catalog) return [];
  const text = search.trim().toLowerCase();
  const usual = new Set(catalog.usualLines.map(l => l.itemId));
  return catalog.items.filter(item => {
    if (text) {
      return item.name.toLowerCase().includes(text) || item.variants.some(v => (v.name ?? '').toLowerCase().includes(text));
    }
    return category === USUAL ? usual.has(item.itemId) : item.categoryIds.includes(category);
  });
};

export const CLOSED_TEXT: Record<ClosedReason, string> = {
  NOT_SET_UP: "Online ordering isn't set up yet. Contact your salesman.",
  BLOCKED: 'Your account is on hold. Contact your salesman.',
  CUTOFF_PASSED: 'Ordering is closed for this day. Contact your salesman.',
  LOCKED: 'This day is being prepared. Contact your salesman.',
};

const pad = (n: number) => String(n).padStart(2, '0');

/** "Tue 6 Oct" from yyyy-MM-dd, without time zone shifts. */
export const dayLabel = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(y, m - 1, d);
  return day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

/** When ordering closes, in the viewer's time: "Mon 5 Oct 16:00". */
export const cutoffLabel = (cutoffAt?: string | null) => {
  if (!cutoffAt) return null;
  const at = new Date(cutoffAt);
  if (Number.isNaN(at.getTime())) return null;
  return `${at.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} ${pad(at.getHours())}:${pad(at.getMinutes())}`;
};

export const variantLabel = (item: IPortalItem, variant: IPortalVariant) =>
  item.variants.length > 1 || (variant.name && variant.name.trim() !== item.name.trim()) ? variant.name ?? '' : '';

export const validatePassword = (password: string, confirm: string) => {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  if (password !== confirm) return "The passwords don't match";
  return null;
};

/** The sign-in link for the invitation email: this site under the tenant path. */
export const portalUrl = (origin: string, pathname: string) => {
  const tenant = pathname.split('/').filter(Boolean)[0];
  return tenant ? `${origin}/${tenant}/portal` : `${origin}/portal`;
};
