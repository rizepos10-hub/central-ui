import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  ArrowUpRight,
  Check,
  Clock3,
  FileText,
  Globe2,
  LayoutTemplate,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from 'app/lib/utils';
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

type PageFilter = 'all' | 'legacy' | PageStatus;

const pageName = (page: IOnlineOrderingPage) => page.name?.trim() || 'Untitled landing page';

const templateLabel = (templateKey?: string) => {
  const labels: Record<string, string> = {
    'home-default': 'Restaurant — Showcase',
    'order-first': 'Restaurant — Order First',
    'home-riode': 'Retail — Split Commerce',
    'home-retail': 'Retail — Electronics',
    'thai-palace': 'Restaurant — Classic',
    'courtyard-hospitality': 'Hospitality — Immersive',
    'ember-basil': 'Restaurant — Artisan Pizza',
    'nonna-table': 'Restaurant — Family Table',
    'olive-hearth': 'Restaurant — Rustic',
    'crimson-stack': 'Restaurant — Bold Burger',
    'saffron-ember': 'Restaurant — Grill',
    'lime-char': 'Restaurant — Fresh Burger',
    'golden-wok': 'Restaurant — Asian Editorial',
    'sakura-tide': 'Restaurant — Sushi',
    'atelier-noir': 'Store — Editorial',
    'fine-dining': 'Fine Dining',
  };
  return (templateKey && labels[templateKey]) || 'Storefront template';
};

const statusLabel = (status?: PageStatus) => {
  switch (status) {
    case PageStatus.PUBLISHED:
      return 'Published';
    case PageStatus.ARCHIVED:
      return 'Archived';
    default:
      return 'Draft';
  }
};

const statusClassName = (status?: PageStatus) => {
  switch (status) {
    case PageStatus.PUBLISHED:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case PageStatus.ARCHIVED:
      return 'border-slate-200 bg-slate-100 text-slate-600';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700';
  }
};

