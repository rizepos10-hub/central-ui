import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, Palette } from 'lucide-react';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { IOnlineOrderingPage, IPageSection, IPageThemeOverride, defaultPageValue } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { SectionType, PageStatus } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.enums';
import {
  createEntity,
  getEntity,
  getSectionTypes,
  publishEntity,
  reset,
  updateEntity,
} from './pages.reducer';
import { ISectionTypeDescriptor } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { flushStorefrontCache, getEntity as getLandingPageSettings, updateEntity as updateLandingPageSettings } from '../settings/landing-page-settings.reducer';
import { getEntity as getStorefrontSettings } from '../settings/storefront-settings.reducer';
import PageEditorPreview from './page-editor-preview';
import { LOCAL_STOREFRONT_URL, canOpenLivePreview, getLivePreviewUrl } from './page-preview-utils';
import { PageThemeOverrideFields, SectionAppearanceFields, defaultSectionAppearance } from './section-appearance-fields';
import { isPrimeColorPickerTarget } from './color-input-field';
import { HeroCarouselSlidesEditor, SelectedImagePreview } from './hero-carousel-slides-editor';
import { defaultFooterColumns, FooterColumn, FooterSectionEditor } from './footer-section-editor';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ILandingPageSettings, IStorefrontSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';

const sectionLabel = (type: SectionType, sectionTypes: ISectionTypeDescriptor[]) =>
  sectionTypes.find(s => s.type === type)?.label ?? type;

