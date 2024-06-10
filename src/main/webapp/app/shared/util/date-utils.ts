import dayjs from 'dayjs';

import { APP_LOCAL_DATETIME_FORMAT, APP_LOCAL_TIME_FORMAT } from "app/config/constants";
import {format} from "date-fns";

export const convertDateTimeFromServerTimeOnly = (date: string | number | Date | dayjs.Dayjs) => date ? dayjs(date).format(APP_LOCAL_TIME_FORMAT) : null;

export const convertDateTimeFromServer = (date: string | number | Date | dayjs.Dayjs) => date ? dayjs(date).format(APP_LOCAL_DATETIME_FORMAT) : null;

export const convertDateTimeToServer = (date: string | number | Date | dayjs.Dayjs) => (date ? dayjs(date).toDate() : null);

export const displayDefaultDateTime = () => dayjs().startOf('day').format(APP_LOCAL_DATETIME_FORMAT);

export function getLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function toLocalISOString(date: Date): string {
  const timezone = getLocalTimeZone();
  return format(date, "yyyy-MM-dd'T'HH:mm:ssxxx", { timeZone: timezone } as any);
}

export function convertUtcToLocalDate(utcTimestamp: string): string {
  if(!utcTimestamp) return;
  const localDate = new Date(utcTimestamp);
  return  format(localDate, 'yyyy-MM-dd HH:mm:ss')
}

