import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select as SectionTypeSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import ItemSelectionModal from 'app/entities/menu/item-selection-modal';
import CategorySelect from 'app/shared/components/select/select';
import { searchEntities as searchItems } from 'app/entities/item/all-items.reducer';
import { getEntities as getRestaurantCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { ITerm } from 'app/shared/model/term.model';
import { IAttachment } from 'app/shared/model/attachment.model';
import { IOnlineOrderingPage, IPageSection, IPageSeo, IPageThemeOverride, defaultPageValue } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { SectionType, PageStatus } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.enums';
import {
  getEntity,
  publishEntity,
  reset,
  updateEntity,
} from './pages.reducer';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { getEntity as getLandingPageSettings, updateEntity as updateLandingPageSettings } from '../settings/landing-page-settings.reducer';
import { getEntity as getStorefrontSettings } from '../settings/storefront-settings.reducer';
import { LOCAL_STOREFRONT_URL, canOpenLivePreview, getLivePreviewUrl } from './page-preview-utils';
import { PageThemeOverrideFields, SectionAppearanceFields, defaultSectionAppearance } from './section-appearance-fields';
import { HeroCarouselSlidesEditor, SelectedImagePreview } from './hero-carousel-slides-editor';
import { defaultFooterColumns, FooterColumn, FooterSectionEditor } from './footer-section-editor';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ColorInputField } from './color-input-field';
import { PropertyEditorGroup } from './property-editor-group';
import { ILandingPageSettings, IStorefrontSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import PageChromeFields from './page-chrome-fields';
import LandingEditorWorkspace from './landing-editor-workspace';
import { EditorNode, normalizeLandingPage } from './landing-editor-bridge';
import ElementPropertiesFields from './element-properties-fields';

const sectionLabel = (type: SectionType) =>
  type
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const clampPercentage = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : fallback;
};

const setValueAtPath = (source: unknown, path: string, value: unknown): unknown => {
  const parts = path.split('.').filter(Boolean);
  if (!parts.length) return source;

  const [head, ...tail] = parts;
  const container: Record<string, unknown> | unknown[] = Array.isArray(source)
    ? [...source]
    : { ...(source && typeof source === 'object' ? source as Record<string, unknown> : {}) };
  const nextValue = tail.length ? setValueAtPath(Array.isArray(container) ? container[Number(head)] : container[head], tail.join('.'), value) : value;

  if (Array.isArray(container)) container[Number(head)] = nextValue;
  else container[head] = nextValue;
  return container;
};

type EditorHistoryState = {
  present: IOnlineOrderingPage;
  past: IOnlineOrderingPage[];
  future: IOnlineOrderingPage[];
  saved: string;
};

type EditorHistoryAction =
  | { type: 'update'; updater: (page: IOnlineOrderingPage) => IOnlineOrderingPage }
  | { type: 'load'; page: IOnlineOrderingPage }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'mark-saved'; page: IOnlineOrderingPage };

const pageSignature = (page: IOnlineOrderingPage) => JSON.stringify(page);

function editorHistoryReducer(state: EditorHistoryState, action: EditorHistoryAction): EditorHistoryState {
  if (action.type === 'load') {
    const page = normalizeLandingPage(action.page);
    return { present: page, past: [], future: [], saved: pageSignature(page) };
  }
  if (action.type === 'update') {
    const next = action.updater(state.present);
    if (pageSignature(next) === pageSignature(state.present)) return state;
    return { present: next, past: [...state.past, state.present].slice(-50), future: [], saved: state.saved };
  }
  if (action.type === 'undo') {
    const previous = state.past[state.past.length - 1];
    if (!previous) return state;
    return { present: previous, past: state.past.slice(0, -1), future: [state.present, ...state.future].slice(0, 50), saved: state.saved };
  }
  if (action.type === 'redo') {
    const next = state.future[0];
    if (!next) return state;
    return { present: next, past: [...state.past, state.present].slice(-50), future: state.future.slice(1), saved: state.saved };
  }
  if (action.type === 'mark-saved') {
    const page = normalizeLandingPage(action.page);
    return { ...state, present: page, saved: pageSignature(page) };
  }
  return state;
}

