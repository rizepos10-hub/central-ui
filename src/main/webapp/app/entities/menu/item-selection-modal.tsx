import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Translate } from 'react-jhipster';
import { getEntities } from 'app/entities/item/all-items.reducer';
import Select from 'app/shared/components/select/select';
import { SingleValue } from 'react-select';
import { ITerm } from 'app/shared/model/term.model';
import { getEntities as getRestaurantCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import { getEntities as getRetailCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { IItem } from 'app/shared/model/ITEM/item.model';
import PaginationFilterStateVals from 'app/shared/components/pagination/pagination-filter-state-vals';
import { useRef } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, CirclePlus, Loader2, PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react';

interface ItemSelectionModalProps {
  isOpen: boolean;
  toggle: any;
  selectedItems: IItem[];
  handleToggleSelect: (items: IItem[]) => void;
  setSelectedItems: React.Dispatch<React.SetStateAction<IItem[]>>;
  disbaleUnselect?: boolean;
  variant?: 'default' | 'featured';
}

type CategoryOption = {
  value: string;
  label: string;
};

const ItemSelectionModal: React.FC<ItemSelectionModalProps> = props => {
  const dispatch = useAppDispatch();

  const totalItems = useAppSelector(state => state.allItems.totalItems);
  const itemList: IItem[] = useAppSelector(state => state.allItems.entities);
  const loading = useAppSelector(state => state.allItems.loading);
  const restaurantCategories: ITerm[] = useAppSelector(state => state.restaurantCategory.entities);
  const retailCategories: ITerm[] = useAppSelector(state => state.retailCategory.entities);

  const { isOpen, toggle, selectedItems, handleToggleSelect, disbaleUnselect, variant = 'default' } = props;

  // Ref to store the current dispatch promise
  const currentRequestRef = useRef<any>(null);

  // Local states replacing searchParams
  const [itemName, setItemName] = useState<string>('');
  // Debounced value of itemName to avoid firing requests on every key stroke
  const [debouncedItemName, setDebouncedItemName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [unassignedItems, setUnassignedItems] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [size] = useState<number>(10);

  const [activeIndex, setActiveIndex] = useState(0);

  // Debounce the item name search input so we only fetch after the user stops
  // typing for 300 ms. This also prevents race-conditions where a slower
  // response of an earlier query overrides a faster one of a later query.
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedItemName(itemName);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [itemName]);

  // Fetch items whenever the debounced search term or other filters change.
  useEffect(() => {
    // Cancel the previous request if it exists
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
    }

    // Dispatch the new request and store the promise
    const requestPromise = dispatch(
      getEntities({
        page: page - 1,
        size,
        name: debouncedItemName,
        sort: 'id,asc',
        categoryId: selectedCategory || '',
        unassignedItems: unassignedItems ? 'true' : '',
      })
    );

    currentRequestRef.current = requestPromise;

    // Cleanup function to abort the request if component unmounts or dependencies change
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }
    };
  }, [page, size, debouncedItemName, selectedCategory, unassignedItems]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    dispatch(
      getRestaurantCategories({
        page: 0,
        size: 1000,
        sort: `id,desc`,
      })
    );
    dispatch(
      getRetailCategories({
        page: 0,
        size: 1000,
        sort: `id,desc`,
      })
    );
  }, []);

  const categoryOptions = (activeIndex === 0 ? retailCategories : restaurantCategories)
    .filter(category => category.id && category.name)
    .map(category => ({ value: category.id, label: category.name }));

  const selectedCategoryOption = categoryOptions.find(option => option.value === selectedCategory) ?? null;

  const isItemSelected = (id?: string) => Boolean(selectedItems?.some(selected => selected.id === id));

  const getItemImageUrl = (item: IItem) => item.attachments?.[0]?.url || item.variants?.[0]?.attachments?.[0]?.url;

  const getItemCategories = (item: IItem) => (item.categories ?? []).map(category => category.name).filter(Boolean);

  const allVisibleItemsSelected = itemList.length > 0 && itemList.every(item => isItemSelected(item.id));

  const handleSave = () => {
    toggle();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && toggle()}>
      <DialogContent className="flex max-h-[min(90vh,760px)] max-w-6xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-primary/[0.06] via-background to-accent/[0.08] px-5 py-4 pr-12 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <PackageSearch className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold tracking-tight">
                  {variant === 'featured' ? (
                    'Choose featured products'
                  ) : (
                    <Translate contentKey={'menus.pos.update.modals.item.title'}>Add Existing Items</Translate>
                  )}
                </DialogTitle>
                <p className="mt-1 max-w-xl text-xs text-muted-foreground">
                  Search your catalog, use filters to narrow the list, then select the products you want to show.
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="shrink-0 gap-1.5 px-2.5 py-1 text-xs">
              <Check className="h-3 w-3" />
              {selectedItems.length} selected
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row lg:p-5">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            <div className="shrink-0 rounded-xl border bg-muted/[0.18] p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  id="searchItem"
                  onChange={e => {
                    setItemName(e.target.value || '');
                    setPage(1);
                  }}
                  value={itemName}
                  placeholder="Search products by name…"
                  aria-label="Search products by name"
                  className="h-10 border-0 bg-background pl-9 pr-9 text-sm shadow-sm ring-1 ring-border focus-visible:ring-2"
                />
                {itemName && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setItemName('');
                      setPage(1);
                    }}
                    aria-label="Clear product search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,0.75fr)_minmax(220px,1fr)]">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Catalog
                  </Label>
                  <Tabs
                    value={activeIndex === 0 ? 'retail' : 'restaurant'}
                    onValueChange={value => {
                      setActiveIndex(value === 'retail' ? 0 : 1);
                      setSelectedCategory(null);
                      setPage(1);
                    }}
                    className="w-full"
                  >
                    <TabsList className="grid h-9 w-full grid-cols-2 bg-background/70">
                      <TabsTrigger value="retail" className="h-7 text-xs">
                        Retail
                      </TabsTrigger>
                      <TabsTrigger value="restaurant" className="h-7 text-xs">
                        Restaurant
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="searchCategory" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Category
                  </Label>
                  <Select<CategoryOption>
                    inputId="searchCategory"
                    options={categoryOptions}
                    value={selectedCategoryOption}
                    onChange={(option: SingleValue<CategoryOption>) => {
                      setSelectedCategory(option?.value ?? null);
                      setPage(1);
                    }}
                    isClearable
                    isSearchable
                    placeholder="All categories"
                    noOptionsMessage={() => 'No categories found'}
                    aria-label="Search categories"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <label htmlFor="filterByUnassignedItems" className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    id="filterByUnassignedItems"
                    checked={unassignedItems}
                    onCheckedChange={checked => {
                      setUnassignedItems(checked === true);
                      setPage(1);
                    }}
                  />
                  <span>
                    <Translate contentKey={'menus.pos.update.modals.item.filterByUnassignedItems'}>Only unassigned items</Translate>
                  </span>
                </label>
                <label htmlFor="selectAllItems" className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                  <Checkbox
                    id="selectAllItems"
                    checked={allVisibleItemsSelected}
                    onCheckedChange={checked => {
                      if (checked === true) {
                        const notSelected = itemList.filter(item => !isItemSelected(item.id));
                        handleToggleSelect(notSelected);
                      } else if (!disbaleUnselect) {
                        const currentlySelectedFromList = selectedItems.filter(item =>
                          itemList.some(visibleItem => visibleItem.id === item.id)
                        );
                        handleToggleSelect(currentlySelectedFromList);
                      }
                    }}
                  />
                  <span>
                    <Translate contentKey={'menus.pos.update.modals.item.selectAll'}>Select all on this page</Translate>
                  </span>
                </label>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-semibold">Catalog results</span>
                  <Badge variant="outline" className="shrink-0 px-2 py-0.5 text-[10px] font-medium">
                    {totalItems || 0}
                  </Badge>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">Page {page}</span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                    <span className="text-xs">Finding products…</span>
                  </div>
                ) : itemList.length === 0 ? (
                  <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 p-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      <PackageSearch className="h-6 w-6" />
                    </div>
                    <p className="mt-1 text-sm font-medium">No products found</p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      Try a different name, clear the category, or switch catalog type.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {itemList.map(item => {
                      const selected = isItemSelected(item.id);
                      const imageUrl = getItemImageUrl(item);
                      const categories = getItemCategories(item);
                      const variantCount = Array.isArray(item.variants) ? item.variants.length : 0;
                      return (
                        <div key={item.id} className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/[0.35]">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/60">
                            {imageUrl ? (
                              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <PackageSearch className="h-5 w-5 text-muted-foreground/70" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-medium">{item.name || 'Unnamed product'}</p>
                              {selected && (
                                <Badge className="gap-1 px-1.5 py-0 text-[10px]">
                                  <Check className="h-3 w-3" />
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                              {item.itemType && <span>{item.itemType.toLowerCase()}</span>}
                              {variantCount > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>
                                    {variantCount} {variantCount === 1 ? 'variant' : 'variants'}
                                  </span>
                                </>
                              )}
                              {categories.slice(0, 2).map(category => (
                                <Badge key={category} variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                                  {category}
                                </Badge>
                              ))}
                              {categories.length > 2 && <span>+{categories.length - 2}</span>}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant={selected ? 'outline' : 'default'}
                            size="sm"
                            className="h-8 shrink-0 gap-1.5 px-2.5 text-xs"
                            disabled={selected && disbaleUnselect}
                            onClick={() => (!selected || !disbaleUnselect ? handleToggleSelect([item]) : undefined)}
                          >
                            {selected ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                {disbaleUnselect ? 'Selected' : 'Remove'}
                              </>
                            ) : (
                              <>
                                <CirclePlus className="h-3.5 w-3.5" />
                                <Translate contentKey="menus.pos.update.modals.item.buttons.select">Add</Translate>
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 justify-center">
              <PaginationFilterStateVals
                totalPages={Math.ceil(totalItems / size)}
                currentPage={page}
                setCurrentPage={newPage => setPage(newPage)}
              />
            </div>
          </div>

          <aside className="flex max-h-52 min-h-[150px] w-full shrink-0 flex-col overflow-hidden rounded-xl border bg-muted/[0.16] lg:max-h-none lg:w-72">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-background/70 px-3 py-3">
              <div>
                <p className="text-sm font-semibold">Selected products</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">They will appear in this section</p>
              </div>
              <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
                {selectedItems.length}
              </Badge>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {selectedItems.length === 0 ? (
                <div className="flex h-full min-h-[120px] flex-col items-center justify-center px-4 py-6 text-center">
                  <CirclePlus className="h-5 w-5 text-muted-foreground/60" />
                  <p className="mt-2 text-xs font-medium">Nothing selected yet</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Add products from the catalog and they’ll collect here.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedItems.map((item, index) => {
                    const imageUrl = getItemImageUrl(item);
                    return (
                      <div
                        key={item.id ?? `${item.name}-${index}`}
                        className="flex items-center gap-2 rounded-lg border bg-background p-2 shadow-sm"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                          {imageUrl ? (
                            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <PackageSearch className="h-4 w-4 text-muted-foreground/70" />
                          )}
                        </div>
                        <p className="min-w-0 flex-1 truncate text-xs font-medium">{item.name || 'Unnamed product'}</p>
                        {!disbaleUnselect && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleToggleSelect([item])}
                            aria-label={`Remove ${item.name || 'product'}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>

        <DialogFooter className="shrink-0 border-t px-4 py-3 sm:px-5">
          <div className="flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-xs text-muted-foreground">
              {selectedItems.length === 0
                ? 'Choose at least one product to feature.'
                : `${selectedItems.length} product${selectedItems.length === 1 ? '' : 's'} ready to feature.`}
            </div>
            <Button size="sm" className="h-9 w-full px-5 text-xs sm:w-auto" onClick={handleSave}>
              <Translate contentKey={'entity.action.save'}>Save selection</Translate>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemSelectionModal;
