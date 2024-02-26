import dayjs from 'dayjs';
import { format } from 'date-fns';

import { APP_LOCAL_DATETIME_FORMAT } from 'app/config/constants';

export const convertDateTimeFromServer = date => (date ? dayjs(date).format(APP_LOCAL_DATETIME_FORMAT) : null);

export const convertDateTimeToServer = date => (date ? dayjs(date).toDate() : null);

export const displayDefaultDateTime = () => dayjs().startOf('day').format(APP_LOCAL_DATETIME_FORMAT);

export function getLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function toLocalISOString(date: Date): string {
  const timezone = getLocalTimeZone();
  return format(date, "yyyy-MM-dd'T'HH:mm:ssxxx", { timeZone: timezone } as any);
}
