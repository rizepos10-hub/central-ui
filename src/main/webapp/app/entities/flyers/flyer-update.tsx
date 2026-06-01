import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { Translate } from 'react-jhipster';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeEntityField, createEntity, getEntity, reset, updateEntity } from './flyer.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getEntities as searchAllItems } from 'app/entities/item/all-items.reducer';
import AsyncSelect from 'app/shared/components/select/async-select';
import { IFlyer, IFlyerEntry, IFlyerVariantRef } from 'app/shared/model/flyer.model';
import { IBranch } from 'app/shared/model/branch.model';
import { IItem } from 'app/shared/model/ITEM/item.model';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ItemOption = {
  value: string;
  label: string;
  item: IItem;
};

type VariantOption = {
  value: string;
  label: string;
  variant: IFlyerVariantRef;
};

const toDateTimeInputValue = (value?: string | null) => (value ? dayjs(value).format('YYYY-MM-DDTHH:mm') : '');

const buildEntry = (): IFlyerEntry => ({
  itemId: null,
  variantId: null,
  item: null,
  variant: null,
});

const getVariantOptions = (item?: IItem | null): VariantOption[] => {
  return (item?.variants || [])
    .filter(variant => variant?.id)
    .map(variant => ({
      value: variant.id,
      label: variant.name ? `${variant.name}${variant.sku ? ` (${variant.sku})` : ''}` : variant.sku || variant.id,
      variant: {
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
      },
    }));
};

const normalizeEntry = (entry?: IFlyerEntry | null): IFlyerEntry => ({
  itemId: entry?.item?.id || entry?.itemId || null,
  variantId: entry?.variant?.id || entry?.variantId || null,
  item: entry?.item || (entry?.itemId ? { id: entry.itemId, name: entry.itemId } : null),
  variant:
    entry?.variant ||
    (entry?.variantId
      ? {
          id: entry.variantId,
          name: entry.variantId,
        }
      : null),
});