const OnlineOrderingPageEditor = () => {
  const { id } = useParams<'id'>();
  const isNew = !id || id === 'new';
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sectionTypes = useAppSelector(state => state.onlineOrderingPage.sectionTypes);
  const updating = useAppSelector(state => state.onlineOrderingPage.updating || state.landingPageSettings.updating || state.storefrontSettings.updating);
  const landingPageSettings: ILandingPageSettings = useAppSelector(state => state.landingPageSettings.entity);
  const storefrontSettings: IStorefrontSettings = useAppSelector(state => state.storefrontSettings.entity);
  const uiSettings: IUiSettings = { ...landingPageSettings, ...storefrontSettings };
  const [page, setPage] = useState<IOnlineOrderingPage>({ ...defaultPageValue });
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [appearanceSectionIndex, setAppearanceSectionIndex] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<IItem[]>([]);
  const itemsLoading = useAppSelector(state => state.allItems.loading);

  useEffect(() => {
    dispatch(getSectionTypes());
    dispatch(getRestaurantCategories({}));
    dispatch(getLandingPageSettings());
    dispatch(getStorefrontSettings());
    if (!isNew && id) {
      dispatch(getEntity(id)).unwrap().then(res => setPage(res.data));
    }
    return () => {
      dispatch(reset());
    };
  }, [dispatch, id, isNew]);

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

  const addSection = (type: SectionType) => {
    setPage(prev => ({
      ...prev,
      sections: [
        ...(prev.sections ?? []),
        {
          type,
          visible: true,
          order: prev.sections?.length ?? 0,
          config: defaultConfigFor(type),
        },
      ],
    }));
  };

  const removeSection = (index: number) => {
    setPage(prev => ({ ...prev, sections: (prev.sections ?? []).filter((_, i) => i !== index) }));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const sections = [...(page.sections ?? [])];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    setPage(prev => ({ ...prev, sections: sections.map((s, i) => ({ ...s, order: i })) }));
  };

  const savePage = async () => {
    const payload = {
      ...page,
      sections: (page.sections ?? []).map((s, i) => ({ ...s, order: i })),
    };
    if (isNew) {
      const result = await dispatch(createEntity(payload)).unwrap();
      toast.success('Page created');
      navigate(`/online-ordering/pages/${result.data.id}/edit`, { replace: true });
    } else {
      await dispatch(updateEntity(payload)).unwrap();
      toast.success('Page saved');
    }
  };

  const publishPage = async () => {
    if (!page.id) {
      toast.error('Save the page before publishing');
      return;
    }
    await dispatch(updateEntity({ ...page, sections: page.sections ?? [] })).unwrap();
    await dispatch(publishEntity(page.id)).unwrap();
    setPage(prev => ({ ...prev, status: PageStatus.PUBLISHED }));
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
      usePageBuilder: true,
      defaultPageId: page.id,
      defaultPageSlug: page.slug,
    };
    await dispatch(updateLandingPageSettings(next)).unwrap();
    toast.success('Landing page set as active');
    openPreview(LOCAL_STOREFRONT_URL);
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{isNew ? 'Create landing page' : 'Edit landing page'}</h2>
            <p className="text-xs text-muted-foreground">Configure sections for the online ordering storefront</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-8 text-xs"
              disabled={isNew}
              onClick={() => openPreview(previewUrl)}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Preview
            </Button>
            <Button variant="outline" className="h-8 text-xs" onClick={() => navigate('/online-ordering/pages')}>
              Back
            </Button>
            <Button className="h-8 text-xs" disabled={updating} onClick={savePage}>
              Save draft
            </Button>
            <Button className="h-8 text-xs" disabled={updating || isNew} onClick={publishPage}>
              Publish
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="p-3"><CardTitle className="text-sm">Page details</CardTitle></CardHeader>
          <CardContent className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={page.name ?? ''} onChange={e => updatePageField('name', e.target.value)} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={page.slug ?? ''} onChange={e => updatePageField('slug', e.target.value.toLowerCase())} placeholder="home" />
            </div>
            <PageThemeOverrideFields
              themeOverride={page.themeOverride ?? {}}
              onChange={(value: IPageThemeOverride) => updatePageField('themeOverride', value)}
            />
          </CardContent>
        </Card>

        {!isNew && (
          <PageEditorPreview
            page={page}
            uiSettings={uiSettings}
            onSetActiveAndPreview={handleSetActiveAndPreview}
            settingActive={updating}
            onFlushStorefrontCache={handleFlushStorefrontCache}
            flushingStorefrontCache={updating}
          />
        )}

        <Card>
          <CardHeader className="p-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Sections</CardTitle>
            <SectionTypeSelect onValueChange={value => addSection(value as SectionType)}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Add section" /></SelectTrigger>
              <SelectContent>
                {sectionTypes.map(st => (
                  <SelectItem key={st.type} value={st.type}>{st.label}</SelectItem>
                ))}
              </SelectContent>
            </SectionTypeSelect>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            {(page.sections ?? []).map((section, index) => (
              <Card key={`${section.type}-${index}`}>
                <CardHeader className="p-3 flex flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{sectionLabel(section.type, sectionTypes)}</CardTitle>
                    <Checkbox
                      checked={section.visible !== false}
                      onCheckedChange={checked => updateSection(index, { visible: checked === true })}
                    />
                    <span className="text-xs text-muted-foreground">Visible</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Section appearance"
                      onClick={() => setAppearanceSectionIndex(index)}
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(index, 'up')}><ArrowUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(index, 'down')}><ArrowDown className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSection(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <SectionConfigForm
                    section={section}
                    debouncedLoadItemOptions={debouncedLoadItemOptions}
                    itemsLoading={itemsLoading}
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
            ))}
            {(page.sections ?? []).length === 0 && <p className="text-sm text-muted-foreground">Add a section to start building the page.</p>}
          </CardContent>
        </Card>
      </div>

      <ItemSelectionModal
        isOpen={itemModalOpen}
        toggle={() => setItemModalOpen(false)}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        handleToggleSelect={toggleFeaturedItems}
      />

      <Sheet open={appearanceSectionIndex !== null} onOpenChange={open => !open && setAppearanceSectionIndex(null)}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-md"
          onPointerDownOutside={e => {
            if (isPrimeColorPickerTarget(e.target)) e.preventDefault();
          }}
          onInteractOutside={e => {
            if (isPrimeColorPickerTarget(e.target)) e.preventDefault();
          }}
        >
          <SheetHeader className="text-left">
            <SheetTitle className="text-base">Section appearance</SheetTitle>
            <SheetDescription className="text-xs">
              {appearanceSectionIndex != null &&
                sectionLabel(page.sections?.[appearanceSectionIndex]?.type ?? SectionType.HERO_CAROUSEL, sectionTypes)}
            </SheetDescription>
          </SheetHeader>
          {appearanceSectionIndex != null && (
            <SectionAppearanceFields
              embedded
              sectionType={page.sections?.[appearanceSectionIndex]?.type ?? SectionType.HERO_CAROUSEL}
              appearance={(page.sections?.[appearanceSectionIndex]?.config?.appearance ?? {}) as Record<string, unknown>}
              onChange={next => updateSectionConfig(appearanceSectionIndex, 'appearance', next)}
            />
          )}
        </SheetContent>
      </Sheet>
    </PageWrapper>
  );
};

