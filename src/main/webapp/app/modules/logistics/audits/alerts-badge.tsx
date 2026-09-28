import React, { useCallback, useEffect, useState } from 'react';

import { fetchOpenAlertCount } from './audits.api';
import { useAlertUpdates } from './audits-socket';

/** Open alerts, shown next to the Alerts menu item and updated as alerts are raised or acknowledged. */
export const AlertsBadge = () => {
  const [open, setOpen] = useState(0);

  const refresh = useCallback(() => {
    fetchOpenAlertCount()
      .then(setOpen)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useAlertUpdates(refresh, 5 * 60 * 1000);

  if (open <= 0) return null;
  return (
    <span
      className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-destructive-foreground"
      aria-label={`${open} open alerts`}
    >
      {open}
    </span>
  );
};

export default AlertsBadge;
