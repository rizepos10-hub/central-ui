import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2, X } from 'lucide-react';
import dayjs from 'dayjs';
import { Translate, translate } from 'react-jhipster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeEntityField, createEntity, getEntity, reset, updateEntity } from './flyer.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getEntities as searchAllItems } from 'app/entities/item/all-items.reducer';
import AsyncSelect from 'app/shared/components/select/async-select';
import { IFlyer, IFlyerEntry, IFlyerSchedule, IFlyerVariantRef } from 'app/shared/model/flyer.model';
import { IBranch } from 'app/shared/model/branch.model';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { DayOfWeek } from 'app/shared/model/ENUMS/day-of-week.model';
import { SourceType } from 'app/shared/model/ENUMS/source-type.model';
import { ISchedule } from 'app/shared/model/visibility.model';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';

type ItemOption = {
  value: string;
  label: string;
  item: IItem;
};

type VariantOption = {
  value: string;
  label: string;
  variant: IFlyerVariantRef;
};

type TimeRangeDraft = {
  from: string;
  to: string;
};

type FlyerScheduleDraft = {
  startAt: string;
  endAt: string;
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

const createEmptyScheduleDraft = (): FlyerScheduleDraft => ({
  startAt: '',
  endAt: '',
  application: allApplicationsValue,
  useDateRange: false,
  schedule: {},
});

const toDateValue = (value?: string | null) => (value ? dayjs(value).format('YYYY-MM-DD') : '');

const formatTimeForInput = (value?: string | { hour?: number | null; minute?: number | null; second?: number | null; nano?: number | null } | null) => {
  if (!value) {
    return '00:00';
  }

  if (typeof value === 'string') {
    const [hours = '00', minutes = '00'] = value.split(':');
    return `${hours}:${minutes}`;
  }

  const paddedHour = String(value.hour ?? 0).padStart(2, '0');
  const paddedMinute = String(value.minute ?? 0).padStart(2, '0');
  return `${paddedHour}:${paddedMinute}`;
};

const formatTimeFromInput = (value: string) => (value ? value : '00:00');

const toMidnightInstant = (value?: string | null) => (value ? `${value}T00:00:00Z` : null);

const toScheduleDraft = (schedule?: ISchedule | null): FlyerScheduleDraft['schedule'] => {
  if (!schedule) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(schedule).map(([day, ranges]) => [
      day as DayOfWeek,
      (ranges || []).map(range => ({
        from: formatTimeForInput(range.from as any),
        to: formatTimeForInput(range.to as any),
      })),
    ])
  );
};

const normalizeScheduleForSave = (schedule: FlyerScheduleDraft['schedule']): ISchedule | null => {
  const normalized = Object.entries(schedule).reduce((acc, [day, ranges]) => {
    const validRanges = (ranges || [])
      .filter(range => Boolean(range.from) && Boolean(range.to))
      .map(range => ({
        from: formatTimeFromInput(range.from),
        to: formatTimeFromInput(range.to),
      }));

    if (Array.isArray(ranges)) {
      acc[day] = validRanges;
    }

    return acc;
  }, {} as ISchedule);

  return Object.keys(normalized).length > 0 ? normalized : null;
};

const toFlyerScheduleDraft = (schedule?: IFlyerSchedule | null): FlyerScheduleDraft => ({
  startAt: toDateValue(schedule?.startAt),
  endAt: toDateValue(schedule?.endAt),
  application: schedule?.application ?? allApplicationsValue,
  useDateRange: Boolean(schedule?.startAt || schedule?.endAt),
  schedule: toScheduleDraft(schedule?.schedule),
});

const formatApplicationLabel = (application: FlyerScheduleDraft['application']) =>
  application === allApplicationsValue ? 'All applications' : application;

const buildEntry = (): IFlyerEntry => ({
  itemId: null,
  variantId: null,
  item: null,
  variant: null,
  price: null,
});

const getVariantOptions = (item?: IItem | null): VariantOption[] =>
  (item?.variants || [])
    .map(variant => {
      const variantId = variant?.id || variant?.variantId;
      const variantName = variant?.name || variant?.variantName;
      const variantSku = variant?.sku;

      if (!variantId) {
        return null;
      }

      return {
        value: variantId,
        label: variantName ? `${variantName}${variantSku ? ` (${variantSku})` : ''}` : variantSku || variantId,
        variant: {
          id: variantId,
          name: variantName,
          sku: variantSku,
        },
      };
    })
    .filter(Boolean) as VariantOption[];