const SectionConfigForm = ({
  section,
  debouncedLoadItemOptions,
  itemsLoading,
  onConfigChange,
  onFeaturedItemsChange,
  onPickItems,
}: {
  section: IPageSection;
  debouncedLoadItemOptions: (inputValue: string, callback: (options: Array<{ value: string; label: string; data: IItem }>) => void) => void;
  itemsLoading: boolean;
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
      <div className="space-y-3">
        <Label>Layout</Label>
        <SectionTypeSelect value={layout} onValueChange={value => onConfigChange('layout', value)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default carousel</SelectItem>
            <SelectItem value="riode-split">Riode split (carousel + side promo)</SelectItem>
          </SelectContent>
        </SectionTypeSelect>
        <HeroCarouselSlidesEditor
          slides={slides}
          layout={layout}
          onChange={next => onConfigChange('slides', next)}
        />
        {layout === 'riode-split' && (
          <div className="space-y-2 rounded-md border bg-muted/20 p-3">
            <Label className="text-xs font-medium">Side promo</Label>
            <Label>Eyebrow</Label>
            <Input value={(promoSide.eyebrow as string) ?? ''} onChange={e => onConfigChange('promoSide', { ...promoSide, eyebrow: e.target.value })} />
            <Label>Title</Label>
            <Input value={(promoSide.title as string) ?? ''} onChange={e => onConfigChange('promoSide', { ...promoSide, title: e.target.value })} />
            <Label>Subtitle</Label>
            <Input value={(promoSide.subtitle as string) ?? ''} onChange={e => onConfigChange('promoSide', { ...promoSide, subtitle: e.target.value })} />
            <Label>Image</Label>
            <SelectedImagePreview
              image={(promoSide.image as IAttachment) ?? null}
              onClear={() => onConfigChange('promoSide', { ...promoSide, image: undefined })}
            />
            <MediaLibrary
              handleFilesSelectCallback={files => {
                const image = transformAttachmentStructure(files, 'toIAttachment')[0];
                onConfigChange('promoSide', { ...promoSide, image });
              }}
            />
            <Label>CTA text</Label>
            <Input
              value={((promoSide.cta as Record<string, string> | undefined)?.text) ?? ''}
              onChange={e =>
                onConfigChange('promoSide', {
                  ...promoSide,
                  cta: { ...((promoSide.cta as Record<string, string>) ?? {}), text: e.target.value },
                })
              }
            />
            <Label>CTA URL</Label>
            <Input
              value={((promoSide.cta as Record<string, string> | undefined)?.url) ?? ''}
              onChange={e =>
                onConfigChange('promoSide', {
                  ...promoSide,
                  cta: { ...((promoSide.cta as Record<string, string>) ?? {}), url: e.target.value },
                })
              }
            />
          </div>
        )}
      </div>
    );
  }

  if (section.type === SectionType.FEATURED_ITEMS) {
    const items = (config.items as IItem[]) ?? [];
    return (
      <div className="space-y-2">
        <Label>Layout</Label>
        <SectionTypeSelect value={(config.layout as string) ?? 'LAYOUT_ONE'} onValueChange={value => onConfigChange('layout', value)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="LAYOUT_ONE">Layout one</SelectItem>
            <SelectItem value="DISH_GRID">Dish grid</SelectItem>
          </SelectContent>
        </SectionTypeSelect>
        <Label>Title</Label>
        <Input value={(config.title as string) ?? ''} onChange={e => onConfigChange('title', e.target.value)} />
        <Label>Eyebrow (optional)</Label>
        <Input value={(config.eyebrow as string) ?? ''} onChange={e => onConfigChange('eyebrow', e.target.value)} />
        <div className="flex items-center gap-2">
          <Checkbox checked={config.showImages !== false} onCheckedChange={checked => onConfigChange('showImages', checked === true)} />
          <Label>Show item images</Label>
        </div>
        <div className="space-y-2 rounded-md border bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs">Featured items ({items.length})</Label>
            <Button variant="outline" className="h-8 text-xs" onClick={onPickItems}>
              <Plus className="h-3 w-3 mr-1" />
              {items.length ? 'Add / edit items' : 'Select items'}
            </Button>
          </div>
          {items.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-2 rounded border bg-background px-2 py-1">
                  <span className="text-xs truncate">{item.name}</span>
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
        </div>
      </div>
    );
  }

  if (section.type === SectionType.CATEGORY_STRIP) {
    const categories = (config.categories as ITerm[]) ?? [];
    const layout = (config.layout as string) ?? 'default';
    const groups = (config.groups as Array<Record<string, unknown>>) ?? [];
    return (
      <div className="space-y-2">
        <Label>Layout</Label>
        <SectionTypeSelect value={layout} onValueChange={value => onConfigChange('layout', value)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default strip</SelectItem>
            <SelectItem value="LAYOUT_ONE">Layout one</SelectItem>
            <SelectItem value="riode-grid">Riode category grid</SelectItem>
          </SelectContent>
        </SectionTypeSelect>
        <Label>Eyebrow (optional)</Label>
        <Input value={(config.eyebrow as string) ?? ''} onChange={e => onConfigChange('eyebrow', e.target.value)} />
        <Label>Title</Label>
        <Input value={(config.title as string) ?? ''} onChange={e => onConfigChange('title', e.target.value)} />
        <div className="flex items-center gap-2">
          <Checkbox checked={config.showImages !== false} onCheckedChange={checked => onConfigChange('showImages', checked === true)} />
          <Label>Show category images</Label>
        </div>
        {layout === 'riode-grid' ? (
          <div className="space-y-3 rounded-md border bg-muted/20 p-3">
            <Label className="text-xs">Category groups ({groups.length})</Label>
            {groups.map((group, groupIndex) => {
              const links = (group.links as Array<Record<string, string>>) ?? [];
              return (
                <div key={groupIndex} className="space-y-2 rounded border bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">Group {groupIndex + 1}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onConfigChange('groups', groups.filter((_, index) => index !== groupIndex))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Label>Name</Label>
                  <Input value={(group.name as string) ?? ''} onChange={e => onConfigChange('groups', updateArrayItem(groups, groupIndex, { ...group, name: e.target.value }))} />
                  <Label>Image</Label>
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
                    <div key={linkIndex} className="grid grid-cols-1 gap-2 rounded border p-2 md:grid-cols-2">
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
                  <Button
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => onConfigChange('groups', updateArrayItem(groups, groupIndex, { ...group, links: [...links, { label: '', url: '' }] }))}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add link
                  </Button>
                </div>
              );
            })}
            <Button
              variant="outline"
              className="h-8 text-xs"
              onClick={() => onConfigChange('groups', [...groups, { name: '', links: [{ label: '', url: '' }] }])}
            >
              <Plus className="h-3 w-3 mr-1" /> Add group
            </Button>
          </div>
        ) : (
          <>
            <Label>Categories</Label>
            <CategorySelect
              isMulti
              options={restaurantCategories}
              value={categories}
              onChange={(value: ITerm[]) => onConfigChange('categories', value ?? [])}
              getOptionLabel={(option: ITerm) => option.name}
              getOptionValue={(option: ITerm) => option.id}
              placeholder="Select categories"
            />
          </>
        )}
      </div>
    );
  }

  if (section.type === SectionType.BRANCH_DIRECTORY) {
    const variant = (config.variant as string) ?? 'default';
    const cards = (config.cards as Array<Record<string, unknown>>) ?? [];
    return (
      <div className="space-y-2">
        <Label>Display mode</Label>
        <SectionTypeSelect value={variant} onValueChange={value => onConfigChange('variant', value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Branch / zone listing (from API)</SelectItem>
            <SelectItem value="cards">Location cards (configured below)</SelectItem>
          </SelectContent>
        </SectionTypeSelect>
        <Label>Eyebrow (optional)</Label>
        <Input value={(config.eyebrow as string) ?? ''} onChange={e => onConfigChange('eyebrow', e.target.value)} />
        <Label>Section title</Label>
        <Input value={(config.title as string) ?? ''} onChange={e => onConfigChange('title', e.target.value)} />
        <Label>Subtitle (optional)</Label>
        <Input value={(config.subtitle as string) ?? ''} onChange={e => onConfigChange('subtitle', e.target.value)} />
        {variant === 'cards' ? (
          <div className="space-y-3 rounded-md border bg-muted/20 p-3">
            <Label className="text-xs">Location cards ({cards.length})</Label>
            {cards.map((card, cardIndex) => {
              const image = (card.image as IAttachment) ?? null;
              const lines = (card.lines as string[]) ?? [''];
              const actions = (card.actions as Array<Record<string, string>>) ?? [
                { text: '', url: '', variant: 'gold' },
                { text: '', url: '', variant: 'outline' },
              ];
              return (
                <div key={cardIndex} className="space-y-2 rounded border bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">Card {cardIndex + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => onConfigChange('cards', cards.filter((_, index) => index !== cardIndex))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
                  {actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="grid grid-cols-1 gap-2 rounded border p-2 md:grid-cols-3">
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
              );
            })}
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
          </div>
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
    return (
      <div className="space-y-2">
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
        {variant === 'riode-duo' ? (
          <div className="space-y-3 rounded-md border bg-muted/20 p-3">
            <Label className="text-xs">Promo banners ({banners.length})</Label>
            {banners.map((banner, bannerIndex) => {
              const links = (banner.links as Array<Record<string, string>>) ?? [];
              return (
                <div key={bannerIndex} className="space-y-2 rounded border bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">Banner {bannerIndex + 1}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onConfigChange('banners', banners.filter((_, index) => index !== bannerIndex))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Label>Title</Label>
                  <Input value={(banner.title as string) ?? ''} onChange={e => onConfigChange('banners', updateArrayItem(banners, bannerIndex, { ...banner, title: e.target.value }))} />
                  <Label>Subtitle</Label>
                  <Input value={(banner.subtitle as string) ?? ''} onChange={e => onConfigChange('banners', updateArrayItem(banners, bannerIndex, { ...banner, subtitle: e.target.value }))} />
                  <Label>Background</Label>
                  <Input value={(banner.background as string) ?? ''} onChange={e => onConfigChange('banners', updateArrayItem(banners, bannerIndex, { ...banner, background: e.target.value }))} />
                  <Label>Image</Label>
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
                    <div key={linkIndex} className="grid grid-cols-1 gap-2 rounded border p-2 md:grid-cols-2">
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
                  <Button
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => onConfigChange('banners', updateArrayItem(banners, bannerIndex, { ...banner, links: [...links, { text: '', url: '' }] }))}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add link
                  </Button>
                </div>
              );
            })}
            <Button
              variant="outline"
              className="h-8 text-xs"
              onClick={() => onConfigChange('banners', [...banners, { title: '', subtitle: '', background: '', links: [{ text: '', url: '' }] }])}
            >
              <Plus className="h-3 w-3 mr-1" /> Add banner
            </Button>
          </div>
        ) : (
          <>
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
            {(variant === 'retail' || variant === 'retail-cta') && (
              <>
                <Label>Badge (optional)</Label>
                <Input value={(config.badge as string) ?? ''} onChange={e => onConfigChange('badge', e.target.value)} />
              </>
            )}
            <Label>Eyebrow</Label>
            <Input value={(config.eyebrow as string) ?? ''} onChange={e => onConfigChange('eyebrow', e.target.value)} />
            <Label>Headline</Label>
            <Input value={(config.headline as string) ?? ''} onChange={e => onConfigChange('headline', e.target.value)} />
            <Label>Subtitle</Label>
            <Input value={(config.subtitle as string) ?? ''} onChange={e => onConfigChange('subtitle', e.target.value)} />
            <Label>Primary CTA text</Label>
            <Input value={primaryCta.text ?? ''} onChange={e => onConfigChange('primaryCta', { ...primaryCta, text: e.target.value })} />
            <Label>Primary CTA URL</Label>
            <Input value={primaryCta.url ?? ''} onChange={e => onConfigChange('primaryCta', { ...primaryCta, url: e.target.value })} />
            <Label>Secondary CTA text</Label>
            <Input value={secondaryCta.text ?? ''} onChange={e => onConfigChange('secondaryCta', { ...secondaryCta, text: e.target.value })} />
            <Label>Secondary CTA URL</Label>
            <Input value={secondaryCta.url ?? ''} onChange={e => onConfigChange('secondaryCta', { ...secondaryCta, url: e.target.value })} />
          </>
        )}
      </div>
    );
  }

  if (section.type === SectionType.FEATURE_GRID) {
    const items = (config.items as Array<{ icon?: string; title?: string }>) ?? [];
    return (
      <div className="space-y-2">
        {items.map((item, itemIndex) => (
          <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded p-2">
            <div>
              <Label>Icon (emoji or text)</Label>
              <Input
                value={item.icon ?? ''}
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
        ))}
        <Button
          variant="outline"
          className="h-8 text-xs"
          onClick={() => onConfigChange('items', [...items, { icon: '✦', title: 'Feature' }])}
        >
          <Plus className="h-3 w-3 mr-1" /> Add feature
        </Button>
      </div>
    );
  }

  if (section.type === SectionType.RICH_TEXT) {
    const cta = (config.cta as Record<string, string>) ?? {};
    return (
      <div className="space-y-2">
        <Label>Layout</Label>
        <SectionTypeSelect value={(config.layout as string) ?? 'default'} onValueChange={value => onConfigChange('layout', value)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="split">Split image + text</SelectItem>
            <SelectItem value="centered">Centered</SelectItem>
          </SelectContent>
        </SectionTypeSelect>
        <Label>Background</Label>
        <SectionTypeSelect value={(config.background as string) ?? 'default'} onValueChange={value => onConfigChange('background', value)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="primary">Primary</SelectItem>
          </SelectContent>
        </SectionTypeSelect>
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
        <Label>Eyebrow</Label>
        <Input value={(config.eyebrow as string) ?? ''} onChange={e => onConfigChange('eyebrow', e.target.value)} />
        <Label>Title</Label>
        <Input value={(config.title as string) ?? ''} onChange={e => onConfigChange('title', e.target.value)} />
        <Label>Body</Label>
        <Input value={(config.body as string) ?? ''} onChange={e => onConfigChange('body', e.target.value)} />
        <Label>CTA text</Label>
        <Input value={cta.text ?? ''} onChange={e => onConfigChange('cta', { ...cta, text: e.target.value })} />
        <Label>CTA URL</Label>
        <Input value={cta.url ?? ''} onChange={e => onConfigChange('cta', { ...cta, url: e.target.value })} />
      </div>
    );
  }

  if (section.type === SectionType.BUSINESS_INFO) {
    return (
      <div className="space-y-2">
        <Label>Brand name (optional)</Label>
        <Input value={(config.brandName as string) ?? ''} onChange={e => onConfigChange('brandName', e.target.value)} />
        <Label>Brand accent (optional)</Label>
        <Input value={(config.brandAccent as string) ?? ''} onChange={e => onConfigChange('brandAccent', e.target.value)} />
        <Label>Title</Label>
        <Input value={(config.title as string) ?? ''} onChange={e => onConfigChange('title', e.target.value)} />
        <Label>Subtitle</Label>
        <Input value={(config.subtitle as string) ?? ''} onChange={e => onConfigChange('subtitle', e.target.value)} />
        <Label>Address (optional)</Label>
        <Input value={(config.address as string) ?? ''} onChange={e => onConfigChange('address', e.target.value)} />
        <Label>Phone (optional)</Label>
        <Input value={(config.phone as string) ?? ''} onChange={e => onConfigChange('phone', e.target.value)} />
        <Label>Secondary phone (optional)</Label>
        <Input value={(config.secondaryPhone as string) ?? ''} onChange={e => onConfigChange('secondaryPhone', e.target.value)} />
        <div className="flex items-center gap-2">
          <Checkbox checked={config.showContact !== false} onCheckedChange={checked => onConfigChange('showContact', checked === true)} />
          <Label>Show contact from UI settings</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox checked={config.showHours !== false} onCheckedChange={checked => onConfigChange('showHours', checked === true)} />
          <Label>Show hours block</Label>
        </div>
      </div>
    );
  }

  if (section.type === SectionType.SPACER) {
    return (
      <div>
        <Label>Height (px)</Label>
        <Input
          type="number"
          value={String(config.height ?? 48)}
          onChange={e => onConfigChange('height', Number(e.target.value) || 0)}
        />
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