export const FlyerUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const flyer: IFlyer = useAppSelector(state => state.flyer.entity);
  const loading = useAppSelector(state => state.flyer.loading);
  const updating = useAppSelector(state => state.flyer.updating);
  const updateSuccess = useAppSelector(state => state.flyer.updateSuccess);
  const branchList: IBranch[] = useAppSelector(state => state.branch.entities);

  const createNewRef = useRef(false);
  const [itemLoadingByIndex, setItemLoadingByIndex] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
      dispatch(changeEntityField({ name: 'entries', value: [buildEntry()] }));
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getBranches({ page: 0, size: 500, sort: 'name,asc' }));
  }, [dispatch, id, isNew]);

  useEffect(() => {
    if (!updateSuccess) {
      return;
    }

    if (createNewRef.current) {
      createNewRef.current = false;
      dispatch(reset());
      dispatch(changeEntityField({ name: 'entries', value: [buildEntry()] }));
      navigate('/flyers/new');
      return;
    }

    const nextId = flyer?.id || id;
    if (isNew && nextId) {
      navigate(`/flyers/${nextId}/edit`);
      return;
    }
  }, [dispatch, flyer?.id, id, isNew, navigate, updateSuccess]);

  const entries = useMemo(() => {
    if (flyer.entries?.length) {
      return flyer.entries.map(normalizeEntry);
    }
    return [buildEntry()];
  }, [flyer.entries]);

  const isSaveDisabled = useMemo(() => {
    return (
      updating ||
      !flyer.name?.trim() ||
      !flyer.branch?.id ||
      !flyer.startAt ||
      !flyer.endAt ||
      flyer.price == null ||
      flyer.price < 0 ||
      entries.length === 0 ||
      entries.some(entry => !(entry.item?.id || entry.itemId) || !(entry.variant?.id || entry.variantId))
    );
  }, [entries, flyer.branch?.id, flyer.endAt, flyer.name, flyer.price, flyer.startAt, updating]);

  const updateEntries = (nextEntries: IFlyerEntry[]) => {
    dispatch(
      changeEntityField({
        name: 'entries',
        value: nextEntries,
      })
    );
  };

  const handleAddEntry = () => {
    updateEntries([...entries, buildEntry()]);
  };

  const handleRemoveEntry = (entryIndex: number) => {
    const nextEntries = entries.filter((_, index) => index !== entryIndex);
    updateEntries(nextEntries.length > 0 ? nextEntries : [buildEntry()]);
  };

  const handleEntryChange = (entryIndex: number, updates: Partial<IFlyerEntry>) => {
    updateEntries(
      entries.map((entry, index) =>
        index === entryIndex
          ? {
              ...entry,
              ...updates,
            }
          : entry
      )
    );
  };

  const loadItemOptions = (entryIndex: number, inputValue: string, callback: (options: ItemOption[]) => void) => {
    setItemLoadingByIndex(prev => ({ ...prev, [entryIndex]: true }));
    dispatch(
      searchAllItems({
        page: 0,
        size: 15,
        sort: 'id,asc',
        name: inputValue,
      })
    )
      .then(response => {
        const data = (response.payload as any)?.data || [];
        callback(
          data.map(item => ({
            value: item.id,
            label: item.name,
            item,
          }))
        );
      })
      .finally(() => {
        setItemLoadingByIndex(prev => ({ ...prev, [entryIndex]: false }));
      });
  };

  const saveEntity = async (createNew = false) => {
    createNewRef.current = createNew;

    const entity: IFlyer = {
      ...flyer,
      startAt: flyer.startAt ? new Date(flyer.startAt).toISOString() : null,
      endAt: flyer.endAt ? new Date(flyer.endAt).toISOString() : null,
      entries: entries.map(entry => ({
        itemId: entry.item?.id || entry.itemId,
        variantId: entry.variant?.id || entry.variantId,
        item: entry.item,
        variant: entry.variant,
      })),
    };

    if (isNew) {
      await dispatch(createEntity(entity));
    } else {
      await dispatch(updateEntity(entity));
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{isNew ? 'Create New Flyer' : 'Edit Flyer'}</h2>

        {loading ? (
          <p className="text-xs">Loading...</p>
        ) : (
          <form className="space-y-4">
            <div className="space-y-4 rounded-md border bg-white p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="flyer-name" className="text-xs font-semibold">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="flyer-name"
                    value={flyer.name || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'name', value: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flyer-branch" className="text-xs font-semibold">
                    Branch <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={flyer.branch?.id || ''}
                    onValueChange={value =>
                      dispatch(
                        changeEntityField({
                          name: 'branch',
                          value: branchList.find(branch => branch.id === value) || null,
                        })
                      )
                    }
                  >
                    <SelectTrigger id="flyer-branch" className="h-8 text-xs">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchList.filter(branch => branch.id).map(branch => (
                        <SelectItem key={branch.id} value={branch.id} className="text-xs">
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="flyer-startAt" className="text-xs font-semibold">
                    Start At <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="flyer-startAt"
                    type="datetime-local"
                    value={toDateTimeInputValue(flyer.startAt)}
                    onChange={e => dispatch(changeEntityField({ name: 'startAt', value: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flyer-endAt" className="text-xs font-semibold">
                    End At <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="flyer-endAt"
                    type="datetime-local"
                    value={toDateTimeInputValue(flyer.endAt)}
                    onChange={e => dispatch(changeEntityField({ name: 'endAt', value: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flyer-price" className="text-xs font-semibold">
                    Price <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="flyer-price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={flyer.price ?? ''}
                    onChange={e =>
                      dispatch(
                        changeEntityField({
                          name: 'price',
                          value: e.target.value === '' ? null : parseFloat(e.target.value),
                        })
                      )
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-md border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Entries</h3>
                  <p className="text-xs text-muted-foreground">
                    Search an item, then pick one of its variants for each flyer row.
                  </p>
                </div>
                <Button type="button" variant="outline" className="h-8 text-xs" onClick={handleAddEntry}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entry
                </Button>
              </div>

              <div className="space-y-3">
                {entries.map((entry, entryIndex) => {
                  const variantOptions = (() => {
                    const options = getVariantOptions(entry.item);
                    if (entry.variant?.id && !options.some(option => option.value === entry.variant.id)) {
                      return [
                        ...options,
                        {
                          value: entry.variant.id,
                          label: entry.variant.name || entry.variant.sku || entry.variant.id,
                          variant: entry.variant,
                        },
                      ];
                    }

                    return options;
                  })();
                  const selectedItemOption = entry.item?.id
                    ? {
                        value: entry.item.id,
                        label: entry.item.name || entry.item.id,
                        item: entry.item,
                      }
                    : null;

                  return (
                    <div key={`flyer-entry-${entryIndex}`} className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(0,1fr)_220px_80px]">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Item</Label>
                        <AsyncSelect
                          cacheOptions
                          defaultOptions
                          value={selectedItemOption}
                          loadOptions={(inputValue, callback) => loadItemOptions(entryIndex, inputValue, callback)}
                          getOptionLabel={(option: ItemOption) => option.label}
                          getOptionValue={(option: ItemOption) => option.value}
                          isLoading={Boolean(itemLoadingByIndex[entryIndex])}
                          placeholder="Search items"
                          onChange={(selected: ItemOption | null) =>
                            handleEntryChange(entryIndex, {
                              itemId: selected?.item?.id || null,
                              item: selected?.item || null,
                              variantId: null,
                              variant: null,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Variant</Label>
                        <Select
                          value={entry.variant?.id || entry.variantId || ''}
                          onValueChange={value => {
                            const selectedVariant = variantOptions.find(option => option.value === value)?.variant || null;
                            handleEntryChange(entryIndex, {
                              variantId: selectedVariant?.id || null,
                              variant: selectedVariant,
                            });
                          }}
                          disabled={!entry.item?.id}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder={entry.item?.id ? 'Select variant' : 'Choose item first'} />
                          </SelectTrigger>
                          <SelectContent>
                            {variantOptions.map(option => (
                              <SelectItem key={option.value} value={option.value} className="text-xs">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-8 w-full text-xs"
                          onClick={() => handleRemoveEntry(entryIndex)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate(-1)}
                type="button"
                className="h-8 text-xs"
                id="cancel-save"
                data-cy="entityCreateCancelButton"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                <Translate contentKey="entity.action.back">Back</Translate>
              </Button>
              <Button
                type="button"
                disabled={isSaveDisabled}
                className="h-8 text-xs"
                onClick={() => saveEntity(false)}
                id="save-entity"
                data-cy="entityCreateSaveButton"
              >
                <Save className="mr-2 h-4 w-4" />
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
              <Button
                onClick={() => saveEntity(true)}
                disabled={isSaveDisabled}
                className="h-8 text-xs"
                type="button"
              >
                <Save className="mr-2 h-4 w-4" />
                <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageWrapper>
  );
};

export default FlyerUpdate;
