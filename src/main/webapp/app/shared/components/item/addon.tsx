import { getSortState, translate, Translate } from 'react-jhipster';
import Select, { ActionMeta, MultiValue } from 'react-select';
import React, { useEffect, useState } from 'react';
import { IAddon } from 'app/shared/model/ADDON/addon.model';
import AddonImportModal from 'app/shared/components/item/addon-import-modal';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { cloneDeep } from 'lodash';
import { filterEntities } from 'app/entities/addon/addon.reducer';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { FilterMatchMode } from 'primereact/api';
import { IAddonGroup, IAddonGroups } from 'app/shared/model/ADDON/addon-groups.model';
import { getEntities as getAddonGroups } from 'app/entities/addon-groups/addon-groups.reducer';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { getEntities as getAddonsEntity } from 'app/entities/addon/addon.reducer';
import { IAddonPriceOverride } from 'app/shared/model/ADDON/addon-price-override';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DraggableList } from 'app/shared/components/draggable-list/draggable-list';

type SharedAddonProps = {
  onFieldChange: (field: string, value: IAddon[] | IItem['addonGroups']) => void;
  addons: IAddon[];
  addonGroups: IItem['addonGroups'];
  item: IItem;
};

const initialState = {
  first: 0,
  rows: 1000,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    groupId: { value: null, matchMode: FilterMatchMode.EQUALS },
  },
};

