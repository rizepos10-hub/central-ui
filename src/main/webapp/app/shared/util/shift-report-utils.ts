import { ISalesSummary } from 'app/shared/model/report-summary.model';
import { IUserClock } from 'app/shared/model/user-clock.model';
import { formatClockDuration } from 'app/shared/util/duration-format-utils';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';

export const hasSalesActivity = (summary?: ISalesSummary | null): boolean =>
  !!summary && (summary.orders > 0 || summary.grossSales > 0 || summary.netSales > 0);

export const formatShiftOptionLabel = (clock: Pick<IUserClock, 'instantClockedIn' | 'instantClockedOut'>): string => {
  const clockIn = formatDateForDisplay(clock.instantClockedIn);
  const clockOut = formatDateForDisplay(clock.instantClockedOut);
  const duration = formatClockDuration(clock.instantClockedIn, clock.instantClockedOut);

  return `${clockIn} → ${clockOut} (${duration})`;
};