const getSingleVariantSelection = (item?: IItem | null) => {
  const variantOptions = getVariantOptions(item);
  if (variantOptions.length !== 1) {
    return {
      item,
      variantId: null,
      variant: null,
    };
  }

  return {
    item: {
      ...item,
      variants: item?.variants || [],
    },
    variantId: variantOptions[0].variant.id || null,
    variant: variantOptions[0].variant,
  };
};

const normalizeEntry = (entry?: IFlyerEntry | null): IFlyerEntry => ({
  itemId: entry?.item?.id || (entry?.item as any)?.itemId || entry?.itemId || null,
  variantId: entry?.variant?.id || (entry?.variant as any)?.variantId || entry?.variantId || null,
  item: entry?.item || (entry?.itemId ? { id: entry.itemId, name: entry.itemId } : null),
  variant:
    entry?.variant ||
    (entry?.variantId
      ? {
          id: entry.variantId,
          name: entry.variantId,
        }
      : null),
  price: entry?.price ?? null,
});

export const FlyerUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const flyer: IFlyer = useAppSelector(state => state.flyer.entity);
  const loading = useAppSelector(state => state.flyer.loading);
  const updating = useAppSelector(state => state.flyer.updating);
  const updateSuccess = useAppSelector(state => state.flyer.updateSuccess);
  const branchList: IBranch[] = useAppSelector(state => state.branch.entities);

  const createNewRef = useRef(false);
  const [itemLoadingByIndex, setItemLoadingByIndex] = useState<Record<number, boolean>>({});
  const [scheduleDraft, setScheduleDraft] = useState<FlyerScheduleDraft>(createEmptyScheduleDraft());

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
      dispatch(changeEntityField({ name: 'entries', value: [buildEntry()] }));
      setScheduleDraft(createEmptyScheduleDraft());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getBranches({ page: 0, size: 500, sort: 'name,asc' }));
  }, [dispatch, id, isNew]);

  useEffect(() => {
    if (!isNew || !flyer.id) {
      setScheduleDraft(toFlyerScheduleDraft(flyer.schedule));
    }
  }, [flyer.id, flyer.schedule, isNew]);

  useEffect(() => {
    if (!updateSuccess) {
      return;
    }

    if (createNewRef.current) {
      createNewRef.current = false;
      dispatch(reset());
      dispatch(changeEntityField({ name: 'entries', value: [buildEntry()] }));
      setScheduleDraft(createEmptyScheduleDraft());
      navigate('/flyers/new');
      return;
    }

    const nextId = flyer?.id || id;
    if (isNew && nextId) {
      navigate(`/flyers/${nextId}/edit`);
    }
  }, [dispatch, flyer?.id, id, isNew, navigate, updateSuccess]);

  const entries = useMemo(() => {
    if (flyer.entries?.length) {
      return flyer.entries.map(normalizeEntry);
    }
    return [buildEntry()];
  }, [flyer.entries]);

  useEffect(() => {
    const nextEntries = entries.map(entry => {
      const selectedVariantId = entry.variant?.id || entry.variantId;
      if (!entry.item || selectedVariantId) {
        return entry;
      }

      const singleVariantSelection = getSingleVariantSelection(entry.item);
      if (!singleVariantSelection.variantId) {
        return entry;
      }

      return {
        ...entry,
        itemId: entry.item.id || entry.itemId || null,
        ...singleVariantSelection,
      };
    });

    const hasChanges = nextEntries.some((entry, index) => {
      const currentEntry = entries[index];
      return (
        entry.itemId !== currentEntry.itemId ||
        entry.variantId !== currentEntry.variantId ||
        entry.variant?.id !== currentEntry.variant?.id
      );
    });

    if (hasChanges) {
      updateEntries(nextEntries);
    }
  }, [entries]);

  const hasAnyScheduleRanges = useMemo(
    () => Object.keys(scheduleDraft.schedule).length > 0,
    [scheduleDraft.schedule]
  );

  const hasValidSchedule = useMemo(() => {
    const allRangesValid = Object.values(scheduleDraft.schedule).every(ranges =>
      (ranges || []).every(range => Boolean(range.from) && Boolean(range.to))
    );

    return (
      hasAnyScheduleRanges &&
      allRangesValid &&
      (!scheduleDraft.useDateRange || (Boolean(scheduleDraft.startAt) && Boolean(scheduleDraft.endAt)))
    );
  }, [hasAnyScheduleRanges, scheduleDraft.endAt, scheduleDraft.schedule, scheduleDraft.startAt, scheduleDraft.useDateRange]);

  const isSaveDisabled = useMemo(
    () =>
      updating ||
      !flyer.name?.trim() ||
      !flyer.branch?.id ||
      !hasValidSchedule ||
      entries.length === 0 ||
      entries.some(
        entry =>
          !(entry.item?.id || entry.itemId) ||
          !(entry.variant?.id || entry.variantId) ||
          entry.price == null ||
          entry.price < 0
      ),
    [entries, flyer.branch?.id, flyer.name, hasValidSchedule, updating]
  );

  const updateEntries = (nextEntries: IFlyerEntry[]) => {
    dispatch(
      changeEntityField({
        name: 'entries',
        value: nextEntries,
      })
    );
  };

  const handleAddEntry = () => {
    updateEntries([...entries, buildEntry()]);
  };

  const handleRemoveEntry = (entryIndex: number) => {
    const nextEntries = entries.filter((_, index) => index !== entryIndex);
    updateEntries(nextEntries.length > 0 ? nextEntries : [buildEntry()]);
  };

  const handleEntryChange = (entryIndex: number, updates: Partial<IFlyerEntry>) => {
    updateEntries(
      entries.map((entry, index) =>
        index === entryIndex
          ? {
              ...entry,
              ...updates,
            }
          : entry
      )
    );
  };

  const updateScheduleDraft = (updates: Partial<FlyerScheduleDraft>) => {
    setScheduleDraft(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const handleAddHourRange = (day: DayOfWeek) => {
    const currentRanges = scheduleDraft.schedule[day] || [];
    if (Object.prototype.hasOwnProperty.call(scheduleDraft.schedule, day) && currentRanges.length === 0) {
      return;
    }

    setScheduleDraft(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: [...currentRanges, createDefaultTimeRange()],
      },
    }));
  };

  const handleRemoveHourRange = (day: DayOfWeek, rangeIndex: number) => {
    setScheduleDraft(prev => {
      const nextRanges = (prev.schedule[day] || []).filter((_, index) => index !== rangeIndex);
      const nextSchedule = { ...prev.schedule };

      if (nextRanges.length > 0) {
        nextSchedule[day] = nextRanges;
      } else {
        delete nextSchedule[day];
      }

      return {
        ...prev,
        schedule: nextSchedule,
      };
    });
  };

  const handleChangeHourRange = (day: DayOfWeek, rangeIndex: number, key: keyof TimeRangeDraft, value: string) => {
    setScheduleDraft(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: (prev.schedule[day] || []).map((range, index) =>
          index === rangeIndex ? { ...range, [key]: value } : range
        ),
      },
    }));
  };

  const getHourRangesForDay = (day: DayOfWeek) => scheduleDraft.schedule[day] || [];

  const isDaySelected = (day: DayOfWeek) => Object.prototype.hasOwnProperty.call(scheduleDraft.schedule, day);
  const isFullDaySelected = (day: DayOfWeek) => isDaySelected(day) && getHourRangesForDay(day).length === 0;

  const handleToggleDaySelection = (day: DayOfWeek, checked: boolean) => {
    setScheduleDraft(prev => {
      const nextSchedule = { ...prev.schedule };

      if (checked) {
        nextSchedule[day] = [];
      } else {
        delete nextSchedule[day];
      }

      return {
        ...prev,
        schedule: nextSchedule,
      };
    });
  };

  const loadItemOptions = (entryIndex: number, inputValue: string, callback: (options: ItemOption[]) => void) => {
    setItemLoadingByIndex(prev => ({ ...prev, [entryIndex]: true }));
    dispatch(
      searchAllItems({
        page: 0,
        size: 15,
        sort: 'id,asc',
        name: inputValue,
      })
    )
      .then(response => {
        const data = (response.payload as any)?.data || [];
        callback(
          data.map(item => ({
            value: item.id,
            label: item.name,
            item,
          }))
        );
      })
      .finally(() => {
        setItemLoadingByIndex(prev => ({ ...prev, [entryIndex]: false }));
      });
  };

  const saveEntity = async (createNew = false) => {
    createNewRef.current = createNew;

    const entity: IFlyer = {
      ...flyer,
      branch: flyer.branch
        ? {
            id: flyer.branch.id,
            name: flyer.branch.name,
          }
        : null,
      schedule: {
        startAt: scheduleDraft.useDateRange ? toMidnightInstant(scheduleDraft.startAt) : null,
        endAt: scheduleDraft.useDateRange ? toMidnightInstant(scheduleDraft.endAt) : null,
        application: scheduleDraft.application === allApplicationsValue ? null : scheduleDraft.application,
        schedule: normalizeScheduleForSave(scheduleDraft.schedule),
      },
      entries: entries.map(entry => ({
        itemId: entry.item?.id || entry.itemId,
        variantId: entry.variant?.id || entry.variantId,
        item: entry.item,
        variant: entry.variant,
        price: entry.price,
      })),
    };

    if (isNew) {
      await dispatch(createEntity(entity));
    } else {
      await dispatch(updateEntity(entity));
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{isNew ? 'Create New Flyer' : 'Edit Flyer'}</h2>

        {loading ? (
          <p className="text-xs">Loading...</p>
        ) : (
          <form className="space-y-4">
            <div className="space-y-4 rounded-md border bg-white p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="flyer-name" className="text-xs font-semibold">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="flyer-name"
                    value={flyer.name || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'name', value: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flyer-branch" className="text-xs font-semibold">
                    Branch <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={flyer.branch?.id || ''}
                    onValueChange={value =>
                      dispatch(
                        changeEntityField({
                          name: 'branch',
                          value: branchList.find(branch => branch.id === value) || null,
                        })
                      )
                    }
                  >
                    <SelectTrigger id="flyer-branch" className="h-8 text-xs">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchList.filter(branch => branch.id).map(branch => (
                        <SelectItem key={branch.id} value={branch.id} className="text-xs">
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-md border bg-white p-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Schedule</h3>
                <p className="text-xs text-muted-foreground">
                  Use the same application and day/hour scheduling pattern as visibility and scheduled prices.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Application <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={scheduleDraft.application}
                    onValueChange={value => updateScheduleDraft({ application: value as FlyerScheduleDraft['application'] })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select application" />
                    </SelectTrigger>
                    <SelectContent>
                      {applicationOptions.map(application => (
                        <SelectItem key={application} value={application} className="text-xs">
                          {formatApplicationLabel(application)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="flyer-use-date-range"
                      checked={scheduleDraft.useDateRange}
                      onCheckedChange={checked =>
                        updateScheduleDraft({
                          useDateRange: !!checked,
                          startAt: checked ? scheduleDraft.startAt : '',
                          endAt: checked ? scheduleDraft.endAt : '',
                        })
                      }
                    />
                    <Label htmlFor="flyer-use-date-range" className="cursor-pointer text-xs font-medium">
                      Limit to date range
                    </Label>
                  </div>
                </div>
              </div>

              {scheduleDraft.useDateRange ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="flyer-startAt" className="text-xs font-semibold">
                      Start Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="flyer-startAt"
                      type="date"
                      value={scheduleDraft.startAt}
                      onChange={e => updateScheduleDraft({ startAt: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flyer-endAt" className="text-xs font-semibold">
                      End Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="flyer-endAt"
                      type="date"
                      value={scheduleDraft.endAt}
                      onChange={e => updateScheduleDraft({ endAt: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              ) : null}

              <Accordion type="multiple" className="w-full">
                {allDays.map(day => (
                  <AccordionItem key={day} value={day}>
                    <AccordionTrigger className="py-2 text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span>{translate(`daysOfWeek.${day}`)}</span>
                        {isFullDaySelected(day) ? (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                            Full day
                          </span>
                        ) : null}
                        {getHourRangesForDay(day).length > 0 ? (
                          <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium">
                            {getHourRangesForDay(day).length}
                          </span>
                        ) : null}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 px-1 text-xs font-medium">
                          <Checkbox
                            checked={isFullDaySelected(day)}
                            onCheckedChange={checked => handleToggleDaySelection(day, checked === true)}
                          />
                          <span>Full day</span>
                        </label>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddHourRange(day)}
                            className="h-7 text-xs"
                            disabled={isFullDaySelected(day)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Hours
                          </Button>
                        </div>
                        {getHourRangesForDay(day).length > 0 ? (
                          getHourRangesForDay(day).map((hourRange, rangeIndex) => (
                            <Card key={`${day}-${rangeIndex}`} className="border-l-4 border-l-primary p-2">
                              <div className="flex items-end justify-between gap-2">
                                <div className="flex flex-1 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs font-medium">From</Label>
                                    <Input
                                      type="time"
                                      value={hourRange.from}
                                      onChange={e => handleChangeHourRange(day, rangeIndex, 'from', e.target.value)}
                                      className="h-8 w-32 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-medium">To</Label>
                                    <Input
                                      type="time"
                                      value={hourRange.to}
                                      onChange={e => handleChangeHourRange(day, rangeIndex, 'to', e.target.value)}
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
                                    onClick={() => handleRemoveHourRange(day, rangeIndex)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))
                        ) : isDaySelected(day) ? (
                          <div className="px-1 text-[11px] text-muted-foreground">
                            This day is selected as full day and will be sent as an empty schedule array.
                          </div>
                        ) : (
                          <div className="px-1 text-[11px] text-muted-foreground">
                            Add hour ranges directly, or mark this day as full day.
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="space-y-4 rounded-md border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Entries</h3>
                  <p className="text-xs text-muted-foreground">
                    Search an item, pick one of its variants, then set the flyer entry price.
                  </p>
                </div>
                <Button type="button" variant="outline" className="h-8 text-xs" onClick={handleAddEntry}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entry
                </Button>
              </div>

              <div className="space-y-3">
                {entries.map((entry, entryIndex) => {
                  const variantOptions = (() => {
                    const options = getVariantOptions(entry.item);
                    if (entry.variant?.id && !options.some(option => option.value === entry.variant.id)) {
                      return [
                        ...options,
                        {
                          value: entry.variant.id,
                          label: entry.variant.name || entry.variant.sku || entry.variant.id,
                          variant: entry.variant,
                        },
                      ];
                    }

                    return options;
                  })();

                  const selectedItemOption = entry.item?.id
                    ? {
                        value: entry.item.id,
                        label: entry.item.name || entry.item.id,
                        item: entry.item,
                      }
                    : null;

                  return (
                    <div
                      key={`flyer-entry-${entryIndex}`}
                      className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(0,1fr)_220px_160px_100px]"
                    >
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Item</Label>
                        <AsyncSelect
                          cacheOptions
                          defaultOptions
                          value={selectedItemOption}
                          loadOptions={(inputValue, callback) => loadItemOptions(entryIndex, inputValue, callback)}
                          getOptionLabel={(option: ItemOption) => option.label}
                          getOptionValue={(option: ItemOption) => option.value}
                          isLoading={Boolean(itemLoadingByIndex[entryIndex])}
                          placeholder="Search items"
                          onChange={(selected: ItemOption | null) =>
                            handleEntryChange(entryIndex, {
                              itemId: selected?.item?.id || null,
                              ...getSingleVariantSelection(selected?.item || null),
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Variant</Label>
                        <Select
                          value={entry.variant?.id || entry.variantId || ''}
                          onValueChange={value => {
                            const selectedVariant = variantOptions.find(option => option.value === value)?.variant || null;
                            handleEntryChange(entryIndex, {
                              variantId: selectedVariant?.id || null,
                              variant: selectedVariant,
                            });
                          }}
                          disabled={!entry.item?.id}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder={entry.item?.id ? 'Select variant' : 'Choose item first'} />
                          </SelectTrigger>
                          <SelectContent>
                            {variantOptions.map(option => (
                              <SelectItem key={option.value} value={option.value} className="text-xs">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Special Price</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={entry.price ?? ''}
                          onChange={e =>
                            handleEntryChange(entryIndex, {
                              price: e.target.value === '' ? null : parseFloat(e.target.value),
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-8 w-full text-xs"
                          onClick={() => handleRemoveEntry(entryIndex)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate(-1)}
                type="button"
                className="h-8 text-xs"
                id="cancel-save"
                data-cy="entityCreateCancelButton"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                <Translate contentKey="entity.action.back">Back</Translate>
              </Button>
              <Button
                type="button"
                disabled={isSaveDisabled}
                className="h-8 text-xs"
                onClick={() => saveEntity(false)}
                id="save-entity"
                data-cy="entityCreateSaveButton"
              >
                <Save className="mr-2 h-4 w-4" />
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
              <Button
                onClick={() => saveEntity(true)}
                disabled={isSaveDisabled}
                className="h-8 text-xs"
                type="button"
              >
                <Save className="mr-2 h-4 w-4" />
                <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageWrapper>
  );
};

export default FlyerUpdate;