const SharedAddon = ({ onFieldChange, addons, addonGroups, item }: SharedAddonProps) => {
  const currencySettingsEntity = useAppSelector(state => state.currencySettings.entity);

  const dispatch = useAppDispatch();
  const [openedAddonModal, setOpenedAddonModal] = useState(false);

  const addonOptions = useAppSelector(state => state.addon.entities);
  const addonGroupsOptions = useAppSelector(state => state.addonGroups.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [selectedAddonGroup, setSelectedAddonGroup] = useState<IAddonGroups>();

  const openImportAddonModal = () => {
    setOpenedAddonModal(true);
  };

  const handleCheckboxChange = (addonGroupIndex: number) => {
    const updatedAddonGroups = cloneDeep([...addonGroups]);
    updatedAddonGroups[addonGroupIndex].required = !updatedAddonGroups[addonGroupIndex].required;
    onFieldChange('addonGroups', updatedAddonGroups);
  };

  const handleAddonGroupChange = (
    selectedAddonGroup: IAddonGroup,
    actionMeta: ActionMeta<{ id: string; name: string }>
  ) => {
    const newGroup: IAddonGroups = {
      addonGroup: selectedAddonGroup,
      required: false,
      minQuantity: null,
      maxQuantity: null,
      addAutomatically: false,
      addonPriceOverrides: [],
      excluded: [],
      name: null,
    };

    const updatedAddonGroups = Array.isArray(addonGroups) ? addonGroups : [];
    onFieldChange('addonGroups', [...updatedAddonGroups, newGroup]);
  };

  const handleAddonGroupReorder = (event) => {
    const reorderedAddonGroups = event.value?.map(group => {
      const existingGroup = addonGroups?.find(g => g.addonGroup.id === group.id);
      return existingGroup ? existingGroup : { addonGroup: group };
    });
    onFieldChange('addonGroups', reorderedAddonGroups);
  };

  const handleRemoveAddonGroup = (e, groupId: string) => {
    e.stopPropagation();
    const updatedAddonGroups = addonGroups.filter(group => group.addonGroup.id !== groupId);
    onFieldChange('addonGroups', updatedAddonGroups);
    setSelectedAddonGroup(undefined);
  };

  const handleAddonGroupFieldChange = (addonGroupIndex: number, fieldName: string, value: any) => {
    const updatedAddonGroups = [...addonGroups];
    const updatedItem = {
      ...updatedAddonGroups[addonGroupIndex],
      [fieldName]: value,
    };

    updatedAddonGroups[addonGroupIndex] = updatedItem;
    onFieldChange('addonGroups', updatedAddonGroups);
  };

  useEffect(() => {
    const updatedAddonGroups = addonGroups?.map(addonGroup => {
      const isRequired = addonGroup.minQuantity > 0;
      if (addonGroup.required !== isRequired) {
        return {
          ...addonGroup,
          required: isRequired,
        };
      }
      return addonGroup;
    });

    const hasChanged = updatedAddonGroups.some((group, index) => group !== addonGroups[index]);

    if (hasChanged) {
      onFieldChange('addonGroups', updatedAddonGroups);
    }
  }, [addonGroups]);

  useEffect(() => {
    if (selectedAddonGroup && addonGroups) {
      const updatedSelectedGroup = addonGroups.find(
        group => group.addonGroup.id === selectedAddonGroup.addonGroup.id
      );
      if (updatedSelectedGroup && updatedSelectedGroup !== selectedAddonGroup) {
        setSelectedAddonGroup(updatedSelectedGroup);
      }
    }
  }, [addonGroups, selectedAddonGroup]);

  const handleAddonGroupExcludedChange = (
    checked,
    addonGroupIndex: number,
    value: IAddon,
  ) => {
    const updatedAddonGroups = [...addonGroups];

    const updatedItem: IAddonGroups = {
      ...updatedAddonGroups[addonGroupIndex],
      excluded: !checked
        ? [...updatedAddonGroups[addonGroupIndex].excluded, value]
        : updatedAddonGroups[addonGroupIndex].excluded.filter(
          item => item.id !== value.id
        ),
    };

    updatedAddonGroups[addonGroupIndex] = updatedItem;
    onFieldChange('addonGroups', updatedAddonGroups);
  };

  const handleSelectAllAddons = (checked, addonGroupIndex: number) => {
    const updatedAddonGroups = [...addonGroups];
    const currentAddonGroup = updatedAddonGroups[addonGroupIndex];

    const updatedItem: IAddonGroups = {
      ...currentAddonGroup,
      excluded: checked ? [] : [...currentAddonGroup.addonGroup.addons],
    };

    updatedAddonGroups[addonGroupIndex] = updatedItem;
    onFieldChange('addonGroups', updatedAddonGroups);
  };

  const handleAddonGroupOverridedPriceChange = (addonGroupIndex: number, addonId: string, price: number | null | undefined) => {
    const updatedAddonGroups = [...addonGroups];
    const addonGroup = updatedAddonGroups[addonGroupIndex];

    const updatedAddonPriceOverrides = [...addonGroup.addonPriceOverrides];
    const index = updatedAddonPriceOverrides.findIndex(override => override.id === addonId);
    if (price !== null && price !== undefined) {
      if (index >= 0) {
        updatedAddonPriceOverrides[index] = { ...updatedAddonPriceOverrides[index], price };
      } else {
        updatedAddonPriceOverrides.push({ id: addonId, price });
      }
    } else {
      if (index >= 0) {
        updatedAddonPriceOverrides.splice(index, 1);
      }
    }

    const updatedItem: IAddonGroups = {
      ...addonGroup,
      addonPriceOverrides: updatedAddonPriceOverrides,
    };

    updatedAddonGroups[addonGroupIndex] = updatedItem;

    onFieldChange('addonGroups', updatedAddonGroups);
  };

  const reorderHeader = (
    data: {
      id: string;
      name: string;
    }[],
    onChange: any,
    value: any,
    options,
    onFocus: any
  ) => {
    const [selected, setSelected] = useState(null);
    return (
      <div className='flex gap-2 items-center'>
        <Select
          value={selected ? data.find(item => item.id === selected) : null}
          onChange={selectedOption => setSelected(selectedOption?.id || null)}
          options={data}
          placeholder=""
          onFocus={onFocus}
          getOptionLabel={option => option.name}
          getOptionValue={option => option.id}
          isClearable
          styles={{
            control: (base) => ({
              ...base,
              minHeight: '32px',
              fontSize: '0.75rem',
              width: '14rem',
            }),
            menu: (base) => ({
              ...base,
              fontSize: '0.75rem',
            }),
          }}
        />
        <Button
          disabled={!selected}
          onClick={() => {
            onChange(options?.find(g => g?.id === selected))
            setSelected(null)
          }}
          size="sm"
          className='h-7 text-xs'
        >
          Assign
        </Button>
        <Button type="button" size="sm" className="h-7 text-xs" onClick={openImportAddonModal}>
          <Translate contentKey={'items.update.importAddons'}>Import</Translate>
        </Button>
      </div>
    )
  }

  const selectedItemAddonGroupIds = item?.addonGroups?.map(group => group.addonGroup.id) ?? [];
  const selectedVariantAddonGroupIds = item?.variants?.flatMap(variant => variant.addonGroups?.map(group => group.addonGroup.id) ?? []) ?? [];
  const allSelectedAddonGroupIds = [...selectedItemAddonGroupIds, ...selectedVariantAddonGroupIds];

  const filteredAddonGroupsOptions = addonGroupsOptions;

  const handleImportAddonModalSave = (groups: IAddonGroups[]) => {
    const newAddonGroups = [...groups];

    onFieldChange('addonGroups', newAddonGroups);
    setOpenedAddonModal(false);
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            <Translate contentKey={'items.update.addonGroups'}>Addon Groups</Translate>
          </Label>
          <div>
            <DraggableList
              value={addonGroups?.map(group => group.addonGroup) || []}
              onChange={handleAddonGroupReorder}
              itemTemplate={(addonGroup: IAddonGroup, idx: number) => {
                const index = addonGroups?.findIndex(group => group.addonGroup.id === addonGroup.id);

                return (
                  <div
                    className="flex gap-2 items-end w-full"
                    onClick={() => setSelectedAddonGroup(addonGroups[index])}
                  >
                    <span className='flex flex-col gap-1'>
                      <Label className="text-xs">{addonGroup?.name}</Label>
                      <Input
                        value={addonGroups[index]?.name ?? addonGroup?.name}
                        onChange={e => handleAddonGroupFieldChange(index, 'name', e.target.value)}
                        className="w-[120px] h-7 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === ' ') {
                            e.stopPropagation();
                          }
                        }}
                      />
                    </span>
                    <span className='flex gap-1'>
                      <span className='flex flex-col gap-1'>
                        <Label className="text-xs">{translate('items.update.min')}</Label>
                        <Input
                          type="number"
                          value={addonGroups[index]?.minQuantity ?? ''}
                          onChange={e => {
                            handleAddonGroupFieldChange(index, 'minQuantity', parseInt(e.target.value) || null)
                          }}
                          max={addonGroups?.[index]?.addonGroup?.addons?.length}
                          className="w-[40px] h-7 text-xs"
                        />
                      </span>
                      <span className='flex flex-col gap-1'>
                        <Label className="text-xs">{translate('items.update.max')}</Label>
                        <Input
                          type="number"
                          value={addonGroups[index]?.maxQuantity ?? ''}
                          onChange={e => handleAddonGroupFieldChange(index, 'maxQuantity', parseInt(e.target.value) || null)}
                          max={addonGroups?.[index]?.addonGroup?.addons?.length}
                          className="w-[40px] h-7 text-xs"
                        />
                      </span>
                    </span>
                    <span className='flex flex-col gap-1'>
                      <Label className="text-xs">{translate('items.update.addAutomatically')}</Label>
                      <Checkbox
                        checked={addonGroups[index]?.addAutomatically}
                        onCheckedChange={checked => handleAddonGroupFieldChange(index, 'addAutomatically', checked)}
                      />
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => handleRemoveAddonGroup(e, addonGroup.id)}
                    >
                      X
                    </Button>
                  </div>
                )
              }}
              header={
                reorderHeader(
                  filteredAddonGroupsOptions,
                  handleAddonGroupChange,
                  addonGroups?.map(group => ({
                    id: group?.addonGroup?.id,
                    name: group?.addonGroup?.name,
                  })),
                  addonGroupsOptions,
                  () => {
                    dispatch(getAddonGroups({
                      page: paginationState.activePage - 1,
                      size: paginationState.itemsPerPage,
                      sort: `${paginationState.sort},${paginationState.order}`,
                    }))
                  }
                )
              }
              dataKey="id"
            />
          </div>
        </div>

        {selectedAddonGroup && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex justify-between">
              <span>
                <Translate contentKey={'items.update.relatedAddons'}>Related Addons</Translate>
              </span>
              <span className='flex flex-col gap-2'>
                <div className='flex gap-2 items-center text-xs font-normal'>
                  <div className='h-3 w-3 bg-destructive' />
                  <div>Price Modified</div>
                </div>
                <div className='flex gap-2 items-center text-xs font-normal'>
                  <div className='h-3 w-3 bg-black' />
                  <div>Default Price</div>
                </div>
                <div className='flex gap-2 items-center text-xs font-normal'>
                  <Checkbox
                    checked={(() => {
                      const isChecked = selectedAddonGroup?.excluded?.length === 0;
                      return isChecked;
                    })()}
                    onCheckedChange={checked => handleSelectAllAddons(
                      checked,
                      addonGroups?.findIndex(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id)
                    )}
                  />
                  <div>Select All</div>
                </div>
              </span>
            </Label>
            <div className='border rounded'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">
                      <Translate contentKey={'items.update.name'}>Name</Translate>
                    </TableHead>
                    <TableHead className="text-xs">
                      <Translate contentKey={'items.update.price'}>Price</Translate>
                    </TableHead>
                    <TableHead className="text-xs">
                      <Translate contentKey={'items.update.include'}>Include</Translate>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAddonGroup?.addonGroup.addons?.map((addon, index) => (
                    <TableRow key={index}>
                      <TableCell className='text-xs'>{addon.name}</TableCell>
                      <TableCell className='text-xs'>
                        <Input
                          type="number"
                          value={
                            selectedAddonGroup.addonPriceOverrides?.find(override => override.id === addon.id)?.price != null
                              ? selectedAddonGroup.addonPriceOverrides.find(override => override.id === addon.id).price
                              : addon.price
                          }
                          onChange={e => handleAddonGroupOverridedPriceChange(
                            addonGroups?.findIndex(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id),
                            addon.id,
                            parseFloat(e.target.value) || null
                          )}
                          className={`w-[50px] h-7 text-xs ${selectedAddonGroup.addonPriceOverrides?.find(override => override.id === addon.id)?.price !== null && selectedAddonGroup.addonPriceOverrides?.find(override => override.id === addon.id)?.price !== undefined ? 'text-destructive' : ''}`}
                          step={0.01}
                        />
                      </TableCell>
                      <TableCell className='text-xs'>
                        <Checkbox
                          checked={!addonGroups?.find(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id)?.excluded?.map(excluded => excluded.id).includes(addon.id)}
                          onCheckedChange={checked => handleAddonGroupExcludedChange(
                            checked,
                            addonGroups?.findIndex(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id),
                            addon
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {openedAddonModal && (
        <AddonImportModal
          showModal={openedAddonModal}
          handleSave={handleImportAddonModalSave}
          handleClose={() => { setOpenedAddonModal(false) }}
        />
      )}
    </>
  );
};

export default SharedAddon;
