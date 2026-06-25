import React, { useState } from 'react';
import { format, startOfMonth, subDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Translate } from 'react-jhipster';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/src/main/webapp/app/lib/utils';

export function getDefaultDashboardDateRange() {
  const to = new Date();
  const from = subDays(to, 7);
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  };
}

function parseDateString(value: string): Date | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return undefined;
  }
  return new Date(year, month - 1, day);
}

type DashboardDateFilterProps = {
  fromDate: string;
  toDate: string;
  onDateRangeChange: (from: string, to: string) => void;
  onReset: () => void;
};

const DashboardDateFilter = ({
  fromDate,
  toDate,
  onDateRangeChange,
  onReset,
}: DashboardDateFilterProps) => {
  const [open, setOpen] = useState(false);
  const from = parseDateString(fromDate);
  const to = parseDateString(toDate);

  const applyRange = (rangeFrom: Date, rangeTo: Date) => {
    onDateRangeChange(format(rangeFrom, 'yyyy-MM-dd'), format(rangeTo, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const applyPreset = (presetFrom: Date, presetTo: Date) => {
    applyRange(presetFrom, presetTo);
  };

  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      applyRange(range.from, range.to);
    }
  };

  const handleReset = () => {
    onReset();
    setOpen(false);
  };

  return (
    <div className="shrink-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'h-8 justify-start text-left font-normal',
              !from && !to && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {from && to ? (
              <span className="truncate">
                {format(from, 'PP')} - {format(to, 'PP')}
              </span>
            ) : (
              <Translate contentKey="home.dateFilter.pickDateRange" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex flex-wrap gap-1 border-b p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                const today = new Date();
                applyPreset(subDays(today, 7), today);
              }}
            >
              <Translate contentKey="home.dateFilter.last7Days" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                const today = new Date();
                applyPreset(subDays(today, 30), today);
              }}
            >
              <Translate contentKey="home.dateFilter.last30Days" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                const today = new Date();
                applyPreset(startOfMonth(today), today);
              }}
            >
              <Translate contentKey="home.dateFilter.thisMonth" />
            </Button>
          </div>
          <Calendar
            mode="range"
            selected={{ from, to }}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
            defaultMonth={from}
          />
          <div className="flex justify-end border-t p-2">
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={handleReset}>
              <Translate contentKey="home.dateFilter.reset" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DashboardDateFilter;
