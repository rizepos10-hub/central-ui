import React, { useEffect, useMemo, useState } from 'react';
import { Translate, translate } from 'react-jhipster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getFlyers } from 'app/entities/flyers/flyer.reducer';
import { DayOfWeek } from 'app/shared/model/ENUMS/day-of-week.model';
import { SourceType } from 'app/shared/model/ENUMS/source-type.model';
import { IScheduledBranchPrice, IScheduledPriceSchedule } from 'app/shared/model/ITEM/retail/variable-item.model';
import { IFlyer } from 'app/shared/model/flyer.model';
import { CalendarClock, Plus, X } from 'lucide-react';

type ScheduledBranchPricesDialogProps = {
  isOpen: boolean;
  branchId: string;
  branchName: string;
  scheduledPrices: IScheduledBranchPrice[];
  onClose: () => void;
  onSave: (scheduledPrices: IScheduledBranchPrice[]) => void;
};

type TimeRangeDraft = {
  from: string;
  to: string;
};

type ScheduleDraft = {
  startAt: string;
  endAt: string;
  price: number | null;
  flyerId: string;
  flyerName: string;
  application: SourceType | 'ALL_APPLICATIONS';
  useDateRange: boolean;
  schedule: Partial<Record<DayOfWeek, TimeRangeDraft[]>>;
};

const allDays = Object.values(DayOfWeek);
const allApplicationsValue = 'ALL_APPLICATIONS' as const;
const applicationOptions = [allApplicationsValue, ...Object.values(SourceType)] as const;

const createDefaultTimeRange = (): TimeRangeDraft => ({
  from: '00:00',
  to: '01:00',
});

const createEmptySchedule = (
  application: ScheduleDraft['application'] = allApplicationsValue
): ScheduleDraft => ({
  startAt: '',
  endAt: '',
  price: null,
  flyerId: '',
  flyerName: '',
  application,
  useDateRange: false,
  schedule: {},
});

const toDateValue = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toISOString().slice(0, 10);
};

const formatTimeForInput = (timeString: string): string => {
  if (!timeString) return '00:00';
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
};

const formatTimeFromInput = (timeString: string): string => {
  if (!timeString) return '00:00:00';
  return `${timeString}:00`;
};

const toTimeValue = (value?: string | { hour?: number | null; minute?: number | null } | null) => {
  if (!value) {
    return '00:00';
  }

  if (typeof value === 'string') {
    return formatTimeForInput(value);
  }

  const paddedHour = String(value.hour ?? 0).padStart(2, '0');
  const paddedMinute = String(value.minute ?? 0).padStart(2, '0');
  return `${paddedHour}:${paddedMinute}`;
};

const toMidnightInstant = (value?: string | null) => {
  if (!value) {
    return null;
  }

  return `${value}T00:00:00Z`;
};

const formatDayLabel = (day: DayOfWeek) => translate(`daysOfWeek.${day}`);

const formatApplicationLabel = (application: ScheduleDraft['application']) =>
  application === allApplicationsValue ? 'All applications' : application;

const toScheduleDraft = (schedule?: IScheduledPriceSchedule | null): ScheduleDraft['schedule'] => {
  if (!schedule) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(schedule).map(([day, ranges]) => [
      day as DayOfWeek,
      (ranges || []).map(range => ({
        from: toTimeValue(range.from),
        to: toTimeValue(range.to),
      })),
    ])
  );
};

const toDraftSchedule = (schedule: IScheduledBranchPrice): ScheduleDraft => ({
  startAt: toDateValue(schedule.startAt),
  endAt: toDateValue(schedule.endAt),
  price: schedule.price,
  flyerId: schedule.flyer?.id || schedule.flyerId || '',
  flyerName: schedule.flyer?.name || '',
  application: schedule.application ?? allApplicationsValue,
  useDateRange: Boolean(schedule.startAt || schedule.endAt),
  schedule: toScheduleDraft(schedule.schedule),
});

const normalizeScheduleForSave = (schedule: ScheduleDraft['schedule']): IScheduledPriceSchedule | null => {
  const normalizedEntries = Object.entries(schedule).reduce((acc, [day, ranges]) => {
    const validRanges = (ranges || [])
      .filter(range => Boolean(range.from) && Boolean(range.to))
      .map(range => ({
        from: range.from,
        to: range.to,
      }));

    if (ranges) {
      acc[day] = validRanges;
    }

    return acc;
  }, {} as IScheduledPriceSchedule);

  return Object.keys(normalizedEntries).length > 0 ? normalizedEntries : null;
};

