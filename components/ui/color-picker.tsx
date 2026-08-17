import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/src/main/webapp/app/lib/utils';

type PickerFormat = 'hex' | 'rgb' | 'hsl';
type Rgb = { r: number; g: number; b: number };
type Hsv = { h: number; s: number; v: number };
type ParsedColor = { rgb: Rgb; alpha: number };

export type ColorPickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  swatches?: string[];
  className?: string;
};

const DEFAULT_SWATCHES = ['#000000', '#6b7280', '#d1d5db', '#93c5fd', '#818cf8', '#ec4899'];
const FALLBACK_COLOR: ParsedColor = { rgb: { r: 124, g: 58, b: 237 }, alpha: 1 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

function parseHex(value: string): ParsedColor | null {
  const raw = value.trim().replace(/^#/, '');
  if (value.trim().toLowerCase() === 'transparent') return { rgb: { r: 0, g: 0, b: 0 }, alpha: 0 };
  if (!/^[0-9a-f]{3,4}$|^[0-9a-f]{6}$|^[0-9a-f]{8}$/i.test(raw)) return null;

  const normalized = raw.length <= 4 ? raw.split('').map(part => `${part}${part}`).join('') : raw;
  const hasAlpha = normalized.length === 8;
  return {
    rgb: {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    },
    alpha: hasAlpha ? Number.parseInt(normalized.slice(6, 8), 16) / 255 : 1,
  };
}

function rgbToHex(rgb: Rgb, alpha = 1): string {
  const base = [rgb.r, rgb.g, rgb.b]
    .map(value => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('');
  if (alpha >= 1) return `#${base}`;
  return `#${base}${clamp(Math.round(alpha * 255), 0, 255).toString(16).padStart(2, '0')}`;
}

function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const diff = max - min;
  let h = 0;

  if (diff !== 0) {
    if (max === red) h = ((green - blue) / diff) % 6;
    else if (max === green) h = (blue - red) / diff + 2;
    else h = (red - green) / diff + 4;
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return { h, s: round(max === 0 ? 0 : (diff / max) * 100, 1), v: round(max * 100, 1) };
}

function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s, 0, 100) / 100;
  const value = clamp(v, 0, 100) / 100;
  const chroma = value * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = value - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) {
    red = chroma;
    green = x;
  } else if (hue < 120) {
    red = x;
    green = chroma;
  } else if (hue < 180) {
    green = chroma;
    blue = x;
  } else if (hue < 240) {
    green = x;
    blue = chroma;
  } else if (hue < 300) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  };
}

function rgbToHsl({ r, g, b }: Rgb) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const diff = max - min;
  let h = 0;
  let s = 0;

  if (diff !== 0) {
    s = diff / (1 - Math.abs(2 * lightness - 1));
    if (max === red) h = ((green - blue) / diff) % 6;
    else if (max === green) h = (blue - red) / diff + 2;
    else h = (red - green) / diff + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(lightness * 100) };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const hue = (((h % 360) + 360) % 360) / 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  if (saturation === 0) {
    const value = Math.round(lightness * 255);
    return { r: value, g: value, b: value };
  }

  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  const hueToRgb = (value: number) => {
    let next = value;
    if (next < 0) next += 1;
    if (next > 1) next -= 1;
    if (next < 1 / 6) return p + (q - p) * 6 * next;
    if (next < 1 / 2) return q;
    if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
    return p;
  };

  return {
    r: Math.round(hueToRgb(hue + 1 / 3) * 255),
    g: Math.round(hueToRgb(hue) * 255),
    b: Math.round(hueToRgb(hue - 1 / 3) * 255),
  };
}

const checkerboardStyle: React.CSSProperties = {
  backgroundImage: 'linear-gradient(45deg, #d4d4d8 25%, transparent 25%), linear-gradient(-45deg, #d4d4d8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d8 75%), linear-gradient(-45deg, transparent 75%, #d4d4d8 75%)',
  backgroundSize: '10px 10px',
  backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
};

const formatColor = (format: PickerFormat, rgb: Rgb, alpha: number): string => {
  if (format === 'rgb') return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  if (format === 'hsl') {
    const hsl = rgbToHsl(rgb);
    return `${hsl.h}, ${hsl.s}%, ${hsl.l}%`;
  }
  return rgbToHex(rgb, alpha).toUpperCase();
};

