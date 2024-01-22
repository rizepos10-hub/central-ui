import React, {useEffect, useState} from 'react';
import {IVisibility} from "app/shared/model/visibility.model";
import {Dropdown} from "primereact/dropdown";
import {Checkbox} from "primereact/checkbox";
import {Accordion, AccordionTab} from "primereact/accordion";
import {SourceType} from "app/shared/model/enumerations/source-type.model";
import {DayOfWeek} from "app/shared/model/enumerations/day-of-week.model";
import {Button as PrimeButton} from "primereact/button";
import {InputText} from "primereact/inputtext";
import {Nullable} from "primereact/ts-helpers";
import {Calendar} from "primereact/calendar";

interface Props {
  initialState: IVisibility[];
  onStateChanged: (state: IVisibility[]) => void;
}
function convertStringToNullableDate (date: string) : Nullable<Date> {
  const [hours, minutes, seconds] = date ? date.split(':').map(Number) : [undefined, undefined, undefined];
  return (hours !== undefined && minutes !== undefined && seconds !== undefined)
    ? new Date(0, 0, 0, hours, minutes, seconds)
    : null;
}

function convertNullableDateToString (date: Nullable<Date> | Date[] | string) : string {
  if (date !== null && date instanceof Date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  } else {
    return '';
  }
}
const Visibility = ({ initialState, onStateChanged }:Props) => {

  const applications = Object.values(SourceType);
  const allDays = Object.values(DayOfWeek);

  const [selectedApplication, setSelectedApplication] = useState<SourceType>(SourceType.BRANCH_POS);
  const [visibility, setVisibility] = useState<IVisibility[]>(initialState || []);

  const getHourRangesForDay = (day: DayOfWeek) => {
    const appObject = visibility.find(application => application.application === selectedApplication);

    return appObject?.schedule?.[day] || undefined;
  };

  const handleAddHourRange = (day: DayOfWeek) => {
    setVisibility(prev => {
      const appObjectRef = prev.find(obj => obj.application === selectedApplication);

      if (appObjectRef) {
        const updatedSchedule = { ...appObjectRef.schedule, [day]: [...(appObjectRef.schedule?.[day] || []), { from: '00:00:00', to: '01:00:00' }] };
        return prev.map(obj => (obj.application === selectedApplication ? { ...obj, schedule: updatedSchedule } : obj));
      } else {
        const newObj = { application: selectedApplication, visible: true, schedule: { [day]: [{ from: '00:00:00', to: '01:00:00' }] } };
        return [...prev, newObj];
      }
    });
  };

  const handleRemoveHourRange = (day, hourRangeIndex) => {
    setVisibility(prev => {
      return prev.map (obj => (obj.application === selectedApplication?
        {
          ...obj, schedule: {
            ...obj.schedule,
            [day]: [...obj.schedule[day].slice(0, hourRangeIndex), ...obj.schedule[day].slice(hourRangeIndex + 1)]
          }
        } : obj))
    })
  }

  const handleChangeHourRange = (day: DayOfWeek, hourRangeIndex: number, key: string, value: string) => {
    setVisibility(prev =>  {
      return prev.map(appObj => appObj.application === selectedApplication?
        {...appObj, schedule:
            {
              ...appObj.schedule,
              [day]: appObj.schedule[day].map((range, index) => index === hourRangeIndex? {...range, [key]: value}: range)
            }
        }
        : appObj)
    })
  }

  const handleChangeIsVisible = (value: boolean) => {
    setVisibility(prev => {
      return prev.map(appObj => appObj.application === selectedApplication? {
        ...appObj, visible: value
      }: appObj)
    })
  }
  const getIsVisible = () => {
    const existingVisibility = visibility.find(obj => obj.application === selectedApplication);
    if (existingVisibility) {
      return existingVisibility.visible;
    }
    else
    {
      setVisibility(prev => {
        return [...visibility, {application: selectedApplication, visible: true, schedule: null}];
      })
    }
  }

  useEffect(()=>{
    onStateChanged(visibility);
  },[visibility, initialState])


  const accordionTabContent = (day: DayOfWeek) => {
    return (
      <>
        <div className="d-flex justify-content-end mt-3">
          <PrimeButton type="button" className="my-3" onClick={() => handleAddHourRange(day)}>
            Add Visibility Hours
          </PrimeButton>
        </div>
        { getHourRangesForDay(day) && getHourRangesForDay(day).map((hourRange, rangeIndex) => {
          return (
            <div key={rangeIndex} className="d-flex flex-row align-items-center mb-3">
              <label className="mr-2">From:</label>
              <Calendar
                value={convertStringToNullableDate(hourRange.from)}
                onChange={(e) =>
                  handleChangeHourRange(day, rangeIndex, 'from', convertNullableDateToString(e.value))}
                timeOnly
                className={hourRange.from ? '' : 'p-invalid'}
              />

              <label className="ml-2 mr-2">To:</label>
              <Calendar
                value={convertStringToNullableDate(hourRange.to)}
                onChange={(e) =>
                  handleChangeHourRange(day, rangeIndex, 'to', convertNullableDateToString(e.value))}
                timeOnly
                className={hourRange.to ? '' : 'p-invalid'}
              />

              <button
                type="button"
                className="btn btn-danger btn-sm ml-2"
                onClick={() => handleRemoveHourRange(day, rangeIndex)}
              >
                X
              </button>
            </div>);
        })}
      </>);
  }
  return (
    <>
      <h2>Item Visibility</h2>
      <div className="d-flex justify-content-between">
        <Dropdown value={selectedApplication} onChange={(e) => setSelectedApplication(e.value)} options={applications}
                  placeholder="Select an Application" className="w-full md:w-14rem mb-4" />
        {selectedApplication && (
          <div className='d-flex'>
            <label htmlFor="isVisible" className="mr-2">Visible</label>
            <Checkbox inputId="isVisible" onChange={e => handleChangeIsVisible(e.checked)}
                      checked={getIsVisible()}/>
          </div>
        )}
      </div>

      {selectedApplication &&
        <Accordion>
          {allDays.map((day, dayIndex)=>{
            return (
              <AccordionTab key={dayIndex} header={day}>
                {accordionTabContent(day)}
              </AccordionTab>
            )
          })}
        </Accordion>}
    </>
  )
}
export default Visibility;
