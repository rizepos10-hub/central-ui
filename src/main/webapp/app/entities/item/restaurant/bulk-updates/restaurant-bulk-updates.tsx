import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { ChevronDown, Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from 'app/modules/logistics/wholesale-ui/wholesale-page';
import { WsSelectContent } from 'app/modules/logistics/wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from 'app/modules/logistics/wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from 'app/modules/logistics/wholesale-ui/wholesale-error';
import { IDiscount } from 'app/shared/model/discount.model';
import { IVisibility } from 'app/shared/model/visibility.model';
import { SourceType } from 'app/shared/model/ENUMS/source-type.model';

import {
  loadDiscounts,
  loadOptions,
  searchNamedOptions,
  NamedRef,
  RestaurantBulkItem,
  RestaurantKind,
  RestaurantVariant,
  saveRestaurantItems,
  searchRestaurantItems,
} from './restaurant-bulk-updates.api';

type Tri = 'any' | 'yes' | 'no';
type PriceFilter = 'any' | 'missing' | 'present';
type BulkField =
  | 'price'
  | 'salePrice'
  | 'description'
  | 'variantDescription'
  | 'preparationTime'
  | 'category'
  | 'brand'
  | 'tag'
  | 'tax'
  | 'productionCenter'
  | 'mixAndMatch'
  | 'discount'
  | 'visiblePos'
  | 'visibleOnline'
  | 'byWeight'
  | 'askForPrice'
  | 'loyalty'
  | 'skipAddonsPopup';

const VARIANT_FIELDS = new Set<BulkField>(['price', 'salePrice', 'variantDescription', 'preparationTime', 'tax', 'mixAndMatch', 'discount']);
const CLEARABLE = new Set<BulkField>(['brand', 'tag', 'productionCenter', 'mixAndMatch', 'discount']);

const FIELD_LABEL: Record<BulkField, string> = {
  price: 'Price',
  salePrice: 'Sale price',
  description: 'Description',
  variantDescription: 'Variant description',
  preparationTime: 'Preparation time',
  category: 'Category',
  brand: 'Brand',
  tag: 'Tag',
  tax: 'Tax group',
  productionCenter: 'Production center',
  mixAndMatch: 'Mix & match',
  discount: 'Discount',
  visiblePos: 'Visible on POS',
  visibleOnline: 'Visible online',
  byWeight: 'Sell by weight',
  askForPrice: 'Ask for price',
  loyalty: 'Exclude from loyalty',
  skipAddonsPopup: 'Skip add-ons popup',
};

const KIND_LABEL: Record<RestaurantKind, string> = {
  regular: 'Regular',
  pizza: 'Pizza',
  combo: 'Combo',
};

const ANY = '__any__';
const NONE = '__none__';

interface Filters {
  name: string;
  categoryId: string;
  brandId: string;
  taxId: string;
  productionCenterId: string;
  type: string;
  variantsMin: string;
  variantsMax: string;
  price: PriceFilter;
  byWeight: Tri;
  askForPrice: Tri;
}

const emptyFilters = (): Filters => ({
  name: '',
  categoryId: ANY,
  brandId: ANY,
  taxId: ANY,
  productionCenterId: ANY,
  type: ANY,
  variantsMin: '',
  variantsMax: '',
  price: 'any',
  byWeight: 'any',
  askForPrice: 'any',
});

const variantKey = (itemId: string, variantId: string) => `${itemId}::${variantId}`;

const hasPrice = (variant: RestaurantVariant) => variant.price != null;

const priceRange = (item: RestaurantBulkItem) => {
  const prices = (item.variants ?? []).map(variant => variant.price).filter((price): price is number => price != null);
  if (!prices.length) return '-';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? String(min) : `${min} – ${max}`;
};

const discountLabel = (discount: IDiscount) => (discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value ?? ''} ${discount.type ?? ''}`.trim());

const setVisibility = (current: IVisibility[] | null | undefined, application: SourceType, visible: boolean): IVisibility[] => {
  const next = [...(current ?? [])];
  const index = next.findIndex(entry => entry.application === application);
  if (index >= 0) next[index] = { ...next[index], application, visible };
  else next.push({ application, visible });
  return next;
};

const withinCount = (count: number, min: string, max: string) => {
  const low = min.trim() === '' ? null : Number(min);
  const high = max.trim() === '' ? null : Number(max);
  if (low != null && Number.isFinite(low) && count < low) return false;
  if (high != null && Number.isFinite(high) && count > high) return false;
  return true;
};

const PAGE_SIZES = [10, 20, 30, 40, 50, 100, 200];
const SCAN_BATCH = 100;
const SCAN_CAP = 400;

const matchesRestaurantClient = (item: RestaurantBulkItem, filters: Filters) => {
  const variants = item.variants ?? [];
  if (!withinCount(variants.length, filters.variantsMin, filters.variantsMax)) return false;
  if (filters.price === 'missing' && variants.every(hasPrice)) return false;
  if (filters.price === 'present' && variants.some(variant => !hasPrice(variant))) return false;
  return true;
};

const RestaurantBulkUpdates = () => {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [items, setItems] = useState<RestaurantBulkItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [filterNote, setFilterNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [field, setField] = useState<BulkField>('price');
  const [textValue, setTextValue] = useState('');
  const [boolValue, setBoolValue] = useState('true');
  const [refValue, setRefValue] = useState('');
  const [checkedVariants, setCheckedVariants] = useState<Set<string>>(new Set());

  const [categories, setCategories] = useState<NamedRef[]>([]);
  const [brands, setBrands] = useState<NamedRef[]>([]);
  const [taxes, setTaxes] = useState<NamedRef[]>([]);
  const [centers, setCenters] = useState<NamedRef[]>([]);
  const [tags, setTags] = useState<NamedRef[]>([]);
  const [rules, setRules] = useState<NamedRef[]>([]);
  const [discounts, setDiscounts] = useState<IDiscount[]>([]);

  useEffect(() => {
    loadOptions('api/restaurant-categories').then(setCategories).catch(() => setCategories([]));
    loadOptions('api/brands').then(setBrands).catch(() => setBrands([]));
    loadOptions('api/accounting-groups').then(setTaxes).catch(() => setTaxes([]));
    loadOptions('api/production-centers').then(setCenters).catch(() => setCenters([]));
    loadOptions('api/tag-values').then(setTags).catch(() => setTags([]));
    loadOptions('api/mix-and-matches').then(setRules).catch(() => setRules([]));
    loadDiscounts().then(setDiscounts).catch(() => setDiscounts([]));
  }, []);

  const search = async (nextPage = 0, nextRows = rows) => {
    setLoading(true);
    setPage(nextPage);
    setRows(nextRows);
    try {
      const server: Record<string, { value: unknown; matchMode: string }> = {
        isArchived: { value: false, matchMode: 'EQUALS' },
      };
      if (filters.name.trim()) server.name = { value: filters.name.trim(), matchMode: 'CONTAINS' };
      if (filters.categoryId !== ANY) server['categories.id'] = { value: filters.categoryId, matchMode: 'EQUALS' };
      if (filters.brandId !== ANY) server['brand.id'] = { value: filters.brandId, matchMode: 'EQUALS' };
      if (filters.taxId !== ANY) server['accountingGroups.id'] = { value: filters.taxId, matchMode: 'EQUALS' };
      if (filters.productionCenterId !== ANY) server['productionCenter.id'] = { value: filters.productionCenterId, matchMode: 'EQUALS' };
      if (filters.byWeight === 'yes') server.isByWeight = { value: true, matchMode: 'EQUALS' };
      if (filters.byWeight === 'no') server.isByWeight = { value: true, matchMode: 'NOT_EQUALS' };
      if (filters.askForPrice === 'yes') server.askForPrice = { value: true, matchMode: 'EQUALS' };
      if (filters.askForPrice === 'no') server.askForPrice = { value: true, matchMode: 'NOT_EQUALS' };

      const kinds: RestaurantKind[] = filters.type === ANY ? ['regular', 'pizza', 'combo'] : [filters.type as RestaurantKind];
      const needsScan = filters.variantsMin.trim() !== '' || filters.variantsMax.trim() !== '' || filters.price === 'missing' || filters.price === 'present';
      if (!needsScan) {
        const result = await searchRestaurantItems(server, kinds, nextPage, nextRows);
        setItems(result.items);
        setTotal(result.total);
        setPageCount(result.pageCount);
        setFilterNote('');
      } else {
        const matched: RestaurantBulkItem[] = [];
        let serverPage = 0;
        let scanned = 0;
        let finished = false;
        while (scanned < SCAN_CAP && !finished) {
          const batch = await searchRestaurantItems(server, kinds, serverPage, SCAN_BATCH);
          scanned += batch.items.length;
          matched.push(...batch.items.filter(item => matchesRestaurantClient(item, filters)));
          finished = batch.items.length === 0 || serverPage + 1 >= batch.pageCount;
          serverPage += 1;
        }
        const start = nextPage * nextRows;
        setItems(matched.slice(start, start + nextRows));
        setTotal(matched.length);
        setPageCount(Math.max(1, Math.ceil(matched.length / nextRows)));
        setFilterNote(!finished && scanned >= SCAN_CAP ? `Checked the first ${SCAN_CAP} items` : '');
      }
      setSelected(new Set());
      setCheckedVariants(new Set());
      setSearched(true);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The items could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  const selectedItems = useMemo(() => items.filter(item => item.id && selected.has(item.id)), [items, selected]);

  const variantLines = useMemo(
    () =>
      items.flatMap(item =>
        (item.variants ?? []).map(variant => ({
          key: variantKey(item.id ?? '', variant.id ?? ''),
          item,
          variant,
        })),
      ),
    [items],
  );

  const toggleItem = (item: RestaurantBulkItem, on: boolean) => {
    const id = item.id ?? '';
    setSelected(prev => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
    setCheckedVariants(prev => {
      const next = new Set(prev);
      (item.variants ?? []).forEach(variant => {
        const key = variantKey(id, variant.id ?? '');
        if (on) next.add(key);
        else next.delete(key);
      });
      return next;
    });
  };

  const toggleVariant = (key: string, on: boolean) => {
    setCheckedVariants(prev => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const discountOptions = discounts.map(discount => ({ id: discount.id ?? '', name: discountLabel(discount) })).filter(option => option.id);
  const refOptions =
    field === 'category' ? categories :
    field === 'brand' ? brands :
    field === 'tag' ? tags :
    field === 'tax' ? taxes :
    field === 'productionCenter' ? centers :
    field === 'mixAndMatch' ? rules :
    discountOptions;

  const needsText = field === 'description' || field === 'variantDescription';
  const needsNumber = field === 'price' || field === 'salePrice' || field === 'preparationTime';
  const needsBool = field === 'visiblePos' || field === 'visibleOnline' || field === 'byWeight' || field === 'askForPrice' || field === 'loyalty' || field === 'skipAddonsPopup';
  const needsRef = field === 'category' || field === 'brand' || field === 'tag' || field === 'tax' || field === 'productionCenter' || field === 'mixAndMatch' || field === 'discount';

  const apply = async () => {
    if (!VARIANT_FIELDS.has(field) && !selectedItems.length) return;
    const number = Number(textValue);
    if (needsNumber && (!Number.isFinite(number) || number < 0)) {
      toast.error(field === 'preparationTime' ? 'Enter a preparation time of 0 or more.' : 'Enter a price of 0 or more.');
      return;
    }
    if (needsRef && !CLEARABLE.has(field) && !refValue) {
      toast.error('Choose a value first.');
      return;
    }
    const chosen = VARIANT_FIELDS.has(field) ? variantLines.filter(line => checkedVariants.has(line.key)) : [];
    if (VARIANT_FIELDS.has(field) && !chosen.length) {
      toast.error('Select at least one variant.');
      return;
    }

    const chosenByItem = new Map<string, Set<string>>();
    chosen.forEach(line => {
      const ids = chosenByItem.get(line.item.id ?? '') ?? new Set<string>();
      if (line.variant.id) ids.add(line.variant.id);
      chosenByItem.set(line.item.id ?? '', ids);
    });
    const ref = refOptions.find(option => option.id === refValue);
    const discount = discounts.find(entry => entry.id === refValue);
    const yes = boolValue === 'true';

    const updated = (VARIANT_FIELDS.has(field) ? items : selectedItems)
      .filter(item => !VARIANT_FIELDS.has(field) || chosenByItem.has(item.id ?? ''))
      .map(item => {
        const next: RestaurantBulkItem = { ...item, variants: (item.variants ?? []).map(variant => ({ ...variant })) };
        const touch = (variant: RestaurantVariant) => VARIANT_FIELDS.has(field) && chosenByItem.get(item.id ?? '')?.has(variant.id ?? '');
        switch (field) {
          case 'price':
            next.variants = next.variants?.map(variant => (touch(variant) ? { ...variant, price: number } : variant));
            break;
          case 'salePrice':
            next.variants = next.variants?.map(variant => (touch(variant) ? { ...variant, salePrice: number } : variant));
            break;
          case 'variantDescription':
            next.variants = next.variants?.map(variant => (touch(variant) ? { ...variant, description: textValue } : variant));
            break;
          case 'preparationTime':
            next.variants = next.variants?.map(variant => (touch(variant) ? { ...variant, preparationTime: number } : variant));
            break;
          case 'tax':
            next.accountingGroups = ref ? [{ id: ref.id, name: ref.name }] : next.accountingGroups;
            next.variants = next.variants?.map(variant =>
              touch(variant) && item.kind === 'regular'
                ? { ...variant, accountingGroups: ref ? [{ id: ref.id, name: ref.name }] : variant.accountingGroups }
                : variant,
            );
            break;
          case 'mixAndMatch':
            next.variants = next.variants?.map(variant => (touch(variant) ? { ...variant, mixAndMatchRule: ref ? { id: ref.id, name: ref.name } : null } : variant));
            break;
          case 'discount':
            next.discounts = discount ? [discount] : [];
            next.variants = next.variants?.map(variant => (touch(variant) ? { ...variant, discounts: discount ? [discount] : [] } : variant));
            break;
          case 'description':
            next.desc = textValue;
            break;
          case 'category':
            next.categories = ref ? [{ id: ref.id, name: ref.name }] : next.categories;
            break;
          case 'brand':
            next.brand = ref ? { id: ref.id, name: ref.name } : null;
            break;
          case 'tag':
            next.tags = ref ? [{ id: ref.id, name: ref.name }] : [];
            break;
          case 'productionCenter':
            next.productionCenter = ref ? { id: ref.id, name: ref.name } : null;
            break;
          case 'visiblePos':
            next.visibility = setVisibility(next.visibility, SourceType.BRANCH_POS, yes);
            break;
          case 'visibleOnline':
            next.visibility = setVisibility(next.visibility, SourceType.ONLINE_ORDERING, yes);
            break;
          case 'byWeight':
            next.byWeight = yes;
            break;
          case 'askForPrice':
            next.askForPrice = yes;
            break;
          case 'loyalty':
            next.excludedFromLoyaltyPoints = yes;
            break;
          case 'skipAddonsPopup':
            next.skipAddonsPopup = yes;
            if (item.kind === 'regular') {
              next.variants = next.variants?.map(variant => ({ ...variant, skipAddonsPopup: yes }));
            }
            break;
          default:
            break;
        }
        return next;
      });

    setSaving(true);
    try {
      await saveRestaurantItems(updated);
      toast.success(`${updated.length} ${updated.length === 1 ? 'item' : 'items'} updated.`);
      await search(page, rows);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The update could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const allSelected = items.length > 0 && items.every(item => item.id && selected.has(item.id));

  return (
    <WholesalePage
      title="Bulk Updates"
      context="Filter the restaurant catalog, select items, then set one field on all of them. Name and add-ons are not changed here."
    >
      <section className="ws-card">
        <button
          type="button"
          className="flex w-full items-center gap-2 px-4 py-3 text-left"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(open => !open)}
        >
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', !filtersOpen && '-rotate-90')} />
          <h2 className="m-0 text-sm font-semibold">Filter</h2>
          {searched && !filtersOpen && <span className="text-xs text-muted-foreground">{total} items</span>}
        </button>
        {filtersOpen && (
          <div className="grid gap-3 px-4 pb-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="grid gap-1.5">
                <Label htmlFor="restaurant-bulk-name">Name</Label>
                <Input id="restaurant-bulk-name" className="ws-control" value={filters.name} placeholder="Contains" onChange={e => setFilters(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <CategoryFilter inputId="restaurant-bulk-category" value={filters.categoryId} searchUrl="api/_search/restaurant-categories" onChange={categoryId => setFilters(prev => ({ ...prev, categoryId }))} />
              <OptionFilter label="Brand" value={filters.brandId} options={brands} onChange={brandId => setFilters(prev => ({ ...prev, brandId }))} />
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <OptionFilter label="Tax group" value={filters.taxId} options={taxes} onChange={taxId => setFilters(prev => ({ ...prev, taxId }))} />
                </div>
                <div className="w-[9.5rem] shrink-0">
                  <TriFilter label="Sell by weight" value={filters.byWeight} onChange={byWeight => setFilters(prev => ({ ...prev, byWeight }))} />
                </div>
              </div>
              <OptionFilter label="Production center" value={filters.productionCenterId} options={centers} onChange={productionCenterId => setFilters(prev => ({ ...prev, productionCenterId }))} />
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select value={filters.type} onValueChange={type => setFilters(prev => ({ ...prev, type }))}>
                  <SelectTrigger className="ws-control"><SelectValue /></SelectTrigger>
                  <WsSelectContent>
                    <SelectItem value={ANY}>Any</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="combo">Combo</SelectItem>
                    <SelectItem value="pizza">Pizza</SelectItem>
                  </WsSelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="restaurant-bulk-variants-min">Variants</Label>
                <div className="flex items-center gap-2">
                  <Input id="restaurant-bulk-variants-min" className="ws-control" type="number" min={0} placeholder="Min" value={filters.variantsMin} onChange={e => setFilters(prev => ({ ...prev, variantsMin: e.target.value }))} />
                  <Input className="ws-control" type="number" min={0} placeholder="Max" aria-label="Maximum variants" value={filters.variantsMax} onChange={e => setFilters(prev => ({ ...prev, variantsMax: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="grid min-w-0 flex-1 gap-1.5">
                  <Label>Price</Label>
                  <Select value={filters.price} onValueChange={price => setFilters(prev => ({ ...prev, price: price as PriceFilter }))}>
                    <SelectTrigger className="ws-control"><SelectValue /></SelectTrigger>
                    <WsSelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="missing">Missing a price</SelectItem>
                      <SelectItem value="present">Every variant has a price</SelectItem>
                    </WsSelectContent>
                  </Select>
                </div>
                <div className="w-[9.5rem] shrink-0">
                  <TriFilter label="Ask for price" value={filters.askForPrice} onChange={askForPrice => setFilters(prev => ({ ...prev, askForPrice }))} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button className="ws-control" disabled={loading} onClick={() => void search()}>
                {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Search className="mr-1 h-4 w-4" />}
                Search
              </Button>
              <Button variant="outline" className="ws-control" onClick={() => { setFilters(emptyFilters()); setItems([]); setSearched(false); setSelected(new Set()); setCheckedVariants(new Set()); setPage(0); setTotal(0); setPageCount(1); setFilterNote(''); }}>
                Clear
              </Button>
              {searched && <span className="text-xs text-muted-foreground">{total} items{filterNote ? ` · ${filterNote}` : ''}</span>}
            </div>
          </div>
        )}
      </section>

      <section className="ws-card grid gap-3 p-4">
        <h2 className="m-0 text-sm font-semibold">Apply to selected items</h2>
        <div className="grid items-end gap-3 md:grid-cols-[240px_1fr_auto]">
          <div className="grid gap-1.5">
            <Label>Field</Label>
            <Select value={field} onValueChange={value => { setField(value as BulkField); setTextValue(''); setRefValue(''); }}>
              <SelectTrigger className="ws-control"><SelectValue /></SelectTrigger>
              <WsSelectContent>
                {(Object.keys(FIELD_LABEL) as BulkField[]).map(key => (
                  <SelectItem key={key} value={key}>{FIELD_LABEL[key]}</SelectItem>
                ))}
              </WsSelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="restaurant-bulk-value">Value</Label>
            {needsText && field === 'description' && (
              <Textarea id="restaurant-bulk-value" className="min-h-[32px] text-[13px]" value={textValue} onChange={e => setTextValue(e.target.value)} />
            )}
            {needsText && field === 'variantDescription' && (
              <Input id="restaurant-bulk-value" className="ws-control" value={textValue} onChange={e => setTextValue(e.target.value)} />
            )}
            {needsNumber && (
              <Input id="restaurant-bulk-value" className="ws-control ws-mono w-40" type="number" min={0} step={field === 'preparationTime' ? '1' : '0.01'} value={textValue} onChange={e => setTextValue(e.target.value)} />
            )}
            {needsBool && (
              <Select value={boolValue} onValueChange={setBoolValue}>
                <SelectTrigger id="restaurant-bulk-value" className="ws-control w-40"><SelectValue /></SelectTrigger>
                <WsSelectContent>
                  <SelectItem value="true">{field === 'loyalty' ? 'Exclude' : 'Yes'}</SelectItem>
                  <SelectItem value="false">{field === 'loyalty' ? 'Include' : 'No'}</SelectItem>
                </WsSelectContent>
              </Select>
            )}
            {needsRef && (
              <Select value={refValue || NONE} onValueChange={value => setRefValue(value === NONE ? '' : value)}>
                <SelectTrigger id="restaurant-bulk-value" className="ws-control"><SelectValue placeholder="Choose" /></SelectTrigger>
                <WsSelectContent>
                  <SelectItem value={NONE}>{CLEARABLE.has(field) ? 'Clear' : 'Choose'}</SelectItem>
                  {refOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </WsSelectContent>
              </Select>
            )}
          </div>
          <Button className="ws-control" disabled={saving || (VARIANT_FIELDS.has(field) ? checkedVariants.size === 0 : selectedItems.length === 0)} onClick={() => void apply()}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Apply to {VARIANT_FIELDS.has(field) ? checkedVariants.size : selectedItems.length}
          </Button>
        </div>
        <p className="m-0 text-xs text-muted-foreground">
          {VARIANT_FIELDS.has(field)
            ? 'Check the variants under each item. Unchecked variants stay unchanged.'
            : 'This value is saved on every selected item.'}
        </p>
      </section>

      <div className="ws-card">
        <div className="max-h-[60vh] overflow-auto">
        <table className="ws-table" aria-label="Restaurant items">
          <thead>
            <tr>
              <th className="w-10">
                <Checkbox
                  aria-label="Select all items"
                  checked={allSelected}
                  onCheckedChange={checked => {
                    const on = checked === true;
                    setSelected(on ? new Set(items.map(item => item.id ?? '').filter(Boolean)) : new Set());
                    setCheckedVariants(on ? new Set(items.flatMap(item => (item.variants ?? []).map(variant => variantKey(item.id ?? '', variant.id ?? '')))) : new Set());
                  }}
                />
              </th>
              <th>Name</th>
              <th>Type</th>
              <th className="ws-num">Variants</th>
              <th className="ws-num">Price</th>
            </tr>
          </thead>
          <tbody>
            {!searched && <tr><td colSpan={5} className="text-center text-muted-foreground">Search to list items.</td></tr>}
            {searched && items.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground">No items match.</td></tr>}
            {items.map(item => (
              <Fragment key={`${item.kind}-${item.id}`}>
                <tr>
                  <td>
                    <Checkbox aria-label={`Select ${item.name}`} checked={!!item.id && selected.has(item.id)} onCheckedChange={checked => toggleItem(item, checked === true)} />
                  </td>
                  <td className="font-medium">{item.name}</td>
                  <td><WholesaleStatusBadge tone={item.kind === 'regular' ? 'neutral' : item.kind === 'pizza' ? 'new' : 'approved'}>{KIND_LABEL[item.kind]}</WholesaleStatusBadge></td>
                  <td className="ws-num">{item.variants?.length ?? 0}</td>
                  <td className="ws-num">{priceRange(item)}</td>
                </tr>
                {(item.variants ?? []).length > 0 && (
                  <tr className="bg-muted/30">
                    <td colSpan={5} className="p-0">
                      <div className="ml-10 mr-3 mb-2 border-l-2 border-border">
                        <table className="ws-table" aria-label={`Variants of ${item.name}`}>
                          <thead>
                            <tr>
                              <th className="w-10" />
                              <th>Variant</th>
                              <th className="ws-num">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(item.variants ?? []).map(variant => {
                              const key = variantKey(item.id ?? '', variant.id ?? '');
                              return (
                                <tr key={variant.id ?? `${item.id}-${variant.name}`}>
                                  <td>
                                    <Checkbox aria-label={`Select ${item.name} ${variant.name ?? ''}`} checked={checkedVariants.has(key)} onCheckedChange={checked => toggleVariant(key, checked === true)} />
                                  </td>
                                  <td>{variant.name || '-'}</td>
                                  <td className="ws-num">{variant.price ?? '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        </div>
        {searched && (
          <PageBar
            page={page}
            rows={rows}
            total={total}
            pageCount={pageCount}
            loading={loading}
            combined={filters.type === ANY}
            onPage={nextPage => void search(nextPage, rows)}
            onRows={nextRows => void search(0, nextRows)}
          />
        )}
      </div>
    </WholesalePage>
  );
};

const PageBar = ({
  page,
  rows,
  total,
  pageCount,
  loading,
  combined,
  onPage,
  onRows,
}: {
  page: number;
  rows: number;
  total: number;
  pageCount: number;
  loading: boolean;
  combined: boolean;
  onPage: (page: number) => void;
  onRows: (rows: number) => void;
}) => {
  const from = total === 0 ? 0 : page * rows + 1;
  const to = total === 0 ? 0 : Math.min(total, (page + 1) * rows);
  const label = total === 0 ? 'No entries' : combined ? `Page ${page + 1} of ${pageCount} · ${total} items` : `Showing ${from} to ${to} of ${total}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <Select value={String(rows)} onValueChange={value => onRows(Number(value))}>
          <SelectTrigger className="ws-control w-20" aria-label="Rows per page"><SelectValue /></SelectTrigger>
          <WsSelectContent>
            {PAGE_SIZES.map(size => (
              <SelectItem key={size} value={String(size)}>{size}</SelectItem>
            ))}
          </WsSelectContent>
        </Select>
        <Button variant="outline" className="ws-control" disabled={loading || page <= 0} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button variant="outline" className="ws-control" disabled={loading || page + 1 >= pageCount} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
};

