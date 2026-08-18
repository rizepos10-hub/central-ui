import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LayoutTemplate, Loader2, Search, Sparkles, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from 'app/lib/utils';
import { toast } from 'react-toastify';
import { createFromTemplate, getTemplates } from './page-template.actions';
import { getEntities } from './pages.reducer';
import { IPageTemplateDescriptor } from 'app/shared/model/ONLINE_ORDERING/page-template.model';
import { IOnlineOrderingPage } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import PageTemplatePreview from './page-template-preview';

type PageTemplatePickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type TemplateFilter = 'all' | string;

const verticalLabel = (vertical?: string) => {
  switch (vertical) {
    case 'restaurant':
      return 'Restaurant';
    case 'retail':
      return 'Retail';
    case 'hospitality':
      return 'Hospitality';
    default:
      return 'General';
  }
};

const verticalTone = (vertical?: string) => {
  switch (vertical) {
    case 'restaurant':
      return 'border-amber-200/80 bg-amber-50/50';
    case 'retail':
      return 'border-sky-200/80 bg-sky-50/50';
    case 'hospitality':
      return 'border-rose-200/80 bg-rose-50/50';
    default:
      return 'border-emerald-200/80 bg-emerald-50/40';
  }
};

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const getApiErrorMessage = (error: unknown) => {
  const candidate = error as { message?: string; response?: { data?: { message?: string } } };
  return candidate?.response?.data?.message || candidate?.message || '';
};

const templatePreviewPage = (template: IPageTemplateDescriptor): IOnlineOrderingPage => ({
  name: template.name,
  slug: template.defaultSlug,
  templateKey: template.key,
  templateVersion: template.version,
  sections: [],
});

