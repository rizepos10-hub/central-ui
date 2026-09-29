import React from 'react';

import { CallListBadge } from 'app/modules/logistics/sales/call-list-badge';
import { AlertsBadge } from 'app/modules/logistics/audits/alerts-badge';
import { UnfulfilledOrdersBadge } from 'app/modules/logistics/sales/unfulfilled-orders-badge';

/** Live counters shown next to menu items, looked up by `MenuItem.badge`. */
export const MENU_BADGES: Record<string, React.ComponentType> = {
  wholesaleCallList: CallListBadge,
  wholesaleAlerts: AlertsBadge,
  wholesaleUnfulfilledOrders: UnfulfilledOrdersBadge,
};

export const MenuBadge = ({ name }: { name: string }) => {
  const Badge = MENU_BADGES[name];
  return Badge ? <Badge /> : null;
};
