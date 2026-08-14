import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LayoutTemplate } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import { createFromTemplate, getTemplates } from './page-template.actions';
import { getEntities } from './pages.reducer';
import { IPageTemplateDescriptor } from 'app/shared/model/ONLINE_ORDERING/page-template.model';

type PageTemplatePickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const verticalLabel = (vertical: string) => {
  switch (vertical) {
    case 'restaurant':
      return 'Restaurant';
    case 'retail':
      return 'Retail';
    default:
      return 'General';
  }
};

const accentByVertical: Record<string, string> = {
  restaurant: 'from-amber-500/80 via-rose-500/70 to-slate-950',
  retail: 'from-sky-500/80 via-indigo-500/70 to-slate-950',
  generic: 'from-emerald-500/80 via-teal-500/70 to-slate-950',
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

export const PageTemplatePicker = ({ open, onOpenChange }: PageTemplatePickerProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const templates = useAppSelector(state => state.onlineOrderingPage.templates);
  const updating = useAppSelector(state => state.onlineOrderingPage.updating);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [pageName, setPageName] = useState('');
  const [pageSlug, setPageSlug] = useState('');

  const selectedTemplate = useMemo(
    () => templates.find(template => template.key === selectedKey),
    [selectedKey, templates]
  );

  useEffect(() => {
    if (open) {
      dispatch(getTemplates());
      setSelectedKey(null);
      setPageName('');
      setPageSlug('');
    }
  }, [dispatch, open]);

  const selectTemplate = (template: IPageTemplateDescriptor) => {
    setSelectedKey(template.key);
    setPageName(template.name);
    setPageSlug(template.defaultSlug);
  };

  const handleCreate = async (publish: boolean) => {
    if (!selectedKey || !pageName.trim() || !pageSlug.trim()) {
      toast.warn('Choose a template and complete the page name and slug');
      return;
    }
    try {
      const result = await dispatch(
        createFromTemplate({ templateKey: selectedKey, name: pageName.trim(), slug: toSlug(pageSlug), publish })
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
        toast.error('That slug is already used by another active landing page. Choose a different slug or archive the active page first.');
      } else {
        toast.error('Failed to create landing page. Check that the slug is unique.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose a storefront template</DialogTitle>
          <DialogDescription>
            Each template has a fixed structure. You can customize its content, visibility, branding, and storefront chrome after importing it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            {templates.map((template: IPageTemplateDescriptor) => {
              const selected = selectedKey === template.key;
              return (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => selectTemplate(template)}
                  className={`group rounded-xl border p-3 text-left transition-all ${
                    selected ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30' : 'border-border hover:-translate-y-0.5 hover:bg-muted/40'
                  }`}
                >
                  <div className={`relative mb-3 h-24 overflow-hidden rounded-lg bg-gradient-to-br ${accentByVertical[template.vertical] ?? accentByVertical.generic}`}>
                    <div className="absolute inset-x-3 top-3 h-2 rounded-full bg-white/80" />
                    <div className="absolute inset-x-3 top-8 grid grid-cols-3 gap-2">
                      <span className="h-10 rounded-md bg-white/35" />
                      <span className="h-10 rounded-md bg-white/20" />
                      <span className="h-10 rounded-md bg-white/25" />
                    </div>
                    {selected && <span className="absolute right-2 top-2 rounded-full bg-white p-1 text-primary"><Check className="h-3 w-3" /></span>}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{template.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">/{template.defaultSlug}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{verticalLabel(template.vertical)}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{template.description}</p>
                </button>
              );
            })}
          </div>

          <Card className="h-fit bg-muted/20">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Create a landing page</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Importing creates a saved landing page copy. It does not create a reusable tenant template.
              </p>
              <div className="space-y-2">
                <Label htmlFor="landing-page-name">Page name</Label>
                <Input id="landing-page-name" value={pageName} onChange={event => setPageName(event.target.value)} placeholder="Summer storefront" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="landing-page-slug">Slug</Label>
                <Input id="landing-page-slug" value={pageSlug} onChange={event => setPageSlug(toSlug(event.target.value))} placeholder="summer-storefront" />
                <p className="text-[11px] text-muted-foreground">Use a unique URL-safe slug. The active page is shown at the storefront home route.</p>
              </div>
              {selectedTemplate && <div className="rounded-lg border bg-background p-3 text-xs"><span className="font-medium">Selected:</span> {selectedTemplate.name}</div>}
            </CardContent>
          </Card>
        </div>

        {templates.length === 0 && <p className="text-sm text-muted-foreground">No code-defined templates are available.</p>}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" className="h-8 text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" className="h-8 text-xs" disabled={!selectedKey || updating} onClick={() => handleCreate(false)}>Import as draft</Button>
          <Button className="h-8 text-xs" disabled={!selectedKey || updating} onClick={() => handleCreate(true)}>Import &amp; publish</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PageTemplatePicker;
