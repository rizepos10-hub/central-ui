import React from 'react';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ColorInputFieldProps = {
  id?: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const normalizeHex = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.toLowerCase() === 'transparent') return 'transparent';
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
};

export const ColorInputField = ({ id, label, value = '', onChange, placeholder }: ColorInputFieldProps) => {
  const displayValue = value ?? '';

  return (
    <div>
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <div className="relative shrink-0">
          <ColorPicker
            value={displayValue || '#ffffff'}
            onChange={onChange}
          />
        </div>
        <Input
          id={id}
          value={displayValue}
          onChange={e => onChange(e.target.value)}
          onBlur={e => {
            const next = e.target.value.trim();
            if (next) onChange(normalizeHex(next));
          }}
          placeholder={placeholder}
          className="h-8 flex-1 text-xs"
        />
      </div>
    </div>
  );
};