export const PageTemplatePicker = ({ open, onOpenChange }: PageTemplatePickerProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const templates = useAppSelector(state => state.onlineOrderingPage.templates);
  const updating = useAppSelector(state => state.onlineOrderingPage.updating);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [pageName, setPageName] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [templateQuery, setTemplateQuery] = useState('');
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>('all');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const selectedTemplate = useMemo(() => templates.find(template => template.key === selectedKey), [selectedKey, templates]);

  const templateFilters = useMemo<TemplateFilter[]>(() => {
    const verticals = Array.from(new Set<string>(templates.map(template => template.vertical).filter(Boolean)));
    return ['all', ...verticals];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const query = templateQuery.trim().toLowerCase();
    return templates.filter(template => {
      const matchesFilter = templateFilter === 'all' || template.vertical === templateFilter;
      const matchesQuery =
        !query ||
        [template.name, template.description, template.key, template.defaultSlug, template.vertical].some(value =>
          value?.toLowerCase().includes(query)
        );
      return matchesFilter && matchesQuery;
    });
  }, [templateFilter, templateQuery, templates]);

  useEffect(() => {
    if (!open) return undefined;

    let mounted = true;
    setSelectedKey(null);
    setPageName('');
    setPageSlug('');
    setTemplateQuery('');
    setTemplateFilter('all');
    setLoadingTemplates(true);

    dispatch(getTemplates())
      .unwrap()
      .catch(() => {
        if (mounted) toast.error('Could not load storefront templates. Please try again.');
      })
      .finally(() => {
        if (mounted) setLoadingTemplates(false);
      });

    return () => {
      mounted = false;
    };
  }, [dispatch, open]);

  const selectTemplate = (template: IPageTemplateDescriptor) => {
    setSelectedKey(template.key);
    setPageName(template.name);
    setPageSlug(template.defaultSlug);
  };

  const handleCreate = async (publish: boolean) => {
    const normalizedSlug = toSlug(pageSlug);
    if (!selectedKey || !pageName.trim() || !normalizedSlug) {
      toast.warn('Choose a template and complete the page name and URL slug');
      return;
    }
    try {
      const result = await dispatch(
        createFromTemplate({ templateKey: selectedKey, name: pageName.trim(), slug: normalizedSlug, publish })
      ).unwrap();
      const importedPage = result.data;
      const returnedTemplateKey = importedPage.templateKey?.trim().toLowerCase();
      if (returnedTemplateKey !== selectedKey.trim().toLowerCase() || !importedPage.templateVersion) {
        throw new Error('TEMPLATE_METADATA_MISSING');
      }
      await dispatch(getEntities());
      toast.success(publish ? 'Landing page created and published' : 'Landing page created as draft');
      onOpenChange(false);
      navigate(`/online-ordering/pages/${result.data.id}/edit`);
    } catch (error) {
      if (error instanceof Error && error.message === 'TEMPLATE_METADATA_MISSING') {
        toast.error('Template import returned incomplete metadata. Rebuild and restart Central, then import the template again.');
      } else if (getApiErrorMessage(error).toLowerCase().includes('slug already in use')) {
        toast.error(
          'That URL slug is already used by another active landing page. Choose a different slug or archive the active page first.'
        );
      } else {
        toast.error('Failed to create landing page. Check that the URL slug is unique.');
      }
    }
  };

  const canCreate = Boolean(selectedTemplate && pageName.trim() && toSlug(pageSlug) && !updating);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[94vh] max-h-[94vh] max-w-6xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-y-auto p-0 lg:overflow-hidden">
        <DialogHeader className="shrink-0 border-b bg-slate-950 px-6 py-5 text-white sm:px-7">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-2.5 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl text-white">Start from a storefront template</DialogTitle>
              <DialogDescription className="mt-1 max-w-2xl text-slate-300">
                Pick a fixed visual system, then import a private copy you can customize without changing its structure.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_330px] lg:overflow-hidden">
          <div className="min-h-0 space-y-4 p-5 sm:p-6 lg:overflow-y-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Browse templates</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {filteredTemplates.length} of {templates.length} available
                </p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={templateQuery}
                  onChange={event => setTemplateQuery(event.target.value)}
                  placeholder="Search templates"
                  className="h-9 bg-background pl-9 pr-9"
                  autoFocus
                />
                {templateQuery && (
                  <button
                    type="button"
                    aria-label="Clear template search"
                    onClick={() => setTemplateQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {templateFilters.map(filter => {
                const active = templateFilter === filter;
                return (
                  <Button
                    key={filter}
                    variant={active ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'shrink-0 rounded-full border px-3 text-xs',
                      active
                        ? 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/15'
                        : 'border-transparent text-muted-foreground'
                    )}
                    onClick={() => setTemplateFilter(filter)}
                  >
                    {filter === 'all' ? 'All templates' : verticalLabel(filter)}
                  </Button>
                );
              })}
            </div>

            {loadingTemplates ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[310px] animate-pulse rounded-2xl border bg-muted/40" />
                ))}
              </div>
            ) : filteredTemplates.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredTemplates.map(template => {
                  const selected = selectedKey === template.key;
                  return (
                    <button
                      key={template.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectTemplate(template)}
                      className={cn(
                        'group relative min-w-0 rounded-2xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        verticalTone(template.vertical),
                        selected && 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/25'
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <Badge variant="outline" className="border-white/70 bg-white/70 text-[10px]">
                          {verticalLabel(template.vertical)}
                        </Badge>
                        {selected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">
                            <Check className="h-3 w-3" />
                            Selected
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                            Choose
                          </span>
                        )}
                      </div>
                      <div className="flex justify-center rounded-xl border border-white/70 bg-white/75 py-3 shadow-inner">
                        <PageTemplatePreview page={templatePreviewPage(template)} showLinks={false} showMeta={false} />
                      </div>
                      <div className="mt-3 min-w-0">
                        <p className="truncate text-sm font-semibold">{template.name}</p>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">/{template.defaultSlug}</p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{template.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 text-center">
                <div className="rounded-2xl bg-background p-3 shadow-sm">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm font-semibold">No templates match that search</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                  Try a template name, vertical, or keyword such as carousel, retail, or hospitality.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setTemplateQuery('');
                    setTemplateFilter('all');
                  }}
                >
                  Clear search
                </Button>
              </div>
            )}
          </div>

          <aside className="border-t bg-muted/20 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <Card className="overflow-hidden border-primary/20 bg-background shadow-sm lg:sticky lg:top-0">
              <div className="border-b bg-gradient-to-br from-primary/10 via-background to-indigo-500/10 p-5">
                <div className="flex items-center gap-2 text-primary">
                  <LayoutTemplate className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">Import setup</p>
                </div>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">Make it yours</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Your imported page starts as a draft copy. The template structure stays fixed while its approved properties remain
                  editable.
                </p>
              </div>
              <CardContent className="space-y-4 p-5">
                {selectedTemplate ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Selected template</p>
                        <p className="mt-1 truncate text-sm font-semibold">{selectedTemplate.name}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {verticalLabel(selectedTemplate.vertical)}
                      </Badge>
                    </div>
                    <p className="mt-2 truncate text-xs text-muted-foreground">/{selectedTemplate.defaultSlug} · fixed structure</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                    <LayoutTemplate className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Select a template to unlock the page details.</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="landing-page-name" className="text-xs font-medium">
                    Page name
                  </label>
                  <Input
                    id="landing-page-name"
                    value={pageName}
                    onChange={event => setPageName(event.target.value)}
                    placeholder="Summer storefront"
                    disabled={!selectedTemplate}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="landing-page-slug" className="text-xs font-medium">
                    URL slug
                  </label>
                  <Input
                    id="landing-page-slug"
                    value={pageSlug}
                    onChange={event => setPageSlug(toSlug(event.target.value))}
                    placeholder="summer-storefront"
                    disabled={!selectedTemplate}
                  />
                  <p className="text-[11px] leading-4 text-muted-foreground">
                    Unique URL-safe identifier. Preview:{' '}
                    <span className="font-medium text-foreground">/{toSlug(pageSlug) || 'your-slug'}</span>
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                  <span className="font-medium text-foreground">What happens next?</span> Importing creates a saved landing page copy, then
                  opens the customization workspace.
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        <DialogFooter className="shrink-0 border-t bg-background px-5 py-4 sm:px-6">
          <p className="mr-auto hidden text-xs text-muted-foreground sm:block">
            {selectedTemplate ? 'Ready when you are.' : 'Choose a starting point first.'}
          </p>
          <Button variant="outline" className="h-9 text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" className="h-9 text-xs" disabled={!canCreate} onClick={() => handleCreate(false)}>
            {updating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Import as draft
          </Button>
          <Button className="h-9 text-xs" disabled={!canCreate} onClick={() => handleCreate(true)}>
            {updating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Import &amp; publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PageTemplatePicker;
