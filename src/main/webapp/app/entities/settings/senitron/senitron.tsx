import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ISenitronSettingRequest, normalizeSenitronSetting } from 'app/shared/model/senitron-setting.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changeEntityField, getSenitronSetting, updateSenitronSetting } from './senitron.reducer';

const SenitronSettingsPage = () => {
  const dispatch = useAppDispatch();
  const entity = useAppSelector(state => state.senitronSetting.entity);
  const loading = useAppSelector(state => state.senitronSetting.loading);
  const updating = useAppSelector(state => state.senitronSetting.updating);
  const updateSuccess = useAppSelector(state => state.senitronSetting.updateSuccess);

  const [apiKeyInput, setApiKeyInput] = useState('');
  const setting = normalizeSenitronSetting(entity);

  useEffect(() => {
    dispatch(getSenitronSetting());
  }, [dispatch]);

  useEffect(() => {
    if (updateSuccess) {
      toast.success('Senitron settings saved.');
      setApiKeyInput('');
    }
  }, [updateSuccess]);

  const updateField = (name: 'enabled' | 'clientCode' | 'storeCode', value: boolean | string) => {
    dispatch(changeEntityField({ name, value }));
  };

  const getApiErrorMessage = (error: any, fallback: string) => {
    const data = error?.response?.data;
    return data?.message || data?.detail || data?.title || error?.message || fallback;
  };

  const onSave = async () => {
    const enabled = !!setting.enabled;
    const clientCode = (setting.clientCode || '').trim();
    const storeCode = (setting.storeCode || '').trim();
    const apiKey = apiKeyInput.trim();

    if (enabled && (!clientCode || !storeCode || (!apiKey && !setting.apiKeyConfigured))) {
      toast.error('Enabled Senitron requires client code, store code, and an API key.');
      return;
    }

    const request: ISenitronSettingRequest = {
      enabled,
      clientCode: clientCode || null,
      storeCode: storeCode || null,
    };
    if (apiKey) {
      request.apiKey = apiKey;
    }

    try {
      await dispatch(updateSenitronSetting(request)).unwrap();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to save Senitron settings.'));
    }
  };

  return (
    <PageWrapper className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Senitron Settings</h2>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-8 text-xs">
            <Link to="/integrations">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Link>
          </Button>
          <Button type="button" className="h-8 text-xs" disabled={updating || loading} onClick={onSave}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">RFID / inventory integration</CardTitle>
          <CardDescription className="text-xs">
            Tenant-wide connection to Senitron for catalog sync, labels, and inventory. The POS RFID reader is configured separately on the
            terminal under Personalization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <label className="flex items-center gap-2">
            <Checkbox checked={!!setting.enabled} onCheckedChange={checked => updateField('enabled', !!checked)} />
            <span className="font-semibold">Enable Senitron</span>
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="senitron-client-code" className="text-xs font-semibold">
                Client code
              </Label>
              <Input
                id="senitron-client-code"
                className="h-8 text-xs"
                value={setting.clientCode || ''}
                onChange={e => updateField('clientCode', e.target.value)}
                placeholder="Senitron client code"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="senitron-store-code" className="text-xs font-semibold">
                Store code
              </Label>
              <Input
                id="senitron-store-code"
                className="h-8 text-xs"
                value={setting.storeCode || ''}
                onChange={e => updateField('storeCode', e.target.value)}
                placeholder="Senitron store code"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="senitron-api-key" className="text-xs font-semibold">
              API key
            </Label>
            <Input
              id="senitron-api-key"
              type="password"
              className="h-8 text-xs"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder={setting.apiKeyConfigured ? 'Saved (leave blank to keep current)' : 'Enter API key'}
              autoComplete="new-password"
            />
            <p className="text-[11px] text-muted-foreground">
              {setting.apiKeyConfigured ? 'API key already configured.' : 'No API key configured yet.'}
            </p>
          </div>

          {setting.connectionVersion ? (
            <p className="text-[11px] text-muted-foreground">Connection version: {setting.connectionVersion}</p>
          ) : null}

          {loading ? <p className="text-[11px] text-muted-foreground">Loading Senitron settings...</p> : null}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default SenitronSettingsPage;
