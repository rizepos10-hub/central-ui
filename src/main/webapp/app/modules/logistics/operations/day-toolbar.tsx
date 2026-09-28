import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { formatDay } from '../closures/closure.model';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { shiftDay } from './operations.model';

export const ALL_FACTORIES = '__all';

interface DayToolbarProps {
  date: string;
  onDateChange: (date: string) => void;
  factories?: IWholesaleFactory[];
  factoryId?: string;
  onFactoryChange?: (factoryId: string) => void;
  /** Offers "All factories" in the factory picker. */
  allowAllFactories?: boolean;
  children?: React.ReactNode;
}

/** Delivery date stepper and factory picker shared by the Operations pages. */
export const DayToolbar = ({ date, onDateChange, factories, factoryId, onFactoryChange, allowAllFactories, children }: DayToolbarProps) => (
  <div className="flex flex-wrap items-center gap-2 print:hidden">
    <Button variant="outline" size="icon" className="ws-control w-8" aria-label="Previous day" onClick={() => onDateChange(shiftDay(date, -1))}>
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <Input
      type="date"
      aria-label="Delivery date"
      className="ws-control w-40"
      value={date}
      onChange={e => e.target.value && onDateChange(e.target.value)}
    />
    <Button variant="outline" size="icon" className="ws-control w-8" aria-label="Next day" onClick={() => onDateChange(shiftDay(date, 1))}>
      <ChevronRight className="h-4 w-4" />
    </Button>
    <span className="text-sm text-muted-foreground" data-testid="delivery-day">
      {formatDay(date)}
    </span>
    {factories && onFactoryChange && (
      <Select value={factoryId} onValueChange={onFactoryChange}>
        <SelectTrigger className="ws-control w-52" aria-label="Factory">
          <SelectValue placeholder="Choose a factory" />
        </SelectTrigger>
        <WsSelectContent>
          {allowAllFactories && <SelectItem value={ALL_FACTORIES}>All factories</SelectItem>}
          {factories.map(f => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </WsSelectContent>
      </Select>
    )}
    {children}
  </div>
);

export default DayToolbar;
