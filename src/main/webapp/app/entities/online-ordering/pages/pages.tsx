import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { getEntities, publishEntity, archiveEntity } from './pages.reducer';
import { getEntity as getUiSettings, updateEntity as updateUiSettings, changeEntityField } from '../settings/settings.reducer';
import { PageStatus } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.enums';
import { IOnlineOrderingPage } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import PageTemplatePreview from './page-template-preview';
import PageTemplatePicker from './page-template-picker';

const OnlineOrderingPages = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const pages: IOnlineOrderingPage[] = useAppSelector(state => state.onlineOrderingPage.entities);
  const uiSettings: IUiSettings = useAppSelector(state => state.uiSettings.entity);
  const updating = useAppSelector(state => state.onlineOrderingPage.updating || state.uiSettings.updating);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  useEffect(() => {
    dispatch(getEntities());
    dispatch(getUiSettings());
  }, [dispatch]);

  const handleTogglePageBuilder = async (enabled: boolean) => {
    const next = { ...uiSettings, usePageBuilder: enabled };
    await dispatch(updateUiSettings(next)).unwrap();
    toast.success(enabled ? 'Page builder enabled' : 'Legacy layouts enabled');
  };

  const handleSetActive = async (page: IOnlineOrderingPage) => {
    const next = {
      ...uiSettings,
      usePageBuilder: true,
      defaultPageId: page.id,
      defaultPageSlug: page.slug,
    };
    await dispatch(updateUiSettings(next)).unwrap();
    toast.success(`"${page.name}" is now the active landing page`);
  };

  const handlePublish = async (page: IOnlineOrderingPage) => {
    await dispatch(publishEntity(page.id)).unwrap();
    toast.success(`"${page.name}" published`);
    dispatch(getEntities());
  };

  const handleArchive = async (page: IOnlineOrderingPage) => {
    await dispatch(archiveEntity(page.id));
    toast.success(`"${page.name}" archived`);
  };

  return (
    <PageWrapper className="max-w-6xl mx-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Landing Pages</h2>
            <p className="text-xs text-muted-foreground">Build custom online ordering home pages with sections</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-8 text-xs" onClick={() => setTemplatePickerOpen(true)}>
              Start from template
            </Button>
            <Button className="h-8 text-xs" onClick={() => navigate('/online-ordering/pages/new')}>
              Blank page
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Storefront mode</CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex items-center gap-3">
            <Checkbox
              id="usePageBuilder"
              checked={uiSettings.usePageBuilder === true}
              onCheckedChange={checked => handleTogglePageBuilder(checked === true)}
            />
            <Label htmlFor="usePageBuilder" className="text-sm">
              Use page builder for the online ordering home page
            </Label>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {pages.map(page => {
            const isActive = uiSettings.defaultPageId === page.id;
            return (
              <Card key={page.id}>
                <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
                  <PageTemplatePreview
                    page={page}
                    isActive={isActive}
                    storeDomain={uiSettings.domain}
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{page.name}</h3>
                      <Badge variant="outline">{page.status}</Badge>
                      {isActive && <Badge>Active</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">/{page.slug}</p>
                    <p className="text-xs text-muted-foreground">{page.sections?.length ?? 0} sections</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="h-8 text-xs" asChild>
                      <Link to={`/online-ordering/pages/${page.id}/edit`}>Edit</Link>
                    </Button>
                    <Button variant="outline" className="h-8 text-xs" disabled={updating} onClick={() => handlePublish(page)}>
                      Publish
                    </Button>
                    <Button
                      className="h-8 text-xs"
                      disabled={updating || page.status !== PageStatus.PUBLISHED}
                      onClick={() => handleSetActive(page)}
                    >
                      Set active
                    </Button>
                    <Button variant="destructive" className="h-8 text-xs" disabled={updating} onClick={() => handleArchive(page)}>
                      Archive
                    </Button>
                  </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {pages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No pages yet. Start from a template or create a blank page.
            </p>
          )}
        </div>
      </div>

      <PageTemplatePicker open={templatePickerOpen} onOpenChange={setTemplatePickerOpen} />
    </PageWrapper>
  );
};

export default OnlineOrderingPages;
