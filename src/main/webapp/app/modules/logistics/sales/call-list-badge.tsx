import React, { useEffect, useState } from 'react';

import { fetchCallListCount } from './sales.api';
import { addDays, todayIso } from './sales.model';
import { CALL_LOGGED_EVENT } from './log-call-dialog';

const REFRESH_MS = 5 * 60 * 1000;

/** Customers still to call for tomorrow's delivery, shown next to the Call List menu item. */
export const CallListBadge = () => {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const refresh = () =>
      fetchCallListCount(addDays(todayIso(), 1))
        .then(count => !cancelled && setPending(count))
        .catch(() => undefined);
    refresh();
    const timer = window.setInterval(refresh, REFRESH_MS);
    window.addEventListener(CALL_LOGGED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(CALL_LOGGED_EVENT, refresh);
    };
  }, []);

  if (pending <= 0) return null;
  return (
    <span
      className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground"
      aria-label={`${pending} to call`}
    >
      {pending}
    </span>
  );
};

export default CallListBadge;