const OnlineOrderingPageEditor = () => {
  const { id } = useParams<'id'>();
  const isNew = !id || id === 'new';
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const updating = useAppSelector(state => state.onlineOrderingPage.updating || state.landingPageSettings.updating || state.storefrontSettings.updating);
  const landingPageSettings: ILandingPageSettings = useAppSelector(state => state.landingPageSettings.entity);
  const storefrontSettings: IStorefrontSettings = useAppSelector(state => state.storefrontSettings.entity);
  const uiSettings: IUiSettings = { ...landingPageSettings, ...storefrontSettings };
  const [history, dispatchHistory] = useReducer(editorHistoryReducer, {
    present: { ...defaultPageValue },
    past: [],
    future: [],
    saved: pageSignature(defaultPageValue),
  });
  const page = history.present;
  const setPage = (updater: React.SetStateAction<IOnlineOrderingPage>) => {
    dispatchHistory({ type: 'update', updater: typeof updater === 'function' ? updater : () => updater });
  };
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<IItem[]>([]);
  const itemsLoading = useAppSelector(state => state.allItems.loading);

  useEffect(() => {
    if (isNew) {
      navigate('/online-ordering/pages', { replace: true });
      return;
    }
    dispatch(getRestaurantCategories({}));
    dispatch(getLandingPageSettings());
    dispatch(getStorefrontSettings());
    if (!isNew && id) {
      dispatch(getEntity(id)).unwrap().then(res => dispatchHistory({ type: 'load', page: res.data }));
    }
    return () => {
      dispatch(reset());
    };
  }, [dispatch, id, isNew, navigate]);

  const debouncedLoadItemOptions = useMemo(
    () =>
      debounce((inputValue: string, callback: (options: Array<{ value: string; label: string; data: IItem }>) => void) => {
        dispatch(searchItems({ query: inputValue, page: 0, size: 20 }))
          .unwrap()
          .then(result => {
            callback(
              (result.data ?? []).map((item: IItem) => ({
                value: item.id,
                label: item.name,
                data: item,
              }))
            );
          })
          .catch(() => callback([]));
      }, 300),
    [dispatch]
  );

  const updatePageField = (field: keyof IOnlineOrderingPage, value: unknown) => {
    setPage(prev => ({ ...prev, [field]: value }));
  };

  const updatePagePath = (path: string, value: unknown) => {
    setPage(prev => setValueAtPath(prev, path, value) as IOnlineOrderingPage);
  };

  const updateSection = (index: number, patch: Partial<IPageSection>) => {
    setPage(prev => {
      const sections = [...(prev.sections ?? [])];
      sections[index] = { ...sections[index], ...patch };
      return { ...prev, sections };
    });
  };

  const updateSectionConfig = (index: number, key: string, value: unknown) => {
    setPage(prev => {
      const sections = [...(prev.sections ?? [])];
      const config = { ...(sections[index].config ?? {}), [key]: value };
      sections[index] = { ...sections[index], config };
      return { ...prev, sections };
    });
  };

  const updateSectionFeaturedItems = (index: number, items: IItem[]) => {
    setPage(prev => {
      const sections = [...(prev.sections ?? [])];
      sections[index] = {
        ...sections[index],
        config: {
          ...(sections[index].config ?? {}),
          items,
          itemRefs: items.map(item => ({ itemId: item.id })),
        },
      };
      return { ...prev, sections };
    });
  };

  const toggleFeaturedItems = (items: IItem[]) => {
    const updatedList = [...selectedItems];
    items.forEach(item => {
      const existingIndex = updatedList.findIndex(selected => selected.id === item.id);
      if (existingIndex === -1) {
        updatedList.push(item);
      } else {
        updatedList.splice(existingIndex, 1);
      }
    });
    setSelectedItems(updatedList);
    if (editingSectionIndex != null) {
      updateSectionFeaturedItems(editingSectionIndex, updatedList);
    }
  };

  const savePage = async () => {
    if (!page.id) {
      toast.error('Import a template before editing a landing page');
      return;
    }
    const payload = normalizeLandingPage(page);
    const response = await dispatch(updateEntity(payload)).unwrap();
    dispatchHistory({ type: 'mark-saved', page: response.data ?? payload });
    toast.success('Landing page saved');
  };

  const publishPage = async () => {
    if (!page.id) {
      toast.error('Save the page before publishing');
      return;
    }
    const payload = normalizeLandingPage(page);
    await dispatch(updateEntity(payload)).unwrap();
    const response = await dispatch(publishEntity(page.id)).unwrap();
    dispatchHistory({ type: 'mark-saved', page: { ...(response.data ?? payload), status: PageStatus.PUBLISHED } });
    toast.success('Page published');
  };

  const openPreview = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const livePreviewUrl = getLivePreviewUrl(uiSettings);
  const previewUrl =
    canOpenLivePreview(page, uiSettings) && livePreviewUrl
      ? livePreviewUrl
      : LOCAL_STOREFRONT_URL;

  const handleSetActiveAndPreview = async () => {
    if (!page.id || !page.slug) {
      toast.error('Save the page before setting it active');
      return;
    }
    const next = {
      ...landingPageSettings,
      defaultPageId: page.id,
      defaultPageSlug: page.slug,
    };
    await dispatch(updateLandingPageSettings(next)).unwrap();
    toast.success('Landing page set as active');
    openPreview(LOCAL_STOREFRONT_URL);
  };

  const renderPageProperties = () => (
    <Card>
      <CardContent className="space-y-2 p-2">
        <PropertyEditorGroup title="Identity" description="Name and public URL" defaultOpen>
          <div className="landing-editor-fields-grid grid gap-2">
            <div><Label>Name</Label><Input className="h-8 text-xs" value={page.name ?? ''} onChange={event => updatePageField('name', event.target.value)} /></div>
            <div><Label>Slug</Label><Input className="h-8 text-xs" value={page.slug ?? ''} onChange={event => updatePageField('slug', event.target.value.toLowerCase())} placeholder="home" /></div>
          </div>
        </PropertyEditorGroup>
        <PageThemeOverrideFields templateKey={page.templateKey} themeOverride={page.themeOverride ?? {}} onChange={(value: IPageThemeOverride) => updatePageField('themeOverride', value)} />
        <PropertyEditorGroup title="Search preview" description="How this page appears in search and sharing" defaultOpen={false}>
          <div className="space-y-2">
            <div><Label>SEO title</Label><Input className="h-8 text-xs" value={page.seo?.title ?? ''} onChange={event => updatePageField('seo', { ...(page.seo ?? {}), title: event.target.value } as IPageSeo)} placeholder="Landing page title" /></div>
            <div><Label>SEO description</Label><Input className="h-8 text-xs" value={page.seo?.description ?? ''} onChange={event => updatePageField('seo', { ...(page.seo ?? {}), description: event.target.value } as IPageSeo)} placeholder="Short description for search and sharing" /></div>
          </div>
        </PropertyEditorGroup>
      </CardContent>
    </Card>
  );

  const renderChromeProperties = (part: 'header' | 'footer') => <PageChromeFields part={part} templateKey={page.templateKey} chrome={page.chrome ?? {}} onChange={value => updatePageField('chrome', value)} />;

  const renderSectionProperties = (index: number) => {
    const section = page.sections?.[index];
    if (!section) return <p className="text-xs text-muted-foreground">This template slot is unavailable.</p>;
    return (
      <Card>
        <CardContent className="p-2">
          <SectionConfigForm
            section={section}
            debouncedLoadItemOptions={debouncedLoadItemOptions}
            itemsLoading={itemsLoading}
            templateLocked
            onConfigChange={(key, value) => updateSectionConfig(index, key, value)}
            onFeaturedItemsChange={items => updateSectionFeaturedItems(index, items)}
            onPickItems={() => {
              setEditingSectionIndex(index);
              setSelectedItems((section.config?.items as IItem[]) ?? []);
              setItemModalOpen(true);
            }}
          />
        </CardContent>
      </Card>
    );
  };

  const renderAppearanceProperties = (index: number) => (
    <div className="space-y-2">
      <SectionAppearanceFields
        embedded
        sectionType={page.sections?.[index]?.type ?? SectionType.HERO_CAROUSEL}
        appearance={(page.sections?.[index]?.config?.appearance ?? {}) as Record<string, unknown>}
        templateKey={page.templateKey}
        themeOverride={page.themeOverride}
        sectionConfig={page.sections?.[index]?.config}
        onChange={next => updateSectionConfig(index, 'appearance', next)}
      />
    </div>
  );

  const renderElementProperties = (node: EditorNode) => (
    <ElementPropertiesFields node={node} page={page} onUpdatePath={updatePagePath} />
  );

  return (
    <>
      <LandingEditorWorkspace
        page={page}
        uiSettings={uiSettings}
        updating={updating}
        dirty={pageSignature(page) !== history.saved}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        selectedSectionIndex={selectedSectionIndex}
        onSelectSection={setSelectedSectionIndex}
        onUpdateSection={updateSection}
        onSave={savePage}
        onPublish={publishPage}
        onUndo={() => dispatchHistory({ type: 'undo' })}
        onRedo={() => dispatchHistory({ type: 'redo' })}
        onBack={() => navigate('/online-ordering/pages')}
        onOpenLivePreview={() => openPreview(previewUrl)}
        onSetActiveAndPreview={handleSetActiveAndPreview}
        renderPageProperties={renderPageProperties}
        renderChromeProperties={renderChromeProperties}
        renderSectionProperties={renderSectionProperties}
        renderAppearanceProperties={renderAppearanceProperties}
        renderElementProperties={renderElementProperties}
      />
      <ItemSelectionModal
        isOpen={itemModalOpen}
        toggle={() => setItemModalOpen(false)}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        handleToggleSelect={toggleFeaturedItems}
        variant="featured"
      />
    </>
  );
};

