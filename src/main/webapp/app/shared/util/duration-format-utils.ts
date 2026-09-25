import { differenceInSeconds } from 'date-fns';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;

const parseDate = (value: string | Date | undefined | null): Date | null => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getElapsedSeconds = (start: Date, end: Date): number => {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  return Math.max(0, differenceInSeconds(end, start));
};

export const formatWorkingDuration = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '0m';
  }

  const wholeMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const days = Math.floor(wholeMinutes / (SECONDS_PER_DAY / SECONDS_PER_MINUTE));
  const hours = Math.floor((wholeMinutes % (SECONDS_PER_DAY / SECONDS_PER_MINUTE)) / 60);
  const minutes = wholeMinutes % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes}m`);
  }

  return parts.join(' ');
};

export const formatClockDuration = (clockIn: string | Date | undefined | null, clockOut: string | Date | undefined | null): string => {
  const start = parseDate(clockIn);
  const end = parseDate(clockOut);

    if (!start || !end) {
    return '0m';
  }

  return formatWorkingDuration(getElapsedSeconds(start, end));
};

export const formatWorkingDurationTitle = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '0 minutes';
  }

  const wholeMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  if (wholeMinutes <= 0) {
    return '0 minutes';
  }

  const days = Math.floor(wholeMinutes / (SECONDS_PER_DAY / SECONDS_PER_MINUTE));
  const hours = Math.floor((wholeMinutes % (SECONDS_PER_DAY / SECONDS_PER_MINUTE)) / 60);
  const minutes = wholeMinutes % 60;
  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days.toLocaleString()} ${days === 1 ? 'day' : 'days'}`);
  }
  if (hours > 0) {
    parts.push(`${hours.toLocaleString()} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes.toLocaleString()} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }

  return parts.join(' ');
};
