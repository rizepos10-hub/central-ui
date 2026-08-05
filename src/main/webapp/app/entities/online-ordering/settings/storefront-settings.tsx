import React, { useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IStorefrontSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { changeEntityField, getEntity, updateEntity } from './storefront-settings.reducer';

const StorefrontSettingsPage = () => {
  const dispatch = useAppDispatch();
  const entity: IStorefrontSettings = useAppSelector(state => state.storefrontSettings.entity);
  const loading = useAppSelector(state => state.storefrontSettings.loading);
  const updating = useAppSelector(state => state.storefrontSettings.updating);

  useEffect(() => {
    dispatch(getEntity());
  }, []);

  return (
    <PageWrapper className="max-w-5xl mx-auto">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Storefront Settings</h2>
          <p className="text-xs text-muted-foreground">Cookie text and storefront domain (managed in Admin Applications)</p>
        </div>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Storefront settings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="storefront-domain" className="text-xs font-semibold">
                Domain
              </Label>
              <Input id="storefront-domain" value={entity.domain || ''} disabled className="h-8 text-xs" />
              <p className="text-xs text-muted-foreground">Set on the Online Ordering application in Admin.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="storefront-cookie" className="text-xs font-semibold">
                Cookie
              </Label>
              <Input
                id="storefront-cookie"
                value={entity.cookie || ''}
                onChange={e => dispatch(changeEntityField({ name: 'cookie', value: e.target.value }))}
                className="h-8 text-xs"
              />
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

export default StorefrontSettingsPage;
