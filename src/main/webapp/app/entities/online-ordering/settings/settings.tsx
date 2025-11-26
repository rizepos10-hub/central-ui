import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, reset, changeEntityField } from './settings.reducer';
import {
  currencySymbolPositionOptions,
  IFontSetting,
  ISocialProfiles,
  IUiSettings,
  orderTakingOptions
} from "app/shared/model/ONLINE_ORDERING/ui-setting.model";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { Editor } from 'primereact/editor';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { ColorPicker } from 'primereact/colorpicker';
import { hexToHSL, hslToHex } from 'app/shared/util/color-utils';
import { ISocialProfile } from 'app/shared/model/ONLINE_ORDERING/social-profile';
import SeoTags from 'app/shared/components/item/seo-tags';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { ScriptSnippets } from './components/script-snippets';

export const UiSettingsUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const UiSettingsEntity: IUiSettings = useAppSelector(state => state.uiSettings.entity);
  const loading = useAppSelector(state => state.uiSettings.loading);
  const updating = useAppSelector(state => state.uiSettings.updating);
  const updateSuccess = useAppSelector(state => state.uiSettings.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);

  const [fontSettings, setFontSettings] = useState<IFontSetting>({
    fontFamily: '',
    fontSize: '',
    fontWeight: '',
    lineHeight: '',
    letterSpacing: ''
  });


  useEffect(() => {
    dispatch(getEntity());
    dispatch(getBranches({}));
  }, []);

  const saveEntity = (e) => {
    e.preventDefault();
    dispatch(updateEntity(UiSettingsEntity));
  };

  const quillHeader = (
    <span className="ql-formats">
      <select className="ql-size">
        <option value="small"></option>
        <option selected></option>
        <option value="large"></option>
        <option value="huge"></option>
      </select>
      <button className="ql-bold"></button>
      <button className="ql-italic"></button>
      <button className="ql-underline"></button>
      <select className="ql-color"></select>
      <button className="ql-align" value=""></button>
      <button className="ql-align" value="center"></button>
      <button className="ql-align" value="right"></button>
      <button className="ql-list" value="bullet"></button>
    </span>
  );

  const handleBranchHideRetailShop = (branchIndex, checked, branchId) => {
    const newData = JSON.parse(JSON.stringify(UiSettingsEntity?.branchDetail));
    newData[branchIndex] = {
      ...newData[branchIndex],
      hideRetailShop: checked,
      branchId,
    };
    console.log(branchIndex)
    console.log(newData)
    dispatch(changeEntityField({ name: 'branchDetail', value: newData }));
  };

  const handleColorSettingChange = (field, value, isHex = false) => {
    const newData = JSON.parse(JSON.stringify(UiSettingsEntity?.colorSetting)) || {};
    
    // Auto-detect hex colors and convert them to HSL
    let processedValue = value;
    if (!isHex && typeof value === 'string') {
      // Check if the value is a hex color (with or without #)
      const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (hexRegex.test(value)) {
        // Add # if it's missing
        const hexValue = value.startsWith('#') ? value : `#${value}`;
        processedValue = hexToHSL(hexValue);
      }
    } else if (isHex) {
      processedValue = hexToHSL(value);
    }
    
    newData[field] = processedValue;
    dispatch(changeEntityField({ name: 'colorSetting', value: newData }));
  };

  const handlefontSettingChange = (field, value) => {
    const newData = JSON.parse(JSON.stringify(UiSettingsEntity?.fontSetting)) || {};
    newData[field] = value;
    dispatch(changeEntityField({ name: 'fontSetting', value: newData }));
  };

  const handleCustomThemeSelector = (theme) => {
    const newData = JSON.parse(JSON.stringify(UiSettingsEntity?.colorSetting)) || {};
    Object.keys(theme).forEach(key => {
      newData[key] = theme[key];
    });
    dispatch(changeEntityField({ name: 'colorSetting', value: newData }));
  };

  const updateHomeSeo = (index, fieldName, value) => {
    const branchDetail = UiSettingsEntity?.branchDetail || [];
    const newData = JSON.parse(JSON.stringify(branchDetail));
    if (newData.length <= index) {
      for (let i = newData.length; i <= index; i++) {
        newData.push({ pages: {} });
      }
    }
    newData[index].pages = newData[index].pages || {};
    newData[index].pages.home = newData[index].pages.home || {};
    newData[index].pages.home[fieldName] = value;
    dispatch(changeEntityField({ name: 'branchDetail', value: newData }));
  };

  const updateRetailSeo = (index, fieldName, value) => {
    const branchDetail = UiSettingsEntity?.branchDetail || [];
    const newData = JSON.parse(JSON.stringify(branchDetail));
    if (newData.length <= index) {
      for (let i = newData.length; i <= index; i++) {
        newData.push({ pages: {} });
      }
    }
    newData[index].pages = newData[index].pages || {};
    newData[index].pages.retail = newData[index].pages.retail || {};
    newData[index].pages.retail[fieldName] = value;
    dispatch(changeEntityField({ name: 'branchDetail', value: newData }));
  };

  const updateRestaurantSeo = (index, fieldName, value) => {
    const branchDetail = UiSettingsEntity?.branchDetail || [];
    const newData = JSON.parse(JSON.stringify(branchDetail));
    if (newData.length <= index) {
      for (let i = newData.length; i <= index; i++) {
        newData.push({ pages: {} });
      }
    }
    newData[index].pages = newData[index].pages || {};
    newData[index].pages.restaurant = newData[index].pages.restaurant || {};
    newData[index].pages.restaurant[fieldName] = value;
    dispatch(changeEntityField({ name: 'branchDetail', value: newData }));
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Edit UI Settings</h2>

        <div className="bg-card p-4 rounded-lg border">
          {loading ? (
            <p className="text-xs">Loading...</p>
          ) : (
            <div className="space-y-4">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="h-9">
                  <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
                  <TabsTrigger value="social" className="text-xs">Social Profiles</TabsTrigger>
                  <TabsTrigger value="order" className="text-xs">Order / SEO</TabsTrigger>
                  <TabsTrigger value="ui" className="text-xs">UI/UX</TabsTrigger>
                  <TabsTrigger value="visibility" className="text-xs">Visibility & Formatting</TabsTrigger>
                  <TabsTrigger value="scripts" className="text-xs">Script Snippets</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-3 mt-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="UiSettings-applicationName" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.applicationName')}
                    </Label>
                    <Input
                      id="UiSettings-applicationName"
                      value={UiSettingsEntity.applicationName || ''}
                      onChange={e => dispatch(changeEntityField({ name: 'applicationName', value: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="UiSettings-domain" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.domain')}
                    </Label>
                    <Input
                      id="UiSettings-domain"
                      value={UiSettingsEntity.domain || ''}
                      onChange={e => dispatch(changeEntityField({ name: 'domain', value: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="UiSettings-email" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.email')}
                    </Label>
                    <Input
                      id="UiSettings-email"
                      value={UiSettingsEntity.email || ''}
                      onChange={e => dispatch(changeEntityField({ name: 'email', value: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="UiSettings-phoneNumber" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.phoneNumber')}
                    </Label>
                    <Input
                      id="UiSettings-phoneNumber"
                      value={UiSettingsEntity.phoneNumber || ''}
                      onChange={e => dispatch(changeEntityField({ name: 'phoneNumber', value: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="UiSettings-address" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.address')}
                    </Label>
                    <Input
                      id="UiSettings-address"
                      value={UiSettingsEntity.address || ''}
                      onChange={e => dispatch(changeEntityField({ name: 'address', value: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="UiSettings-cookie" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.cookie')}
                    </Label>
                    <Input
                      id="UiSettings-cookie"
                      value={UiSettingsEntity.cookie || ''}
                      onChange={e => dispatch(changeEntityField({ name: 'cookie', value: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="UiSettings-privacyPolicy" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.privacyPolicy')}
                    </Label>
                    <Editor
                      value={UiSettingsEntity.privacyPolicy || null}
                      onTextChange={e => dispatch(changeEntityField({ name: 'privacyPolicy', value: e.htmlValue }))}
                      style={{
                        minHeight: '400px',
                      }}
                      headerTemplate={quillHeader}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="social" className="space-y-3 mt-4">
                  <SocialProfiles socialProfiles={UiSettingsEntity.socialProfiles} />
                </TabsContent>

                <TabsContent value="order" className="space-y-3 mt-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="UiSettings-orderTaking" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.orderTaking')}
                    </Label>
                    <div className="flex gap-2">
                      {orderTakingOptions.map((option) => (
                        <Button
                          key={option}
                          type="button"
                          variant={UiSettingsEntity.orderTaking === option ? 'default' : 'outline'}
                          className="h-8 text-xs"
                          onClick={() => dispatch(changeEntityField({ name: 'orderTaking', value: option }))}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="UiSettings-orderConfirmation"
                      checked={UiSettingsEntity.orderConfirmation || false}
                      onCheckedChange={checked => dispatch(changeEntityField({ name: 'orderConfirmation', value: checked }))}
                    />
                    <Label htmlFor="UiSettings-orderConfirmation" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.orderConfirmation')}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="UiSettings-guestCheckout"
                      checked={UiSettingsEntity.guestCheckout || false}
                      onCheckedChange={checked => dispatch(changeEntityField({ name: 'guestCheckout', value: checked }))}
                    />
                    <Label htmlFor="UiSettings-guestCheckout" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.guestCheckout')}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="UiSettings-canOrder"
                      checked={UiSettingsEntity.canOrder || false}
                      onCheckedChange={checked => dispatch(changeEntityField({ name: 'canOrder', value: checked }))}
                    />
                    <Label htmlFor="UiSettings-canOrder" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.canOrder')}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="UiSettings-canOrderOutOfStock"
                      checked={UiSettingsEntity.canOrderOutOfStock || false}
                      onCheckedChange={checked => dispatch(changeEntityField({ name: 'canOrderOutOfStock', value: checked }))}
                    />
                    <Label htmlFor="UiSettings-canOrderOutOfStock" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.canOrderOutOfStock')}
                    </Label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Tabs defaultValue={branchList?.[0]?.id?.toString()} className="w-full">
                      <TabsList className="h-9 overflow-x-auto flex-nowrap">
                        {branchList?.map((branch, index) => (
                          <TabsTrigger key={branch.id} value={branch.id.toString()} className="text-xs">
                            {branch.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {branchList?.map((branch, index) => (
                        <TabsContent key={branch.id} value={branch.id.toString()} className="space-y-3">
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={UiSettingsEntity?.branchDetail?.[index]?.hideRetailShop || false}
                                onCheckedChange={(checked) => handleBranchHideRetailShop(index, checked, branch.id)}
                              />
                              <Label className="text-xs font-semibold">Hide Retail Shop</Label>
                            </div>

                            <div>
                              <Label className="text-xs font-semibold">Retail Seo</Label>
                              <SeoTags
                                field={UiSettingsEntity?.branchDetail?.[index]?.pages?.retail}
                                onFieldChange={(field, value) => updateRetailSeo(index, field, value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold">Restaurant Seo</Label>
                              <SeoTags
                                field={UiSettingsEntity?.branchDetail?.[index]?.pages?.restaurant}
                                onFieldChange={(field, value) => updateRestaurantSeo(index, field, value)}
                              />
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                </TabsContent>

                <TabsContent value="ui" className="space-y-3 mt-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="UiSettings-logo" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.logo')}
                    </Label>
                    <MediaLibrary
                      handleFilesSelectCallback={files =>
                        dispatch(
                          changeEntityField({
                            name: 'logo',
                            value: transformAttachmentStructure(files, 'toIAttachment')[0],
                          })
                        )
                      }
                      defaultValues={transformAttachmentStructure(
                        UiSettingsEntity.logo ? [UiSettingsEntity.logo] : [],
                        'toFileLibraryListItem'
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="UiSettings-hideBranchesSection"
                      checked={UiSettingsEntity.hideBranchesSection || false}
                      onCheckedChange={checked => dispatch(changeEntityField({ name: 'hideBranchesSection', value: checked }))}
                    />
                    <Label htmlFor="UiSettings-hideBranchesSection" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.hideBranchesSection')}
                    </Label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="UiSettings-retailItemsPerRow" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.retailItemsPerRow')}
                    </Label>
                    <Select
                      value={UiSettingsEntity.retailItemsPerRow?.toString() || ''}
                      onValueChange={(value) =>
                        dispatch(changeEntityField({ name: 'retailItemsPerRow', value: parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="UiSettings-restaurantItemsPerRow" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.restaurantItemsPerRow')}
                    </Label>
                    <Select
                      value={UiSettingsEntity.restaurantItemsPerRow?.toString() || ''}
                      onValueChange={(value) =>
                        dispatch(changeEntityField({ name: 'restaurantItemsPerRow', value: parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted rounded-lg p-4 border space-y-3">
                    <h5 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <i className="fas fa-palette"></i>
                      {translate('tempApp.UiSettings.colorSetting.title')}
                    </h5>

                    <PremadeColorThemes handleCustomThemeSelector={handleCustomThemeSelector} />

                    {UiSettingsEntity?.colorSetting && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.keys(UiSettingsEntity.colorSetting).map(key => (
                          <div
                            key={key}
                            className="bg-card rounded-md p-3 border shadow-sm"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className="w-6 h-6 rounded border-2"
                                style={{
                                  backgroundColor: UiSettingsEntity && typeof UiSettingsEntity.colorSetting[key] === 'string'
                                    ? `hsl(${UiSettingsEntity.colorSetting[key]})`
                                    : '#000000'
                                }}
                              />
                              <Label
                                htmlFor={`UiSettings-colorSetting.${key}`}
                                className="text-xs font-semibold flex-1"
                              >
                                {translate(`tempApp.UiSettings.colorSetting.${key}`)}
                              </Label>
                            </div>

                            <div className="flex gap-2 items-center">
                              <Input
                                id={`UiSettings-colorSetting.${key}`}
                                value={UiSettingsEntity.colorSetting[key] || ''}
                                onChange={(e) => handleColorSettingChange(key, e.target.value)}
                                className="h-7 text-xs flex-1 font-mono"
                                placeholder="HSL value (e.g., 0 0% 100%) or hex color (e.g., #ffffff)"
                              />

                              <ColorPicker
                                value={
                                  UiSettingsEntity && typeof UiSettingsEntity.colorSetting[key] === 'string'
                                    ? hslToHex(UiSettingsEntity.colorSetting[key])
                                    : '#000000'
                                }
                                onChange={(e) => handleColorSettingChange(key, e.value, true)}
                                className="border rounded"
                              />
                            </div>

                            <div className="mt-2 text-xs text-muted-foreground italic">
                              HSL format: hue saturation% lightness% (hex colors auto-convert)
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold">
                      {translate('tempApp.UiSettings.fontSetting.title')}
                    </h2>
                    {Object.keys(fontSettings).map(key => (
                      <div className="flex flex-col gap-2" key={key}>
                        <Label htmlFor={`UiSettings-fontSetting.${key}`} className="text-xs font-semibold">
                          {translate(`tempApp.UiSettings.fontSetting.${key}`)}
                        </Label>
                        <Input
                          id={`UiSettings-fontSetting.${key}`}
                          value={UiSettingsEntity?.fontSetting?.[key] || ''}
                          onChange={(e) => handlefontSettingChange(key, e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="visibility" className="space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="UiSettings-hideItemDescription"
                      checked={UiSettingsEntity.hideItemDescription || false}
                      onCheckedChange={checked => dispatch(changeEntityField({ name: 'hideItemDescription', value: checked }))}
                    />
                    <Label htmlFor="UiSettings-hideItemDescription" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.hideItemDescription')}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="UiSettings-hideModalDescription"
                      checked={UiSettingsEntity.hideModalDescription || false}
                      onCheckedChange={checked => dispatch(changeEntityField({ name: 'hideModalDescription', value: checked }))}
                    />
                    <Label htmlFor="UiSettings-hideModalDescription" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.hideModalDescription')}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="UiSettings-showDeliveryTips"
                      checked={UiSettingsEntity.showDeliveryTips || false}
                      onCheckedChange={checked => dispatch(changeEntityField({ name: 'showDeliveryTips', value: checked }))}
                    />
                    <Label htmlFor="UiSettings-showDeliveryTips" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.showDeliveryTips')}
                    </Label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="UiSettings-currencySymbolPosition" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.currencySymbolPosition')}
                    </Label>
                    <div className="flex gap-2">
                      {currencySymbolPositionOptions.map((option) => (
                        <Button
                          key={option}
                          type="button"
                          variant={UiSettingsEntity.currencySymbolPosition === option ? 'default' : 'outline'}
                          className="h-8 text-xs"
                          onClick={() => dispatch(changeEntityField({ name: 'currencySymbolPosition', value: option }))}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="UiSettings-digitsAfterDecimal" className="text-xs font-semibold">
                      {translate('tempApp.UiSettings.digitsAfterDecimal')}
                    </Label>
                    <Input
                      id="UiSettings-digitsAfterDecimal"
                      type="number"
                      value={UiSettingsEntity.digitsAfterDecimal ?? ''}
                      onChange={e => dispatch(changeEntityField({ name: 'digitsAfterDecimal', value: parseInt(e.target.value) ?? 0 }))}
                      className="h-7 text-xs"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="scripts" className="space-y-3 mt-4">
                  <ScriptSnippets
                    snippets={UiSettingsEntity.scriptSnippets || []}
                    onChange={(snippets) => dispatch(changeEntityField({ name: 'scriptSnippets', value: snippets }))}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  asChild
                  variant="outline"
                  className="h-8 text-xs"
                >
                  <Link to="/online-ordering/settings">
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </Link>
                </Button>
                <Button
                  type="button"
                  disabled={updating}
                  className="h-8 text-xs"
                  onClick={saveEntity}
                >
                  <Save className="h-3 w-3 mr-1" />
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

const SocialProfiles = ({
  socialProfiles
}: {
  socialProfiles: ISocialProfiles | null
}) => {
  const dispatch = useAppDispatch();
  const handleChange = (field: keyof ISocialProfiles, value: string) => {
    // Handle null case by defaulting to an empty object
    const currentSocialProfiles = socialProfiles || {};
    const currentField = currentSocialProfiles[field] || {};
    const newSocialProfilesValues = {
      ...currentSocialProfiles,
      [field]: {
        ...currentField,
        url: value,
        name: field
      }
    };
    dispatch(changeEntityField({ name: "socialProfiles", value: newSocialProfilesValues }));
  };

  const socials = [
    { key: 'INSTAGRAM', label: 'Instagram' },
    { key: 'FACEBOOK', label: 'Facebook' },
    { key: 'TIKTOK', label: 'Tiktok' },
    { key: 'TWITTER', label: 'Twitter' },
    { key: 'YOUTUBE', label: 'Youtube' },
    { key: 'LINKEDIN', label: 'Linkedin' }
  ];

  return (
    <div className="space-y-3">
      {socials.map((social, idx) => (
        <div key={idx} className="flex flex-col gap-2">
          <Label htmlFor={social.key} className="text-xs font-semibold">
            {translate(`tempApp.layoutSettings.tabs.contactInfo.socials.${social.key}`)}
          </Label>
          <Input
            type='text'
            id={social.key}
            name={social.key}
            placeholder={`${social.label} URL`}
            value={socialProfiles?.[social.key]?.url || ''}
            onChange={(e) => handleChange(social.key as keyof ISocialProfiles, e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      ))}
    </div>
  );
};

const PremadeColorThemes = ({
  handleCustomThemeSelector
}) => {
  const themes = [
    {
      name: 'Light Crimson',
      colors: ['hsl(0 0% 100%)', 'hsl(60 4.8% 95.9%)', 'hsl(0, 75%, 59%)'],
      theme: {
        "accent": '60 4.8% 95.9%',
        "accent-foreground": '24 9.8% 10%',
        "background": '0 0% 100%',
        "border": '20 6% 90%',
        "card": '0 0% 100%',
        "card-foreground": '20 14.3% 4.1%',
        "destructive": '0 84% 60%',
        "destructive-foreground": '0 0% 98%',
        "foreground": '20 14.3% 4.1%',
        "input": '20 6% 90%',
        "muted": '60 4.8% 95.9%',
        "muted-foreground": '25 5.3% 44.7%',
        "popover": '0 0% 100%',
        "popover-foreground": '20 14.3% 4.1%',
        "primary": '24 9.8% 10%',
        "primary-foreground": '60 9.1% 97.8%',
        "radius": '0.5rem',
        "ring": '24 9.8% 10%',
        "secondary": '60 4.8% 95.9%',
        "secondary-foreground": '24 9.8% 10%',
      }
    },
    {
      name: 'Dark Crimson',
      colors: ['hsl(24 10% 10%)', 'hsl(12 6.5% 15.1%)', 'hsl(0, 75%, 59%)'],
      theme: {
        "accent": '12 6.5% 15.1%',
        "accent-foreground": '60 9.1% 97.8%',
        "background": '24 10% 10%',
        "border": '12 6.5% 15.1%',
        "card": '24 10% 10%',
        "card-foreground": '60 9.1% 97.8%',
        "destructive": '0 62% 30%',
        "destructive-foreground": '0 0% 98%',
        "foreground": '60 9.1% 97.8%',
        "input": '12 6.5% 15.1%',
        "muted": '12 6.5% 15.1%',
        "muted-foreground": '24 5.4% 63.9%',
        "popover": '24 10% 10%',
        "popover-foreground": '60 9.1% 97.8%',
        "primary": '60 9.1% 97.8%',
        "primary-foreground": '24 9.8% 10%',
        "radius": '0.5rem',
        "ring": '60 9.1% 97.8%',
        "secondary": '12 6.5% 15.1%',
        "secondary-foreground": '60 9.1% 97.8%',
      }
    },
    {
      name: 'Modern Ledger',
      colors: ['hsl(350 42% 98%)', 'hsl(350 40% 41%)', 'hsl(350 10% 84%)'],
      theme: {
        "accent": '350 10% 84%',
        "accent-foreground": '350 10% 24%',
        "background": '350 42% 98%',
        "border": '350 10% 84%',
        "card": '350 42% 98%',
        "card-foreground": '350 80% 3%',
        "destructive": '0 84% 60%',
        "destructive-foreground": '0 0% 98%',
        "foreground": '350 80% 3%',
        "input": '350 10% 84%',
        "muted": '350 33% 91%',
        "muted-foreground": '350 13% 36%',
        "popover": '350 42% 98%',
        "popover-foreground": '350 80% 3%',
        "primary": '350 40% 41%',
        "primary-foreground": '0 0% 100%',
        "radius": '0.5rem',
        "ring": '350 40% 41%',
        "secondary": '350 10% 84%',
        "secondary-foreground": '350 10% 24%',
      }
    },
    {
      name: 'Autumn Harvest',
      colors: ['hsl(222 39% 98%)', 'hsl(222 69% 44%)', 'hsl(42 69% 44%)'],
      theme: {
        "accent": '42 69% 44%',
        "accent-foreground": '42 69% 4%',
        "background": '222 39% 98%',
        "border": '222 69% 44%',
        "card": '222 39% 98%',
        "card-foreground": '222 71% 4%',
        "destructive": '0 84% 60%',
        "destructive-foreground": '0 0% 98%',
        "foreground": '222 71% 4%',
        "input": '222 69% 44%',
        "muted": '42 24% 88%',
        "muted-foreground": '42 4% 25%',
        "popover": '222 39% 98%',
        "popover-foreground": '222 71% 4%',
        "primary": '222 69% 44%',
        "primary-foreground": '0 0% 100%',
        "radius": '0.5rem',
        "ring": '222 69% 44%',
        "secondary": '42 69% 44%',
        "secondary-foreground": '42 69% 4%',
      }
    },
    {
      name: 'Mint',
      colors: ['hsl(186 63% 99%)', 'hsl(186 62% 66%)', 'hsl(186 2% 87%)'],
      theme: {
        "accent": '186 2% 87%',
        "accent-foreground": '186 2% 27%',
        "background": '186 63% 99%',
        "border": '186 62% 66%',
        "card": '186 63% 99%',
        "card-foreground": '186 62% 5%',
        "destructive": '0 84% 60%',
        "destructive-foreground": '0 0% 98%',
        "foreground": '186 62% 5%',
        "input": '186 62% 66%',
        "muted": '186 39% 89%',
        "muted-foreground": '186 5% 27%',
        "popover": '186 63% 99%',
        "popover-foreground": '186 62% 5%',
        "primary": '186 62% 66%',
        "primary-foreground": '186 62% 5%',
        "radius": '0.5rem',
        "ring": '186 62% 66%',
        "secondary": '186 2% 87%',
        "secondary-foreground": '186 2% 27%',
      }
    },
    {
      name: 'Royal Purple',
      colors: ['hsl(0 0% 100%)', 'hsl(281 92% 46%)', 'hsl(60 5% 96%)'],
      theme: {
        "accent": '60 5% 96%',
        "accent-foreground": '25 6% 45%',
        "background": '0 0% 100%',
        "border": '20 6% 90%',
        "card": '0 0% 100%',
        "card-foreground": '20 14% 4%',
        "destructive": '0 84% 60%',
        "destructive-foreground": '0 0% 98%',
        "foreground": '20 14% 4%',
        "input": '20 6% 90%',
        "muted": '60 5% 96%',
        "muted-foreground": '25 6% 45%',
        "popover": '0 0% 100%',
        "popover-foreground": '20 14% 4%',
        "primary": '281 92% 46%',
        "primary-foreground": '60 9% 98%',
        "radius": '0.5rem',
        "ring": '281 92% 46%',
        "secondary": '60 5% 96%',
        "secondary-foreground": '25 6% 45%',
      }
    },
    {
      name: 'Golden Amber',
      colors: ['hsl(0 0% 100%)', 'hsl(43 72% 52%)', 'hsl(60 5% 96%)'],
      theme: {
        "accent": '60 5% 96%',
        "accent-foreground": '25 6% 45%',
        "background": '0 0% 100%',
        "border": '20 6% 90%',
        "card": '0 0% 100%',
        "card-foreground": '20 14% 4%',
        "destructive": '0 84% 60%',
        "destructive-foreground": '0 0% 98%',
        "foreground": '20 14% 4%',
        "input": '20 6% 90%',
        "muted": '60 5% 96%',
        "muted-foreground": '25 6% 45%',
        "popover": '0 0% 100%',
        "popover-foreground": '20 14% 4%',
        "primary": '43 72% 52%',
        "primary-foreground": '60 9% 98%',
        "radius": '0.5rem',
        "ring": '43 72% 52%',
        "secondary": '60 5% 96%',
        "secondary-foreground": '25 6% 45%',
      }
    },
    {
      name: 'Rose Blush',
      colors: ['hsl(335 0% 93.5%)', 'hsl(355 85% 58%)', 'hsl(35 0% 89.5%)'],
      theme: {
        "accent": '35 0% 89.5%',
        "accent-foreground": '0 0% 38.5%',
        "background": '335 0% 93.5%',
        "border": '355 85% 58%',
        "card": '335 0% 93.5%',
        "card-foreground": '355 0% 0%',
        "destructive": '0 84% 60%',
        "destructive-foreground": '0 0% 98%',
        "foreground": '355 0% 0%',
        "input": '355 85% 58%',
        "muted": '5 68% 82%',
        "muted-foreground": '0 0% 38.5%',
        "popover": '335 0% 93.5%',
        "popover-foreground": '355 0% 0%',
        "primary": '355 85% 58%',
        "primary-foreground": '60 9% 98%',
        "radius": '0.5rem',
        "ring": '355 85% 58%',
        "secondary": '35 0% 89.5%',
        "secondary-foreground": '0 0% 38.5%',
      }
    },
    {
      name: 'Forest Green',
      colors: ['hsl(335 5% 77.5%)', 'hsl(103 75% 49%)', 'hsl(35 10% 73.5%)'],
      theme: {
        "accent": '35 10% 73.5%',
        "accent-foreground": '0 11% 22.5%',
        "background": '335 5% 77.5%',
        "border": '103 75% 49%',
        "card": '335 5% 77.5%',
        "card-foreground": '355 19% 0%',
        "destructive": '0 84% 60%',
        "destructive-foreground": '0 0% 98%',
        "foreground": '355 19% 0%',
        "input": '103 75% 49%',
        "muted": '92 33% 67%',
        "muted-foreground": '0 11% 22.5%',
        "popover": '335 5% 77.5%',
        "popover-foreground": '355 19% 0%',
        "primary": '103 75% 49%',
        "primary-foreground": '60 9% 98%',
        "radius": '0.5rem',
        "ring": '103 75% 49%',
        "secondary": '35 10% 73.5%',
        "secondary-foreground": '0 11% 22.5%',
      }
    },
    {
      name: 'Emerald Sage',
      colors: ['hsl(355 15% 93.5%)', 'hsl(160 77% 44%)', 'hsl(55 20% 89.5%)'],
      theme: {
        "accent": '55 20% 89.5%',
        "accent-foreground": '20 21% 38.5%',
        "background": '355 15% 93.5%',
        "border": '160 77% 44%',
        "card": '355 15% 93.5%',
        "card-foreground": '15 29% 0%',
        "destructive": '0 84% 60%',
        "destructive-foreground": '0 0% 98%',
        "foreground": '15 29% 0%',
        "input": '160 77% 44%',
        "muted": '138 38% 81%',
        "muted-foreground": '20 21% 38.5%',
        "popover": '355 15% 93.5%',
        "popover-foreground": '15 29% 0%',
        "primary": '160 77% 44%',
        "primary-foreground": '60 9% 98%',
        "radius": '0.5rem',
        "ring": '160 77% 44%',
        "secondary": '55 20% 89.5%',
        "secondary-foreground": '20 21% 38.5%',
      }
    },
    {
      name: 'Ocean Blue',
      colors: ['hsl(333 0% 84.5%)', 'hsl(233 87% 40%)', 'hsl(33 0% 80.5%)'],
      theme: {
        "accent": '33 0% 80.5%',
        "accent-foreground": '358 0% 29.5%',
        "background": '333 0% 84.5%',
        "border": '233 87% 40%',
        "card": '333 0% 84.5%',
        "card-foreground": '353 0% 0%',
        "destructive": '0 84% 60%',
        "destructive-foreground": '0 0% 98%',
        "foreground": '353 0% 0%',
        "input": '233 87% 40%',
        "muted": '256 33% 69%',
        "muted-foreground": '358 0% 29.5%',
        "popover": '333 0% 84.5%',
        "popover-foreground": '353 0% 0%',
        "primary": '233 87% 40%',
        "primary-foreground": '60 9% 98%',
        "radius": '0.5rem',
        "ring": '233 87% 40%',
        "secondary": '33 0% 80.5%',
        "secondary-foreground": '358 0% 29.5%',
      }
    },
    {
      name: 'Warm Honey',
      colors: ['hsl(4.5 4.5% 97.3%)', 'hsl(50 90% 48%)', 'hsl(64.5 9.5% 93.3%)'],
      theme: {
        "accent": '64.5 9.5% 93.3%',
        "accent-foreground": '29.5 10.5% 42.3%',
        "background": '4.5 4.5% 97.3%',
        "border": '50 90% 48%',
        "card": '4.5 4.5% 97.3%',
        "card-foreground": '24.5 18.5% 1.3%',
        "destructive": '0 84% 60%',
        "destructive-foreground": '0 0% 98%',
        "foreground": '24.5 18.5% 1.3%',
        "input": '50 90% 48%',
        "muted": '45 69% 84%',
        "muted-foreground": '29.5 10.5% 42.3%',
        "popover": '4.5 4.5% 97.3%',
        "popover-foreground": '24.5 18.5% 1.3%',
        "primary": '50 90% 48%',
        "primary-foreground": '60 9% 98%',
        "radius": '0.5rem',
        "ring": '50 90% 48%',
        "secondary": '64.5 9.5% 93.3%',
        "secondary-foreground": '29.5 10.5% 42.3%',
      }
    }
  ];

  return (
    <div style={{
      background: '#f8f9fa',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e9ecef',
      marginBottom: '1.5rem'
    }}>
      <h5 style={{
        marginBottom: '1rem',
        color: '#007bff',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <i className="fas fa-palette"></i>
        Pre-made Themes
      </h5>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {themes.map((theme, index) => (
          <div 
            key={index}
            onClick={() => handleCustomThemeSelector(theme.theme)}
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '2px solid transparent',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              e.currentTarget.style.borderColor = '#007bff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                display: 'flex',
                height: '60px',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid #dee2e6'
              }}>
                {theme.colors.map((color, colorIndex) => (
                  <div
                    key={colorIndex}
                    style={{
                      flex: 1,
                      backgroundColor: color,
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                display: 'block',
                fontWeight: '600',
                color: '#495057',
                marginBottom: '4px'
              }}>
                {theme.name}
              </span>
              <small style={{
                color: '#6c757d',
                fontSize: '0.875rem'
              }}>
                Click to apply
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UiSettingsUpdate;
