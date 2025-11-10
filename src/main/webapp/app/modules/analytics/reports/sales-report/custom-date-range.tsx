import React, { useEffect, useRef, useState } from 'react';
import { SalesReportsPeriods } from 'app/shared/model/ENUMS/sales-reports.models';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subHours,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import { toLocalISOString } from 'app/shared/util/date-utils';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/src/main/webapp/app/lib/utils';

type dateRange = {
  from: string;
  to: string;
  dateSlot: {
    period: string;
    slots: number;
  };
};

const DateCustomComponent = ({ onApplyDateRange, dateRange, setDateRange }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('period');
  const [primeDateValue, setPrimeDateValue] = useState({
    from: undefined,
    to: undefined,
  });

  const [slotNumber, setSlotNumber] = useState<number | null>(4);

  const [selectedPeriodOption, setSelectedPeriodOption] = useState('period-to-date');
  const periodOptions = Object.entries(SalesReportsPeriods)
    .map(([key, val]) => ({ label: key, value: val }));

  const handleApplyDateRange = () => {
    setOpen(false);
    onApplyDateRange(dateRange);
  };

  const handleSlotChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setSlotNumber(numValue);
      calculateDates('last-n-period', numValue);
    }
  };

  const handlePeriodChange = (value: string) => {
    setDateRange(prevDateRange => ({
      ...prevDateRange,
      dateSlot: {
        ...prevDateRange?.dateSlot,
        period: value,
      },
    }));
    calculateDates(selectedPeriodOption);
  };

  const dates = [new Date(dateRange.from), new Date(dateRange.to)];

  function toTitleCase(str) {
    return str?.toLowerCase().replace(/\b\w/g, function (char) {
      return char.toUpperCase();
    });
  }

  const calculateDates = (selectedOption: string, n = slotNumber) => {
    setSelectedPeriodOption(selectedOption);

    setDateRange(prevDateRange => {
      const currentDate = new Date();

      let fromDate = '';
      let toDate = '';

      switch (selectedOption) {
        case 'period-to-date':
          switch (prevDateRange?.dateSlot?.period) {
            case 'YEAR':
              fromDate = toLocalISOString(startOfYear(currentDate));
              break;
            case 'QUARTER':
              fromDate = toLocalISOString(subMonths(startOfMonth(currentDate), 2));
              break;
            case 'MONTH':
              fromDate = toLocalISOString(startOfMonth(currentDate));
              break;
            case 'WEEK':
              fromDate = toLocalISOString(startOfWeek(currentDate));
              break;
            case 'DAY':
              fromDate = toLocalISOString(startOfDay(currentDate));
              break;
            case 'HOUR':
              fromDate = toLocalISOString(subHours(currentDate, 1));
              break;
            default:
              break;
          }
          toDate = toLocalISOString(currentDate);
          break;

        case 'previous-period':
          switch (prevDateRange?.dateSlot?.period) {
            case 'YEAR':
              fromDate = toLocalISOString(subYears(startOfYear(currentDate), 1));
              toDate = toLocalISOString(subYears(endOfYear(currentDate), 1));
              break;
            case 'QUARTER':
              fromDate = toLocalISOString(subMonths(startOfMonth(currentDate), 3));
              toDate = toLocalISOString(subMonths(endOfMonth(currentDate), 1));
              break;
            case 'MONTH':
              fromDate = toLocalISOString(subMonths(startOfMonth(currentDate), 1));
              toDate = toLocalISOString(subMonths(endOfMonth(currentDate), 1));
              break;
            case 'WEEK':
              fromDate = toLocalISOString(subWeeks(startOfWeek(currentDate), 1));
              toDate = toLocalISOString(subWeeks(endOfWeek(currentDate), 1));
              break;
            case 'DAY':
              fromDate = toLocalISOString(subDays(startOfDay(currentDate), 1));
              toDate = toLocalISOString(subDays(endOfDay(currentDate), 1));
              break;
            case 'HOUR':
              fromDate = toLocalISOString(subHours(currentDate, 2));
              toDate = toLocalISOString(subHours(currentDate, 1));
              break;
            default:
              break;
          }
          break;

        case 'last-n-period':
          console.log(n, 'hellon');

          switch (prevDateRange?.dateSlot?.period) {
            case 'YEAR':
              fromDate = toLocalISOString(subYears(startOfYear(currentDate), n - 1));
              toDate = toLocalISOString(endOfYear(currentDate));
              break;
            case 'QUARTER':
              fromDate = toLocalISOString(subMonths(startOfMonth(currentDate), n * 3 - 1));
              toDate = toLocalISOString(currentDate);
              break;
            case 'MONTH':
              fromDate = toLocalISOString(subMonths(startOfMonth(currentDate), n - 1));
              toDate = toLocalISOString(currentDate);
              break;
            case 'WEEK':
              fromDate = toLocalISOString(subWeeks(startOfWeek(currentDate), n - 1));
              toDate = toLocalISOString(currentDate);
              break;
            case 'DAY':
              fromDate = toLocalISOString(subDays(startOfDay(currentDate), n - 1));
              toDate = toLocalISOString(currentDate);
              break;
            case 'HOUR':
              fromDate = toLocalISOString(subHours(currentDate, n));
              toDate = toLocalISOString(currentDate);
              break;
            default:
              break;
          }
          break;

        default:
          break;
      }

      return {
        ...prevDateRange,
        from: fromDate,
        to: toDate,
        dateSlot: {
          period: prevDateRange?.dateSlot?.period || '',
          slots: selectedOption === 'last-n-period' ? n : 1,
        },
      };
    });
  };

  const dateRangeDisplay = dateRange.from && dateRange.to
    ? `${formatDateForDisplay(dateRange.from, 'yyyy-MM-dd')} - ${formatDateForDisplay(dateRange.to, 'yyyy-MM-dd')}`
    : 'Select date range';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-7 text-xs justify-start text-left font-normal min-w-[208px]",
            !dateRange.from && !dateRange.to && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-3 w-3" />
          {dateRangeDisplay}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="period" className="text-xs h-7">
              <CalendarIcon className="mr-2 h-3 w-3" />
              Specify Period
            </TabsTrigger>
            <TabsTrigger value="date" className="text-xs h-7">
              <CalendarIcon className="mr-2 h-3 w-3" />
              Specify Date
            </TabsTrigger>
          </TabsList>

          <TabsContent value="period" className="p-3 space-y-3">
            <div className="flex flex-wrap gap-1">
              {periodOptions.map(option => (
                <Button
                  key={option.value}
                  type="button"
                  variant={dateRange?.dateSlot?.period === option.value ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => handlePeriodChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <RadioGroup value={selectedPeriodOption} onValueChange={(value) => calculateDates(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="period-to-date" id="period-to-date" />
                <Label htmlFor="period-to-date" className="text-xs font-normal cursor-pointer">
                  {`Current ${toTitleCase(dateRange?.dateSlot?.period)}`}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="previous-period" id="previous-period" />
                <Label htmlFor="previous-period" className="text-xs font-normal cursor-pointer">
                  {`Previous ${toTitleCase(dateRange?.dateSlot?.period)}`}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last-n-period" id="last-n-period" />
                <Label htmlFor="last-n-period" className="text-xs font-normal cursor-pointer flex items-center gap-1">
                  Last{' '}
                  <Input
                    type="number"
                    className="h-6 w-12 text-xs px-1 py-0"
                    value={slotNumber ?? ''}
                    onChange={(e) => handleSlotChange(e.target.value)}
                    onClick={() => calculateDates('last-n-period')}
                  />{' '}
                  {toTitleCase(dateRange?.dateSlot?.period)}(s)
                </Label>
              </div>
            </RadioGroup>
          </TabsContent>

          <TabsContent value="date" className="p-3 space-y-3">
            <div className="flex flex-col gap-3">
              <div>
                <Label className="text-xs mb-1 block">From: {formatDateForDisplay(dateRange.from, 'yyyy-MM-dd')}</Label>
                <Calendar
                  mode="single"
                  selected={primeDateValue.from}
                  onSelect={(date) => {
                    if (date) {
                      const formattedDate = toLocalISOString(date);
                      setDateRange((prev: any) => ({ ...prev, from: formattedDate }));
                      setPrimeDateValue((prev: any) => ({ ...prev, from: date }));
                    }
                  }}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">To: {formatDateForDisplay(dateRange.to, 'yyyy-MM-dd')}</Label>
                <Calendar
                  mode="single"
                  selected={primeDateValue.to}
                  onSelect={(date) => {
                    if (date) {
                      const newDate = new Date(date);
                      newDate.setHours(23, 59, 59);
                      const formattedDate = toLocalISOString(newDate);
                      setDateRange((prev: any) => ({ ...prev, to: formattedDate }));
                      setPrimeDateValue((prev: any) => ({ ...prev, to: newDate }));
                    }
                  }}
                  className="rounded-md border"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between p-3 border-t">
          <div className="text-xs text-muted-foreground">
            {dateRangeDisplay}
          </div>
          <Button onClick={handleApplyDateRange} size="sm" className="h-7 text-xs">
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateCustomComponent;
