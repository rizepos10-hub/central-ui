import React, {useEffect, useState} from 'react';
import {IVisibility} from "app/shared/model/visibility.model";
import {Dropdown} from "primereact/dropdown";
import {Checkbox} from "primereact/checkbox";
import {Accordion, AccordionTab} from "primereact/accordion";
import {SourceType} from "app/shared/model/enumerations/source-type.model";
import {DayOfWeek} from "app/shared/model/enumerations/day-of-week.model";
import {Button as PrimeButton} from "primereact/button";
import {InputText} from "primereact/inputtext";

interface Props {
  initialState: IVisibility[];
  onStateChanged: (state: IVisibility[]) => void;
}
const Visibility = ({ initialState, onStateChanged }:Props) => {

  const applications = Object.values(SourceType);
  const allDays = Object.values(DayOfWeek);

  const [selectedApplication, setSelectedApplication] = useState<SourceType>(SourceType.BRANCH_POS);
  const [visibility, setVisibilty] = useState<IVisibility[]>(initialState);

  const getHourRangesForDay = (day: DayOfWeek) => {
    const appObject = visibility.find(application => application.application === selectedApplication);

    return appObject?.schedule?.[day] || undefined;
  };

  const handleAddHourRange = (day: DayOfWeek) => {
    setVisibilty(prev => {
      const appObjectRef = prev.find(obj => obj.application === selectedApplication);

      if (appObjectRef) {
        const updatedSchedule = { ...appObjectRef.schedule, [day]: [...(appObjectRef.schedule?.[day] || []), { from: '', to: '' }] };
        return prev.map(obj => (obj.application === selectedApplication ? { ...obj, schedule: updatedSchedule } : obj));
      } else {
        const newObj = { application: selectedApplication, visible: true, schedule: { [day]: [{ from: '', to: '' }] } };
        return [...prev, newObj];
      }
    });
  };

  const handleRemoveHourRange = (day, hourRangeIndex) => {
    setVisibilty(prev => {
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
    setVisibilty(prev =>  {
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
    setVisibilty(prev => {
      return prev.map(appObj => appObj.application === selectedApplication? {
        ...appObj, visible: value
      }: appObj)
    })
  }
  const getIsVisible = ()=>{
    return visibility.find(obj => obj.application === selectedApplication)?.visible;
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
              <InputText
                type="text"
                placeholder="HH:mm:ss"
                pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"

                value={hourRange.from}
                onChange={(e) => handleChangeHourRange(day, rangeIndex, 'from', e.target.value)}/>

              <label className="ml-2 mr-2">To:</label>
              <InputText
                type="text"
                placeholder="HH:mm:ss"
                pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                value={hourRange.to}
                onChange={(e) => handleChangeHourRange(day, rangeIndex, 'to',  e.target.value)}/>

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
