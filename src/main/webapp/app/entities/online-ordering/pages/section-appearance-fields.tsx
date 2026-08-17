import React from 'react';
import { Select as SectionTypeSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { IPageThemeOverride } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { SectionType } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.enums';
import { ColorInputField } from './color-input-field';
import { PropertyEditorGroup } from './property-editor-group';

type AppearanceConfig = Record<string, unknown>;

const appearanceField = (appearance: AppearanceConfig, key: string) =>
  (appearance[key] as string | boolean | undefined) ?? '';

const showTypography = (type: SectionType) =>
  ![SectionType.HERO_CAROUSEL, SectionType.SPACER].includes(type);

const showPadding = (type: SectionType) => type !== SectionType.SPACER;

const showCardFields = (type: SectionType) =>
  [SectionType.FEATURED_ITEMS, SectionType.FEATURE_GRID, SectionType.CATEGORY_STRIP].includes(type);

const showBadgeFields = (type: SectionType) => type === SectionType.FEATURED_ITEMS;

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
  embedded = false,
}: {
  appearance: AppearanceConfig;
  onChange: (next: AppearanceConfig) => void;
  sectionType: SectionType;
  embedded?: boolean;
}) => {
  const set = (key: string, value: unknown) => onChange({ ...appearance, [key]: value });
  const typography = showTypography(sectionType);
  const padding = showPadding(sectionType);
  const cards = showCardFields(sectionType);
  const badges = showBadgeFields(sectionType);

  return (
    <div className={embedded ? 'space-y-2' : 'space-y-2 rounded-md border bg-muted/20 p-2'}>
      {!embedded && <p className="text-xs font-semibold">Section appearance</p>}

      <div className="space-y-2">
        <PropertyEditorGroup title="Surface & spacing" description="Background and vertical rhythm" defaultOpen>
          <div className="landing-editor-fields-grid grid gap-2">
            <ColorInputField
              label="Background"
              placeholder={sectionType === SectionType.SPACER ? '#ffffff' : '#fff8ea'}
              value={String(appearanceField(appearance, 'background') || '')}
              onChange={value => set('background', value)}
            />

            {padding && (
              <div>
                <Label className="text-xs">Section spacing</Label>
                <SectionTypeSelect
                  value={String(appearanceField(appearance, 'paddingY') || 'default')}
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
                value={String(appearanceField(appearance, 'titleColor') || '')}
                onChange={value => set('titleColor', value)}
              />
              <ColorInputField
                label="Eyebrow color"
                placeholder="Uses theme primary"
                value={String(appearanceField(appearance, 'eyebrowColor') || '')}
                onChange={value => set('eyebrowColor', value)}
              />
              <ColorInputField
                label="Subtitle / body color"
                placeholder="#666666"
                value={String(appearanceField(appearance, 'subtitleColor') || '')}
                onChange={value => set('subtitleColor', value)}
              />
              <div>
                <Label className="text-xs">Title font</Label>
                <SectionTypeSelect
                  value={String(appearanceField(appearance, 'titleFont') || 'serif')}
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
                value={String(appearanceField(appearance, 'cardBackground') || '')}
                onChange={value => set('cardBackground', value)}
              />
              {sectionType === SectionType.FEATURED_ITEMS && (
                <ColorInputField
                  label="Card hover background"
                  placeholder="Uses theme secondary"
                  value={String(appearanceField(appearance, 'cardHoverBackground') || '')}
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
                  value={String(appearanceField(appearance, 'badgeLabel') || '')}
                  onChange={e => set('badgeLabel', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Badge style</Label>
                <SectionTypeSelect
                  value={String(appearanceField(appearance, 'badgeVariant') || 'destructive')}
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
  onChange,
}: {
  themeOverride: IPageThemeOverride;
  onChange: (next: IPageThemeOverride) => void;
}) => {
  const set = (key: string, value: string) => onChange({ ...themeOverride, [key]: value });

  return (
    <PropertyEditorGroup
      title="Theme colors"
      description="Optional overrides for this landing page"
      className="landing-editor-wide-field"
      defaultOpen={false}
    >
      <div className="landing-editor-fields-grid grid gap-2">
        <ColorInputField
          label="Primary"
          placeholder="#062f25"
          value={themeOverride.primary ?? ''}
          onChange={value => set('primary', value)}
        />
        <ColorInputField
          label="Secondary"
          placeholder="#0b4638"
          value={themeOverride.secondary ?? ''}
          onChange={value => set('secondary', value)}
        />
        <ColorInputField
          label="Accent"
          placeholder="#f2c94c"
          value={themeOverride.accent ?? ''}
          onChange={value => set('accent', value)}
        />
      </div>
    </PropertyEditorGroup>
  );
};
