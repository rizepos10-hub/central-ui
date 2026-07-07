import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import SeoTags from 'app/shared/components/item/seo-tags';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IBranchSeoSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { changeEntityField, getEntity, updateEntity } from './branch-seo.reducer';

const BranchSeoSettingsPage = () => {
  const dispatch = useAppDispatch();
  const entity: IBranchSeoSettings = useAppSelector(state => state.branchSeoSettings.entity);
  const branchList = useAppSelector(state => state.branch.entities);
  const loading = useAppSelector(state => state.branchSeoSettings.loading);
  const updating = useAppSelector(state => state.branchSeoSettings.updating);
  const [activeBranchTab, setActiveBranchTab] = useState<string>('');

  useEffect(() => {
    dispatch(getEntity());
    dispatch(getBranches({}));
  }, []);

  useEffect(() => {
    if (!activeBranchTab && branchList?.length > 0) {
      setActiveBranchTab(branchList[0].id.toString());
    }
  }, [activeBranchTab, branchList]);

  const updateBranchSeo = (index: number, pageName: 'retail' | 'restaurant', fieldName: string, value: any) => {
    const branchDetail = entity.branchDetail || [];
    const next = JSON.parse(JSON.stringify(branchDetail));
    const fallbackBranchId = branchList?.[index]?.id;

    if (next.length <= index) {
      for (let i = next.length; i <= index; i++) {
        next.push({ branchId: branchList?.[i]?.id, pages: {} });
      }
    }

    next[index].branchId = next[index].branchId || fallbackBranchId;
    next[index].pages = next[index].pages || {};
    next[index].pages[pageName] = next[index].pages[pageName] || {};
    next[index].pages[pageName][fieldName] = value;

    dispatch(changeEntityField({ name: 'branchDetail', value: next }));
  };

  const handleBranchHideRetailShop = (branchIndex: number, checked: boolean, branchId: string) => {
    const next = JSON.parse(JSON.stringify(entity.branchDetail || []));
    next[branchIndex] = {
      ...next[branchIndex],
      hideRetailShop: checked,
      branchId,
    };
    dispatch(changeEntityField({ name: 'branchDetail', value: next }));
  };

  return (
    <PageWrapper className="max-w-6xl mx-auto">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Branch SEO</h2>
          <p className="text-xs text-muted-foreground">Branch-specific retail and restaurant SEO settings</p>
        </div>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Branch SEO</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Tabs value={activeBranchTab} onValueChange={setActiveBranchTab} className="w-full">
              <TabsList className="h-9 overflow-x-auto flex-nowrap">
                {branchList?.map(branch => (
                  <TabsTrigger key={branch.id} value={branch.id.toString()} className="text-xs">
                    {branch.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {branchList?.map((branch, index) => (
                <TabsContent key={branch.id} value={branch.id.toString()} className="space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`hide-retail-shop-${branch.id}`}
                      checked={entity.branchDetail?.[index]?.hideRetailShop || false}
                      onCheckedChange={checked => handleBranchHideRetailShop(index, checked === true, branch.id)}
                    />
                    <Label htmlFor={`hide-retail-shop-${branch.id}`} className="text-xs font-semibold">
                      Hide Retail Shop
                    </Label>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Retail SEO</Label>
                    <SeoTags
                      field={entity.branchDetail?.[index]?.pages?.retail}
                      onFieldChange={(field, value) => updateBranchSeo(index, 'retail', field, value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Restaurant SEO</Label>
                    <SeoTags
                      field={entity.branchDetail?.[index]?.pages?.restaurant}
                      onFieldChange={(field, value) => updateBranchSeo(index, 'restaurant', field, value)}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
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

export default BranchSeoSettingsPage;