const SectionConfigForm = ({
  section,
  debouncedLoadItemOptions,
  itemsLoading,
  templateLocked,
  onConfigChange,
  onFeaturedItemsChange,
  onPickItems,
}: {
  section: IPageSection;
  debouncedLoadItemOptions: (inputValue: string, callback: (options: Array<{ value: string; label: string; data: IItem }>) => void) => void;
  itemsLoading: boolean;
  templateLocked?: boolean;
  onConfigChange: (key: string, value: unknown) => void;
  onFeaturedItemsChange?: (items: IItem[]) => void;
  onPickItems: () => void;
}) => {
  const config = section.config ?? {};
  const restaurantCategories = useAppSelector(state => state.restaurantCategory.entities);
  const updateArrayItem = <T,>(list: T[], index: number, value: T) => list.map((entry, entryIndex) => (entryIndex === index ? value : entry));

  if (section.type === SectionType.HERO_CAROUSEL) {
    const slides = (config.slides as Array<Record<string, unknown>>) ?? [];
    const layout = (config.layout as string) ?? 'default';
    const promoSide = (config.promoSide as Record<string, unknown>) ?? {};
    return (
      <div className="landing-editor-config-fields space-y-2">
        <PropertyEditorGroup title="Template" description="The template layout stays fixed after import" defaultOpen>
          {templateLocked ? <p className="text-xs text-muted-foreground">Fixed layout: <span className="font-medium text-foreground">{layout}</span></p> : (
            <>
              <Label>Layout</Label>
              <SectionTypeSelect value={layout} onValueChange={value => onConfigChange('layout', value)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default carousel</SelectItem>
                  <SelectItem value="riode-split">Riode split (carousel + side promo)</SelectItem>
                </SelectContent>
              </SectionTypeSelect>
            </>
          )}
        </PropertyEditorGroup>
        <PropertyEditorGroup title="Slides" description="Edit the carousel images and copy" badge={`${slides.length}`} defaultOpen>
          <HeroCarouselSlidesEditor
            slides={slides}
            layout={layout}
            fixedStructure={templateLocked}
            onChange={next => onConfigChange('slides', next)}
          />
        </PropertyEditorGroup>
        {layout === 'riode-split' && (
          <PropertyEditorGroup title="Side promotion" description="Optional content beside the carousel" defaultOpen={false}>
            <div className="space-y-2">
              <div className="landing-editor-fields-grid grid gap-2">
                <div><Label>Eyebrow</Label><Input value={(promoSide.eyebrow as string) ?? ''} onChange={e => onConfigChange('promoSide', { ...promoSide, eyebrow: e.target.value })} /></div>
                <div><Label>Title</Label><Input value={(promoSide.title as string) ?? ''} onChange={e => onConfigChange('promoSide', { ...promoSide, title: e.target.value })} /></div>
                <div><Label>Subtitle</Label><Input value={(promoSide.subtitle as string) ?? ''} onChange={e => onConfigChange('promoSide', { ...promoSide, subtitle: e.target.value })} /></div>
                <div><Label>CTA text</Label><Input value={((promoSide.cta as Record<string, string> | undefined)?.text) ?? ''} onChange={e => onConfigChange('promoSide', { ...promoSide, cta: { ...((promoSide.cta as Record<string, string>) ?? {}), text: e.target.value } })} /></div>
                <div className="landing-editor-wide-field"><Label>CTA URL</Label><Input value={((promoSide.cta as Record<string, string> | undefined)?.url) ?? ''} onChange={e => onConfigChange('promoSide', { ...promoSide, cta: { ...((promoSide.cta as Record<string, string>) ?? {}), url: e.target.value } })} /></div>
              </div>
              <div><Label>Image</Label><SelectedImagePreview image={(promoSide.image as IAttachment) ?? null} onClear={() => onConfigChange('promoSide', { ...promoSide, image: undefined })} /></div>
              <MediaLibrary
                handleFilesSelectCallback={files => {
                  const image = transformAttachmentStructure(files, 'toIAttachment')[0];
                  onConfigChange('promoSide', { ...promoSide, image });
                }}
              />
            </div>
          </PropertyEditorGroup>
        )}
      </div>
    );
  }

  if (section.type === SectionType.FEATURED_ITEMS) {
    const items = (config.items as IItem[]) ?? [];
    return (
      <div className="landing-editor-config-fields space-y-2">
        <PropertyEditorGroup title="Content" description="Section heading and display options" defaultOpen>
          <div className="landing-editor-fields-grid grid gap-2">
            <div>
              {templateLocked ? <p className="text-xs text-muted-foreground">Fixed layout: <span className="font-medium text-foreground">{String(config.layout ?? 'LAYOUT_ONE')}</span></p> : <Label>Layout</Label>}
              {!templateLocked && (
                <SectionTypeSelect value={(config.layout as string) ?? 'LAYOUT_ONE'} onValueChange={value => onConfigChange('layout', value)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAYOUT_ONE">Layout one</SelectItem>
                    <SelectItem value="DISH_GRID">Dish grid</SelectItem>
                  </SelectContent>
                </SectionTypeSelect>
              )}
            </div>
            <div><Label>Title</Label><Input value={(config.title as string) ?? ''} onChange={e => onConfigChange('title', e.target.value)} /></div>
            <div><Label>Eyebrow (optional)</Label><Input value={(config.eyebrow as string) ?? ''} onChange={e => onConfigChange('eyebrow', e.target.value)} /></div>
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs">
            <Checkbox checked={config.showImages !== false} onCheckedChange={checked => onConfigChange('showImages', checked === true)} />
            <span>Show item images</span>
          </label>
        </PropertyEditorGroup>
        <PropertyEditorGroup title="Featured items" description="Select the products shown in this slot" badge={`${items.length}`} defaultOpen>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">{items.length ? 'Products selected' : 'No products selected'}</span>
            <Button variant="outline" className="h-7 text-xs" onClick={onPickItems}>
              <Plus className="mr-1 h-3 w-3" />
              {items.length ? 'Add / edit' : 'Select items'}
            </Button>
          </div>
          {items.length > 0 && (
            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-2 rounded border bg-muted/20 px-2 py-1">
                  <span className="truncate text-xs">{item.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => onFeaturedItemsChange?.(items.filter(i => i.id !== item.id))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </PropertyEditorGroup>
      </div>
    );
  }

  if (section.type === SectionType.CATEGORY_STRIP) {
    const categories = (config.categories as ITerm[]) ?? [];
    const layout = (config.layout as string) ?? 'default';
    const groups = (config.groups as Array<Record<string, unknown>>) ?? [];
    return (
      <div className="landing-editor-config-fields space-y-2">
        <PropertyEditorGroup title="Content" description="Heading, layout, and image visibility" defaultOpen>
          <div className="landing-editor-fields-grid grid gap-2">
            <div>
              {templateLocked ? <p className="text-xs text-muted-foreground">Fixed layout: <span className="font-medium text-foreground">{layout}</span></p> : <Label>Layout</Label>}
              {!templateLocked && (
                <SectionTypeSelect value={layout} onValueChange={value => onConfigChange('layout', value)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default strip</SelectItem>
                    <SelectItem value="LAYOUT_ONE">Layout one</SelectItem>
                    <SelectItem value="riode-grid">Riode category grid</SelectItem>
                  </SelectContent>
                </SectionTypeSelect>
              )}
            </div>
            <div><Label>Eyebrow (optional)</Label><Input value={(config.eyebrow as string) ?? ''} onChange={e => onConfigChange('eyebrow', e.target.value)} /></div>
            <div><Label>Title</Label><Input value={(config.title as string) ?? ''} onChange={e => onConfigChange('title', e.target.value)} /></div>
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs">
            <Checkbox checked={config.showImages !== false} onCheckedChange={checked => onConfigChange('showImages', checked === true)} />
            <span>Show category images</span>
          </label>
        </PropertyEditorGroup>
        {layout === 'riode-grid' ? (
          <PropertyEditorGroup title="Category groups" description="Organize the links shown in the grid" badge={`${groups.length}`} defaultOpen>
            <div className="space-y-2">
            {groups.map((group, groupIndex) => {
              const links = (group.links as Array<Record<string, string>>) ?? [];
              return (
                <PropertyEditorGroup key={groupIndex} title={`Group ${groupIndex + 1}`} description="Category image and links" badge={`${links.length} links`} defaultOpen={groupIndex === 0} contentClassName="p-2">
                  <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">Group settings</span>
                    {!templateLocked && (
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onConfigChange('groups', groups.filter((_, index) => index !== groupIndex))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <Label>Name</Label>
                  <Input value={(group.name as string) ?? ''} onChange={e => onConfigChange('groups', updateArrayItem(groups, groupIndex, { ...group, name: e.target.value }))} />
                  <Label>Image alt text</Label>
                  <SelectedImagePreview
                    image={(group.image as IAttachment) ?? null}
                    onClear={() => onConfigChange('groups', updateArrayItem(groups, groupIndex, { ...group, image: undefined }))}
                  />
                  <MediaLibrary
                    handleFilesSelectCallback={files => {
                      const image = transformAttachmentStructure(files, 'toIAttachment')[0];
                      onConfigChange('groups', updateArrayItem(groups, groupIndex, { ...group, image }));
                    }}
                  />
                  <Label>Links</Label>
                  {links.map((link, linkIndex) => (
                    <div key={linkIndex} className="landing-editor-fields-grid grid gap-2 rounded border p-2">
                      <div>
                        <Label>Label</Label>
                        <Input
                          value={link.label ?? ''}
                          onChange={e => {
                            const nextLinks = updateArrayItem(links, linkIndex, { ...link, label: e.target.value });
                            onConfigChange('groups', updateArrayItem(groups, groupIndex, { ...group, links: nextLinks }));
                          }}
                        />
                      </div>
                      <div>
                        <Label>URL</Label>
                        <Input
                          value={link.url ?? ''}
                          onChange={e => {
                            const nextLinks = updateArrayItem(links, linkIndex, { ...link, url: e.target.value });
                            onConfigChange('groups', updateArrayItem(groups, groupIndex, { ...group, links: nextLinks }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {!templateLocked && (
                    <Button
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => onConfigChange('groups', updateArrayItem(groups, groupIndex, { ...group, links: [...links, { label: '', url: '' }] }))}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add link
                    </Button>
                  )}
                  </div>
                </PropertyEditorGroup>
              );
            })}
            {!templateLocked && (
              <Button
                variant="outline"
                className="h-8 text-xs"
                onClick={() => onConfigChange('groups', [...groups, { name: '', links: [{ label: '', url: '' }] }])}
              >
                <Plus className="h-3 w-3 mr-1" /> Add group
              </Button>
            )}
            </div>
          </PropertyEditorGroup>
        ) : (
          <PropertyEditorGroup title="Categories" description="Choose which categories appear" defaultOpen>
            <CategorySelect
              isMulti
              options={restaurantCategories}
              value={categories}
              onChange={(value: ITerm[]) => onConfigChange('categories', value ?? [])}
              getOptionLabel={(option: ITerm) => option.name}
              getOptionValue={(option: ITerm) => option.id}
              placeholder="Select categories"
            />
          </PropertyEditorGroup>
        )}
      </div>
    );
  }

  if (section.type === SectionType.BRANCH_DIRECTORY) {
    const variant = (config.variant as string) ?? 'default';
    const cards = (config.cards as Array<Record<string, unknown>>) ?? [];
    return (
      <div className="landing-editor-config-fields space-y-2">
        <PropertyEditorGroup title="Content" description="Display mode, heading, and supporting copy" defaultOpen>
          <div className="landing-editor-fields-grid grid gap-2">
            <div>
              {templateLocked ? <p className="text-xs text-muted-foreground">Fixed display mode: <span className="font-medium text-foreground">{variant}</span></p> : <Label>Display mode</Label>}
              {!templateLocked && (
                <SectionTypeSelect value={variant} onValueChange={value => onConfigChange('variant', value)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Branch / zone listing (from API)</SelectItem>
                    <SelectItem value="cards">Location cards (configured below)</SelectItem>
                  </SelectContent>
                </SectionTypeSelect>
              )}
            </div>
            <div><Label>Eyebrow (optional)</Label><Input value={(config.eyebrow as string) ?? ''} onChange={e => onConfigChange('eyebrow', e.target.value)} /></div>
            <div><Label>Section title</Label><Input value={(config.title as string) ?? ''} onChange={e => onConfigChange('title', e.target.value)} /></div>
            <div><Label>Subtitle (optional)</Label><Input value={(config.subtitle as string) ?? ''} onChange={e => onConfigChange('subtitle', e.target.value)} /></div>
          </div>
        </PropertyEditorGroup>
        {variant === 'cards' ? (
          <PropertyEditorGroup title="Location cards" description="Configured branches and actions" badge={`${cards.length}`} defaultOpen>
            <div className="space-y-2">
            <Label className="text-xs">Location cards ({cards.length})</Label>
            {cards.map((card, cardIndex) => {
              const image = (card.image as IAttachment) ?? null;
              const lines = (card.lines as string[]) ?? [''];
              const actions = (card.actions as Array<Record<string, string>>) ?? [
                { text: '', url: '', variant: 'gold' },
                { text: '', url: '', variant: 'outline' },
              ];
              return (
                <PropertyEditorGroup key={cardIndex} title={`Card ${cardIndex + 1}`} description="Location details and actions" defaultOpen={cardIndex === 0} contentClassName="p-2">
                  <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">Card settings</span>
                    {!templateLocked && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => onConfigChange('cards', cards.filter((_, index) => index !== cardIndex))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <Label>Tag</Label>
                  <Input
                    value={(card.tag as string) ?? ''}
                    onChange={e => {
                      const next = [...cards];
                      next[cardIndex] = { ...next[cardIndex], tag: e.target.value };
                      onConfigChange('cards', next);
                    }}
                  />
                  <Label>Title</Label>
                  <Input
                    value={(card.title as string) ?? ''}
                    onChange={e => {
                      const next = [...cards];
                      next[cardIndex] = { ...next[cardIndex], title: e.target.value };
                      onConfigChange('cards', next);
                    }}
                  />
                  <Label>Image</Label>
                  <SelectedImagePreview image={image} onClear={() => {
                    const next = [...cards];
                    next[cardIndex] = { ...next[cardIndex], image: undefined };
                    onConfigChange('cards', next);
                  }} />
                  <MediaLibrary
                    handleFilesSelectCallback={files => {
                      const selected = transformAttachmentStructure(files, 'toIAttachment')[0];
                      const next = [...cards];
                      next[cardIndex] = { ...next[cardIndex], image: selected };
                      onConfigChange('cards', next);
                    }}
                  />
                  <Label>Description lines</Label>
                  {lines.map((line, lineIndex) => (
                    <Input
                      key={lineIndex}
                      value={line}
                      onChange={e => {
                        const next = [...cards];
                        const nextLines = [...lines];
                        nextLines[lineIndex] = e.target.value;
                        next[cardIndex] = { ...next[cardIndex], lines: nextLines };
                        onConfigChange('cards', next);
                      }}
                    />
                  ))}
                  {!templateLocked && (
                    <Button
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => {
                        const next = [...cards];
                        next[cardIndex] = { ...next[cardIndex], lines: [...lines, ''] };
                        onConfigChange('cards', next);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add line
                    </Button>
                  )}
                  {actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="landing-editor-fields-grid grid gap-2 rounded border p-2">
                      <div>
                        <Label>Button {actionIndex + 1} text</Label>
                        <Input
                          value={action.text ?? ''}
                          onChange={e => {
                            const next = [...cards];
                            const nextActions = [...actions];
                            nextActions[actionIndex] = { ...nextActions[actionIndex], text: e.target.value };
                            next[cardIndex] = { ...next[cardIndex], actions: nextActions };
                            onConfigChange('cards', next);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Button {actionIndex + 1} URL</Label>
                        <Input
                          value={action.url ?? ''}
                          onChange={e => {
                            const next = [...cards];
                            const nextActions = [...actions];
                            nextActions[actionIndex] = { ...nextActions[actionIndex], url: e.target.value };
                            next[cardIndex] = { ...next[cardIndex], actions: nextActions };
                            onConfigChange('cards', next);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Button {actionIndex + 1} style</Label>
                        <SectionTypeSelect
                          value={action.variant ?? 'gold'}
                          onValueChange={value => {
                            const next = [...cards];
                            const nextActions = [...actions];
                            nextActions[actionIndex] = { ...nextActions[actionIndex], variant: value };
                            next[cardIndex] = { ...next[cardIndex], actions: nextActions };
                            onConfigChange('cards', next);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="outline">Outline</SelectItem>
                          </SelectContent>
                        </SectionTypeSelect>
                      </div>
                    </div>
                  ))}
                  </div>
                </PropertyEditorGroup>
              );
            })}
            {!templateLocked && (
              <Button
                variant="outline"
                className="h-8 text-xs"
                onClick={() =>
                  onConfigChange('cards', [
                    ...cards,
                    {
                      tag: 'Location',
                      title: 'Branch name',
                      lines: ['Address line'],
                      actions: [
                        { text: 'Call', url: 'tel:', variant: 'gold' },
                        { text: 'Directions', url: '#', variant: 'outline' },
                      ],
                    },
                  ])
                }
              >
                <Plus className="h-3 w-3 mr-1" /> Add card
              </Button>
            )}
            </div>
          </PropertyEditorGroup>
        ) : (
          <p className="text-xs text-muted-foreground">Branches and zones are loaded automatically on the storefront.</p>
        )}
      </div>
    );
  }

  if (section.type === SectionType.HERO_BANNER) {
    const primaryCta = (config.primaryCta as Record<string, string>) ?? {};
    const secondaryCta = (config.secondaryCta as Record<string, string>) ?? {};
    const variant = (config.variant as string) ?? 'hero';
    const banners = (config.banners as Array<Record<string, unknown>>) ?? [];
    const imageFit = (config.imageFit as string) ?? (variant === 'retail' ? 'contain' : 'cover');
    const imagePosition = (config.imagePosition as string) ?? 'center';
    const contentAlign = (config.contentAlign as string) ?? 'left';
    const buttonPosition = (config.buttonPosition as string) ?? contentAlign;
    const heroHeight = (config.height as string) ?? 'screen';
    const imageOpacity = clampPercentage(config.imageOpacity, 100);
    const parsedOverlayOpacity = Number(config.overlayOpacity ?? (config.image ? 0 : 88));
    const overlayOpacity = Number.isFinite(parsedOverlayOpacity) ? Math.max(0, Math.min(100, parsedOverlayOpacity)) : config.image ? 0 : 88;
    return (
      <div className="landing-editor-config-fields space-y-2">
        <PropertyEditorGroup title="Template" description="The visual variant is fixed after import" defaultOpen>
          {templateLocked ? <p className="text-xs text-muted-foreground">Fixed visual variant: <span className="font-medium text-foreground">{variant}</span></p> : (
            <>
              <Label>Variant</Label>
              <SectionTypeSelect value={variant} onValueChange={value => onConfigChange('variant', value)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Full hero</SelectItem>
                  <SelectItem value="cta">CTA banner</SelectItem>
                  <SelectItem value="retail">Retail hero (electronics)</SelectItem>
                  <SelectItem value="retail-cta">Retail CTA banner</SelectItem>
                  <SelectItem value="riode-duo">Riode dual promo banners</SelectItem>
                </SelectContent>
              </SectionTypeSelect>
            </>
          )}
        </PropertyEditorGroup>
        {variant === 'riode-duo' ? (
          <PropertyEditorGroup title="Promo banners" description="Content and artwork for each banner" badge={`${banners.length}`} defaultOpen>
            <div className="space-y-2">
            {banners.map((banner, bannerIndex) => {
              const links = (banner.links as Array<Record<string, string>>) ?? [];
              return (
                <PropertyEditorGroup key={bannerIndex} title={`Banner ${bannerIndex + 1}`} description="Promo copy, background, and links" defaultOpen={bannerIndex === 0} contentClassName="p-2">
                  <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">Banner settings</span>
                    {!templateLocked && (
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onConfigChange('banners', banners.filter((_, index) => index !== bannerIndex))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <Label>Title</Label>
                  <Input value={(banner.title as string) ?? ''} onChange={e => onConfigChange('banners', updateArrayItem(banners, bannerIndex, { ...banner, title: e.target.value }))} />
                  <Label>Subtitle</Label>
                  <Input value={(banner.subtitle as string) ?? ''} onChange={e => onConfigChange('banners', updateArrayItem(banners, bannerIndex, { ...banner, subtitle: e.target.value }))} />
                  <ColorInputField
                    label="Background"
                    placeholder={bannerIndex === 0 ? '#3cbea4' : '#444443'}
                    value={(banner.background as string) ?? (bannerIndex === 0 ? '#3cbea4' : '#444443')}
                    onChange={value => onConfigChange('banners', updateArrayItem(banners, bannerIndex, { ...banner, background: value }))}
                  />
                  <Label>Image alt text</Label>
                  <Input
                    value={(banner.imageAlt as string) ?? ''}
                    placeholder="Describe this promo image"
                    onChange={e => onConfigChange('banners', updateArrayItem(banners, bannerIndex, { ...banner, imageAlt: e.target.value }))}
                  />
                  <Label>Image opacity ({clampPercentage(banner.imageOpacity ?? config.imageOpacity, 100)}%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={clampPercentage(banner.imageOpacity ?? config.imageOpacity, 100)}
                    onChange={e => onConfigChange('banners', updateArrayItem(banners, bannerIndex, { ...banner, imageOpacity: clampPercentage(e.target.value, 0) }))}
                  />
                  <SelectedImagePreview
                    image={(banner.image as IAttachment) ?? null}
                    onClear={() => onConfigChange('banners', updateArrayItem(banners, bannerIndex, { ...banner, image: undefined }))}
                  />
                  <MediaLibrary
                    handleFilesSelectCallback={files => {
                      const image = transformAttachmentStructure(files, 'toIAttachment')[0];
                      onConfigChange('banners', updateArrayItem(banners, bannerIndex, { ...banner, image }));
                    }}
                  />
                  {links.map((link, linkIndex) => (
                    <div key={linkIndex} className="landing-editor-fields-grid grid gap-2 rounded border p-2">
                      <div>
                        <Label>Link text</Label>
                        <Input
                          value={link.text ?? ''}
                          onChange={e => {
                            const nextLinks = updateArrayItem(links, linkIndex, { ...link, text: e.target.value });
                            onConfigChange('banners', updateArrayItem(banners, bannerIndex, { ...banner, links: nextLinks }));
                          }}
                        />
                      </div>
                      <div>
                        <Label>Link URL</Label>
                        <Input
                          value={link.url ?? ''}
                          onChange={e => {
                            const nextLinks = updateArrayItem(links, linkIndex, { ...link, url: e.target.value });
                            onConfigChange('banners', updateArrayItem(banners, bannerIndex, { ...banner, links: nextLinks }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {!templateLocked && (
                    <Button
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => onConfigChange('banners', updateArrayItem(banners, bannerIndex, { ...banner, links: [...links, { text: '', url: '' }] }))}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add link
                    </Button>
                  )}
                  </div>
                </PropertyEditorGroup>
              );
            })}
            {!templateLocked && (
              <Button
                variant="outline"
                className="h-8 text-xs"
                onClick={() => onConfigChange('banners', [...banners, { title: '', subtitle: '', background: '', links: [{ text: '', url: '' }] }])}
              >
                <Plus className="h-3 w-3 mr-1" /> Add banner
              </Button>
            )}
            </div>
          </PropertyEditorGroup>
        ) : (
          <PropertyEditorGroup title="Content & artwork" description="Hero copy, image, and calls to action" defaultOpen>
            <div className="space-y-2">
            <Label>Background image</Label>
            <SelectedImagePreview
              image={(config.image as IAttachment) ?? null}
              onClear={() => onConfigChange('image', undefined)}
            />
            <MediaLibrary
              handleFilesSelectCallback={files => {
                const image = transformAttachmentStructure(files, 'toIAttachment')[0];
                onConfigChange('image', image);
              }}
            />
            <Label>Image alt text</Label>
            <Input value={(config.imageAlt as string) ?? ''} placeholder="Describe the hero image" onChange={e => onConfigChange('imageAlt', e.target.value)} />
            <Label>Badge (optional)</Label>
            <Input value={(config.badge as string) ?? ''} onChange={e => onConfigChange('badge', e.target.value)} />
            <Label>Eyebrow</Label>
            <Input value={(config.eyebrow as string) ?? ''} onChange={e => onConfigChange('eyebrow', e.target.value)} />
            <Label>Headline</Label>
            <Input value={(config.headline as string) ?? (config.title as string) ?? ''} onChange={e => onConfigChange('headline', e.target.value)} />
            <Label>Subtitle</Label>
            <Input value={(config.subtitle as string) ?? (config.body as string) ?? ''} onChange={e => onConfigChange('subtitle', e.target.value)} />
            <Label>Primary CTA text</Label>
            <Input value={primaryCta.text ?? ''} onChange={e => onConfigChange('primaryCta', { ...primaryCta, text: e.target.value })} />
            <Label>Primary CTA URL</Label>
            <Input value={primaryCta.url ?? ''} onChange={e => onConfigChange('primaryCta', { ...primaryCta, url: e.target.value })} />
            <Label>Secondary CTA text</Label>
            <Input value={secondaryCta.text ?? ''} onChange={e => onConfigChange('secondaryCta', { ...secondaryCta, text: e.target.value })} />
            <Label>Secondary CTA URL</Label>
            <Input value={secondaryCta.url ?? ''} onChange={e => onConfigChange('secondaryCta', { ...secondaryCta, url: e.target.value })} />
            </div>
          </PropertyEditorGroup>
        )}
        {variant !== 'riode-duo' && (
          <PropertyEditorGroup title="Layout & image" description="Control the hero composition without changing its template" defaultOpen={false}>
            <div className="landing-editor-fields-grid grid gap-2">
              <div>
                <Label>Image fit</Label>
                <SectionTypeSelect value={imageFit} onValueChange={value => onConfigChange('imageFit', value)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                  </SelectContent>
                </SectionTypeSelect>
              </div>
              <div>
                <Label>Image position</Label>
                <SectionTypeSelect value={imagePosition} onValueChange={value => onConfigChange('imagePosition', value)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </SectionTypeSelect>
              </div>
              <div>
                <Label>Image opacity ({imageOpacity}%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={imageOpacity}
                  onChange={e => onConfigChange('imageOpacity', clampPercentage(e.target.value, 0))}
                />
              </div>
              <div>
                <Label>Content alignment</Label>
                <SectionTypeSelect value={contentAlign} onValueChange={value => onConfigChange('contentAlign', value)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </SectionTypeSelect>
              </div>
              <div>
                <Label>Button position</Label>
                <SectionTypeSelect value={buttonPosition} onValueChange={value => onConfigChange('buttonPosition', value)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </SectionTypeSelect>
              </div>
              {variant === 'hero' && (
                <>
                  <div>
                    <Label>Hero height</Label>
                    <SectionTypeSelect value={heroHeight} onValueChange={value => onConfigChange('height', value)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="screen">Full screen</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="auto">Content height</SelectItem>
                      </SelectContent>
                    </SectionTypeSelect>
                  </div>
                  <div>
                    <Label>Image overlay ({overlayOpacity}%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={overlayOpacity}
                      onChange={e => onConfigChange('overlayOpacity', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    />
                  </div>
                  <ColorInputField
                    label="Overlay color"
                    placeholder="#000000"
                    value={(config.overlayColor as string) ?? '#000000'}
                    onChange={value => onConfigChange('overlayColor', value)}
                  />
                </>
              )}
            </div>
          </PropertyEditorGroup>
        )}
      </div>
    );
  }

  if (section.type === SectionType.FEATURE_GRID) {
    const items = (config.items as Array<{ icon?: string; title?: string }>) ?? [];
    return (
      <div className="landing-editor-config-fields space-y-2">
        <PropertyEditorGroup title="Features" description="Icons and titles shown in the grid" badge={`${items.length}`} defaultOpen>
          <div className="space-y-2">
            {!items.length && <p className="rounded border border-dashed p-2 text-xs text-muted-foreground">No features yet. Add one to start building this grid.</p>}
            {items.map((item, itemIndex) => (
              <div key={itemIndex} className="space-y-2 rounded border bg-muted/20 p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">Feature {itemIndex + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove feature ${itemIndex + 1}`}
                    disabled={items.length <= 1}
                    onClick={() => onConfigChange('items', items.filter((_, index) => index !== itemIndex))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="landing-editor-fields-grid grid gap-2">
                  <div>
                    <Label>Icon (emoji or text)</Label>
                    <Input
                      value={item.icon ?? '✦'}
                      onChange={e => {
                        const next = [...items];
                        next[itemIndex] = { ...next[itemIndex], icon: e.target.value };
                        onConfigChange('items', next);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={item.title ?? ''}
                      onChange={e => {
                        const next = [...items];
                        next[itemIndex] = { ...next[itemIndex], title: e.target.value };
                        onConfigChange('items', next);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => onConfigChange('items', [...items, { icon: '✦', title: `Feature ${items.length + 1}` }])}
            >
              <Plus className="mr-1 h-3 w-3" /> Add feature
            </Button>
          </div>
        </PropertyEditorGroup>
      </div>
    );
  }

  if (section.type === SectionType.RICH_TEXT) {
    const cta = (config.cta as Record<string, string>) ?? {};
    return (
      <div className="landing-editor-config-fields space-y-2">
        <PropertyEditorGroup title="Content" description="Layout, tone, and copy" defaultOpen>
          <div className="landing-editor-fields-grid grid gap-2">
            <div>
              {templateLocked ? <p className="text-xs text-muted-foreground">Fixed layout: <span className="font-medium text-foreground">{String(config.layout ?? 'default')}</span></p> : <Label>Layout</Label>}
              {!templateLocked && (
                <SectionTypeSelect value={(config.layout as string) ?? 'default'} onValueChange={value => onConfigChange('layout', value)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="split">Split image + text</SelectItem>
                    <SelectItem value="centered">Centered</SelectItem>
                  </SelectContent>
                </SectionTypeSelect>
              )}
            </div>
            <div>
              <Label>Background tone</Label>
              <SectionTypeSelect value={(config.background as string) ?? 'default'} onValueChange={value => onConfigChange('background', value)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                </SelectContent>
              </SectionTypeSelect>
            </div>
            <div><Label>Eyebrow</Label><Input value={(config.eyebrow as string) ?? ''} onChange={e => onConfigChange('eyebrow', e.target.value)} /></div>
            <div><Label>Title</Label><Input value={(config.title as string) ?? ''} onChange={e => onConfigChange('title', e.target.value)} /></div>
            <div className="landing-editor-wide-field"><Label>Body</Label><Input value={(config.body as string) ?? (config.html as string) ?? ''} onChange={e => onConfigChange('body', e.target.value)} /></div>
          </div>
        </PropertyEditorGroup>
        <PropertyEditorGroup title="Media & call to action" description="Optional image and destination" defaultOpen={false}>
          <Label>Image (split layout)</Label>
          <SelectedImagePreview
            image={(config.image as IAttachment) ?? null}
            onClear={() => onConfigChange('image', undefined)}
          />
          <MediaLibrary
            handleFilesSelectCallback={files => {
              const image = transformAttachmentStructure(files, 'toIAttachment')[0];
              onConfigChange('image', image);
            }}
          />
          <div className="landing-editor-fields-grid mt-2 grid gap-2">
            <div><Label>CTA text</Label><Input value={cta.text ?? ''} onChange={e => onConfigChange('cta', { ...cta, text: e.target.value })} /></div>
            <div><Label>CTA URL</Label><Input value={cta.url ?? ''} onChange={e => onConfigChange('cta', { ...cta, url: e.target.value })} /></div>
          </div>
        </PropertyEditorGroup>
      </div>
    );
  }

  if (section.type === SectionType.BUSINESS_INFO) {
    return (
      <div className="landing-editor-config-fields space-y-2">
        <PropertyEditorGroup title="Branding & copy" description="Business identity and section text" defaultOpen>
          <div className="landing-editor-fields-grid grid gap-2">
            <div><Label>Brand name (optional)</Label><Input value={(config.brandName as string) ?? ''} placeholder="Uses the business name" onChange={e => onConfigChange('brandName', e.target.value)} /></div>
            <div><Label>Brand accent (optional)</Label><Input value={(config.brandAccent as string) ?? 'Palace'} onChange={e => onConfigChange('brandAccent', e.target.value)} /></div>
            <div><Label>Title</Label><Input value={(config.title as string) ?? ''} placeholder="Uses the business name" onChange={e => onConfigChange('title', e.target.value)} /></div>
            <div><Label>Subtitle</Label><Input value={(config.subtitle as string) ?? ''} placeholder="Uses the business description" onChange={e => onConfigChange('subtitle', e.target.value)} /></div>
          </div>
        </PropertyEditorGroup>
        <PropertyEditorGroup title="Contact details" description="Optional overrides for business contact data" defaultOpen={false}>
          <div className="landing-editor-fields-grid grid gap-2">
            <div><Label>Address (optional)</Label><Input value={(config.address as string) ?? ''} onChange={e => onConfigChange('address', e.target.value)} /></div>
            <div><Label>Phone (optional)</Label><Input value={(config.phone as string) ?? ''} onChange={e => onConfigChange('phone', e.target.value)} /></div>
            <div><Label>Secondary phone (optional)</Label><Input value={(config.secondaryPhone as string) ?? ''} onChange={e => onConfigChange('secondaryPhone', e.target.value)} /></div>
          </div>
        </PropertyEditorGroup>
        <PropertyEditorGroup title="Visibility" description="Choose which information blocks appear" defaultOpen={false}>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs">
              <Checkbox checked={config.showContact !== false} onCheckedChange={checked => onConfigChange('showContact', checked === true)} />
              <span>Show contact from UI settings</span>
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Checkbox checked={config.showHours !== false} onCheckedChange={checked => onConfigChange('showHours', checked === true)} />
              <span>Show hours block</span>
            </label>
          </div>
        </PropertyEditorGroup>
      </div>
    );
  }

  if (section.type === SectionType.SPACER) {
    return (
      <div className="landing-editor-config-fields">
        <PropertyEditorGroup title="Spacing" description="Control the empty space height" defaultOpen>
          <Label>Height (px)</Label>
          <Input
            type="number"
            className="h-8 text-xs"
            value={String(config.height ?? 48)}
            onChange={e => onConfigChange('height', Number(e.target.value) || 0)}
          />
        </PropertyEditorGroup>
      </div>
    );
  }

  if (section.type === SectionType.FOOTER) {
    const columns = (config.columns as FooterColumn[]) ?? [];
    return (
      <FooterSectionEditor
        columns={columns}
        showCopyright={config.showCopyright !== false}
        copyrightText={(config.copyrightText as string) ?? ''}
        onColumnsChange={next => onConfigChange('columns', next)}
        onShowCopyrightChange={value => onConfigChange('showCopyright', value)}
        onCopyrightTextChange={value => onConfigChange('copyrightText', value)}
      />
    );
  }

  return <p className="text-xs text-muted-foreground">No extra configuration for this section type.</p>;
};

const defaultConfigFor = (type: SectionType): Record<string, unknown> => {
  const appearance = defaultSectionAppearance();
  switch (type) {
    case SectionType.HERO_CAROUSEL:
      return { slides: [], appearance };
    case SectionType.FEATURED_ITEMS:
      return {
        title: 'Featured',
        layout: 'LAYOUT_ONE',
        showImages: true,
        items: [],
        itemRefs: [],
        appearance: {
          ...appearance,
          background: '#fff8ea',
          titleColor: '#101010',
          subtitleColor: '#666666',
          cardBackground: '#ffffff',
        },
      };
    case SectionType.CATEGORY_STRIP:
      return { title: 'Categories', eyebrow: '', layout: 'LAYOUT_ONE', showImages: true, categories: [], groups: [], appearance };
    case SectionType.BRANCH_DIRECTORY:
      return {
        variant: 'default',
        title: '',
        eyebrow: '',
        subtitle: '',
        cards: [],
        appearance,
      };
    case SectionType.HERO_BANNER:
      return {
        variant: 'hero',
        eyebrow: '',
        badge: '',
        headline: '',
        subtitle: '',
        primaryCta: { text: 'View menu', url: '/shop' },
        secondaryCta: { text: 'Contact', url: '#contact' },
        imageFit: 'cover',
        imagePosition: 'center',
        contentAlign: 'left',
        height: 'screen',
        overlayOpacity: 0,
        imageOpacity: 100,
        banners: [],
        appearance,
      };
    case SectionType.FEATURE_GRID:
      return {
        appearance,
        items: [
          { icon: '🍜', title: 'Authentic Thai' },
          { icon: '🥡', title: 'Takeout ready' },
          { icon: '🚚', title: 'Delivery' },
          { icon: '⭐', title: 'Top rated' },
        ],
      };
    case SectionType.RICH_TEXT:
      return { layout: 'split', background: 'primary', eyebrow: 'About', title: '', body: '', cta: { text: 'Visit us', url: '#contact' }, appearance };
    case SectionType.BUSINESS_INFO:
      return { brandName: '', brandAccent: '', title: '', subtitle: '', address: '', phone: '', secondaryPhone: '', showContact: true, showHours: true, appearance };
    case SectionType.SPACER:
      return { height: 48, appearance: {} };
    case SectionType.FOOTER:
      return {
        columns: defaultFooterColumns(),
        showCopyright: true,
        copyrightText: '',
        appearance: {
          ...appearance,
          background: '#ffffff',
          paddingY: 'default',
        },
      };
    default:
      return { appearance };
  }
};

export default OnlineOrderingPageEditor;
