import React, {useRef, useState} from "react"
import {Dropdown} from "primereact/dropdown";
import {
  SalesReportsMeasures,
  SalesReportsPeriods,
  SalesReportsTypes
} from "app/shared/model/enumerations/sales-reports.models";
import {Container, Modal, ModalHeader} from "reactstrap";
import {TabMenu} from "primereact/tabmenu";
import {InputText} from "primereact/inputtext";
import {Button} from "primereact/button";
import {OverlayPanel} from "primereact/overlaypanel";
import {SelectButton} from "primereact/selectbutton";
import {RadioButton} from "primereact/radiobutton";
import {
  endOfDay,
  endOfMonth, endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subHours,
  subMonths,
  subWeeks, subYears
} from "date-fns";
import {Calendar} from "primereact/calendar";


type dateRange = {
  from: string;
  to: string;
  dateSlot: {
    period: string;
    slots: number;
  };
}

type formRequest = {
  dateRange: dateRange;
  measure: string;
  type: string;
}

export const SalesReport = () => {

  const reportTypesOptions = Object.entries(SalesReportsTypes).map(([key,val]) => ({label: key, value: val}));
  console.log(reportTypesOptions, 'reportTypesOptions')
  const reportMeasuresOptions = Object.entries(SalesReportsMeasures).map(([key,val]) => ({label: key, value: val}));

  const [selectedType, setSelectedType] = useState("");
  const [selectedMeasure, setSelectedMeasure] = useState("");



  const handleTypeChange = (e) => {
    const type = e.value;
    setSelectedType(type)
  };


  const handleMeasureChange = (e) => {
    const measure = e.value;
    setSelectedMeasure(measure)
  };


  const DateCustomComponent = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [dateRange, setDateRange] = useState<dateRange | null>({
      from: '',
      to: '',
      dateSlot: {
        period: '',
        slots: 0,
      }
    })
    const [selectedPeriodOption, setSelectedPeriodOption] = useState("")
    const periodOptions = Object.entries(SalesReportsPeriods).map(([key,val]) => ({label: key, value: val}));
    const op = useRef(null);

    console.log(dateRange, 'dateRange')

    const items = [
      { label: "Specify Period", icon: "pi pi-fw pi-calendar" },
      { label: "Specify Date", icon: "pi pi-fw pi-calendar" },
    ];

    const handlePeriodChange = (e) => {
      console.log(e, 'hellowlr')
      if(e.value){
        setSelectedPeriodOption("")
        setDateRange((prevDateRange) => ({
          ...prevDateRange,
          dateSlot: {
            ...prevDateRange?.dateSlot,
            period: e.value
          }
        }))
      }

    }
    const selectedPeriod = dateRange?.dateSlot?.period || periodOptions[0].label
    const dates = [new Date(dateRange.from), new Date(dateRange.to)]


    const handleRadioChange = (selectedOption) => {
      setSelectedPeriodOption(selectedOption)

      const currentDate = new Date();
      let fromDate = '';
      let toDate = '';

      switch (selectedOption) {
        case 'period-to-date':
          switch (dateRange?.dateSlot?.period) {
            case 'YEAR':
              fromDate = format(startOfYear(currentDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
              break;
            case 'QUARTER':
              fromDate = format(subMonths(startOfMonth(currentDate), 3), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
              break;
            case 'MONTH':
              fromDate = format(startOfMonth(currentDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
              break;
            case 'WEEK':
              fromDate = format(startOfWeek(currentDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
              break;
            case 'DAY':
              fromDate = format(startOfDay(currentDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
              break;
            case 'HOUR':
              fromDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
              break;
            default:
              break;
          }
          toDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
          break;

        case 'previous-period':
          switch (dateRange?.dateSlot?.period) {
            case 'YEAR':
              fromDate = format(subYears(startOfYear(currentDate), 1), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
              toDate = format(subYears(currentDate, 1), "yyyy-MM-dd'T'23:59:59.999xxx");
              break;
            case 'QUARTER':
              fromDate = format(subMonths(startOfMonth(currentDate), 4), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
              toDate = format(subMonths(endOfMonth(currentDate), 1), "yyyy-MM-dd'T'23:59:59.999xxx");
              break;
            case 'MONTH':
              fromDate = format(subMonths(startOfMonth(currentDate), 1), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
              toDate = format(subMonths(endOfMonth(currentDate), 1), "yyyy-MM-dd'T'23:59:59.999xxx");
              break;
            case 'WEEK':
              fromDate = format(subWeeks(startOfWeek(currentDate), 1), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
              toDate = format(subWeeks(endOfWeek(currentDate), 1), "yyyy-MM-dd'T'23:59:59.999xxx");
              break;
            case 'DAY':
              fromDate = format(subDays(startOfDay(currentDate), 1), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
              toDate = format(subDays(endOfDay(currentDate), 1), "yyyy-MM-dd'T'23:59:59.999xxx");
              break;
            case 'HOUR':
              fromDate = format(subHours(currentDate, 1), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
              toDate = format(subHours(currentDate, 1), "yyyy-MM-dd'T'59:59.999xxx");
              break;
            default:
              break;
          }
          break;

        default:
          break;
      }

      setDateRange((prevDateRange) => ({
        ...prevDateRange,
        from: fromDate,
        to: toDate,
      }));
    };

    return (
      <div className=" flex justify-content-center">
        <InputText value={''}  inputMode={"none"}  onClick={(e) => op.current.toggle(e)} />
        <OverlayPanel ref={op}>
          <div className=" d-flex flex-column gap-3 justify-content-center p-3">
            <TabMenu model={items} activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}/>

            {activeIndex === 0 ?
              <>
                <SelectButton value={selectedPeriod}
                              onChange={handlePeriodChange}
                              type="button"
                              options={periodOptions} />

                <div className="flex flex-column gap-3">

                  <div className="flex align-items-center my-2">
                    <RadioButton
                      inputId={"period-to-date"}
                      name="period-to-date"
                      onChange={() => {
                        handleRadioChange("period-to-date")
                      }}
                      checked={selectedPeriodOption === "period-to-date"}

                    />
                    <label htmlFor={"period-to-date"} className="ml-2">{`${selectedPeriod} to date`}</label>
                      </div>

                      <div className="flex align-items-center my-2">
                        <RadioButton
                          inputId={"previous-period"}
                          name="previous-period"
                          onChange={() => handleRadioChange("previous-period")}
                          checked={selectedPeriodOption === "previous-period"}
                        />
                        <label htmlFor={"previous-period"} className="ml-2">{`Previous ${selectedPeriod}`}</label>
                      </div>
                </div>
              </> : null}

            {activeIndex === 1 ?
              <Container>
                <div className={"d-flex justify-content-center"} >
                  <Calendar value={dates} selectionMode="range" disabled={true}   readOnlyInput />
                </div>


                <div className="d-flex gap-3 relative">
                <div className="d-flex flex-column m-3 relative">
                  <label>From: {(dateRange.from.toString().substring(0 ,25))}</label>
                  <Calendar inline={true} value={dateRange.from} onChange={(e) => setDateRange((prev :any) => ({...prev, from: e.value}))} />
                </div>

                <div className="d-flex flex-column m-3 relative">
                  <label>To: {dateRange.to.toString().substring(0, 25)}</label>
                  <Calendar inline={true} value={dateRange.to} onChange={(e) => setDateRange((prev :any) => ({...prev, to: e.value}))} />
                </div>
              </div>
              </Container> : null}
          </div>
        </OverlayPanel>

      </div>
    );
  };




  return (
    <>
      <div className="d-flex gap-3">
        <div className="d-flex flex-column gap-1">
          <label>Report Type</label>
          <Dropdown options={reportTypesOptions} onChange={handleTypeChange} value={selectedType} />
        </div>
        <div className="d-flex flex-column gap-1">
          <label>Measure Type</label>
          <Dropdown options={reportMeasuresOptions} onChange={handleMeasureChange} value={selectedMeasure} />
        </div>
        <div className="d-flex flex-column gap-1">
          <div className="d-flex flex-column gap-1">
            <label>Date Range</label>
            <DateCustomComponent />
          </div>
        </div>

      </div>
    </>
  )
}
