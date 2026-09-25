import React from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { KitchenPrintComponent } from 'app/shared/model/PRINTER/printer.model';
import { maxWidthMultiplier } from 'app/shared/model/PRINTER/printer-models';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const KITCHEN_TYPES = [
  ['WALK_IN_TYPE', 'Walk in type'],
  ['DATE', 'Date'],
  ['USER', 'User'],
  ['TABLE_NUMBER', 'Table number'],
  ['SEQUENCE_NUMBER', 'Sequence number'],
  ['ORDER_METHOD', 'Order method'],
  ['ITEMS', 'Items'],
  ['CUSTOMER_INFORMATION', 'Customer information'],
  ['DELIVERY_INFORMATION', 'Delivery information'],
] as const;

const section = (variableType: string, extra: Partial<KitchenPrintComponent> = {}): KitchenPrintComponent => ({
  type: 'KITCHEN_VARIABLE',
  variableType,
  font: 1,
  fontWidth: 1,
  alignment: 'left',
  bold: false,
  underline: false,
  printInRed: false,
  ...extra,
});

export const defaultKitchenLayout = (): KitchenPrintComponent[] => [
  section('WALK_IN_TYPE', { font: 2, fontWidth: 2, alignment: 'center', bold: true }),
  section('DATE'),
  section('USER'),
  section('TABLE_NUMBER'),
  section('SEQUENCE_NUMBER'),
  section('ORDER_METHOD'),
  { type: 'SPACE', font: 1, fontWidth: 1, alignment: 'left', bold: false, underline: false, printInRed: false, lines: 1 },
  section('ITEMS'),
  { type: 'SPACE', font: 1, fontWidth: 1, alignment: 'left', bold: false, underline: false, printInRed: false, lines: 1 },
  section('CUSTOMER_INFORMATION'),
  section('DELIVERY_INFORMATION'),
];

export const fitKitchenLayoutToPrinter = (
  components: KitchenPrintComponent[],
  columns: number | null | undefined,
  supportsRed: boolean,
): KitchenPrintComponent[] => {
  const maxWidth = maxWidthMultiplier(columns);
  return components.map(component => ({
    ...component,
    font: Math.min(Math.max(component.font || 1, 1), 8),
    fontWidth: Math.min(Math.max(component.fontWidth || 1, 1), maxWidth),
    printInRed: supportsRed ? component.printInRed : false,
  }));
};

const labelFor = (component: KitchenPrintComponent) => {
  if (component.type === 'SPACE') return 'Blank line';
  if (component.type === 'HORIZONTAL_LINE') return 'Horizontal line';
  return KITCHEN_TYPES.find(([id]) => id === component.variableType)?.[1] || component.variableType || 'Section';
};

export const KitchenLayoutEditor = ({
  components,
  supportsRed,
  onChange,
}: {
  components: KitchenPrintComponent[];
  supportsRed: boolean;
  onChange: (next: KitchenPrintComponent[]) => void;
}) => {
  const update = (index: number, patch: Partial<KitchenPrintComponent>) => {
    onChange(components.map((component, i) => (i === index ? { ...component, ...patch } : component)));
  };
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= components.length) return;
    const next = [...components];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Kitchen ticket</h3>
          <p className="text-xs text-muted-foreground">Saved on this printer and used by the POS when it prints to this kitchen printer.</p>
        </div>
        <Button type="button" variant="outline" className="h-7 text-xs" onClick={() => onChange([...components, section('ITEMS')])}>
          <Plus className="h-3 w-3 mr-1" />
          Add section
        </Button>
      </div>
      {components.map((component, index) => (
        <div key={index} className="rounded border p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-primary">{labelFor(component)}</span>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" className="h-7 w-7 p-0" onClick={() => move(index, -1)}><ArrowUp className="h-3 w-3" /></Button>
              <Button type="button" variant="ghost" className="h-7 w-7 p-0" onClick={() => move(index, 1)}><ArrowDown className="h-3 w-3" /></Button>
              <Button type="button" variant="ghost" className="h-7 w-7 p-0" onClick={() => onChange(components.filter((_, i) => i !== index))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
          {component.type === 'KITCHEN_VARIABLE' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Section</Label>
                <Select value={component.variableType} onValueChange={value => update(index, { variableType: value })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KITCHEN_TYPES.map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Alignment</Label>
                <Select value={component.alignment} onValueChange={value => update(index, { alignment: value as KitchenPrintComponent['alignment'] })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Height Multiplier</Label>
                <Select value={String(component.font)} onValueChange={value => update(index, { font: Number(value) })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(size => <SelectItem key={size} value={String(size)}>{size}x</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Width Multiplier</Label>
                <Select value={String(component.fontWidth)} onValueChange={value => update(index, { fontWidth: Number(value) })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(size => <SelectItem key={size} value={String(size)}>{size}x</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={component.bold} onChange={e => update(index, { bold: e.target.checked })} />
                Bold
              </label>
              {supportsRed && (
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={component.printInRed} onChange={e => update(index, { printInRed: e.target.checked })} />
                  Print in red
                </label>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