export const ColorPicker = ({ value = '#7c3aed', onChange, swatches = DEFAULT_SWATCHES, className }: ColorPickerProps) => {
  const parsedValue = parseHex(value) ?? FALLBACK_COLOR;
  const [hsv, setHsv] = React.useState<Hsv>(() => rgbToHsv(parsedValue.rgb));
  const [alpha, setAlpha] = React.useState(parsedValue.alpha);
  const [format, setFormat] = React.useState<PickerFormat>('hex');
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const next = parseHex(value);
    if (!next) return;
    setHsv(rgbToHsv(next.rgb));
    setAlpha(next.alpha);
  }, [value]);

  const rgb = hsvToRgb(hsv);
  const hex = rgbToHex(rgb, alpha);
  const isTransparent = alpha <= 0;
  const emit = (nextHsv: Hsv, nextAlpha: number) => onChange?.(rgbToHex(hsvToRgb(nextHsv), nextAlpha));

  const updatePlane = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const next = {
      ...hsv,
      s: round(clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100), 1),
      v: round(clamp(100 - ((event.clientY - rect.top) / rect.height) * 100, 0, 100), 1),
    };
    setHsv(next);
    emit(next, alpha);
  };

  const selectParsedColor = (next: ParsedColor) => {
    const nextHsv = rgbToHsv(next.rgb);
    setHsv(nextHsv);
    setAlpha(next.alpha);
    emit(nextHsv, next.alpha);
  };

  const handleFormattedInput = (raw: string) => {
    if (format === 'hex') {
      const next = parseHex(raw);
      if (next) selectParsedColor(next);
      return;
    }

    const values = raw.replaceAll('%', '').split(',').map(part => Number(part.trim()));
    if (values.length !== 3 || values.some(Number.isNaN)) return;
    selectParsedColor({
      rgb: format === 'rgb' ? { r: clamp(values[0], 0, 255), g: clamp(values[1], 0, 255), b: clamp(values[2], 0, 255) } : hslToRgb(values[0], values[1], values[2]),
      alpha,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon" className={cn('h-8 w-8 shrink-0 p-1', className)} aria-label="Open color picker">
          <span className="relative h-full w-full overflow-hidden rounded-sm border" style={checkerboardStyle}>
            <span className="absolute inset-0" style={{ backgroundColor: hex }} />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-[min(20rem,calc(100vw-1rem))] space-y-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold">Color</p>
            <p className="text-[10px] text-muted-foreground">Adjust color and transparency</p>
          </div>
          <span className="rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{isTransparent ? 'Transparent' : hex.toUpperCase()}</span>
        </div>

        <div
          className="relative h-44 w-full cursor-crosshair touch-none overflow-hidden rounded-md border"
          style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
          onPointerDown={event => {
            event.currentTarget.setPointerCapture(event.pointerId);
            updatePlane(event);
          }}
          onPointerMove={event => {
            if (event.buttons % 2 === 1) updatePlane(event);
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
          <span className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` }} />
        </div>

        <div className="space-y-2">
          <div className="h-3 overflow-hidden rounded-full border" style={{ background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)' }}>
            <input aria-label="Hue" type="range" min="0" max="360" value={hsv.h} onChange={event => { const next = { ...hsv, h: Number(event.target.value) }; setHsv(next); emit(next, alpha); }} className="h-full w-full cursor-pointer appearance-none bg-transparent accent-primary" />
          </div>
          <div className="h-3 overflow-hidden rounded-full border" style={checkerboardStyle}>
            <input aria-label="Transparency" type="range" min="0" max="100" value={Math.round(alpha * 100)} onChange={event => { const nextAlpha = Number(event.target.value) / 100; setAlpha(nextAlpha); emit(hsv, nextAlpha); }} className="h-full w-full cursor-pointer appearance-none bg-transparent accent-primary" style={{ background: `linear-gradient(to right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1))` }} />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Input aria-label="Color value" value={formatColor(format, rgb, alpha)} onChange={event => handleFormattedInput(event.target.value)} className="h-8 font-mono text-xs" />
          <Select value={format} onValueChange={next => setFormat(next as PickerFormat)}>
            <SelectTrigger className="h-8 w-[76px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hex">Hex</SelectItem>
              <SelectItem value="rgb">RGB</SelectItem>
              <SelectItem value="hsl">HSL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant={isTransparent ? 'secondary' : 'outline'} size="sm" className="h-8 flex-1 text-xs" aria-pressed={isTransparent} onClick={() => { setAlpha(0); emit(hsv, 0); }}>
            Transparent
          </Button>
          <div className="flex gap-1.5">
            {swatches.map(swatch => (
              <button key={swatch} type="button" aria-label={`Select ${swatch}`} className="h-6 w-6 rounded border" style={{ backgroundColor: swatch }} onClick={() => { const next = parseHex(swatch); if (next) selectParsedColor(next); }} />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
