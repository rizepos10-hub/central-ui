import React, { useEffect } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IAdvancedSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { ScriptSnippets } from './components/script-snippets';
import { changeEntityField, flushStorefrontCache, getEntity, updateEntity } from './advanced.reducer';

const AdvancedSettingsPage = () => {
  const dispatch = useAppDispatch();
  const entity: IAdvancedSettings = useAppSelector(state => state.advancedSettings.entity);
  const loading = useAppSelector(state => state.advancedSettings.loading);
  const updating = useAppSelector(state => state.advancedSettings.updating);

  useEffect(() => {
    dispatch(getEntity());
  }, []);

  const handleFlushStorefrontCache = async () => {
    try {
      await dispatch(flushStorefrontCache()).unwrap();
      toast.success('Storefront cache flushed successfully');
    } catch {
      toast.error('Failed to flush storefront cache. Check the domain and cache flush secret.');
    }
  };

  return (
    <PageWrapper className="max-w-5xl mx-auto">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Advanced / Scripts</h2>
          <p className="text-xs text-muted-foreground">Storefront domain, cookie text, custom scripts, and operational actions</p>
        </div>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Storefront settings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="advanced-domain" className="text-xs font-semibold">
                Domain
              </Label>
              <Input
                id="advanced-domain"
                value={entity.domain || ''}
                onChange={e => dispatch(changeEntityField({ name: 'domain', value: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="advanced-cookie" className="text-xs font-semibold">
                Cookie
              </Label>
              <Input
                id="advanced-cookie"
                value={entity.cookie || ''}
                onChange={e => dispatch(changeEntityField({ name: 'cookie', value: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Storefront cache</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold">Flush cached storefront data</p>
                <p className="text-xs text-muted-foreground">Clear cached UI settings and landing page data for this storefront.</p>
              </div>
              <Button type="button" variant="outline" className="h-8 text-xs" disabled={updating || !entity.domain} onClick={handleFlushStorefrontCache}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Flush storefront cache
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Script snippets</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ScriptSnippets snippets={entity.scriptSnippets || []} onChange={snippets => dispatch(changeEntityField({ name: 'scriptSnippets', value: snippets }))} />
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

export default AdvancedSettingsPage;
