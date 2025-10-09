import React, {useEffect, useState} from 'react';
import {IVisibility} from "app/shared/model/visibility.model";
import {SourceType} from "app/shared/model/ENUMS/source-type.model";
import {DayOfWeek} from "app/shared/model/ENUMS/day-of-week.model";
import {Translate, translate} from "react-jhipster";

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

type Nullable<T> = T | null;


interface Props {
  initialState: IVisibility[];
  onStateChanged: (state: IVisibility[]) => void;
  title?: string;
}
// Convert time string (HH:mm:ss) to HH:mm format for input
function formatTimeForInput(timeString: string): string {
  if (!timeString) return '00:00';
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
}

// Convert input time (HH:mm) to time string (HH:mm:ss)
function formatTimeFromInput(timeString: string): string {
  if (!timeString) return '00:00:00';
  return `${timeString}:00`;
}
const Visibility = ({ initialState, onStateChanged, title = "Visibility" }:Props) => {

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
        return [...visibility, {application: selectedApplication, visible: true, schedule: {}}];
      })
    }
  }

  useEffect(()=>{
    onStateChanged(visibility);
  },[visibility, initialState])


  const accordionTabContent = (day: DayOfWeek) => {
    return (
      <div className="space-y-2">
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleAddHourRange(day)}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            <Translate contentKey={'visibility.add'}>Add Visibility Hours</Translate>
          </Button>
        </div>
        {getHourRangesForDay(day) && getHourRangesForDay(day).map((hourRange, rangeIndex) => (
          <Card key={rangeIndex} className="p-2 border-l-4 border-l-primary">
            <div className="flex items-end justify-between gap-2">
              <div className="flex gap-2 flex-1">
                <div className="space-y-1">
                  <Label htmlFor={`fromPicker-${day}-${rangeIndex}`} className="text-xs font-medium">
                    <Translate contentKey={'visibility.from'}>From</Translate>
                  </Label>
                  <Input
                    id={`fromPicker-${day}-${rangeIndex}`}
                    type="time"
                    value={formatTimeForInput(hourRange.from)}
                    onChange={(e) =>
                      handleChangeHourRange(day, rangeIndex, 'from', formatTimeFromInput(e.target.value))
                    }
                    className="h-8 text-xs w-32"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`toPicker-${day}-${rangeIndex}`} className="text-xs font-medium">
                    <Translate contentKey={'visibility.to'}>To</Translate>
                  </Label>
                  <Input
                    id={`toPicker-${day}-${rangeIndex}`}
                    type="time"
                    value={formatTimeForInput(hourRange.to)}
                    onChange={(e) =>
                      handleChangeHourRange(day, rangeIndex, 'to', formatTimeFromInput(e.target.value))
                    }
                    className="h-8 text-xs w-32"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  <Translate contentKey={'visibility.remove'}>Remove</Translate>
                </Label>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveHourRange(day, rangeIndex)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="flex justify-between items-center flex-wrap gap-2">
        <Select value={selectedApplication} onValueChange={(value) => setSelectedApplication(value as SourceType)}>
          <SelectTrigger className="w-full md:w-64 h-8 text-xs">
            <SelectValue placeholder="Select Application" />
          </SelectTrigger>
          <SelectContent>
            {applications.map((app) => (
              <SelectItem key={app} value={app} className="text-xs">
                {app}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedApplication && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isVisible"
              checked={getIsVisible()}
              onCheckedChange={(checked) => handleChangeIsVisible(!!checked)}
            />
            <Label htmlFor="isVisible" className="text-xs font-medium cursor-pointer">
              <Translate contentKey={'visibility.visible'}>Visible</Translate>
            </Label>
          </div>
        )}
      </div>

      {selectedApplication && (
        <Accordion type="single" collapsible className="w-full">
          {allDays.map((day, dayIndex) => (
            <AccordionItem key={dayIndex} value={`day-${dayIndex}`}>
              <AccordionTrigger className="text-xs font-medium py-2">
                {translate(`daysOfWeek.${day}`)}
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                {accordionTabContent(day)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
export default Visibility;
