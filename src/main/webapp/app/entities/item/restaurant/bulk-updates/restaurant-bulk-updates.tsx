import React, { useEffect, useMemo, useState } from 'react';
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

const currentValue = (field: BulkField, item: RestaurantBulkItem, variant: RestaurantVariant) => {
  switch (field) {
    case 'salePrice':
      return variant.salePrice ?? '-';
    case 'variantDescription':
      return variant.description || '-';
    case 'preparationTime':
      return variant.preparationTime ?? '-';
    case 'tax':
      return ((item.kind === 'regular' ? variant.accountingGroups : item.accountingGroups) ?? []).map(group => group.name).join(', ') || '-';
    case 'mixAndMatch':
      return variant.mixAndMatchRule?.name || '-';
    case 'discount':
      return (variant.discounts ?? []).map(discountLabel).join(', ') || '-';
    default:
      return variant.price ?? '-';
  }
};

const RestaurantBulkUpdates = () => {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [items, setItems] = useState<RestaurantBulkItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [capped, setCapped] = useState(false);
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

  const search = async () => {
    setLoading(true);
    try {
      const server: Record<string, { value: unknown; matchMode: string }> = {
        isArchived: { value: false, matchMode: 'EQUALS' },
      };
      if (filters.name.trim()) server.name = { value: filters.name.trim(), matchMode: 'CONTAINS' };
      if (filters.categoryId !== ANY) server['categories.id'] = { value: filters.categoryId, matchMode: 'EQUALS' };
      if (filters.brandId !== ANY) server['brand.id'] = { value: filters.brandId, matchMode: 'EQUALS' };
      if (filters.taxId !== ANY) server['accountingGroups.id'] = { value: filters.taxId, matchMode: 'EQUALS' };
      if (filters.productionCenterId !== ANY) server['productionCenter.id'] = { value: filters.productionCenterId, matchMode: 'EQUALS' };

      const kinds: RestaurantKind[] = filters.type === ANY ? ['regular', 'pizza', 'combo'] : [filters.type as RestaurantKind];
      const result = await searchRestaurantItems(server, kinds);
      const filtered = result.items.filter(item => {
        const variants = item.variants ?? [];
        if (!withinCount(variants.length, filters.variantsMin, filters.variantsMax)) return false;
        if (filters.price === 'missing' && variants.every(hasPrice)) return false;
        if (filters.price === 'present' && variants.some(variant => !hasPrice(variant))) return false;
        if (filters.byWeight === 'yes' && item.byWeight !== true) return false;
        if (filters.byWeight === 'no' && item.byWeight === true) return false;
        if (filters.askForPrice === 'yes' && item.askForPrice !== true) return false;
        if (filters.askForPrice === 'no' && item.askForPrice === true) return false;
        return true;
      });
      setItems(filtered);
      setCapped(result.capped);
      setSelected(new Set());
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
      selectedItems.flatMap(item =>
        (item.variants ?? []).map(variant => ({
          key: variantKey(item.id ?? '', variant.id ?? ''),
          item,
          variant,
        })),
      ),
    [selectedItems],
  );

  useEffect(() => {
    if (!VARIANT_FIELDS.has(field)) return;
    setCheckedVariants(new Set(variantLines.map(line => line.key)));
  }, [field, variantLines]);

  const toggleItem = (id: string, on: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
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
    if (!selectedItems.length) return;
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

    const updated = selectedItems
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
      await search();
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
          {searched && !filtersOpen && <span className="text-xs text-muted-foreground">{items.length} items</span>}
        </button>
        {filtersOpen && (
          <div className="grid gap-3 px-4 pb-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="grid gap-1.5">
                <Label htmlFor="restaurant-bulk-name">Name</Label>
                <Input id="restaurant-bulk-name" className="ws-control" value={filters.name} placeholder="Contains" onChange={e => setFilters(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <OptionFilter label="Category" value={filters.categoryId} options={categories} onChange={categoryId => setFilters(prev => ({ ...prev, categoryId }))} />
              <OptionFilter label="Brand" value={filters.brandId} options={brands} onChange={brandId => setFilters(prev => ({ ...prev, brandId }))} />
              <OptionFilter label="Tax group" value={filters.taxId} options={taxes} onChange={taxId => setFilters(prev => ({ ...prev, taxId }))} />
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
              <div className="grid gap-1.5">
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
              <TriFilter label="Sell by weight" value={filters.byWeight} onChange={byWeight => setFilters(prev => ({ ...prev, byWeight }))} />
              <TriFilter label="Ask for price" value={filters.askForPrice} onChange={askForPrice => setFilters(prev => ({ ...prev, askForPrice }))} />
            </div>
            <div className="flex items-center gap-2">
              <Button className="ws-control" disabled={loading} onClick={() => void search()}>
                {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Search className="mr-1 h-4 w-4" />}
                Search
              </Button>
              <Button variant="outline" className="ws-control" onClick={() => { setFilters(emptyFilters()); setItems([]); setSearched(false); setSelected(new Set()); }}>
                Clear
              </Button>
              {searched && <span className="text-xs text-muted-foreground">{items.length} items{capped ? ' (first 2,000 from the server; narrow the filter)' : ''}</span>}
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
          <Button className="ws-control" disabled={saving || selectedItems.length === 0} onClick={() => void apply()}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Apply to {VARIANT_FIELDS.has(field) ? checkedVariants.size : selectedItems.length}
          </Button>
        </div>
        <p className="m-0 text-xs text-muted-foreground">
          {VARIANT_FIELDS.has(field)
            ? 'Each variant is listed below. Uncheck a variant to leave it unchanged.'
            : 'This value is saved on every selected item.'}
        </p>

        {VARIANT_FIELDS.has(field) && (
          <div className="max-h-[320px] overflow-auto rounded-md border">
            <table className="ws-table" aria-label="Variants to update">
              <thead>
                <tr>
                  <th className="w-10">
                    <Checkbox
                      aria-label="Select all variants"
                      checked={variantLines.length > 0 && variantLines.every(line => checkedVariants.has(line.key))}
                      onCheckedChange={checked => setCheckedVariants(checked === true ? new Set(variantLines.map(line => line.key)) : new Set())}
                    />
                  </th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Variant</th>
                  <th>Current</th>
                </tr>
              </thead>
              <tbody>
                {variantLines.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted-foreground">Select items in the list first.</td></tr>
                )}
                {variantLines.map(line => (
                  <tr key={line.key}>
                    <td>
                      <Checkbox aria-label={`Update ${line.item.name} ${line.variant.name ?? ''}`} checked={checkedVariants.has(line.key)} onCheckedChange={checked => toggleVariant(line.key, checked === true)} />
                    </td>
                    <td className="font-medium">{line.item.name}</td>
                    <td>{KIND_LABEL[line.item.kind]}</td>
                    <td>{line.variant.name || '-'}</td>
                    <td>{currentValue(field, line.item, line.variant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="ws-card max-h-[60vh] overflow-auto">
        <table className="ws-table" aria-label="Restaurant items">
          <thead>
            <tr>
              <th className="w-10">
                <Checkbox
                  aria-label="Select all items"
                  checked={allSelected}
                  onCheckedChange={checked => setSelected(checked === true ? new Set(items.map(item => item.id ?? '').filter(Boolean)) : new Set())}
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
              <tr key={`${item.kind}-${item.id}`}>
                <td>
                  <Checkbox aria-label={`Select ${item.name}`} checked={!!item.id && selected.has(item.id)} onCheckedChange={checked => item.id && toggleItem(item.id, checked === true)} />
                </td>
                <td className="font-medium">{item.name}</td>
                <td><WholesaleStatusBadge tone={item.kind === 'regular' ? 'neutral' : item.kind === 'pizza' ? 'new' : 'approved'}>{KIND_LABEL[item.kind]}</WholesaleStatusBadge></td>
                <td className="ws-num">{item.variants?.length ?? 0}</td>
                <td className="ws-num">{priceRange(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WholesalePage>
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
