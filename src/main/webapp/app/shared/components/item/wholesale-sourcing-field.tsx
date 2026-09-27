import React from 'react';

import { Button } from '@/components/ui/button';
import { IItem } from 'app/shared/model/ITEM/item.model';

type WholesaleSourcing = NonNullable<IItem['wholesaleSourcing']>;

const OPTIONS: { value: WholesaleSourcing; label: string; description: string }[] = [
  { value: 'PRODUCED', label: 'Produced', description: 'Made in our own factories.' },
  { value: 'PURCHASED', label: 'Purchased', description: 'Bought from a supplier and resold as is.' },
];

interface WholesaleSourcingFieldProps {
  value?: IItem['wholesaleSourcing'];
  onChange: (value: WholesaleSourcing) => void;
  /** Hide the label when the surrounding section already has a title. */
  hideLabel?: boolean;
}

/** Items saved before this field existed have no value; they are treated as Produced. */
export const WholesaleSourcingField = ({ value, onChange, hideLabel = false }: WholesaleSourcingFieldProps) => {
  const current = value ?? 'PRODUCED';
  return (
    <div className="space-y-1" data-testid="wholesale-sourcing-field">
      {!hideLabel && <label className="text-xs font-semibold">Wholesale sourcing</label>}
      <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Wholesale sourcing">
        {OPTIONS.map(option => (
          <Button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={current === option.value}
            variant={current === option.value ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{OPTIONS.find(o => o.value === current)?.description}</p>
    </div>
  );
};

export default WholesaleSourcingField;
