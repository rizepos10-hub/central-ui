import React from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { KitchenPrintComponent } from 'app/shared/model/PRINTER/printer.model';
import { DEFAULT_WINDOWS_FONT_SIZE, fontsFor, IPrinterModel, maxWidthMultiplier, PrinterCommandMode, PrinterFont, WINDOWS_FONT_SIZES, windowsTypeface } from 'app/shared/model/PRINTER/printer-models';
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

export const defaultSectionFont = (mode?: PrinterCommandMode): PrinterFont => (mode === 'WINDOWS_DRIVER' ? 'ARIAL' : 'A');

export const applyKitchenFontDefaults = (
  components: KitchenPrintComponent[],
  mode?: PrinterCommandMode,
): KitchenPrintComponent[] => {
  const printerFont = defaultSectionFont(mode);
  return components.map(component => ({
    ...component,
    printerFont,
    font: 1,
    fontWidth: 1,
    fontSize: DEFAULT_WINDOWS_FONT_SIZE,
    italic: false,
  }));
};

const section = (variableType: string, extra: Partial<KitchenPrintComponent> = {}, mode?: PrinterCommandMode): KitchenPrintComponent => ({
  type: 'KITCHEN_VARIABLE',
  variableType,
  printerFont: defaultSectionFont(mode),
  font: 1,
  fontWidth: 1,
  fontSize: DEFAULT_WINDOWS_FONT_SIZE,
  alignment: 'left',
  bold: false,
  italic: false,
  underline: false,
  printInRed: false,
  ...extra,
});

export const defaultKitchenLayout = (mode?: PrinterCommandMode): KitchenPrintComponent[] => [
  section('WALK_IN_TYPE', { alignment: 'center', bold: true }, mode),
  section('DATE', {}, mode),
  section('USER', {}, mode),
  section('TABLE_NUMBER', {}, mode),
  section('SEQUENCE_NUMBER', {}, mode),
  section('ORDER_METHOD', {}, mode),
  { type: 'SPACE', printerFont: defaultSectionFont(mode), font: 1, fontWidth: 1, fontSize: DEFAULT_WINDOWS_FONT_SIZE, alignment: 'left', bold: false, italic: false, underline: false, printInRed: false, lines: 1 },
  section('ITEMS', {}, mode),
  { type: 'SPACE', printerFont: defaultSectionFont(mode), font: 1, fontWidth: 1, fontSize: DEFAULT_WINDOWS_FONT_SIZE, alignment: 'left', bold: false, italic: false, underline: false, printInRed: false, lines: 1 },
  section('CUSTOMER_INFORMATION', {}, mode),
  section('DELIVERY_INFORMATION', {}, mode),
];

export const fitKitchenLayoutToPrinter = (
  components: KitchenPrintComponent[],
  columns: number | null | undefined,
  supportsRed: boolean,
  mode?: PrinterCommandMode,
): KitchenPrintComponent[] => {
  const maxWidth = maxWidthMultiplier(columns);
  const printerFont = defaultSectionFont(mode);
  return components.map(component => ({
    ...component,
    printerFont,
    font: 1,
    fontWidth: Math.min(1, maxWidth),
    fontSize: DEFAULT_WINDOWS_FONT_SIZE,
    italic: false,
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
  commandMode,
  model,
  paperSize = 'mm80',
  onChange,
}: {
  components: KitchenPrintComponent[];
  supportsRed: boolean;
  commandMode?: PrinterCommandMode;
  model?: IPrinterModel;
  paperSize?: IPrinterModel['size'];
  onChange: (next: KitchenPrintComponent[]) => void;
}) => {
  const mode = commandMode ?? 'ESC_POS';
  const windows = mode === 'WINDOWS_DRIVER';
  const fonts = fontsFor(model, mode, paperSize);
  const fontValue = (font?: PrinterFont) => {
    const current = windows ? windowsTypeface(font) : font === 'B' ? 'B' : 'A';
    return fonts.some(option => option.id === current) ? current : fonts[0]?.id;
  };
  const update = (index: number, patch: Partial<KitchenPrintComponent>) => {
    onChange(components.map((component, i) => (i === index ? { ...component, ...patch } : component)));
  };
  const [addTick, setAddTick] = React.useState(0);
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
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-7 text-xs" onClick={() => onChange(applyKitchenFontDefaults(components, mode))}>
            Restore Defaults
          </Button>
          <Select
            key={addTick}
            onValueChange={value => {
              if (value === 'SPACE') {
                onChange([...components, { type: 'SPACE', printerFont: defaultSectionFont(mode), font: 1, fontWidth: 1, fontSize: DEFAULT_WINDOWS_FONT_SIZE, alignment: 'left', bold: false, italic: false, underline: false, printInRed: false, lines: 1 }]);
              } else if (value === 'HORIZONTAL_LINE') {
                onChange([...components, { type: 'HORIZONTAL_LINE', printerFont: defaultSectionFont(mode), font: 1, fontWidth: 1, fontSize: DEFAULT_WINDOWS_FONT_SIZE, alignment: 'left', bold: false, italic: false, underline: false, printInRed: false }]);
              } else {
                onChange([...components, section(value, {}, mode)]);
              }
              setAddTick(tick => tick + 1);
            }}
          >
            <SelectTrigger className="h-7 w-[150px] text-xs">
              <Plus className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Add section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SPACE">Blank line</SelectItem>
              <SelectItem value="HORIZONTAL_LINE">Horizontal line</SelectItem>
              {KITCHEN_TYPES.map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {components.map((component, index) => (
        <div key={index} className="rounded border p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-black">{labelFor(component)}</span>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" className="h-7 w-7 p-0" onClick={() => move(index, -1)}><ArrowUp className="h-3 w-3" /></Button>
              <Button type="button" variant="ghost" className="h-7 w-7 p-0" onClick={() => move(index, 1)}><ArrowDown className="h-3 w-3" /></Button>
              <Button type="button" variant="ghost" className="h-7 w-7 p-0" onClick={() => onChange(components.filter((_, i) => i !== index))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
          {component.type === 'SPACE' && (
            <div className="max-w-[160px]">
              <Label className="text-xs">Lines</Label>
              <Select value={String(component.lines || 1)} onValueChange={value => update(index, { lines: Number(value) })}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(lines => <SelectItem key={lines} value={String(lines)}>{lines}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
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
                <Label className="text-xs">Font</Label>
                <Select
                  key={`${mode}-font`}
                  value={fontValue(component.printerFont)}
                  onValueChange={value => update(index, { printerFont: value as PrinterFont })}
                >
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Font" /></SelectTrigger>
                  <SelectContent>
                    {fonts.map(font => <SelectItem key={`${mode}-${font.id}`} value={font.id}>{font.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {windows ? (
                <div>
                  <Label className="text-xs">Size</Label>
                  <Select
                    key={`${mode}-size`}
                    value={String(component.fontSize || DEFAULT_WINDOWS_FONT_SIZE)}
                    onValueChange={value => update(index, { fontSize: Number(value), printerFont: windowsTypeface(component.printerFont) })}
                  >
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WINDOWS_FONT_SIZES.map(size => <SelectItem key={size} value={String(size)}>{size} pt</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
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
                </>
              )}
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={component.bold} onChange={e => update(index, { bold: e.target.checked })} />
                Bold
              </label>
              {windows && (
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={!!component.italic} onChange={e => update(index, { italic: e.target.checked })} />
                  Italic
                </label>
              )}
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
