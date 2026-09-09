import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IOnlineOrderingLogo, IFontSetting, addonOptionsVisibilityOptions, currencySymbolPositionOptions, variantsUiLayoutOptions } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { IUiUxSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { changeEntityField, getEntity, updateEntity } from './ui-ux.reducer';

const UiUxSettingsPage = () => {
  const dispatch = useAppDispatch();
  const entity: IUiUxSettings = useAppSelector(state => state.uiUxSettings.entity);
  const loading = useAppSelector(state => state.uiUxSettings.loading);
  const updating = useAppSelector(state => state.uiUxSettings.updating);
  const [fontSettings] = useState<IFontSetting>({
    fontFamily: '',
    fontSize: '',
    fontWeight: '',
    lineHeight: '',
    letterSpacing: '',
  });

  useEffect(() => {
    dispatch(getEntity());
  }, []);

  const handleFontSettingChange = (field: keyof IFontSetting, value: string) => {
    const next = JSON.parse(JSON.stringify(entity?.fontSetting)) || {};
    next[field] = value;
    dispatch(changeEntityField({ name: 'fontSetting', value: next }));
  };

  return (
    <PageWrapper className="max-w-7xl mx-auto">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">UI/UX</h2>
          <p className="text-xs text-muted-foreground">Storefront visuals, colors, typography, and display formatting</p>
        </div>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Storefront visuals</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ui-ux-logo" className="text-xs font-semibold">Logo</Label>
              <MediaLibrary
                handleFilesSelectCallback={files =>
                  dispatch(
                    changeEntityField({
                      name: 'logo',
                      value: {
                        image: transformAttachmentStructure(files, 'toIAttachment')[0],
                        width: entity.logo?.width || 0,
                        height: entity.logo?.height || 0,
                      } as IOnlineOrderingLogo,
                    })
                  )
                }
                defaultValues={transformAttachmentStructure(entity.logo ? [entity.logo.image] : [], 'toFileLibraryListItem')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ui-ux-logo-width" className="text-xs font-semibold">Logo Width</Label>
                <Input
                  id="ui-ux-logo-width"
                  type="number"
                  value={entity.logo?.width?.toString() || ''}
                  onChange={e => dispatch(changeEntityField({ name: 'logo.width', value: parseInt(e.target.value, 10) || 0 }))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ui-ux-logo-height" className="text-xs font-semibold">Logo Height</Label>
                <Input
                  id="ui-ux-logo-height"
                  type="number"
                  value={entity.logo?.height?.toString() || ''}
                  onChange={e => dispatch(changeEntityField({ name: 'logo.height', value: parseInt(e.target.value, 10) || 0 }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="ui-ux-hide-branches"
                checked={entity.hideBranchesSection || false}
                onCheckedChange={checked => dispatch(changeEntityField({ name: 'hideBranchesSection', value: checked === true }))}
              />
              <Label htmlFor="ui-ux-hide-branches" className="text-xs font-semibold">Hide Branches Section</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Grid and variants</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <OptionButtons
              label="Retail Items Per Row"
              options={[1, 2, 3, 4]}
              value={entity.retailItemsPerRow}
              onSelect={value => dispatch(changeEntityField({ name: 'retailItemsPerRow', value }))}
            />
            <OptionButtons
              label="Restaurant Items Per Row"
              options={[1, 2, 3, 4]}
              value={entity.restaurantItemsPerRow}
              onSelect={value => dispatch(changeEntityField({ name: 'restaurantItemsPerRow', value }))}
            />
            <StringOptionButtons
              label="Variants UI Layout"
              options={variantsUiLayoutOptions}
              value={entity.variantsUiLayout}
              onSelect={value => dispatch(changeEntityField({ name: 'variantsUiLayout', value }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Display & formatting</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Toggle id="hide-item-description" label="Hide Item Description" checked={entity.hideItemDescription || false} onCheckedChange={value => dispatch(changeEntityField({ name: 'hideItemDescription', value }))} />
            <Toggle id="hide-modal-description" label="Hide Modal Description" checked={entity.hideModalDescription || false} onCheckedChange={value => dispatch(changeEntityField({ name: 'hideModalDescription', value }))} />
            <Toggle id="hide-category-description" label="Hide Category Description" checked={entity.hideCategoryDescription || false} onCheckedChange={value => dispatch(changeEntityField({ name: 'hideCategoryDescription', value }))} />
            <Toggle id="show-category-images" label="Show Category Images" checked={entity.showCategoryImages || false} onCheckedChange={value => dispatch(changeEntityField({ name: 'showCategoryImages', value }))} />
            <StringOptionButtons
              label="Currency Symbol Position"
              options={currencySymbolPositionOptions}
              value={entity.currencySymbolPosition}
              onSelect={value => dispatch(changeEntityField({ name: 'currencySymbolPosition', value }))}
            />
            <StringOptionButtons
              label="Addon Options Visibility"
              options={addonOptionsVisibilityOptions}
              value={entity.addonOptionsVisibility}
              onSelect={value => dispatch(changeEntityField({ name: 'addonOptionsVisibility', value }))}
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="digits-after-decimal" className="text-xs font-semibold">Digits After Decimal</Label>
              <Input
                id="digits-after-decimal"
                type="number"
                value={entity.digitsAfterDecimal ?? ''}
                onChange={e => dispatch(changeEntityField({ name: 'digitsAfterDecimal', value: parseInt(e.target.value, 10) || 0 }))}
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Colors</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs text-muted-foreground">
            Colors are configured per landing page in the landing page editor, so each page and template can use its own palette.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Typography</CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(fontSettings).map(key => (
              <div className="flex flex-col gap-2" key={key}>
                <Label className="text-xs font-semibold">{key}</Label>
                <Input
                  value={entity?.fontSetting?.[key] || ''}
                  onChange={e => handleFontSettingChange(key as keyof IFontSetting, e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="h-8 text-xs" disabled={loading || updating} onClick={() => dispatch(updateEntity(entity))}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

const Toggle = ({ id, label, checked, onCheckedChange }: { id: string; label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
  <div className="flex items-center gap-2">
    <Checkbox id={id} checked={checked} onCheckedChange={value => onCheckedChange(value === true)} />
    <Label htmlFor={id} className="text-xs font-semibold">{label}</Label>
  </div>
);

const OptionButtons = ({ label, options, value, onSelect }: { label: string; options: number[]; value?: number; onSelect: (value: number) => void }) => (
  <div className="flex flex-col gap-2">
    <Label className="text-xs font-semibold">{label}</Label>
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <Button key={option} type="button" variant={value === option ? 'default' : 'outline'} className="h-8 text-xs" onClick={() => onSelect(option)}>
          {option}
        </Button>
      ))}
    </div>
  </div>
);

const StringOptionButtons = ({ label, options, value, onSelect }: { label: string; options: string[]; value?: string; onSelect: (value: string) => void }) => (
  <div className="flex flex-col gap-2">
    <Label className="text-xs font-semibold">{label}</Label>
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <Button key={option} type="button" variant={value === option ? 'default' : 'outline'} className="h-8 text-xs" onClick={() => onSelect(option)}>
          {option}
        </Button>
      ))}
    </div>
  </div>
);

export default UiUxSettingsPage;
