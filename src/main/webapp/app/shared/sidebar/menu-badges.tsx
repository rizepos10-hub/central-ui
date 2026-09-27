import React from 'react';

import { CallListBadge } from 'app/modules/logistics/sales/call-list-badge';

/** Live counters shown next to menu items, looked up by `MenuItem.badge`. */
export const MENU_BADGES: Record<string, React.ComponentType> = {
  wholesaleCallList: CallListBadge,
};

export const MenuBadge = ({ name }: { name: string }) => {
  const Badge = MENU_BADGES[name];
  return Badge ? <Badge /> : null;
};
