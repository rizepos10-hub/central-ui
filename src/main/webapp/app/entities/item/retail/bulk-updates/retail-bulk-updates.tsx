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
import { IProduct } from 'app/shared/model/ITEM/retail/product.model';
import { IVariableItemVariant } from 'app/shared/model/ITEM/retail/variable-item.model';
import { IVisibility } from 'app/shared/model/visibility.model';
import { SourceType } from 'app/shared/model/ENUMS/source-type.model';
import { ItemVariantType } from 'app/shared/model/ENUMS/item-variant-type.model';

import { loadOptions, NamedRef, saveRetailProducts, searchRetailProducts } from './retail-bulk-updates.api';

type Tri = 'any' | 'yes' | 'no';
type SkuFilter = 'any' | 'missing' | 'present' | 'contains';
type BulkField =
  | 'price'
  | 'salePrice'
  | 'description'
  | 'variantDescription'
  | 'category'
  | 'brand'
  | 'tax'
  | 'visiblePos'
  | 'visibleOnline'
  | 'byWeight'
  | 'askForPrice'
  | 'loyalty'
  | 'baseMeasure';

const VARIANT_FIELDS = new Set<BulkField>(['price', 'salePrice', 'variantDescription', 'tax']);

const FIELD_LABEL: Record<BulkField, string> = {
  price: 'Price',
  salePrice: 'Sale price',
  description: 'Description',
  variantDescription: 'Variant description',
  category: 'Category',
  brand: 'Brand',
  tax: 'Tax group',
  visiblePos: 'Visible on POS',
  visibleOnline: 'Visible online',
  byWeight: 'Sell by weight',
  askForPrice: 'Ask for price',
  loyalty: 'Exclude from loyalty',
  baseMeasure: 'Unit of measure',
};

const ANY = '__any__';
const NONE = '__none__';

interface Filters {
  name: string;
  categoryId: string;
  brandId: string;
  taxId: string;
  type: string;
  variantsMin: string;
  variantsMax: string;
  sku: SkuFilter;
  skuText: string;
  byWeight: Tri;
  askForPrice: Tri;
}

const emptyFilters = (): Filters => ({
  name: '',
  categoryId: ANY,
  brandId: ANY,
  taxId: ANY,
  type: ANY,
  variantsMin: '',
  variantsMax: '',
  sku: 'any',
  skuText: '',
  byWeight: 'any',
  askForPrice: 'any',
});

const variantKey = (itemId: string, variantId: string) => `${itemId}::${variantId}`;

const skuText = (variant: IVariableItemVariant) => (variant.skus ?? []).map(sku => sku.trim()).filter(Boolean).join(', ');

const hasSku = (variant: IVariableItemVariant) => skuText(variant) !== '';

const isSimple = (product: IProduct) => product.itemVariantType !== ItemVariantType.RETAIL_VARIABLE;

const priceRange = (product: IProduct) => {
  const prices = (product.variants ?? []).map(variant => variant.price).filter((price): price is number => price != null);
  if (!prices.length) return '-';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? String(min) : `${min} – ${max}`;
};

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

