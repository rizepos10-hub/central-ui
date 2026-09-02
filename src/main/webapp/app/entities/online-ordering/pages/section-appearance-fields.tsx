import React from 'react';
import { Select as SectionTypeSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { IPageThemeOverride } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { SectionType } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.enums';
import { ColorInputField } from './color-input-field';
import { PropertyEditorGroup } from './property-editor-group';
import { getHeroBoxModelDefaults, getSectionAppearanceDefaults, getTemplatePalette } from './page-template-defaults';

type AppearanceConfig = Record<string, unknown>;

const showTypography = (type: SectionType) =>
  ![SectionType.HERO_CAROUSEL, SectionType.SPACER].includes(type);

const showPadding = (type: SectionType) => type !== SectionType.SPACER;

const showCardFields = (type: SectionType) =>
  [SectionType.FEATURED_ITEMS, SectionType.FEATURE_GRID, SectionType.CATEGORY_STRIP].includes(type);

const showBadgeFields = (type: SectionType) => type === SectionType.FEATURED_ITEMS;

const HERO_BOX_MODEL_FIELDS = [
  ['marginTop', 'Top'],
  ['marginRight', 'Right'],
  ['marginBottom', 'Bottom'],
  ['marginLeft', 'Left'],
] as const;

const HERO_PADDING_FIELDS = [
  ['paddingTop', 'Top'],
  ['paddingRight', 'Right'],
  ['paddingBottom', 'Bottom'],
  ['paddingLeft', 'Left'],
] as const;

const numberText = (value: unknown): string => typeof value === 'number' && Number.isFinite(value) ? String(value) : '';

function HeroDimensionField({ label, value, placeholder, min, onChange }: { label: string; value: unknown; placeholder: string; min: number; onChange: (value: number | undefined) => void }) {
  return (
    <div>
      <Label className="text-[11px]">{label}</Label>
      <Input
        type="number"
        min={min}
        value={numberText(value)}
        placeholder={placeholder}
        className="h-8 text-xs"
        onChange={event => onChange(event.target.value === '' ? undefined : Number(event.target.value))}
      />
    </div>
  );
}

export const defaultSectionAppearance = (): AppearanceConfig => ({
  titleFont: 'serif',
  paddingY: 'default',
  showBadge: true,
  badgeVariant: 'destructive',
  badgeLabel: 'HOT',
});

export const SectionAppearanceFields = ({
  appearance,
  onChange,
  sectionType,
  templateKey,
  themeOverride,
  sectionConfig,
  embedded = false,
}: {
  appearance: AppearanceConfig;
  onChange: (next: AppearanceConfig) => void;
  sectionType: SectionType;
  templateKey?: string;
  themeOverride?: IPageThemeOverride;
  sectionConfig?: Record<string, unknown>;
  embedded?: boolean;
}) => {
  const set = (key: string, value: unknown) => onChange({ ...appearance, [key]: value });
  const defaults = getSectionAppearanceDefaults(templateKey, themeOverride, sectionType, sectionConfig);
  const valueFor = (key: string, fallback = '') => appearance[key] ?? defaults[key] ?? fallback;
  const typography = showTypography(sectionType);
  const padding = showPadding(sectionType);
  const cards = showCardFields(sectionType);
  const badges = showBadgeFields(sectionType);
  const heroVariant = String(sectionConfig?.variant ?? 'hero');
  const heroBoxDefaults = getHeroBoxModelDefaults(heroVariant);
  const heroBoxValue = (key: string) => appearance[key] ?? heroBoxDefaults[key] ?? '';

  return (
    <div className={embedded ? 'space-y-2' : 'space-y-2 rounded-md border bg-muted/20 p-2'}>
      {!embedded && <p className="text-xs font-semibold">Section appearance</p>}

      <div className="space-y-2">
        {sectionType === SectionType.HERO_BANNER && (
          <PropertyEditorGroup title="Hero frame" description="Control the banner box without changing its fixed template" defaultOpen={false}>
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Margin (px)</p>
                <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-4">
                  {HERO_BOX_MODEL_FIELDS.map(([key, label]) => (
                    <HeroDimensionField
                      key={key}
                      label={label}
                      value={heroBoxValue(key)}
                      placeholder={String(heroBoxDefaults[key])}
                      min={-240}
                      onChange={value => set(key, value)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Padding (px)</p>
                <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-4">
                  {HERO_PADDING_FIELDS.map(([key, label]) => (
                    <HeroDimensionField
                      key={key}
                      label={label}
                      value={heroBoxValue(key)}
                      placeholder={String(heroBoxDefaults[key])}
                      min={0}
                      onChange={value => set(key, value)}
                    />
                  ))}
                </div>
              </div>
              <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-2">
                <HeroDimensionField
                  label="Corner radius"
                  value={heroBoxValue('borderRadius')}
                  placeholder={String(heroBoxDefaults.borderRadius)}
                  min={0}
                  onChange={value => set('borderRadius', value)}
                />
                <div>
                  <Label className="text-[11px]">Shadow</Label>
                  <SectionTypeSelect value={String(appearance.boxShadow ?? 'none')} onValueChange={value => set('boxShadow', value === 'none' ? undefined : value)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="0 10px 30px rgba(15, 23, 42, 0.12)">Soft</SelectItem>
                      <SelectItem value="0 24px 60px rgba(15, 23, 42, 0.2)">Strong</SelectItem>
                    </SelectContent>
                  </SectionTypeSelect>
                </div>
              </div>
            </div>
          </PropertyEditorGroup>
        )}

        <PropertyEditorGroup title="Surface & spacing" description="Background and vertical rhythm" defaultOpen>
          <div className="landing-editor-fields-grid grid gap-2">
            <ColorInputField
              label="Background"
              placeholder={sectionType === SectionType.SPACER ? '#ffffff' : '#fff8ea'}
              value={String(valueFor('background', sectionType === SectionType.SPACER ? '#ffffff' : '#fff8ea') || '')}
              onChange={value => set('background', value)}
            />

            {padding && (
              <div>
                <Label className="text-xs">Section spacing</Label>
                <SectionTypeSelect
                  value={String(valueFor('paddingY', 'default') || 'default')}
                  onValueChange={value => set('paddingY', value)}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </SectionTypeSelect>
              </div>
            )}
          </div>
        </PropertyEditorGroup>

        {typography && (
          <PropertyEditorGroup title="Typography" description="Type, headings, and supporting copy" defaultOpen>
            <div className="landing-editor-fields-grid grid gap-2">
              <ColorInputField
                label="Title color"
                placeholder="#101010"
                value={String(valueFor('titleColor', '#101010') || '')}
                onChange={value => set('titleColor', value)}
              />
              <ColorInputField
                label="Eyebrow color"
                placeholder="Uses theme primary"
                value={String(valueFor('eyebrowColor', '#062f25') || '')}
                onChange={value => set('eyebrowColor', value)}
              />
              <ColorInputField
                label="Subtitle / body color"
                placeholder="#666666"
                value={String(valueFor('subtitleColor', '#666666') || '')}
                onChange={value => set('subtitleColor', value)}
              />
              <div>
                <Label className="text-xs">Title font</Label>
                <SectionTypeSelect
                  value={String(valueFor('titleFont', 'serif') || 'serif')}
                  onValueChange={value => set('titleFont', value)}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="sans">Sans</SelectItem>
                  </SelectContent>
                </SectionTypeSelect>
              </div>
            </div>
          </PropertyEditorGroup>
        )}

        {cards && (
          <PropertyEditorGroup title="Cards" description="Card surfaces and hover treatment" defaultOpen>
            <div className="landing-editor-fields-grid grid gap-2">
              <ColorInputField
                label="Card background"
                placeholder="#ffffff"
                value={String(valueFor('cardBackground', '#ffffff') || '')}
                onChange={value => set('cardBackground', value)}
              />
              {sectionType === SectionType.FEATURED_ITEMS && (
                <ColorInputField
                  label="Card hover background"
                  placeholder="Uses theme secondary"
                  value={String(valueFor('cardHoverBackground', '#0b4638') || '')}
                  onChange={value => set('cardHoverBackground', value)}
                />
              )}
            </div>
          </PropertyEditorGroup>
        )}

        {badges && (
          <PropertyEditorGroup title="Item badge" description="Optional featured-item marker" defaultOpen={false}>
            <div className="landing-editor-fields-grid grid gap-2">
              <div>
                <Label className="text-xs">Badge label</Label>
                <Input
                  placeholder="HOT"
                  value={String(valueFor('badgeLabel', 'HOT') || '')}
                  onChange={e => set('badgeLabel', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Badge style</Label>
                <SectionTypeSelect
                  value={String(valueFor('badgeVariant', 'destructive') || 'destructive')}
                  onValueChange={value => set('badgeVariant', value)}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="destructive">Red (destructive)</SelectItem>
                    <SelectItem value="default">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="none">Hidden</SelectItem>
                  </SelectContent>
                </SectionTypeSelect>
              </div>
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs">
              <Checkbox
                checked={appearance.showBadge !== false}
                onCheckedChange={checked => set('showBadge', checked === true)}
              />
              <span>Show item badge</span>
            </label>
          </PropertyEditorGroup>
        )}
      </div>
    </div>
  );
};

export const PageThemeOverrideFields = ({
  themeOverride,
  templateKey,
  onChange,
}: {
  themeOverride: IPageThemeOverride;
  templateKey?: string;
  onChange: (next: IPageThemeOverride) => void;
}) => {
  const set = (key: keyof IPageThemeOverride, value: string) => onChange({ ...themeOverride, [key]: value });
  const defaults = getTemplatePalette(templateKey, themeOverride);
  const colorField = (key: keyof IPageThemeOverride, label: string) => (
    <ColorInputField
      key={key}
      id={`theme-${key}`}
      label={label}
      placeholder={defaults[key]}
      value={themeOverride[key] || defaults[key]}
      onChange={value => set(key, value)}
    />
  );
  const textField = (key: keyof IPageThemeOverride, label: string, placeholder?: string) => (
    <div key={key}>
      <Label htmlFor={`theme-${key}`} className="text-xs">{label}</Label>
      <Input
        id={`theme-${key}`}
        value={themeOverride[key] || defaults[key]}
        placeholder={placeholder || defaults[key]}
        onChange={event => set(key, event.target.value)}
        className="mt-1 h-8 text-xs"
      />
    </div>
  );

  return (
    <div className="space-y-2">
      <PropertyEditorGroup
        title="Theme colors"
        description="Every shadcn token used by this page"
        className="landing-editor-wide-field"
        defaultOpen
      >
        <div className="space-y-2">
          <PropertyEditorGroup title="Surface & text" description="Page, card, popover, and muted surfaces" defaultOpen>
            <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-2">
              {colorField('background', 'Page background')}
              {colorField('foreground', 'Page text')}
              {colorField('card', 'Card background')}
              {colorField('cardForeground', 'Card text')}
              {colorField('popover', 'Popover background')}
              {colorField('popoverForeground', 'Popover text')}
              {colorField('muted', 'Muted background')}
              {colorField('mutedForeground', 'Muted text')}
            </div>
          </PropertyEditorGroup>

          <PropertyEditorGroup title="Controls & feedback" description="Actions, inputs, borders, focus, and feedback states" defaultOpen>
            <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-2">
              {colorField('primary', 'Primary')}
              {colorField('primaryForeground', 'Primary text')}
              {colorField('secondary', 'Secondary')}
              {colorField('secondaryForeground', 'Secondary text')}
              {colorField('accent', 'Accent')}
              {colorField('accentForeground', 'Accent text')}
              {colorField('destructive', 'Destructive')}
              {colorField('destructiveForeground', 'Destructive text')}
              {colorField('border', 'Border')}
              {colorField('input', 'Input border')}
              {colorField('ring', 'Focus ring')}
            </div>
          </PropertyEditorGroup>

          <PropertyEditorGroup title="Charts" description="Chart 1–5 palette" defaultOpen={false}>
            <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-2">
              {colorField('chart1', 'Chart 1')}
              {colorField('chart2', 'Chart 2')}
              {colorField('chart3', 'Chart 3')}
              {colorField('chart4', 'Chart 4')}
              {colorField('chart5', 'Chart 5')}
            </div>
          </PropertyEditorGroup>

          <PropertyEditorGroup title="Sidebar" description="Sidebar surface, actions, borders, and focus" defaultOpen={false}>
            <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-2">
              {colorField('sidebarBackground', 'Background')}
              {colorField('sidebarForeground', 'Foreground')}
              {colorField('sidebarPrimary', 'Primary')}
              {colorField('sidebarPrimaryForeground', 'Primary text')}
              {colorField('sidebarAccent', 'Accent')}
              {colorField('sidebarAccentForeground', 'Accent text')}
              {colorField('sidebarBorder', 'Border')}
              {colorField('sidebarRing', 'Focus ring')}
            </div>
          </PropertyEditorGroup>
        </div>
      </PropertyEditorGroup>

      <PropertyEditorGroup title="Typography" description="Font family and reading rhythm" defaultOpen>
        <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-2">
          {textField('fontFamily', 'Font family', 'Inter, system-ui, sans-serif')}
          {textField('headingFontFamily', 'Heading family', 'Inter, system-ui, sans-serif')}
          {textField('fontSize', 'Base size', '16px')}
          {textField('fontWeight', 'Base weight', '400')}
          {textField('lineHeight', 'Line height', '1.5')}
          {textField('letterSpacing', 'Letter spacing', '0.05em')}
        </div>
      </PropertyEditorGroup>

      <PropertyEditorGroup title="Other" description="Shared component shape" defaultOpen>
        <div className="landing-editor-fields-grid grid gap-2 sm:grid-cols-2">
          {textField('radius', 'Base radius', '0.5rem')}
        </div>
      </PropertyEditorGroup>
    </div>
  );
};
