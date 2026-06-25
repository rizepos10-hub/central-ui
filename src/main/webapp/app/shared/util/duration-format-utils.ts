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
    return '0s';
  }

  const wholeSeconds = Math.floor(totalSeconds);
  const days = Math.floor(wholeSeconds / SECONDS_PER_DAY);
  const hours = Math.floor((wholeSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  const minutes = Math.floor((wholeSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = wholeSeconds % SECONDS_PER_MINUTE;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  const showSeconds = wholeSeconds < SECONDS_PER_MINUTE || seconds > 0;
  if (showSeconds) {
    parts.push(`${seconds}s`);
  }

  return parts.join(' ');
};

export const formatClockDuration = (clockIn: string | Date | undefined | null, clockOut: string | Date | undefined | null): string => {
  const start = parseDate(clockIn);
  const end = parseDate(clockOut);

  if (!start || !end) {
    return '0s';
  }

  return formatWorkingDuration(getElapsedSeconds(start, end));
};

export const formatWorkingDurationTitle = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '0 seconds';
  }

  const wholeSeconds = Math.floor(totalSeconds);
  const label = wholeSeconds === 1 ? 'second' : 'seconds';
  return `${wholeSeconds.toLocaleString()} ${label}`;
};
