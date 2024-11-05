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
import { InputText } from 'primereact/inputtext';
import { OverlayPanel } from 'primereact/overlaypanel';
import { TabMenu } from 'primereact/tabmenu';
import { SelectButton } from 'primereact/selectbutton';
import { RadioButton } from 'primereact/radiobutton';
import { Container } from 'reactstrap';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { toLocalISOString } from 'app/shared/util/date-utils';

type dateRange = {
  from: string;
  to: string;
  dateSlot: {
    period: string;
    slots: number;
  };
};

const DateCustomComponent = ({ onApplyDateRange, dateRange, setDateRange }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [primeDateValue, setPrimeDateValue] = useState({
    from: '',
    to: '',
  });

  const [slotNumber, setSlotNumber] = useState<number | null>(4);

  const [selectedPeriodOption, setSelectedPeriodOption] = useState('period-to-date');
  const periodOptions = Object.entries(SalesReportsPeriods)
    .map(([key, val]) => ({ label: key, value: val }));

  const op = useRef(null);

  const handleApplyDateRange = e => {
    op.current.toggle(e);
    onApplyDateRange(dateRange);
  };

  console.log(dateRange, 'dateRange');

  const items = [
    { label: 'Specify Period', icon: 'pi pi-fw pi-calendar' },
    { label: 'Specify Date', icon: 'pi pi-fw pi-calendar' },
  ];

  const handleSlotChange = e => {
    if(e.value) {
      setSlotNumber(e.value);
      calculateDates('last-n-period', e.value);
    }
  };

  const handlePeriodChange = e => {
    console.log(e, 'hellowlr');
    if (e.value) {
      setDateRange(prevDateRange => ({
        ...prevDateRange,
        dateSlot: {
          ...prevDateRange?.dateSlot,
          period: e.value,
        },
      }));
    }
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

  return (
    <div className=" flex justify-content-center">
      <InputText
        style={{ minWidth: '13rem' }}
        value={
          dateRange.from && dateRange.to && `${dateRange.from.toString().substring(0, 10)}  -  ${dateRange.to.toString().substring(0, 10)}`
        }
        inputMode={'none'}
        id={'self'}
        onClick={e => {
          op.current.toggle(e);
        }}
      />
      <OverlayPanel ref={op} showCloseIcon={true} onHide={() => setActiveIndex(0)}>
        <div className=" d-flex flex-column gap-3 justify-content-center p-3">
          <TabMenu model={items} activeIndex={activeIndex} onTabChange={e => setActiveIndex(e.index)} />

          {activeIndex === 0 ? (
            <>
              <SelectButton value={dateRange?.dateSlot?.period} onChange={handlePeriodChange} type="button" options={periodOptions} />

              <div className="flex flex-column gap-3">
                <div className="flex align-items-center my-2">
                  <RadioButton
                    inputId={'period-to-date'}
                    name="period-to-date"
                    onChange={() => {
                      calculateDates('period-to-date');
                    }}
                    checked={selectedPeriodOption === 'period-to-date'}
                  />
                  <label htmlFor={'period-to-date'} className="ml-2">{`Current ${toTitleCase(dateRange?.dateSlot?.period)} `}</label>
                </div>

                <div className="flex align-items-center my-2">
                  <RadioButton
                    inputId={'previous-period'}
                    name="previous-period"
                    onChange={() => calculateDates('previous-period')}
                    checked={selectedPeriodOption === 'previous-period'}
                  />
                  <label htmlFor={'previous-period'} className="ml-2">{`Previous ${toTitleCase(dateRange?.dateSlot?.period)}`}</label>
                </div>

                <div className="flex align-items-center my-2">
                  <RadioButton
                    inputId={'last-n-period'}
                    name="last-n-period"
                    onChange={() => calculateDates('last-n-period')}
                    checked={selectedPeriodOption === 'last-n-period'}
                  />
                  <label htmlFor={'last-n-period'} className="ml-2">
                    Last <InputNumber inputMode={'numeric'} size={1} value={slotNumber} onChange={handleSlotChange} />{' '}
                    {toTitleCase(dateRange?.dateSlot?.period)}(s)
                  </label>
                </div>
              </div>
            </>
          ) : null}

          {activeIndex === 1 ? (
            <>
              <div className={'d-flex justify-content-center'}>
                <Calendar value={dates} selectionMode="range" disabled={true} readOnlyInput />
              </div>

              <div className="d-flex gap-3 relative">
                <div className="d-flex flex-column m-3 relative">
                  <label>From: {dateRange.from.toString().substring(0, 10)}</label>
                  <Calendar
                    inline={true}
                    value={new Date(primeDateValue.from)}
                    onSelect={(e: any) => {
                      console.log(e.value, 'e.valuee.value');
                      const formattedDate = toLocalISOString(e.value);
                      setDateRange((prev: any) => ({ ...prev, from: formattedDate }));
                      setPrimeDateValue((prev: any) => ({ ...prev, from: e.value }));
                    }}
                  />
                </div>
                <div className="d-flex flex-column m-3 relative">
                  <label>To: {dateRange.to.toString().substring(0, 10)}</label>
                  <Calendar
                    inline={true}
                    value={new Date(primeDateValue.to)}
                    onChange={(e: any) => {
                      const formattedDate = toLocalISOString(e.value);
                      setDateRange((prev: any) => ({ ...prev, to: formattedDate }));
                      setPrimeDateValue((prev: any) => ({ ...prev, to: e.value }));
                    }}
                  />
                </div>
              </div>
            </>
          ) : null}
          <div className="flex">
            <Calendar value={dates} selectionMode={'range'} disabled={true} readOnlyInput />
            <Button onClick={handleApplyDateRange} className={'ml-auto'}>
              Apply
            </Button>
          </div>
        </div>
      </OverlayPanel>
    </div>
  );
};

export default DateCustomComponent;