const CategoryFilter = ({ value, searchUrl, inputId, onChange }: { value: string; searchUrl: string; inputId: string; onChange: (value: string) => void }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<NamedRef[]>([]);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (value === ANY) setLabel('');
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    let ignore = false;
    const timeoutId = window.setTimeout(() => {
      searchNamedOptions(searchUrl, query)
        .then(next => { if (!ignore) setOptions(next); })
        .catch(() => { if (!ignore) setOptions([]); });
    }, 250);
    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [open, query, searchUrl]);

  const choose = (id: string, name: string) => {
    onChange(id);
    setLabel(name);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="grid gap-1.5" ref={rootRef}>
      <Label htmlFor={inputId}>Category</Label>
      <div className="relative">
        <Input
          id={inputId}
          className="ws-control"
          placeholder="Any"
          value={open ? query : label}
          onChange={event => {
            setQuery(event.target.value);
            setOpen(true);
            if (!event.target.value.trim()) onChange(ANY);
          }}
          onFocus={() => {
            setQuery(label);
            setOpen(true);
          }}
        />
        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-md border bg-popover p-1 shadow-md">
            <button type="button" className="flex w-full rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-accent" onMouseDown={event => event.preventDefault()} onClick={() => choose(ANY, '')}>Any</button>
            {options.map(option => (
              <button key={option.id} type="button" className="flex w-full rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-accent" onMouseDown={event => event.preventDefault()} onClick={() => choose(option.id, option.name)}>
                {option.name}
              </button>
            ))}
            {options.length === 0 && <div className="px-2 py-1.5 text-[13px] text-muted-foreground">No categories</div>}
          </div>
        )}
      </div>
    </div>
  );
};

const OptionFilter = ({ label, value, options, onChange }: { label: string; value: string; options: NamedRef[]; onChange: (value: string) => void }) => (
  <div className="grid gap-1.5">
    <Label>{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="ws-control"><SelectValue /></SelectTrigger>
      <WsSelectContent>
        <SelectItem value={ANY}>Any</SelectItem>
        {options.map(option => (
          <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
        ))}
      </WsSelectContent>
    </Select>
  </div>
);

const TriFilter = ({ label, value, onChange }: { label: string; value: Tri; onChange: (value: Tri) => void }) => (
  <div className="grid gap-1.5">
    <Label>{label}</Label>
    <Select value={value} onValueChange={next => onChange(next as Tri)}>
      <SelectTrigger className="ws-control"><SelectValue /></SelectTrigger>
      <WsSelectContent>
        <SelectItem value="any">Any</SelectItem>
        <SelectItem value="yes">Yes</SelectItem>
        <SelectItem value="no">No</SelectItem>
      </WsSelectContent>
    </Select>
  </div>
);

export default RestaurantBulkUpdates;
