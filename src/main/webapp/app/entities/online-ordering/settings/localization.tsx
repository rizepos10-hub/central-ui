import React, { useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ILocalizationSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { Language, languageOptions } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { changeEntityField, getEntity, updateEntity } from './localization.reducer';

const LocalizationSettingsPage = () => {
  const dispatch = useAppDispatch();
  const entity: ILocalizationSettings = useAppSelector(state => state.localizationSettings.entity);
  const loading = useAppSelector(state => state.localizationSettings.loading);
  const updating = useAppSelector(state => state.localizationSettings.updating);

  useEffect(() => {
    dispatch(getEntity());
  }, []);

  return (
    <PageWrapper className="max-w-4xl mx-auto">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Localization</h2>
          <p className="text-xs text-muted-foreground">Default storefront language and enabled languages</p>
        </div>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Languages</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="defaultLanguage" className="text-xs font-semibold">
                Default Language
              </Label>
              <Select
                value={entity.languages?.defaultLanguage || ''}
                onValueChange={value => {
                  const enabledLanguages = entity.languages?.enabledLanguages || [];
                  dispatch(
                    changeEntityField({
                      name: 'languages',
                      value: {
                        ...entity.languages,
                        defaultLanguage: value as Language,
                        enabledLanguages: enabledLanguages.includes(value as Language) ? enabledLanguages : [...enabledLanguages, value as Language],
                      },
                    })
                  );
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select default language" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map(lang => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold">Enabled Languages</Label>
              {languageOptions.map(lang => {
                const isDefault = entity.languages?.defaultLanguage === lang;
                const isChecked = entity.languages?.enabledLanguages?.includes(lang) || isDefault;

                return (
                  <div key={lang} className="flex items-center gap-2">
                    <Checkbox
                      id={`language-${lang}`}
                      checked={isChecked}
                      disabled={isDefault}
                      onCheckedChange={checked => {
                        const currentEnabled = entity.languages?.enabledLanguages || [];
                        const nextEnabled = checked === true ? [...currentEnabled, lang] : currentEnabled.filter(current => current !== lang);
                        dispatch(
                          changeEntityField({
                            name: 'languages',
                            value: {
                              ...entity.languages,
                              enabledLanguages: nextEnabled,
                            },
                          })
                        );
                      }}
                    />
                    <Label htmlFor={`language-${lang}`} className="text-xs">
                      {lang} {isDefault ? '(Default)' : ''}
                    </Label>
                  </div>
                );
              })}
            </div>
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

export default LocalizationSettingsPage;
