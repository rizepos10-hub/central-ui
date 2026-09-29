import React, { useEffect, useState } from 'react';

import { fetchUnfulfilledCount } from './order-search.api';
import { ORDERS_CHANGED_EVENT } from './order-search.model';

const REFRESH_MS = 5 * 60 * 1000;

/** Orders not delivered yet, shown next to the Orders menu item. */
export const UnfulfilledOrdersBadge = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const refresh = () =>
      fetchUnfulfilledCount()
        .then(found => !cancelled && setCount(found))
        .catch(() => undefined);
    refresh();
    const timer = window.setInterval(refresh, REFRESH_MS);
    window.addEventListener(ORDERS_CHANGED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(ORDERS_CHANGED_EVENT, refresh);
    };
  }, []);

  if (count <= 0) return null;
  return (
    <span
      className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground"
      aria-label={`${count} unfulfilled`}
    >
      {count}
    </span>
  );
};

export default UnfulfilledOrdersBadge;
