import React from 'react';
import { ColorPicker } from 'primereact/colorpicker';
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
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
};

const toPickerValue = (value?: string): string => {
  const normalized = normalizeHex(value ?? '');
  return normalized ? normalized.replace('#', '') : 'ffffff';
};

const isPrimeColorPickerTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('.p-colorpicker-panel, .p-colorpicker-overlay, .p-colorpicker'));
};

export const ColorInputField = ({ id, label, value = '', onChange, placeholder }: ColorInputFieldProps) => {
  const displayValue = value ?? '';

  return (
    <div>
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <div className="relative shrink-0">
          <ColorPicker
            value={toPickerValue(displayValue)}
            onChange={e => onChange(e.value ? `#${String(e.value).replace('#', '')}` : '')}
            format="hex"
            appendTo="self"
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

export { isPrimeColorPickerTarget };
