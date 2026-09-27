import { AUTHORITIES } from 'app/config/constants';

const {
  ADMIN,
  INVENTORY_ADMIN,
  WAREHOUSE_ADMIN,
  ONLINE_ORDERING_ADMIN,
  WHOLESALE_ADMIN,
  WHOLESALE_SALES_MANAGER,
  WHOLESALE_BOOKKEEPER,
  WHOLESALE_SALESMAN,
  WHOLESALE_FACTORY,
} = AUTHORITIES;

const ordering = [
  ADMIN,
  INVENTORY_ADMIN,
  WAREHOUSE_ADMIN,
  ONLINE_ORDERING_ADMIN,
  WHOLESALE_ADMIN,
  WHOLESALE_SALES_MANAGER,
  WHOLESALE_BOOKKEEPER,
  WHOLESALE_SALESMAN,
];

/**
 * Roles per Wholesale page, shared by the sidebar items and the `/logistics/*` route guards. Setup pages follow the
 * central endpoint checks: a role is listed when it can at least read the page's data.
 */
export const WHOLESALE_PAGE_ROLES = {
  createOrder: ordering,
  wholesaleOrders: ordering,
  savedOrders: ordering,
  routes: ordering,
  map: ordering,
  customers: [ADMIN, WHOLESALE_ADMIN, WHOLESALE_SALES_MANAGER, WHOLESALE_BOOKKEEPER],
  routeDefinitions: [ADMIN, WHOLESALE_ADMIN, WHOLESALE_SALES_MANAGER, WHOLESALE_BOOKKEEPER],
  factories: [ADMIN, WHOLESALE_ADMIN, WHOLESALE_SALES_MANAGER, WHOLESALE_FACTORY],
  closures: [ADMIN, WHOLESALE_ADMIN, WHOLESALE_SALES_MANAGER, WHOLESALE_BOOKKEEPER],
  users: [ADMIN, WHOLESALE_ADMIN, WHOLESALE_SALES_MANAGER, WHOLESALE_BOOKKEEPER],
  settings: [ADMIN, WHOLESALE_ADMIN],
  themePreview: [ADMIN, WHOLESALE_ADMIN],
};

export type WholesalePageKey = keyof typeof WHOLESALE_PAGE_ROLES;

/** Everyone who can open at least one Wholesale page: the Wholesale menu group and the `/logistics/*` guard. */
export const WHOLESALE_ANY_ROLES = Array.from(new Set(Object.values(WHOLESALE_PAGE_ROLES).flat()));