const OnlineOrderingPages = () => {
  const dispatch = useAppDispatch();
  const pages: IOnlineOrderingPage[] = useAppSelector(state => state.onlineOrderingPage.entities);
  const landingPageSettings: ILandingPageSettings = useAppSelector(state => state.landingPageSettings.entity);
  const storefrontSettings: IStorefrontSettings = useAppSelector(state => state.storefrontSettings.entity);
  const updating = useAppSelector(
    state => state.onlineOrderingPage.updating || state.landingPageSettings.updating || state.storefrontSettings.updating
  );
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [pageQuery, setPageQuery] = useState('');
  const [pageFilter, setPageFilter] = useState<PageFilter>('all');
  const uiSettings: IUiSettings = { ...landingPageSettings, ...storefrontSettings };

  const activePage = pages.find(page => page.id === uiSettings.defaultPageId && page.templateKey && page.status === PageStatus.PUBLISHED);
  const hasActivePage = Boolean(activePage);
  const hasLegacyPages = pages.some(page => !page.templateKey);

  useEffect(() => {
    dispatch(getEntities());
    dispatch(getLandingPageSettings());
    dispatch(getStorefrontSettings());
  }, [dispatch]);

  const pageCounts = useMemo(
    () => ({
      all: pages.length,
      published: pages.filter(page => page.status === PageStatus.PUBLISHED && page.templateKey).length,
      drafts: pages.filter(page => page.status !== PageStatus.PUBLISHED && page.status !== PageStatus.ARCHIVED && page.templateKey).length,
      archived: pages.filter(page => page.status === PageStatus.ARCHIVED).length,
      legacy: pages.filter(page => !page.templateKey).length,
      retired: pages.filter(page => page.status === PageStatus.ARCHIVED || !page.templateKey).length,
    }),
    [pages]
  );

  const filteredPages = useMemo(() => {
    const query = pageQuery.trim().toLowerCase();

    return pages.filter(page => {
      const isLegacy = !page.templateKey;
      const matchesFilter =
        pageFilter === 'all' ||
        (pageFilter === 'legacy' && isLegacy) ||
        (pageFilter !== 'legacy' && !isLegacy && page.status === pageFilter);
      const matchesQuery =
        !query || [page.name, page.slug, page.templateKey, page.status].some(value => value?.toLowerCase().includes(query));
      return matchesFilter && matchesQuery;
    });
  }, [pageFilter, pageQuery, pages]);

  const handleSetActive = async (page: IOnlineOrderingPage) => {
    if (page.status !== PageStatus.PUBLISHED || !page.templateKey) return;
    await dispatch(updateLandingPageSettings({ defaultPageId: page.id, defaultPageSlug: page.slug })).unwrap();
    toast.success(`"${pageName(page)}" is now the active storefront template`);
  };

  const handlePublish = async (page: IOnlineOrderingPage) => {
    await dispatch(publishEntity(page.id)).unwrap();
    toast.success(`"${pageName(page)}" published`);
    dispatch(getEntities());
  };

  const handleArchive = async (page: IOnlineOrderingPage) => {
    try {
      await dispatch(archiveEntity(page.id)).unwrap();
      toast.success(`"${pageName(page)}" archived`);
    } catch {
      toast.error(`Could not archive "${pageName(page)}". Please try again.`);
    }
  };

  const clearPageFilters = () => {
    setPageQuery('');
    setPageFilter('all');
  };

  const filters: Array<{ key: PageFilter; label: string; count: number }> = [
    { key: 'all', label: 'All pages', count: pageCounts.all },
    { key: PageStatus.PUBLISHED, label: 'Published', count: pageCounts.published },
    { key: PageStatus.DRAFT, label: 'Drafts', count: pageCounts.drafts },
    { key: PageStatus.ARCHIVED, label: 'Archived', count: pageCounts.archived },
    { key: 'legacy', label: 'Legacy', count: pageCounts.legacy },
  ];

  return (
    <PageWrapper className="mx-auto max-w-7xl">
      <div className="space-y-6 pb-8">
        <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 px-6 py-7 text-white shadow-xl sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Storefront studio
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Shape the first impression.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Manage the storefronts your customers see. Start from a fixed template, make the approved content yours, and keep one clear
                live experience across Online Ordering.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    hasActivePage ? 'bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]' : 'bg-amber-400'
                  )}
                />
                {activePage ? `Live: /${activePage.slug}` : 'No live storefront selected'}
              </div>
              <Button
                className="bg-white text-slate-950 shadow-lg shadow-black/20 hover:bg-slate-100"
                onClick={() => setTemplatePickerOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Import template
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200/80 bg-white/80 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{pageCounts.all}</p>
                <p className="text-xs text-muted-foreground">Saved pages</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200/70 bg-emerald-50/40 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700">
                <Globe2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-emerald-900">{pageCounts.published}</p>
                <p className="text-xs text-emerald-800/70">Published templates</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200/70 bg-amber-50/40 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-700">
                <Clock3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-amber-900">{pageCounts.drafts}</p>
                <p className="text-xs text-amber-800/70">Drafts to finish</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/80 bg-slate-50 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-2xl bg-slate-200 p-2.5 text-slate-600">
                <Archive className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-slate-800">{pageCounts.retired}</p>
                <p className="text-xs text-muted-foreground">Archived or legacy</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {!hasActivePage && (
          <Card className="overflow-hidden border-amber-300/70 bg-amber-50/70 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
                  <LayoutTemplate className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-950">Choose the storefront your customers should see</p>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-amber-900/80">
                    Publish a fixed template, then set it active. Legacy layouts remain available for reference but are not rendered on the
                    storefront.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="shrink-0 border-amber-400 bg-transparent text-xs text-amber-950 hover:bg-amber-100"
                onClick={() => setTemplatePickerOpen(true)}
              >
                Browse templates
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {hasLegacyPages && (
          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-xs text-muted-foreground">
            <Archive className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p>
              Legacy page records are preserved for reference only. Re-import a code-defined template to replace them with the
              fixed-template experience.
            </p>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your storefronts</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Saved landing pages</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Each page keeps its template structure while you control its content, branding, and chrome.
              </p>
            </div>
            <div className="relative w-full xl:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={pageQuery}
                onChange={event => setPageQuery(event.target.value)}
                placeholder="Search pages, slugs, or templates"
                className="h-10 bg-white pl-9 pr-9 shadow-sm"
              />
              {pageQuery && (
                <button
                  type="button"
                  aria-label="Clear page search"
                  onClick={() => setPageQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map(filter => (
              <Button
                key={filter.key}
                variant={pageFilter === filter.key ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'shrink-0 rounded-full border px-3',
                  pageFilter === filter.key
                    ? 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/15'
                    : 'border-transparent text-muted-foreground'
                )}
                onClick={() => setPageFilter(filter.key)}
              >
                {filter.label}
                <span className="rounded-full bg-background/80 px-1.5 py-0.5 text-[10px]">{filter.count}</span>
              </Button>
            ))}
          </div>

          {filteredPages.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filteredPages.map(page => {
                const isActive = activePage?.id === page.id;
                const isLegacy = !page.templateKey;
                const sections = page.sections?.length ?? 0;
                return (
                  <Card
                    key={page.id}
                    className={cn(
                      'group overflow-hidden border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg',
                      isActive && 'border-primary/50 ring-1 ring-primary/20',
                      isLegacy && 'border-dashed bg-slate-50/70'
                    )}
                  >
                    <div className="relative border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-100/80 p-4">
                      {isActive && (
                        <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          Live storefront
                        </div>
                      )}
                      <PageTemplatePreview page={page} isActive={isActive} storeDomain={uiSettings.domain} />
                    </div>
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold tracking-tight">{pageName(page)}</h3>
                          <p className="mt-1 truncate text-xs text-muted-foreground">/{page.slug || 'unpublished-slug'}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="-mr-2 -mt-2 h-8 w-8 shrink-0"
                              aria-label={`More actions for ${pageName(page)}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={updating}
                              className="text-destructive focus:text-destructive"
                              onSelect={() => handleArchive(page)}
                            >
                              <Archive className="h-4 w-4" />
                              Archive page
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'border text-[10px]',
                            isLegacy ? 'border-slate-300 bg-slate-100 text-slate-600' : statusClassName(page.status)
                          )}
                        >
                          {isLegacy ? 'Legacy record' : statusLabel(page.status)}
                        </Badge>
                        {page.templateKey && (
                          <Badge variant="secondary" className="max-w-full truncate text-[10px] font-medium">
                            {templateLabel(page.templateKey)}
                          </Badge>
                        )}
                        {page.templateVersion && <span className="text-[10px] text-muted-foreground">v{page.templateVersion}</span>}
                      </div>

                      <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Structure</p>
                          <p className="mt-1 text-xs font-medium">{isLegacy ? 'Legacy layout' : `${sections} fixed sections`}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Scope</p>
                          <p className="mt-1 text-xs font-medium">{page.scope?.type ?? 'Tenant'}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!isLegacy && (
                          <Button variant="outline" size="sm" className="h-8 flex-1 text-xs" asChild>
                            <Link to={`/online-ordering/pages/${page.id}/edit`}>
                              <Pencil className="h-3.5 w-3.5" />
                              Customize
                            </Link>
                          </Button>
                        )}
                        {!isLegacy && page.status !== PageStatus.PUBLISHED && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 flex-1 text-xs"
                            disabled={updating}
                            onClick={() => handlePublish(page)}
                          >
                            <Globe2 className="h-3.5 w-3.5" />
                            Publish
                          </Button>
                        )}
                        {!isLegacy && page.status === PageStatus.PUBLISHED && (
                          <Button
                            size="sm"
                            className={cn('h-8 flex-1 text-xs', isActive && 'bg-emerald-600 hover:bg-emerald-600')}
                            disabled={updating || isActive}
                            onClick={() => handleSetActive(page)}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {isActive ? 'Active' : 'Set active'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed bg-slate-50/60 shadow-none">
              <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-semibold">No landing pages found</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {pages.length
                    ? 'Try another search or filter, or clear the view to see every saved page.'
                    : 'Import a fixed template to create your first storefront experience.'}
                </p>
                {pages.length > 0 && (pageQuery || pageFilter !== 'all') && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={clearPageFilters}>
                    Clear filters
                  </Button>
                )}
                {!pages.length && (
                  <Button size="sm" className="mt-4" onClick={() => setTemplatePickerOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Import a template
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
      <PageTemplatePicker open={templatePickerOpen} onOpenChange={setTemplatePickerOpen} />
    </PageWrapper>
  );
};

export default OnlineOrderingPages;
