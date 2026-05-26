import React, { useEffect, useMemo, useState } from 'react';
import { Translate } from 'react-jhipster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IScheduledBranchPrice } from 'app/shared/model/ITEM/retail/variable-item.model';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { convertDateTimeFromServerTimeOnly } from 'app/shared/util/date-utils';

type ScheduledBranchPricesModalProps = {
  isOpen: boolean;
  branchName: string;
  scheduledPrices: IScheduledBranchPrice[];
  onClose: () => void;
  onSave: (scheduledPrices: IScheduledBranchPrice[]) => void;
};

const createEmptySchedule = (): IScheduledBranchPrice => ({
  startAt: '',
  endAt: '',
  price: null,
});

const TIME_ONLY_INSTANT_PREFIX = '1970-01-01T';
const TIME_ONLY_INSTANT_SUFFIX = ':00Z';

const toTimeValue = (value?: string | null) => {
  if (!value) {
    return '';
  }

  if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return value.slice(0, 5);
  }

  const formattedTime = convertDateTimeFromServerTimeOnly(value);
  if (!formattedTime) {
    return '';
  }

  return formattedTime;
};

const toAnchoredInstantString = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const normalizedTime = toTimeValue(value);
  if (!normalizedTime) {
    return '';
  }

  return `${TIME_ONLY_INSTANT_PREFIX}${normalizedTime}${TIME_ONLY_INSTANT_SUFFIX}`;
};

const ScheduledBranchPricesModal = ({
  isOpen,
  branchName,
  scheduledPrices,
  onClose,
  onSave,
}: ScheduledBranchPricesModalProps) => {
  const [draftSchedules, setDraftSchedules] = useState<IScheduledBranchPrice[]>([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftSchedules(
      scheduledPrices.length > 0
        ? scheduledPrices.map(schedule => ({
            ...schedule,
            startAt: toTimeValue(schedule.startAt),
            endAt: toTimeValue(schedule.endAt),
          }))
        : [createEmptySchedule()]
    );
  }, [isOpen, scheduledPrices]);

  const canSave = useMemo(
    () =>
      draftSchedules.every(
        schedule => Boolean(schedule.startAt) && Boolean(schedule.endAt) && schedule.price != null && schedule.price >= 0
      ),
    [draftSchedules]
  );

  const updateSchedule = (index: number, field: keyof IScheduledBranchPrice, value: string | number | null) => {
    setDraftSchedules(prev =>
      prev.map((schedule, scheduleIndex) =>
        scheduleIndex === index
          ? {
              ...schedule,
              [field]: value,
            }
          : schedule
      )
    );
  };

  const handleAddSchedule = () => {
    setDraftSchedules(prev => [...prev, createEmptySchedule()]);
  };

  const handleRemoveSchedule = (index: number) => {
    setDraftSchedules(prev => prev.filter((_, scheduleIndex) => scheduleIndex !== index));
  };

  const handleSave = () => {
    onSave(
      draftSchedules.map(schedule => ({
        startAt: toAnchoredInstantString(schedule.startAt),
        endAt: toAnchoredInstantString(schedule.endAt),
        price: schedule.price,
      }))
    );
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-primary" />
            Scheduled Prices
          </DialogTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Manage time-based prices for</span>
            <Badge variant="secondary" className="text-[11px]">
              {branchName}
            </Badge>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1 py-1">
          {draftSchedules.map((schedule, index) => (
            <div key={`${branchName}-schedule-${index}`} className="rounded-xl border border-border/70 bg-muted/20 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">Schedule {index + 1}</div>
                  <div className="text-[11px] text-muted-foreground">Set the daily time window and override price for this branch.</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:text-destructive"
                  onClick={() => handleRemoveSchedule(index)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Start At</Label>
                  <Input
                    type="time"
                    className="h-9 text-xs"
                    value={schedule.startAt || ''}
                    onChange={e => updateSchedule(index, 'startAt', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">End At</Label>
                  <Input
                    type="time"
                    className="h-9 text-xs"
                    value={schedule.endAt || ''}
                    onChange={e => updateSchedule(index, 'endAt', e.target.value)}
                  />
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
                    onChange={e => updateSchedule(index, 'price', e.target.value === '' ? null : parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" className="h-8 text-xs" onClick={handleAddSchedule}>
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

export default ScheduledBranchPricesModal;