const ScheduledBranchPricesDialog = ({
  isOpen,
  branchId,
  branchName,
  scheduledPrices,
  onClose,
  onSave,
}: ScheduledBranchPricesDialogProps) => {
  const dispatch = useAppDispatch();
  const flyers: IFlyer[] = useAppSelector(state => state.flyer.entities);
  const [draftSchedules, setDraftSchedules] = useState<ScheduleDraft[]>([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    dispatch(getFlyers({ page: 0, size: 500, sort: 'name,asc' }));

    setDraftSchedules(
      scheduledPrices.length > 0
        ? scheduledPrices.map(toDraftSchedule)
        : [createEmptySchedule(allApplicationsValue)]
    );
  }, [dispatch, isOpen, scheduledPrices]);

  const availableFlyers = useMemo(
    () => flyers.filter(flyer => !branchId || flyer.branch?.id === branchId),
    [branchId, flyers]
  );

  const remainingApplicationOptions = useMemo(() => {
    const used = new Set(draftSchedules.map(schedule => schedule.application));
    return applicationOptions.filter(application => !used.has(application));
  }, [draftSchedules]);

  const canAddSchedule = remainingApplicationOptions.length > 0;

  const canSave = useMemo(
    () =>
      draftSchedules.length > 0 &&
      draftSchedules.every(schedule => {
        const hasAnySelectedDay = Object.keys(schedule.schedule).length > 0;
        const allRangesValid = Object.values(schedule.schedule).every(ranges =>
          (ranges || []).every(range => Boolean(range.from) && Boolean(range.to))
        );

        return (
          schedule.price != null &&
          schedule.price >= 0 &&
          hasAnySelectedDay &&
          allRangesValid &&
          (!schedule.useDateRange || (Boolean(schedule.startAt) && Boolean(schedule.endAt)))
        );
      }),
    [draftSchedules]
  );

  const updateSchedule = (scheduleIndex: number, updates: Partial<ScheduleDraft>) => {
    setDraftSchedules(prev =>
      prev.map((schedule, index) =>
        index === scheduleIndex
          ? {
              ...schedule,
              ...updates,
            }
          : schedule
      )
    );
  };

  const updateDayRanges = (scheduleIndex: number, day: DayOfWeek, ranges: TimeRangeDraft[]) => {
    setDraftSchedules(prev =>
      prev.map((schedule, index) =>
        index === scheduleIndex
          ? {
              ...schedule,
              schedule: {
                ...schedule.schedule,
                [day]: ranges,
              },
            }
          : schedule
      )
    );
  };

  const getApplicationOptionsForSchedule = (scheduleIndex: number) => {
    const currentApplication = draftSchedules[scheduleIndex]?.application;
    const usedByOthers = new Set(
      draftSchedules
        .filter((_, index) => index !== scheduleIndex)
        .map(schedule => schedule.application)
    );

    return applicationOptions.filter(
      application => application === currentApplication || !usedByOthers.has(application)
    );
  };

  const getFlyerOptionsForSchedule = (scheduleIndex: number) => {
    const currentFlyerId = draftSchedules[scheduleIndex]?.flyerId;
    const currentFlyerName = draftSchedules[scheduleIndex]?.flyerName;
    if (currentFlyerId && !availableFlyers.some(flyer => flyer.id === currentFlyerId)) {
      return [...availableFlyers, { id: currentFlyerId, name: currentFlyerName || currentFlyerId }];
    }

    return availableFlyers;
  };

  const isDaySelected = (scheduleIndex: number, day: DayOfWeek) =>
    Object.prototype.hasOwnProperty.call(draftSchedules[scheduleIndex]?.schedule || {}, day);

  const handleToggleDaySelection = (scheduleIndex: number, day: DayOfWeek, checked: boolean) => {
    setDraftSchedules(prev =>
      prev.map((schedule, index) => {
        if (index !== scheduleIndex) {
          return schedule;
        }

        const nextSchedule = { ...schedule.schedule };
        if (checked) {
          nextSchedule[day] = nextSchedule[day] || [];
        } else {
          delete nextSchedule[day];
        }

        return {
          ...schedule,
          schedule: nextSchedule,
        };
      })
    );
  };

  const handleAddSchedule = () => {
    const nextApplication = remainingApplicationOptions[0];
    if (!nextApplication) {
      return;
    }

    setDraftSchedules(prev => [...prev, createEmptySchedule(nextApplication)]);
  };

  const handleRemoveSchedule = (scheduleIndex: number) => {
    setDraftSchedules(prev => prev.filter((_, index) => index !== scheduleIndex));
  };

  const handleAddHourRange = (scheduleIndex: number, day: DayOfWeek) => {
    const currentRanges = draftSchedules[scheduleIndex]?.schedule?.[day] || [];
    updateDayRanges(scheduleIndex, day, [...currentRanges, createDefaultTimeRange()]);
  };

  const handleRemoveHourRange = (scheduleIndex: number, day: DayOfWeek, rangeIndex: number) => {
    const currentRanges = draftSchedules[scheduleIndex]?.schedule?.[day] || [];
    const nextRanges = currentRanges.filter((_, index) => index !== rangeIndex);
    updateDayRanges(scheduleIndex, day, nextRanges);
  };

  const handleChangeHourRange = (
    scheduleIndex: number,
    day: DayOfWeek,
    rangeIndex: number,
    key: keyof TimeRangeDraft,
    value: string
  ) => {
    const currentRanges = draftSchedules[scheduleIndex]?.schedule?.[day] || [];
    const nextRanges = currentRanges.map((range, index) =>
      index === rangeIndex ? { ...range, [key]: value } : range
    );

    updateDayRanges(scheduleIndex, day, nextRanges);
  };

  const handleSave = () => {
    onSave(
      draftSchedules.map(schedule => ({
        startAt: schedule.useDateRange ? toMidnightInstant(schedule.startAt) : null,
        endAt: schedule.useDateRange ? toMidnightInstant(schedule.endAt) : null,
        price: schedule.price,
        application: schedule.application === allApplicationsValue ? null : schedule.application,
        schedule: normalizeScheduleForSave(schedule.schedule),
        flyerId: schedule.flyerId || null,
      }))
    );
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-primary" />
            Scheduled Prices
          </DialogTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Manage application-based price schedules for</span>
            <Badge variant="secondary" className="text-[11px]">
              {branchName}
            </Badge>
          </div>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1 py-1">
          {draftSchedules.map((schedule, scheduleIndex) => (
            <Card key={`${schedule.application}-${scheduleIndex}`} className="rounded-xl border border-border/70 bg-muted/20 p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Schedule {scheduleIndex + 1}</div>
                  <div className="text-[11px] text-muted-foreground">
                    One schedule per application scope. This one is currently set for{' '}
                    <span className="font-medium">{formatApplicationLabel(schedule.application)}</span>.
                  </div>
                </div>
                {draftSchedules.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleRemoveSchedule(scheduleIndex)}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Remove
                  </Button>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Application</Label>
                    <Select
                      value={schedule.application}
                      onValueChange={value =>
                        updateSchedule(scheduleIndex, {
                          application: value as ScheduleDraft['application'],
                        })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select Application" />
                      </SelectTrigger>
                      <SelectContent>
                        {getApplicationOptionsForSchedule(scheduleIndex).map(application => (
                          <SelectItem key={application} value={application} className="text-xs">
                            {formatApplicationLabel(application)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Flyer</Label>
                    <Select
                      value={schedule.flyerId || 'none'}
                      onValueChange={value =>
                        {
                          const selectedFlyer = availableFlyers.find(flyer => flyer.id === value);
                          updateSchedule(scheduleIndex, {
                            flyerId: value === 'none' ? '' : value,
                            flyerName: value === 'none' ? '' : selectedFlyer?.name || '',
                          });
                        }
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="No flyer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">
                          No flyer
                        </SelectItem>
                        {getFlyerOptionsForSchedule(scheduleIndex)
                          .filter(flyer => flyer.id)
                          .map(flyer => (
                          <SelectItem key={flyer.id} value={flyer.id} className="text-xs">
                            {flyer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      <Translate contentKey="items.update.price">Price</Translate>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="h-9 text-xs"
                      value={schedule.price ?? ''}
                      onChange={e =>
                        updateSchedule(scheduleIndex, {
                          price: e.target.value === '' ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border/70 bg-background/70 p-3">
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <Checkbox
                      checked={schedule.useDateRange}
                      onCheckedChange={checked =>
                        updateSchedule(scheduleIndex, {
                          useDateRange: checked === true,
                          ...(checked === true ? {} : { startAt: '', endAt: '' }),
                        })
                      }
                    />
                    <span>Limit to date range</span>
                  </label>

                  {schedule.useDateRange ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Start Date</Label>
                        <Input
                          type="date"
                          className="h-9 text-xs"
                          value={schedule.startAt}
                          onChange={e => updateSchedule(scheduleIndex, { startAt: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">End Date</Label>
                        <Input
                          type="date"
                          className="h-9 text-xs"
                          value={schedule.endAt}
                          onChange={e => updateSchedule(scheduleIndex, { endAt: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground">
                      This schedule will keep applying until a date range is added.
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Weekly Schedule</h3>
                  <Accordion type="single" collapsible className="w-full">
                    {allDays.map((day, dayIndex) => {
                      const daySelected = isDaySelected(scheduleIndex, day);
                      const ranges = draftSchedules[scheduleIndex]?.schedule?.[day] || [];

                      return (
                        <AccordionItem key={`${scheduleIndex}-${day}`} value={`schedule-${scheduleIndex}-day-${dayIndex}`}>
                          <AccordionTrigger className="text-xs font-medium py-2">
                            <div className="flex items-center gap-2">
                              <span>{formatDayLabel(day)}</span>
                              {daySelected && ranges.length === 0 ? (
                                <Badge variant="secondary" className="text-[10px]">
                                  Full day
                                </Badge>
                              ) : null}
                              {ranges.length > 0 ? (
                                <Badge variant="outline" className="text-[10px]">
                                  {ranges.length}
                                </Badge>
                              ) : null}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2">
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 px-1 text-xs font-medium">
                                <Checkbox
                                  checked={daySelected}
                                  onCheckedChange={checked =>
                                    handleToggleDaySelection(scheduleIndex, day, checked === true)
                                  }
                                />
                                <span>Select full day</span>
                              </label>

                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddHourRange(scheduleIndex, day)}
                                  className="h-7 text-xs"
                                  disabled={!daySelected}
                                >
                                  <Plus className="mr-1 h-3 w-3" />
                                  Add Schedule Hours
                                </Button>
                              </div>

                              {daySelected && ranges.length > 0 ? (
                                ranges.map((hourRange, rangeIndex) => (
                                  <Card key={`${scheduleIndex}-${day}-${rangeIndex}`} className="border-l-4 border-l-primary p-2">
                                    <div className="flex items-end justify-between gap-2">
                                      <div className="flex flex-1 gap-2">
                                        <div className="space-y-1">
                                          <Label htmlFor={`fromPicker-${scheduleIndex}-${day}-${rangeIndex}`} className="text-xs font-medium">
                                            <Translate contentKey={'visibility.from'}>From</Translate>
                                          </Label>
                                          <Input
                                            id={`fromPicker-${scheduleIndex}-${day}-${rangeIndex}`}
                                            type="time"
                                            value={formatTimeForInput(hourRange.from)}
                                            onChange={e =>
                                              handleChangeHourRange(
                                                scheduleIndex,
                                                day,
                                                rangeIndex,
                                                'from',
                                                formatTimeFromInput(e.target.value)
                                              )
                                            }
                                            className="h-8 w-32 text-xs"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <Label htmlFor={`toPicker-${scheduleIndex}-${day}-${rangeIndex}`} className="text-xs font-medium">
                                            <Translate contentKey={'visibility.to'}>To</Translate>
                                          </Label>
                                          <Input
                                            id={`toPicker-${scheduleIndex}-${day}-${rangeIndex}`}
                                            type="time"
                                            value={formatTimeForInput(hourRange.to)}
                                            onChange={e =>
                                              handleChangeHourRange(
                                                scheduleIndex,
                                                day,
                                                rangeIndex,
                                                'to',
                                                formatTimeFromInput(e.target.value)
                                              )
                                            }
                                            className="h-8 w-32 text-xs"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-1">
                                        <Label className="text-xs font-medium">Remove</Label>
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => handleRemoveHourRange(scheduleIndex, day, rangeIndex)}
                                          className="h-8 w-8 p-0"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                ))
                              ) : daySelected ? (
                                <div className="px-1 text-[11px] text-muted-foreground">
                                  This day is selected as full day and will be sent as an empty schedule array.
                                </div>
                              ) : (
                                <div className="px-1 text-[11px] text-muted-foreground">
                                  Select this day first, then add hour ranges if needed.
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="h-8 text-xs"
            onClick={handleAddSchedule}
            disabled={!canAddSchedule}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Schedule
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="h-8 text-xs" onClick={onClose}>
              <Translate contentKey="entity.action.cancel">Cancel</Translate>
            </Button>
            <Button type="button" className="h-8 text-xs" onClick={handleSave} disabled={!canSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduledBranchPricesDialog;