const RetailBulkUpdates = () => {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [products, setProducts] = useState<IProduct[]>([]);
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
  const [measures, setMeasures] = useState<NamedRef[]>([]);

  useEffect(() => {
    loadOptions('api/retail-categories').then(setCategories).catch(() => setCategories([]));
    loadOptions('api/brands').then(setBrands).catch(() => setBrands([]));
    loadOptions('api/accounting-groups').then(setTaxes).catch(() => setTaxes([]));
    loadOptions('api/item-measures').then(setMeasures).catch(() => setMeasures([]));
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
      if (filters.type !== ANY) server.itemVariantType = { value: filters.type, matchMode: 'EQUALS' };
      if (filters.sku === 'contains' && filters.skuText.trim()) server['variants.skus'] = { value: filters.skuText.trim(), matchMode: 'CONTAINS' };

      const result = await searchRetailProducts(server);
      const filtered = result.items.filter(product => {
        const variants = product.variants ?? [];
        if (!withinCount(variants.length, filters.variantsMin, filters.variantsMax)) return false;
        if (filters.sku === 'missing' && variants.every(hasSku)) return false;
        if (filters.sku === 'present' && variants.some(variant => !hasSku(variant))) return false;
        if (filters.byWeight === 'yes' && product.byWeight !== true) return false;
        if (filters.byWeight === 'no' && product.byWeight === true) return false;
        if (filters.askForPrice === 'yes' && product.askForPrice !== true) return false;
        if (filters.askForPrice === 'no' && product.askForPrice === true) return false;
        return true;
      });
      setProducts(filtered);
      setCapped(result.capped);
      setSelected(new Set());
      setSearched(true);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The products could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  const selectedProducts = useMemo(() => products.filter(product => product.id && selected.has(product.id)), [products, selected]);

  const variantLines = useMemo(
    () =>
      selectedProducts.flatMap(product =>
        (product.variants ?? []).map(variant => ({
          key: variantKey(product.id ?? '', variant.id ?? ''),
          product,
          variant,
        })),
      ),
    [selectedProducts],
  );

  useEffect(() => {
    if (!VARIANT_FIELDS.has(field)) return;
    setCheckedVariants(new Set(variantLines.map(line => line.key)));
  }, [field, variantLines]);

  const toggleProduct = (id: string, on: boolean) => {
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

  const refOptions = field === 'category' ? categories : field === 'brand' ? brands : field === 'tax' ? taxes : measures;
  const needsText = field === 'description' || field === 'variantDescription';
  const needsNumber = field === 'price' || field === 'salePrice';
  const needsBool = field === 'visiblePos' || field === 'visibleOnline' || field === 'byWeight' || field === 'askForPrice' || field === 'loyalty';
  const needsRef = field === 'category' || field === 'brand' || field === 'tax' || field === 'baseMeasure';

  const apply = async () => {
    if (!selectedProducts.length) return;
    const number = Number(textValue);
    if (needsNumber && (!Number.isFinite(number) || number < 0)) {
      toast.error('Enter a price of 0 or more.');
      return;
    }
    if (needsRef && !refValue) {
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
      const ids = chosenByItem.get(line.product.id ?? '') ?? new Set<string>();
      if (line.variant.id) ids.add(line.variant.id);
      chosenByItem.set(line.product.id ?? '', ids);
    });
    const ref = refOptions.find(option => option.id === refValue);
    const yes = boolValue === 'true';

    const updated = selectedProducts
      .filter(product => !VARIANT_FIELDS.has(field) || chosenByItem.has(product.id ?? ''))
      .map(product => {
        const next: IProduct = { ...product, variants: (product.variants ?? []).map(variant => ({ ...variant })) };
        const touch = (variant: IVariableItemVariant) => VARIANT_FIELDS.has(field) && chosenByItem.get(product.id ?? '')?.has(variant.id ?? '');
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
          case 'tax':
            next.accountingGroups = ref ? [{ id: ref.id, name: ref.name }] : next.accountingGroups;
            next.variants = next.variants?.map(variant => (touch(variant) ? { ...variant, accountingGroups: ref ? [{ id: ref.id, name: ref.name }] : variant.accountingGroups } : variant));
            break;
          case 'description':
            next.desc = textValue;
            break;
          case 'category':
            next.categories = ref ? [{ id: ref.id, name: ref.name }] : next.categories;
            break;
          case 'brand':
            next.brand = ref ? { id: ref.id, name: ref.name } : next.brand;
            break;
          case 'baseMeasure':
            next.baseMeasure = ref ? { id: ref.id, name: ref.name } : next.baseMeasure;
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
          default:
            break;
        }
        return next;
      });

    setSaving(true);
    try {
      await saveRetailProducts(updated);
      toast.success(`${updated.length} ${updated.length === 1 ? 'product' : 'products'} updated.`);
      await search();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The update could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const allSelected = products.length > 0 && products.every(product => product.id && selected.has(product.id));

  return (
    <WholesalePage
      title="Bulk Updates"
      context="Filter the retail catalog, select products, then set one field on all of them. Name and SKU are not changed here."
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
          {searched && !filtersOpen && (
            <span className="text-xs text-muted-foreground">{products.length} products</span>
          )}
        </button>
        {filtersOpen && <div className="grid gap-3 px-4 pb-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="grid gap-1.5">
            <Label htmlFor="bulk-name">Name</Label>
            <Input id="bulk-name" className="ws-control" value={filters.name} placeholder="Contains" onChange={e => setFilters(prev => ({ ...prev, name: e.target.value }))} />
          </div>
          <OptionFilter label="Category" value={filters.categoryId} options={categories} onChange={categoryId => setFilters(prev => ({ ...prev, categoryId }))} />
          <OptionFilter label="Brand" value={filters.brandId} options={brands} onChange={brandId => setFilters(prev => ({ ...prev, brandId }))} />
          <OptionFilter label="Tax group" value={filters.taxId} options={taxes} onChange={taxId => setFilters(prev => ({ ...prev, taxId }))} />
          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select value={filters.type} onValueChange={type => setFilters(prev => ({ ...prev, type }))}>
              <SelectTrigger className="ws-control"><SelectValue /></SelectTrigger>
              <WsSelectContent>
                <SelectItem value={ANY}>Any</SelectItem>
                <SelectItem value={ItemVariantType.RETAIL_SIMPLE}>Simple</SelectItem>
                <SelectItem value={ItemVariantType.RETAIL_VARIABLE}>Variable</SelectItem>
              </WsSelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bulk-variants-min">Variants</Label>
            <div className="flex items-center gap-2">
              <Input id="bulk-variants-min" className="ws-control" type="number" min={0} placeholder="Min" value={filters.variantsMin} onChange={e => setFilters(prev => ({ ...prev, variantsMin: e.target.value }))} />
              <Input className="ws-control" type="number" min={0} placeholder="Max" aria-label="Maximum variants" value={filters.variantsMax} onChange={e => setFilters(prev => ({ ...prev, variantsMax: e.target.value }))} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>SKU</Label>
            <Select value={filters.sku} onValueChange={sku => setFilters(prev => ({ ...prev, sku: sku as SkuFilter }))}>
              <SelectTrigger className="ws-control"><SelectValue /></SelectTrigger>
              <WsSelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="missing">Missing a SKU</SelectItem>
                <SelectItem value="present">Every variant has a SKU</SelectItem>
                <SelectItem value="contains">SKU contains</SelectItem>
              </WsSelectContent>
            </Select>
          </div>
          {filters.sku === 'contains' && (
            <div className="grid gap-1.5">
              <Label htmlFor="bulk-sku">SKU contains</Label>
              <Input id="bulk-sku" className="ws-control" value={filters.skuText} onChange={e => setFilters(prev => ({ ...prev, skuText: e.target.value }))} />
            </div>
          )}
          <TriFilter label="Sell by weight" value={filters.byWeight} onChange={byWeight => setFilters(prev => ({ ...prev, byWeight }))} />
          <TriFilter label="Ask for price" value={filters.askForPrice} onChange={askForPrice => setFilters(prev => ({ ...prev, askForPrice }))} />
        </div>
        <div className="flex items-center gap-2">
          <Button className="ws-control" disabled={loading} onClick={() => void search()}>
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Search className="mr-1 h-4 w-4" />}
            Search
          </Button>
          <Button variant="outline" className="ws-control" onClick={() => { setFilters(emptyFilters()); setProducts([]); setSearched(false); setSelected(new Set()); }}>
            Clear
          </Button>
          {searched && <span className="text-xs text-muted-foreground">{products.length} products{capped ? ' (first 2,000 from the server; narrow the filter)' : ''}</span>}
        </div>
        </div>}
      </section>

      <section className="ws-card grid gap-3 p-4">
        <h2 className="m-0 text-sm font-semibold">Apply to selected products</h2>
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
            <Label htmlFor="bulk-value">Value</Label>
            {needsText && field === 'description' && (
              <Textarea id="bulk-value" className="min-h-[32px] text-[13px]" value={textValue} onChange={e => setTextValue(e.target.value)} />
            )}
            {needsText && field === 'variantDescription' && (
              <Input id="bulk-value" className="ws-control" value={textValue} onChange={e => setTextValue(e.target.value)} />
            )}
            {needsNumber && (
              <Input id="bulk-value" className="ws-control ws-mono w-40" type="number" min={0} step="0.01" value={textValue} onChange={e => setTextValue(e.target.value)} />
            )}
            {needsBool && (
              <Select value={boolValue} onValueChange={setBoolValue}>
                <SelectTrigger id="bulk-value" className="ws-control w-40"><SelectValue /></SelectTrigger>
                <WsSelectContent>
                  <SelectItem value="true">{field === 'loyalty' ? 'Exclude' : 'Yes'}</SelectItem>
                  <SelectItem value="false">{field === 'loyalty' ? 'Include' : 'No'}</SelectItem>
                </WsSelectContent>
              </Select>
            )}
            {needsRef && (
              <Select value={refValue || NONE} onValueChange={value => setRefValue(value === NONE ? '' : value)}>
                <SelectTrigger id="bulk-value" className="ws-control"><SelectValue placeholder="Choose" /></SelectTrigger>
                <WsSelectContent>
                  <SelectItem value={NONE}>Choose</SelectItem>
                  {refOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                  ))}
                </WsSelectContent>
              </Select>
            )}
          </div>
          <Button className="ws-control" disabled={saving || selectedProducts.length === 0} onClick={() => void apply()}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Apply to {VARIANT_FIELDS.has(field) ? checkedVariants.size : selectedProducts.length}
          </Button>
        </div>
        <p className="m-0 text-xs text-muted-foreground">
          {VARIANT_FIELDS.has(field)
            ? 'Each variant is listed below. Uncheck a variant to leave it unchanged.'
            : 'This value is saved on every selected product.'}
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
                  <th>Product</th>
                  <th>Variant</th>
                  <th>SKU</th>
                  <th className="ws-num">{field === 'salePrice' ? 'Sale price' : field === 'price' ? 'Price' : 'Current'}</th>
                </tr>
              </thead>
              <tbody>
                {variantLines.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted-foreground">Select products in the list first.</td></tr>
                )}
                {variantLines.map(line => (
                  <tr key={line.key}>
                    <td>
                      <Checkbox aria-label={`Update ${line.product.name} ${line.variant.name ?? ''}`} checked={checkedVariants.has(line.key)} onCheckedChange={checked => toggleVariant(line.key, checked === true)} />
                    </td>
                    <td className="font-medium">{line.product.name}</td>
                    <td>{line.variant.name || (isSimple(line.product) ? 'Simple' : '-')}</td>
                    <td className="ws-mono text-[12.5px]">{skuText(line.variant) || <span className="text-[hsl(var(--ws-returned))]">Missing</span>}</td>
                    <td className="ws-num">
                      {field === 'salePrice' ? line.variant.salePrice ?? '-' : field === 'tax' ? (line.variant.accountingGroups ?? []).map(group => group.name).join(', ') || '-' : field === 'variantDescription' ? line.variant.description || '-' : line.variant.price ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="ws-card max-h-[60vh] overflow-auto">
        <table className="ws-table" aria-label="Retail products">
          <thead>
            <tr>
              <th className="w-10">
                <Checkbox
                  aria-label="Select all products"
                  checked={allSelected}
                  onCheckedChange={checked => setSelected(checked === true ? new Set(products.map(product => product.id ?? '').filter(Boolean)) : new Set())}
                />
              </th>
              <th>Name</th>
              <th>Type</th>
              <th className="ws-num">Variants</th>
              <th>SKU</th>
              <th className="ws-num">Price</th>
            </tr>
          </thead>
          <tbody>
            {!searched && <tr><td colSpan={6} className="text-center text-muted-foreground">Search to list products.</td></tr>}
            {searched && products.length === 0 && <tr><td colSpan={6} className="text-center text-muted-foreground">No products match.</td></tr>}
            {products.map(product => {
              const skus = (product.variants ?? []).map(skuText).filter(Boolean);
              const missing = (product.variants ?? []).some(variant => !hasSku(variant));
              return (
                <tr key={product.id}>
                  <td>
                    <Checkbox aria-label={`Select ${product.name}`} checked={!!product.id && selected.has(product.id)} onCheckedChange={checked => product.id && toggleProduct(product.id, checked === true)} />
                  </td>
                  <td className="font-medium">{product.name}</td>
                  <td><WholesaleStatusBadge tone={isSimple(product) ? 'neutral' : 'new'}>{isSimple(product) ? 'Simple' : 'Variable'}</WholesaleStatusBadge></td>
                  <td className="ws-num">{product.variants?.length ?? 0}</td>
                  <td className="ws-mono text-[12.5px]">{skus.length ? skus.join(' · ') : ''}{missing && <span className="ml-1 text-[hsl(var(--ws-returned))]">Missing</span>}</td>
                  <td className="ws-num">{priceRange(product)}</td>
                </tr>
              );
            })}
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

export default RetailBulkUpdates;
