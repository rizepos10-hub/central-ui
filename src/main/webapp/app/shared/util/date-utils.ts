import dayjs from 'dayjs';
// import {addMinutes, format, parseISO} from 'date-fns';
import {format, formatInTimeZone, utcToZonedTime} from 'date-fns-tz'
import { APP_LOCAL_DATETIME_FORMAT } from 'app/config/constants';
import enGB from 'date-fns/locale/en-GB'
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

export function convertUtcToLocalDate(utcDateTimeString: string): string {
  if(!utcDateTimeString) return;

  const utcDate = new Date(utcDateTimeString);

  const localTimeZone = getLocalTimeZone();


  return formatInTimeZone(utcDate, localTimeZone, 'yyyy-MM-dd HH:mm:ss')
}

