import dayjs from 'dayjs';

import { APP_LOCAL_DATETIME_FORMAT, APP_LOCAL_TIME_FORMAT } from "app/config/constants";
import {format} from "date-fns";
import { formatInTimeZone } from 'date-fns-tz';
import getStore from 'app/config/store';

export const convertDateTimeFromServerTimeOnly = (date: string | number | Date | dayjs.Dayjs) => date ? dayjs(date).format(APP_LOCAL_TIME_FORMAT) : null;

export const convertDateTimeFromServer = (date: string | number | Date | dayjs.Dayjs) => date ? dayjs(date).format(APP_LOCAL_DATETIME_FORMAT) : null;

export const convertDateTimeToServer = (date: string | number | Date | dayjs.Dayjs) => (date ? dayjs(date).toDate() : null);

export const displayDefaultDateTime = () => dayjs().startOf('day').format(APP_LOCAL_DATETIME_FORMAT);

export function getLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function toLocalISOString(date: Date, timeZone?: string): string {
  console.log('=== toLocalISOString called ===');
  console.log('Input date:', date);
  console.log('Passed timeZone:', timeZone);

  const businessTZ = getStore().getState().businessTimeZone?.timeZone;
  console.log('Business timezone from Redux:', businessTZ);

  const targetTimeZone = timeZone || businessTZ;
  console.log('Target timezone to use:', targetTimeZone);

  if (targetTimeZone) {
    // Format the date as ISO string in the target timezone
    // This treats the date picker's selection as being in the business timezone
    const formatted = formatInTimeZone(date, targetTimeZone, "yyyy-MM-dd'T'HH:mm:ssxxx");
    console.log('Formatted result:', formatted);
    return formatted;
  }

  // Fallback to local timezone behavior
  const localTz = getLocalTimeZone();
  console.log('Fallback to local timezone:', localTz);
  const result = format(date, "yyyy-MM-dd'T'HH:mm:ssxxx", { timeZone: localTz } as any);
  console.log('Local result:', result);
  return result;
}

export function convertUtcToLocalDate(utcTimestamp: string): string {
  if(!utcTimestamp) return;
  const localDate = new Date(utcTimestamp);
  return  format(localDate, 'yyyy-MM-dd HH:mm:ss')
}

