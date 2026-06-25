import React from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Bold,
  Copy,
  Trash2,
} from 'lucide-react';
import { FileLibraryListItem } from 'react-media-library-cloud-links';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import {
  BARCODE_SYMBOLOGY_LABELS,
  BarcodeSymbology,
  ELEMENT_TYPE_LABELS,
  LabelElement,
  LabelTextAlign,
  LabelVerticalAlign,
  QR_DATA_TYPE_LABELS,
  QrDataType,
} from '../../model/label-template.model';
import { ElementIcon } from '../ElementIcon';
import { clamp } from '../../util/units';

const clampFont = (value: number): number => clamp(Math.round(value), 4, 200);

const NON_TEXT_TYPES = ['barcode', 'qrCode', 'productImage', 'logo'];

type PropertiesPanelProps = {
  element: LabelElement;
  onChange: (patch: Partial<LabelElement>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export const PropertiesPanel = ({ element, onChange, onDuplicate, onDelete }: PropertiesPanelProps) => {
  const isText = !NON_TEXT_TYPES.includes(element.type);
  const supportsHorizontalAlign = isText || element.type === 'barcode';
  const rotation = Math.round(element.rotation) % 360;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <ElementIcon type={element.type} size={16} />
        <span className="text-sm font-semibold text-foreground">{ELEMENT_TYPE_LABELS[element.type]}</span>
        <div className="ml-auto flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Duplicate" onClick={onDuplicate}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" title="Delete" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Field label="Position & size (mm)">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="X" value={element.xMm} onChange={v => onChange({ xMm: v })} />
          <NumberInput label="Y" value={element.yMm} onChange={v => onChange({ yMm: v })} />
          <NumberInput label="W" value={element.widthMm} onChange={v => onChange({ widthMm: v })} />
          <NumberInput label="H" value={element.heightMm} onChange={v => onChange({ heightMm: v })} />
        </div>
      </Field>

      <Field label={`Rotation — ${rotation}°`}>
        <div className="flex items-center gap-1.5">
          {[0, 90, 180, 270].map(deg => (
            <Button
              key={deg}
              variant={rotation === deg ? 'default' : 'outline'}
              size="sm"
              className="h-8 flex-1 px-0 text-xs"
              onClick={() => onChange({ rotation: deg })}
            >
              {deg}°
            </Button>
          ))}
          <Input
            type="number"
            value={Math.round(element.rotation)}
            onChange={e => onChange({ rotation: (((Number(e.target.value) || 0) % 360) + 360) % 360 })}
            className="h-8 w-16 text-xs"
          />
        </div>
      </Field>

      {element.type === 'customText' && (
        <Field label="Text">
          <Input
            value={element.value ?? ''}
            onChange={e => onChange({ value: e.target.value })}
            className="h-8 text-sm"
            placeholder="Custom text"
          />
        </Field>
      )}

      {element.type === 'logo' && <LogoField value={element.value ?? null} onChange={v => onChange({ value: v })} />}

      {element.type === 'productImage' && (
        <p className="rounded-md bg-muted px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
          Shows each product&apos;s own image. To use one fixed image on every label, add a <span className="font-semibold">Logo</span>{' '}
          element instead.
        </p>
      )}

      {element.type === 'price' && (
        <Field label="Sale price">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-2 py-1.5">
            <input
              type="checkbox"
              checked={element.showComparePrice ?? false}
              onChange={e => onChange({ showComparePrice: e.target.checked })}
              className="h-4 w-4 accent-sky-500"
            />
            <span className="text-sm text-foreground">Show original price struck through</span>
          </label>
          <p className="text-[11px] leading-snug text-muted-foreground">
            When a product is on sale, the regular price appears crossed out before the sale price (e.g.{' '}
            <span className="text-muted-foreground line-through">$12.99</span> <span className="font-semibold text-foreground">$9.99</span>).
            Otherwise just the current price shows.
          </p>
        </Field>
      )}

      {supportsHorizontalAlign && (
        <Field label="Horizontal align">
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as LabelTextAlign[]).map(align => (
              <Button
                key={align}
                variant={element.alignment === align ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onChange({ alignment: align })}
              >
                {align === 'left' && <AlignLeft className="h-4 w-4" />}
                {align === 'center' && <AlignCenter className="h-4 w-4" />}
                {align === 'right' && <AlignRight className="h-4 w-4" />}
              </Button>
            ))}
          </div>
        </Field>
      )}

      {isText && (
        <>
          <Field label={`Font size — ${Math.round(element.fontSize)} pt`}>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={4}
                max={72}
                step={1}
                value={clampFont(element.fontSize)}
                onChange={e => onChange({ fontSize: Number(e.target.value) })}
                className="h-2 flex-1 cursor-pointer accent-sky-500"
              />
              <Input
                type="number"
                value={Math.round(element.fontSize)}
                onChange={e => onChange({ fontSize: clampFont(Number(e.target.value) || 0) })}
                className="h-8 w-16 text-xs"
              />
              <Button
                variant={element.fontBold ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8 shrink-0"
                title="Bold"
                onClick={() => onChange({ fontBold: !element.fontBold })}
              >
                <Bold className="h-4 w-4" />
              </Button>
            </div>
          </Field>

          <Field label="Vertical align">
            <div className="flex gap-1">
              {(['top', 'middle', 'bottom'] as LabelVerticalAlign[]).map(v => (
                <Button
                  key={v}
                  variant={(element.verticalAlign ?? 'middle') === v ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  title={v}
                  onClick={() => onChange({ verticalAlign: v })}
                >
                  {v === 'top' && <AlignVerticalJustifyStart className="h-4 w-4" />}
                  {v === 'middle' && <AlignVerticalJustifyCenter className="h-4 w-4" />}
                  {v === 'bottom' && <AlignVerticalJustifyEnd className="h-4 w-4" />}
                </Button>
              ))}
            </div>
          </Field>

          <Field label="Text fitting">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-2 py-1.5">
              <input
                type="checkbox"
                checked={element.autoFit ?? true}
                onChange={e => onChange({ autoFit: e.target.checked })}
                className="h-4 w-4 accent-sky-500"
              />
              <span className="text-sm text-foreground">Shrink text to fit</span>
            </label>
            <p className="text-[11px] leading-snug text-muted-foreground">
              {element.autoFit ?? true
                ? 'Long text shrinks (down to the min size) so it never spills out of the box — print matches the preview exactly.'
                : 'Text keeps its exact size and is clamped with “…” if it does not fit.'}
            </p>
          </Field>

          <div className={`grid gap-2 ${(element.autoFit ?? true) ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {(element.autoFit ?? true) && (
              <StackedNumber
                label="Min pt"
                hint="smallest"
                value={element.minFontSize ?? 5}
                onChange={v => onChange({ minFontSize: clampFont(v) })}
              />
            )}
            <StackedNumber
              label="Lines"
              hint="0 = auto"
              value={element.maxLines ?? 0}
              onChange={v => onChange({ maxLines: Math.max(0, Math.round(v)) })}
            />
            <StackedNumber
              label="Spacing"
              hint="line height"
              step={0.05}
              value={element.lineHeight ?? 1.15}
              onChange={v => onChange({ lineHeight: clamp(v, 0.9, 2) })}
            />
          </div>
        </>
      )}

      {element.type === 'barcode' && (
        <Field label="Barcode type">
          <NativeSelect
            value={element.barcodeSymbology ?? 'code128'}
            onChange={v => onChange({ barcodeSymbology: v as BarcodeSymbology })}
            options={Object.entries(BARCODE_SYMBOLOGY_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </Field>
      )}

      {element.type === 'qrCode' && (
        <Field label="QR data">
          <NativeSelect
            value={element.qrDataType ?? 'sku'}
            onChange={v => onChange({ qrDataType: v as QrDataType })}
            options={Object.entries(QR_DATA_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </Field>
      )}
    </div>
  );
};

const LogoField = ({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) => {
  const handleSelect = (files: FileLibraryListItem[]) => {
    const url = files?.[0]?.thumbnailUrl;
    if (url) onChange(url);
  };

  return (
    <Field label="Logo image">
      {value && (
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-[repeating-conic-gradient(#f1f5f9_0_25%,#fff_0_50%)] bg-[length:12px_12px]">
            <img src={value} alt="" className="h-full w-full object-contain" />
          </div>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-red-600" onClick={() => onChange(null)}>
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </Button>
        </div>
      )}
      <MediaLibrary layout="compact" multiSelect={false} handleFilesSelectCallback={handleSelect} />
      <p className="text-[11px] leading-snug text-muted-foreground">
        A fixed image shown on every label (same for all products). Pick from the media library — PNG with transparency works best.
      </p>
    </Field>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
    {children}
  </div>
);

const NumberInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <label className="flex items-center gap-1.5">
    <span className="w-8 text-xs text-muted-foreground">{label}</span>
    <Input
      type="number"
      value={Number.isFinite(value) ? Math.round(value * 10) / 10 : 0}
      onChange={e => onChange(Number(e.target.value) || 0)}
      className="h-8 text-xs"
    />
  </label>
);

const StackedNumber = ({
  label,
  hint,
  value,
  onChange,
  step,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) => (
  <label className="flex min-w-0 flex-col gap-1">
    <span className="flex items-baseline justify-between gap-1">
      <span className="text-[11px] font-medium text-foreground">{label}</span>
      {hint && <span className="truncate text-[10px] text-muted-foreground">{hint}</span>}
    </span>
    <Input
      type="number"
      step={step}
      value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
      onChange={e => onChange(Number(e.target.value) || 0)}
      className="h-8 w-full text-xs"
    />
  </label>
);

const NativeSelect = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <select value={value} onChange={e => onChange(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
    {options.map(o => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);
