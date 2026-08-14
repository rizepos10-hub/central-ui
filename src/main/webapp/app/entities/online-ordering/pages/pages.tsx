import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { getEntities, publishEntity, archiveEntity } from './pages.reducer';
import { PageStatus } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.enums';
import { IOnlineOrderingPage } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import PageTemplatePreview from './page-template-preview';
import PageTemplatePicker from './page-template-picker';
import { getEntity as getLandingPageSettings, updateEntity as updateLandingPageSettings } from '../settings/landing-page-settings.reducer';
import { getEntity as getStorefrontSettings } from '../settings/storefront-settings.reducer';
import { ILandingPageSettings, IStorefrontSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';

const OnlineOrderingPages = () => {
  const dispatch = useAppDispatch();
  const pages: IOnlineOrderingPage[] = useAppSelector(state => state.onlineOrderingPage.entities);
  const landingPageSettings: ILandingPageSettings = useAppSelector(state => state.landingPageSettings.entity);
  const storefrontSettings: IStorefrontSettings = useAppSelector(state => state.storefrontSettings.entity);
  const updating = useAppSelector(state => state.onlineOrderingPage.updating || state.landingPageSettings.updating || state.storefrontSettings.updating);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const uiSettings: IUiSettings = { ...landingPageSettings, ...storefrontSettings };
  const hasActivePage = pages.some(page => page.id === uiSettings.defaultPageId && page.templateKey && page.status === PageStatus.PUBLISHED);
  const hasLegacyPages = pages.some(page => !page.templateKey);

  useEffect(() => {
    dispatch(getEntities());
    dispatch(getLandingPageSettings());
    dispatch(getStorefrontSettings());
  }, [dispatch]);

  const handleSetActive = async (page: IOnlineOrderingPage) => {
    if (page.status !== PageStatus.PUBLISHED || !page.templateKey) return;
    await dispatch(updateLandingPageSettings({ defaultPageId: page.id, defaultPageSlug: page.slug })).unwrap();
    toast.success(`"${page.name}" is now the active storefront template`);
  };

  const handlePublish = async (page: IOnlineOrderingPage) => {
    await dispatch(publishEntity(page.id)).unwrap();
    toast.success(`"${page.name}" published`);
    dispatch(getEntities());
  };

  const handleArchive = async (page: IOnlineOrderingPage) => {
    try {
      await dispatch(archiveEntity(page.id)).unwrap();
      toast.success(`"${page.name}" archived`);
    } catch {
      toast.error(`Could not archive "${page.name}". Please try again.`);
    }
  };

  return (
    <PageWrapper className="mx-auto max-w-6xl">
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Online Ordering</p>
            <h2 className="text-2xl font-semibold tracking-tight">Landing pages</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Import a fixed storefront template, customize its approved content and chrome, then publish it across the entire customer experience.</p>
          </div>
          <Button onClick={() => setTemplatePickerOpen(true)}>Import template</Button>
        </div>

        {!hasActivePage && (
          <Card className="border-amber-300/70 bg-amber-50/50">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-950">No active fixed-template storefront</p>
                <p className="mt-1 text-xs text-amber-900/80">Import and publish a template, then set it active. Legacy layouts are no longer rendered.</p>
              </div>
              <Button variant="outline" className="border-amber-400 bg-transparent text-xs" onClick={() => setTemplatePickerOpen(true)}>Choose template</Button>
            </CardContent>
          </Card>
        )}

        {hasLegacyPages && (
          <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            Legacy page records are missing fixed-template metadata and are preserved for reference only. Re-import from the code-defined template picker to replace them.
          </div>
        )}

        <Card>
          <CardHeader className="p-4"><CardTitle className="text-sm">Saved landing pages</CardTitle></CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {pages.map(page => {
              const isActive = uiSettings.defaultPageId === page.id && Boolean(page.templateKey) && page.status === PageStatus.PUBLISHED;
              const isLegacy = !page.templateKey;
              return (
                <Card key={page.id} className={isActive ? 'border-primary/60 shadow-sm' : undefined}>
                  <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                    <PageTemplatePreview page={page} isActive={isActive} storeDomain={uiSettings.domain} />
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 md:flex-row md:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{page.name}</h3>
                          <Badge variant="outline">{isLegacy ? 'Legacy' : page.status}</Badge>
                          {page.templateKey && <Badge variant="secondary">{page.templateKey}</Badge>}
                          {isActive && <Badge>Active storefront</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">/{page.slug}</p>
                        {!isLegacy && <p className="text-xs text-muted-foreground">{page.sections?.length ?? 0} fixed sections · template-owned navbar and footer</p>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!isLegacy && <Button variant="outline" className="h-8 text-xs" asChild><Link to={`/online-ordering/pages/${page.id}/edit`}>Customize</Link></Button>}
                        {!isLegacy && <Button variant="outline" className="h-8 text-xs" disabled={updating || page.status === PageStatus.PUBLISHED} onClick={() => handlePublish(page)}>Publish</Button>}
                        {!isLegacy && <Button className="h-8 text-xs" disabled={updating || page.status !== PageStatus.PUBLISHED || isActive} onClick={() => handleSetActive(page)}>Set active</Button>}
                        <Button variant="destructive" className="h-8 text-xs" disabled={updating} onClick={() => handleArchive(page)}>Archive</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {pages.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No landing pages yet. Import a fixed template to get started.</div>}
          </CardContent>
        </Card>
      </div>
      <PageTemplatePicker open={templatePickerOpen} onOpenChange={setTemplatePickerOpen} />
    </PageWrapper>
  );
};

export default OnlineOrderingPages;
