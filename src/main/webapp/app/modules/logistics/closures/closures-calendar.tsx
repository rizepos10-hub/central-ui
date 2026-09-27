import React from 'react';

import { cn } from '@/src/main/webapp/app/lib/utils';

import { DEFAULT_ROUTE_COLOR } from '../route-definitions/route-definition.model';
import { IWholesaleClosure, RouteDayMark, formatDay, overlaps, parseIsoDate } from './closure.model';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface ClosuresCalendarProps {
  /** 42 yyyy-MM-dd dates, Monday first. */
  days: string[];
  month: number;
  today: string;
  closures: IWholesaleClosure[];
  routeMarks: Record<string, RouteDayMark[]>;
  closureLabel: (closure: IWholesaleClosure) => string;
  onDayClick?: (day: string) => void;
  onClosureClick: (closure: IWholesaleClosure) => void;
}

const markText = (mark: RouteDayMark) => {
  switch (mark.status) {
    case 'SKIPPED':
      return `${mark.name} skipped`;
    case 'MOVED':
      return `${mark.name} moved to ${formatDay(mark.otherDate)}`;
    case 'MOVED_IN':
      return `${mark.name} (from ${formatDay(mark.otherDate)})`;
    default:
      return mark.name;
  }
};

export const ClosuresCalendar = ({ days, month, today, closures, routeMarks, closureLabel, onDayClick, onClosureClick }: ClosuresCalendarProps) => (
  <div className="ws-card overflow-hidden">
    <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
      {WEEKDAYS.map(d => (
        <div key={d} className="py-1.5">
          {d}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-7">
      {days.map(day => {
        const inMonth = parseIsoDate(day).getMonth() === month;
        const dayClosures = closures.filter(c => overlaps(c, day));
        const marks = routeMarks[day] ?? [];
        return (
          <div
            key={day}
            data-day={day}
            role={onDayClick ? 'button' : undefined}
            tabIndex={onDayClick ? 0 : undefined}
            aria-label={onDayClick ? `Add a closure on ${formatDay(day)}` : undefined}
            onClick={() => onDayClick?.(day)}
            onKeyDown={e => e.key === 'Enter' && onDayClick?.(day)}
            className={cn(
              'min-h-[104px] border-b border-r p-1 text-[11px] [&:nth-child(7n)]:border-r-0',
              !inMonth && 'bg-muted/30 text-muted-foreground',
              dayClosures.length > 0 && 'bg-[hsl(var(--ws-cancelled)/0.06)]',
              onDayClick && 'cursor-pointer hover:bg-accent/40',
            )}
          >
            <div className={cn('mb-0.5 text-right text-xs', day === today && 'font-bold text-primary')}>{parseIsoDate(day).getDate()}</div>
            <div className="grid gap-0.5">
              {dayClosures.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onClosureClick(c);
                  }}
                  className={cn(
                    'truncate rounded px-1 text-left font-medium',
                    c.action === 'MOVE'
                      ? 'bg-[hsl(var(--ws-amendment)/0.15)] text-[hsl(var(--ws-amendment))]'
                      : 'bg-[hsl(var(--ws-cancelled)/0.15)] text-[hsl(var(--ws-cancelled))]',
                  )}
                  title={closureLabel(c)}
                >
                  {closureLabel(c)}
                </button>
              ))}
              {marks.map(mark => (
                <span
                  key={`${mark.routeId}-${mark.status}`}
                  data-testid="route-mark"
                  className={cn(
                    'flex items-center gap-1 truncate',
                    mark.status === 'SKIPPED' && 'text-[hsl(var(--ws-cancelled))] line-through',
                    mark.status === 'MOVED' && 'text-[hsl(var(--ws-amendment))] line-through',
                    mark.status === 'MOVED_IN' && 'font-medium text-[hsl(var(--ws-amendment))]',
                  )}
                  title={markText(mark)}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: mark.color || DEFAULT_ROUTE_COLOR }} />
                  {markText(mark)}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default ClosuresCalendar;
