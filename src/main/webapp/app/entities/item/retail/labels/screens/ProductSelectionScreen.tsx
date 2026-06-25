import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FilterMatchMode } from 'primereact/api';
import { ArrowLeft, Check, CheckCircle2, Layers, Minus, Package, Plus, Ruler, ScanBarcode, Search, Tag, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IProduct } from 'app/shared/model/ITEM/retail/product.model';
import { IVariableItemVariant } from 'app/shared/model/ITEM/retail/variable-item.model';
import { ITerm } from 'app/shared/model/term.model';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { initialItemFilterState } from 'app/shared/model/filter-state.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from 'app/shared/components/select/select';
import PaginationFilter from 'app/shared/components/pagination/pagination-filter';
import { getEntities as getRetailCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { filterEntities } from '../../product/product.reducer';
import { useLabelTemplates } from '../store/useLabelTemplates';
import { useLabelFlow } from '../store/label-flow-context';
import { formatCurrency, variantKey } from '../util/label-data';
import { LabelCanvasPreview } from '../components/LabelCanvas';
import { formatVariant } from 'app/shared/util/variant-utils';
import { directPrintLanguageName, isDirectPrintTemplate } from '../util/label-script';

const SELECT_HEIGHT = '36px';
const matchInputHeight = {
  control: (base: any) => ({ ...base, minHeight: SELECT_HEIGHT, height: SELECT_HEIGHT }),
  valueContainer: (base: any) => ({ ...base, height: SELECT_HEIGHT, padding: '0 8px' }),
  indicatorsContainer: (base: any) => ({ ...base, height: SELECT_HEIGHT }),
};

const ProductSelectionScreen = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { templateId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const { getTemplate } = useLabelTemplates();
  const { template, setTemplate, isSelected, toggle, setCopies, clear, selection, entries, totalLabels } = useLabelFlow();

  const products: IProduct[] = useAppSelector(state => state.product.entities);
  const totalItems = useAppSelector(state => state.product.totalItems);
  const loading = useAppSelector(state => state.product.loading);

  const rootRef = useRef<HTMLDivElement>(null);

  // Reset scroll on entry — the surrounding scroll container keeps its position from the previous step otherwise.
  useEffect(() => {
    let node: HTMLElement | null = rootRef.current;
    while (node) {
      const overflowY = getComputedStyle(node).overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
        node.scrollTop = 0;
      }
      node = node.parentElement;
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!template && templateId) {
      const found = getTemplate(templateId);
      if (found) setTemplate(found);
    }
  }, [template, templateId, getTemplate, setTemplate]);

  const rows = Number(searchParams.get('rows')) || 20;

  useEffect(() => {
    const baseQuery = { ...initialItemFilterState, rows };
    const updatedQuery = applyMatchModeMap({
      ...baseQuery,
      page: Number(searchParams.get('page')) ? Number(searchParams.get('page')) - 1 : 0,
      rows,
      filters: {
        name: { value: searchParams.get('name'), matchMode: FilterMatchMode.CONTAINS },
        'categories.id': { value: searchParams.get('categoryId'), matchMode: FilterMatchMode.EQUALS },
      },
    });
    dispatch(filterEntities({ query: updatedQuery }));
  }, [dispatch, rows, searchParams.get('page'), searchParams.get('rows'), searchParams.get('name'), searchParams.get('categoryId')]);

  const updateParam = (name: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const selectedCount = entries.length;

  const goPreview = () => {
    if (!template || totalLabels === 0) return;
    navigate('/labels/preview');
  };

  const hasFilters = Boolean(searchParams.get('name') || searchParams.get('categoryId'));
  const isDirect = isDirectPrintTemplate(template);

  return (
    <div ref={rootRef} className="flex h-full w-full flex-col px-4 py-4 pb-28">
      <div className="mb-3">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground" onClick={() => navigate('/labels')}>
          <ArrowLeft className="h-4 w-4" /> Templates
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">Step 2 of 3 · Products</p>
          <h2 className="m-0 mt-0.5 text-2xl font-bold tracking-tight text-foreground">Select products</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Pick the products to print. Each variant becomes its own label with its own SKU and price.
          </p>
        </div>
        {template && (
          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-card p-2.5 shadow-sm">
            {isDirect ? (
              <div className="flex h-[84px] w-[128px] items-center justify-center rounded-md border border-border/70 bg-amber-500/5">
                <div className="text-center">
                  <div className="text-sm font-bold text-amber-700">{directPrintLanguageName(template.directPrint?.language ?? 'zpl')}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">Raw printer script</div>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border border-border/70 bg-white">
                <LabelCanvasPreview template={template} maxWidthPx={128} maxHeightPx={84} withShadow={false} />
              </div>
            )}
            <div className="pr-1">
              <p className="m-0 max-w-[150px] truncate text-sm font-semibold text-foreground">{template.name}</p>
              <div className="mt-1.5 flex flex-col gap-1">
                <MetaChip icon={<Ruler className="h-3 w-3" />}>
                  {template.widthMm.toFixed(0)} × {template.heightMm.toFixed(0)} mm
                </MetaChip>
                <MetaChip icon={<Layers className="h-3 w-3" />}>
                  {isDirect ? directPrintLanguageName(template.directPrint?.language ?? 'zpl') : `${template.elements.length} element${template.elements.length === 1 ? '' : 's'}`}
                </MetaChip>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 pl-8 text-sm"
            placeholder="Search products…"
            value={searchParams.get('name') || ''}
            onChange={e => updateParam('name', e.target.value)}
          />
        </div>
        <div className="w-full sm:w-60">
          <CategoryFilter value={searchParams.get('categoryId')} onChange={id => updateParam('categoryId', id)} />
        </div>
      </div>

      <div className="mt-3 flex min-h-[20px] shrink-0 items-center justify-between px-0.5">
        <span className="text-xs text-muted-foreground">
          {loading ? 'Loading…' : `Showing ${products.length} of ${totalItems} product${totalItems === 1 ? '' : 's'}`}
          {hasFilters && !loading && ' · filtered'}
        </span>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" /> Clear selection
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-3">
        {loading && products.length === 0 && <SkeletonList />}
        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">No products found</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Try a different search or category.</p>
          </div>
        )}
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            selection={selection}
            isSelected={isSelected}
            onToggle={toggle}
            onCopies={setCopies}
          />
        ))}
      </div>

      {totalItems > rows && (
        <div className="mt-5 flex justify-center">
          <PaginationFilter totalPages={Math.ceil(totalItems / rows)} />
        </div>
      )}

      {selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-border bg-background px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-sky-600" />
              {selectedCount} product{selectedCount === 1 ? '' : 's'} selected
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              {totalLabels} label{totalLabels === 1 ? '' : 's'} will be generated
            </span>
          </div>
          <Button onClick={goPreview} className="h-11 shrink-0 gap-2 px-6 text-sm font-bold shadow-sm">
            <ScanBarcode className="h-5 w-5" />
            Preview {totalLabels} Label{totalLabels === 1 ? '' : 's'}
          </Button>
        </div>
      )}
    </div>
  );
};

