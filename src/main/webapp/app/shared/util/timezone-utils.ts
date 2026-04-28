import { useAppSelector } from 'app/config/store';
import { format, toZonedTime, fromZonedTime } from 'date-fns-tz';
import getStore from 'app/config/store';

/**
 * Hook to convert dates to business timezone (for use in React components)
 */
export const useBusinessTimeZone = () => {
  const businessTimeZone = useAppSelector(state => state.businessTimeZone.timeZone);

  const convertToBusinessTime = (date: Date | string, formatString = 'yyyy-MM-dd HH:mm:ss', timeZone?) => {
    const targetTimeZone = timeZone || businessTimeZone;
    if (!targetTimeZone) return format(new Date(date), formatString);
    const zonedDate = toZonedTime(new Date(date), targetTimeZone);
    return format(zonedDate, formatString, { timeZone: targetTimeZone });
  };

  return { businessTimeZone, convertToBusinessTime };
};

/**
 * Direct function to convert dates to business timezone (for use outside React components)
 */
export const convertToBusinessTimeZone = (date: Date | string, formatString = 'yyyy-MM-dd HH:mm:ss', timeZone?: string) => {
  const targetTimeZone = timeZone || getStore().getState().businessTimeZone.timeZone;
  if (!targetTimeZone) return format(new Date(date), formatString);
  const zonedDate = toZonedTime(new Date(date), targetTimeZone);
  return format(zonedDate, formatString, { timeZone: targetTimeZone });
};

/**
 * Convert a Date object to UTC ISO string, treating it as if it's in the business timezone.
 * Returns format: 2025-11-04T10:00:00.000Z
 *
 * @param date - The date object (from date picker)
 * @param timeZone - Optional timezone override, otherwise uses business timezone from Redux
 * @returns UTC ISO string in .000Z format
 */
export const dateToUTCString = (date: Date, timeZone?: string): string => {
  const targetTimeZone = timeZone || getStore().getState().businessTimeZone?.timeZone;

  if (!targetTimeZone) {
    // No business timezone set, fall back to default behavior
    return date.toISOString();
  }

  // Extract date/time components from the Date object (in local time)
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Create a plain date string that represents the date in the target timezone
  // Format: "YYYY-MM-DD HH:mm:ss"
  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Convert from the target timezone to UTC
  const utcDate = fromZonedTime(dateString, targetTimeZone);
  return utcDate.toISOString();
};

// 🔴 DEBUG FLAG: Only enable in development mode
const parseDateValue = (date: Date | string): Date | null => {
  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsedDate = new Date(date);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  // Support values like "2026-03-18 00:00:00" that some browsers won't parse directly.
  const normalizedDate = new Date(date.replace(' ', 'T'));
  return Number.isNaN(normalizedDate.getTime()) ? null : normalizedDate;
};

/**
 * Format a UTC date string for display in the business timezone.
 * Use this to replace .toLocaleString() throughout the app.
 *
 * @param date - UTC date string or Date object (from API response)
 * @param formatString - Optional format string (default: 'yyyy-MM-dd HH:mm:ss')
 * @param timeZone - Optional timezone override, otherwise uses business timezone from Redux
 * @returns Formatted date string in business timezone
 */
export const formatDateForDisplay = (
  date: Date | string | null | undefined,
  formatString = 'yyyy-MM-dd HH:mm:ss',
  timeZone?: string
): string => {
  if (!date) return '';

  const targetTimeZone = timeZone || getStore().getState().businessTimeZone?.timeZone;
  const dateObj = parseDateValue(date);

  if (!dateObj) {
    return typeof date === 'string' ? date : '';
  }

  let formattedDate: string;

  if (!targetTimeZone) {
    // No business timezone set, fall back to formatting in the local timezone
    formattedDate = format(dateObj, formatString);
  } else {
    // Format the UTC date in the business timezone
    formattedDate = format(toZonedTime(dateObj, targetTimeZone), formatString);
  }

  // 🔴 Debug mode: Wrap dates with red circle emojis to easily spot them (dev only)
  return formattedDate;
};
