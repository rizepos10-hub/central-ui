import { useAppSelector } from 'app/config/store';
import { format, toZonedTime } from 'date-fns-tz';
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