const MetaChip = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <span className="inline-flex w-fit items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
    {icon}
    {children}
  </span>
);

type CategoryFilterProps = {
  value: string | null;
  onChange: (id: string | null) => void;
};

const CategoryFilter = ({ value, onChange }: CategoryFilterProps) => {
  const dispatch = useAppDispatch();
  const categories: ITerm[] = useAppSelector(state => state.retailCategory.entities);

  useEffect(() => {
    dispatch(getRetailCategories({ page: 0, size: 1000, sort: 'name,asc' }));
  }, [dispatch]);

  const options = useMemo(
    () => [...categories].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(c => ({ value: c.id ?? '', label: c.name || '' })),
    [categories]
  );

  return (
    <Select
      value={options.find(o => o.value === value) || null}
      options={options}
      onChange={(opt: { value: string } | null) => onChange(opt?.value ?? null)}
      isClearable
      placeholder="All categories"
      styles={matchInputHeight}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
    />
  );
};

type ProductCardProps = {
  product: IProduct;
  selection: Map<string, { copies: number }>;
  isSelected: (key: string) => boolean;
  onToggle: (product: IProduct, variant?: IVariableItemVariant) => void;
  onCopies: (key: string, copies: number) => void;
};

const ProductCard = ({ product, selection, isSelected, onToggle, onCopies }: ProductCardProps) => {
  const variants: IVariableItemVariant[] = product.variants || [];
  const printable = variants.filter(v => v.sku);
  if (printable.length === 0) return null;

  const single = printable.length === 1;
  const imageUrl = product.attachments?.[0]?.url;
  const keyOf = (v: IVariableItemVariant) => variantKey(product.id ?? '', v.id);
  const selectedCount = printable.filter(v => isSelected(keyOf(v))).length;
  const anySelected = selectedCount > 0;
  const allSelected = selectedCount === printable.length;
  const category = product.categories?.[0]?.name;

  const toggleAll = () => {
    printable.forEach(v => {
      const isSel = isSelected(keyOf(v));
      if (allSelected ? isSel : !isSel) onToggle(product, v);
    });
  };

  const cardClass = `group relative overflow-hidden rounded-xl border transition-shadow duration-150 ${
    anySelected ? 'border-sky-300 bg-sky-50/40 shadow-sm' : 'border-border bg-card hover:border-foreground/15 hover:shadow-sm'
  }`;
  const focusable = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500/40';

  // Single-variant products: the whole header is one tidy, selectable row.
  if (single) {
    const variant = printable[0];
    const key = keyOf(variant);
    const selected = isSelected(key);
    const copies = selection.get(key)?.copies ?? 1;
    const price = variant.salePrice ?? variant.price;
    const hasSale = variant.salePrice != null && variant.price != null && variant.salePrice !== variant.price;

    return (
      <div className={cardClass}>
        <div className="flex items-center gap-4 px-4 py-3.5">
          <button
            type="button"
            onClick={() => onToggle(product, variant)}
            className={`-m-1 flex min-w-0 flex-1 items-center gap-4 rounded-lg p-1 text-left ${focusable}`}
          >
            <ProductThumb imageUrl={imageUrl} name={product.name} />
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[15px] font-semibold text-foreground">{product.name}</p>
              <div className="mt-1.5 flex items-center gap-2.5">
                <SkuChip sku={variant.sku} />
                {category && <span className="truncate text-xs text-muted-foreground">{category}</span>}
              </div>
            </div>
            {price != null && <PriceTag price={price} original={hasSale ? variant.price : undefined} />}
            <Checkbox selected={selected} />
          </button>
          {selected && <Stepper copies={copies} onDec={() => onCopies(key, copies - 1)} onInc={() => onCopies(key, copies + 1)} />}
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-4 px-4 py-3.5">
        <ProductThumb imageUrl={imageUrl} name={product.name} />
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[15px] font-semibold text-foreground">{product.name}</p>
          <div className="mt-1.5 flex items-center gap-2.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-foreground/70">
              <Package className="h-3 w-3" /> {printable.length} variants
            </span>
            {category && <span className="truncate">{category}</span>}
          </div>
        </div>
        {anySelected && (
          <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">
            {selectedCount}/{printable.length}
          </span>
        )}
        <button
          type="button"
          onClick={toggleAll}
          className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${focusable} ${
            allSelected ? 'text-muted-foreground hover:bg-muted' : 'text-sky-600 hover:bg-sky-50'
          }`}
        >
          {allSelected ? 'Clear all' : 'Select all'}
        </button>
      </div>

      <div className="flex flex-col border-t border-border/60 bg-muted/30 px-2.5 py-2">
        {printable.map(variant => {
          const key = keyOf(variant);
          const selected = isSelected(key);
          const copies = selection.get(key)?.copies ?? 1;
          const price = variant.salePrice ?? variant.price;
          const hasSale = variant.salePrice != null && variant.price != null && variant.salePrice !== variant.price;
          const label = formatVariant(variant.name || '', variant.attributeValues) || variant.sku;
          return (
            <div
              key={key}
              className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors ${selected ? 'bg-sky-50' : 'hover:bg-card'}`}
            >
              <button
                type="button"
                onClick={() => onToggle(product, variant)}
                className={`-m-1 flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left ${focusable}`}
              >
                <Checkbox selected={selected} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{label}</span>
                  <SkuChip sku={variant.sku} />
                </span>
                {price != null && <PriceTag price={price} original={hasSale ? variant.price : undefined} />}
              </button>
              {selected && <Stepper copies={copies} onDec={() => onCopies(key, copies - 1)} onInc={() => onCopies(key, copies + 1)} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProductThumb = ({ imageUrl, name }: { imageUrl?: string; name?: string }) => (
  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted ring-1 ring-border/60">
    {imageUrl ? (
      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
    ) : (
      <span className="text-lg font-bold text-muted-foreground/70">{(name || '?').slice(0, 1).toUpperCase()}</span>
    )}
  </div>
);

const SkuChip = ({ sku }: { sku?: string }) => (
  <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
    <Tag className="h-3 w-3" /> {sku}
  </span>
);

const PriceTag = ({ price, original }: { price: number; original?: number | null }) => (
  <span className="flex shrink-0 flex-col items-end leading-tight">
    <span className="text-[15px] font-bold text-emerald-600">{formatCurrency(price)}</span>
    {original != null && <span className="text-[10px] text-muted-foreground line-through">{formatCurrency(original)}</span>}
  </span>
);

const Checkbox = ({ selected }: { selected: boolean }) => (
  <span
    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
      selected ? 'border-sky-500 bg-sky-500 text-white' : 'border-muted-foreground/30'
    }`}
  >
    {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
  </span>
);

const Stepper = ({ copies, onInc, onDec }: { copies: number; onInc: () => void; onDec: () => void }) => (
  <div
    className="flex shrink-0 items-center gap-0.5 rounded-lg bg-background p-0.5 shadow-sm ring-1 ring-border"
    onClick={e => e.stopPropagation()}
  >
    <StepperButton icon={<Minus className="h-3.5 w-3.5" />} disabled={copies <= 1} onClick={onDec} />
    <span className="w-7 text-center text-sm font-bold tabular-nums text-sky-600">{copies}</span>
    <StepperButton icon={<Plus className="h-3.5 w-3.5" />} onClick={onInc} />
  </div>
);

const StepperButton = ({ icon, onClick, disabled }: { icon: React.ReactNode; onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="flex h-6 w-6 items-center justify-center rounded-md text-sky-600 transition-colors hover:bg-sky-500/12 disabled:text-muted-foreground/40 disabled:hover:bg-transparent"
  >
    {icon}
  </button>
);

const SkeletonList = () => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-5 w-14 animate-pulse rounded bg-muted" />
      </div>
    ))}
  </>
);

export default ProductSelectionScreen;
