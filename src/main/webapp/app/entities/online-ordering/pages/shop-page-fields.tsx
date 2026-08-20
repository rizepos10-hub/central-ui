import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { IAttachment } from 'app/shared/model/attachment.model';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { IPageShopOverride, IPageThemeOverride } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { ColorInputField } from './color-input-field';
import { PropertyEditorGroup } from './property-editor-group';
import { getTemplatePalette } from './page-template-defaults';

type ShopGroup = keyof IPageShopOverride;
type ShopPageFieldsProps = {
  shop: IPageShopOverride;
  templateKey?: string;
  themeOverride?: IPageThemeOverride;
  focus?: ShopGroup;
  onChange: (next: IPageShopOverride) => void;
};

const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value) : '';

export default function ShopPageFields({ shop, templateKey, themeOverride, focus, onChange }: ShopPageFieldsProps) {
  const palette = getTemplatePalette(templateKey, themeOverride);
  const defaults: Record<string, Record<string, string>> = {
    masthead: { background: palette.secondary, backgroundImage: '', foreground: palette.secondaryForeground, paddingY: '3rem', textAlign: 'center' },
    content: { background: palette.background, foreground: palette.foreground, paddingY: '3.5rem', maxWidth: '80rem' },
    sidebar: { background: palette.card, border: palette.border, radius: palette.radius, width: '15rem' },
    toolbar: { background: palette.background, border: palette.border, radius: palette.radius },
    grid: { columns: '3', gap: '1px', background: palette.border, border: palette.border, radius: '0px' },
    card: {
      background: palette.card,
      foreground: palette.cardForeground,
      border: palette.border,
      hoverBackground: palette.muted,
      hoverBorder: palette.primary,
      radius: palette.radius,
      imageBackground: palette.card,
      imageAspect: '1 / 1',
      imagePadding: '1.25rem',
      titleColor: palette.foreground,
      categoryColor: palette.mutedForeground,
      priceColor: palette.primary,
      actionBackground: palette.card,
      actionForeground: palette.cardForeground,
      actionBorder: palette.cardForeground,
      actionRadius: palette.radius,
    },
  };
  const update = (group: ShopGroup, key: string, value: unknown) => {
    const current = asRecord(shop[group]);
    const next = { ...current };
    if (value === undefined || value === '') delete next[key];
    else next[key] = value;
    onChange({ ...shop, [group]: next } as IPageShopOverride);
  };

  const group = (key: ShopGroup) => asRecord(shop[key]);
  const resolved = (groupKey: ShopGroup, key: string, fallback: string) => text(group(groupKey)[key]) || defaults[groupKey]?.[key] || fallback;
  const color = (groupKey: ShopGroup, key: string, label: string, placeholder: string) => (
    <ColorInputField
      label={label}
      value={resolved(groupKey, key, '')}
      placeholder={placeholder}
      onChange={value => update(groupKey, key, value)}
    />
  );
  const input = (groupKey: ShopGroup, key: string, label: string, placeholder: string, fallback = placeholder) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input className="mt-1 h-8 text-xs" value={resolved(groupKey, key, fallback)} placeholder={placeholder} onChange={event => update(groupKey, key, event.target.value)} />
    </div>
  );
  const backgroundImage = (groupKey: ShopGroup) => {
    const value = text(group(groupKey).backgroundImage);
    return (
      <div className="space-y-2 sm:col-span-2">
        <Label>Background image</Label>
        {value ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/20 p-2">
            <img src={value} alt="Shop masthead background" className="h-14 w-24 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-muted-foreground">{value}</p>
              <Button type="button" variant="ghost" className="h-6 px-1 text-[11px]" onClick={() => update(groupKey, 'backgroundImage', '')}>Remove</Button>
            </div>
          </div>
        ) : <p className="text-[11px] text-muted-foreground">Uses the selected background color until an image is added.</p>}
        <MediaLibrary
          layout="compact"
          handleFilesSelectCallback={files => {
            const selected = transformAttachmentStructure(files, 'toIAttachment')[0] as IAttachment | undefined;
            if (selected?.url) update(groupKey, 'backgroundImage', selected.url);
          }}
        />
        {input(groupKey, 'backgroundImage', 'Image URL', 'https://…', '')}
      </div>
    );
  };
  const checkbox = (groupKey: ShopGroup, key: string, label: string, defaultChecked = true) => {
    const value = group(groupKey)[key];
    return (
      <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-2.5 py-2 text-xs">
        <Checkbox checked={typeof value === 'boolean' ? value : defaultChecked} onCheckedChange={next => update(groupKey, key, next === true)} />
        <span>{label}</span>
      </label>
    );
  };
  const select = (groupKey: ShopGroup, key: string, label: string, value: string, options: Array<{ value: string; label: string }>, parse?: (next: string) => unknown) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={resolved(groupKey, key, value)} onValueChange={next => update(groupKey, key, parse ? parse(next) : next)}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );

  const renderGroup = (key: ShopGroup) => {
    if (key === 'masthead') {
      return <PropertyEditorGroup key={key} title="Shop masthead" description="The category-led header above the catalog" defaultOpen>
        <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-2">
          {color(key, 'background', 'Background', 'Uses secondary')}
          {backgroundImage(key)}
          {color(key, 'foreground', 'Text', 'Uses secondary text')}
          {input(key, 'paddingY', 'Vertical spacing', '3rem')}
          {select(key, 'textAlign', 'Text location', 'center', [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }])}
          {checkbox(key, 'showCategories', 'Show category navigation')}
        </div>
      </PropertyEditorGroup>;
    }
    if (key === 'content') {
      return <PropertyEditorGroup key={key} title="Page surface" description="The shop content area and spacing" defaultOpen>
        <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-2">
          {color(key, 'background', 'Background', 'Uses background')}
          {color(key, 'foreground', 'Text', 'Uses foreground')}
          {input(key, 'paddingY', 'Vertical spacing', '3.5rem')}
          {input(key, 'maxWidth', 'Content width', '80rem')}
        </div>
      </PropertyEditorGroup>;
    }
    if (key === 'sidebar') {
      return <PropertyEditorGroup key={key} title="Filters sidebar" description="Shared desktop and mobile filter visibility" defaultOpen>
        <div className="space-y-2">
          {checkbox(key, 'visible', 'Show filters')}
          <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-2">
            {color(key, 'background', 'Surface', 'Uses card')}
            {color(key, 'border', 'Border', 'Uses border')}
            {input(key, 'width', 'Width', '15rem')}
            {input(key, 'radius', 'Corner radius', 'Uses base radius')}
          </div>
        </div>
      </PropertyEditorGroup>;
    }
    if (key === 'toolbar') {
      return <PropertyEditorGroup key={key} title="Search & controls" description="Search, filters, sorting, and result controls" defaultOpen>
        <div className="space-y-2">
          {checkbox(key, 'sticky', 'Keep controls visible while scrolling')}
          <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-2">
            {color(key, 'background', 'Surface', 'Uses background')}
            {color(key, 'border', 'Border', 'Uses border')}
            {input(key, 'radius', 'Corner radius', 'Uses base radius')}
          </div>
        </div>
      </PropertyEditorGroup>;
    }
    if (key === 'grid') {
      return <PropertyEditorGroup key={key} title="Product grid" description="Layout shared by every item card" defaultOpen>
        <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-2">
          {select(key, 'cardLayout', 'Card layout', 'grid', [{ value: 'grid', label: 'Grid cards' }, { value: 'menu', label: 'Horizontal menu cards' }])}
          {select(key, 'columns', 'Columns', '3', [{ value: '1', label: '1 column' }, { value: '2', label: '2 columns' }, { value: '3', label: '3 columns' }, { value: '4', label: '4 columns' }], Number)}
          {input(key, 'gap', 'Card gap', '1px')}
          {input(key, 'radius', 'Grid radius', '0px')}
          {color(key, 'background', 'Grid surface', 'Uses border')}
          {color(key, 'border', 'Grid border', 'Uses border')}
        </div>
      </PropertyEditorGroup>;
    }
    return <PropertyEditorGroup key={key} title="Product cards (repeatable)" description="One change applies to every catalog card" defaultOpen>
      <div className="space-y-2">
        <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-2">
          {color(key, 'background', 'Card surface', 'Uses card')}
          {color(key, 'foreground', 'Card text', 'Uses card text')}
          {color(key, 'border', 'Card border', 'Uses border')}
          {color(key, 'hoverBackground', 'Hover surface', 'Uses muted')}
          {color(key, 'hoverBorder', 'Hover border', 'Uses primary')}
          {input(key, 'radius', 'Corner radius', 'Uses base radius')}
          {color(key, 'imageBackground', 'Image surface', 'Uses card')}
          {input(key, 'imageAspect', 'Image ratio', '1 / 1')}
          {input(key, 'imagePadding', 'Image padding', '1.25rem')}
          {color(key, 'titleColor', 'Title color', 'Uses foreground')}
          {color(key, 'categoryColor', 'Category color', 'Uses muted text')}
          {color(key, 'priceColor', 'Price color', 'Uses primary')}
          {color(key, 'actionBackground', 'Action surface', 'Uses card')}
          {color(key, 'actionForeground', 'Action text', 'Uses card text')}
          {color(key, 'actionBorder', 'Action border', 'Uses card text')}
          {input(key, 'actionRadius', 'Action radius', 'Uses base radius')}
        </div>
        {select(key, 'hoverEffect', 'Hover motion', 'subtle', [{ value: 'none', label: 'None' }, { value: 'subtle', label: 'Subtle' }, { value: 'lift', label: 'Lift' }])}
      </div>
    </PropertyEditorGroup>;
  };

  const groups: ShopGroup[] = focus ? [focus] : ['masthead', 'content', 'sidebar', 'toolbar', 'grid', 'card'];
  return <div className="landing-editor-property-groups grid gap-2">{groups.map(renderGroup)}</div>;
}
