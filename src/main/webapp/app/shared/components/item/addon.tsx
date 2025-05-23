import { Button, Col, Row, Table } from 'reactstrap';
import { getSortState, translate, Translate } from 'react-jhipster';
import Select, { ActionMeta, MultiValue } from 'react-select';
import React, { useEffect, useState } from 'react';
import { IAddon } from 'app/shared/model/ADDON/addon.model';
import AddonImportModal from 'app/shared/components/item/addon-import-modal';
import { Checkbox } from 'primereact/checkbox';
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
import { OrderList } from 'primereact/orderlist';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { IAddonPriceOverride } from 'app/shared/model/ADDON/addon-price-override';
import { InputText } from 'primereact/inputtext';

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
  // const [filterAddonState, setFilterAddonState] = useState(initialState);

  const addonOptions = useAppSelector(state => state.addon.entities);
  // const loadingAddonOptions = useAppSelector(state => state.addon.loading);
  const addonGroupsOptions = useAppSelector(state => state.addonGroups.entities);
  // const loadingAddonGroupsOptions = useAppSelector(state => state.addonGroups.loading);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [selectedAddonGroup, setSelectedAddonGroup] = useState<IAddonGroups>();


  // const handleAddonGroupFilterChange = (selectedGroup: IAddonGroup) => {
  //   setFilterAddonState(prevState => ({
  //     ...prevState,
  //     filters: {
  //       ...prevState.filters,
  //       groupId: { value: selectedGroup?.id, matchMode: FilterMatchMode.EQUALS }
  //     }
  //   }))
  // }

  const openImportAddonModal = () => {
    setOpenedAddonModal(true);
  };

  // const handleImportAddonModalClose = () => {
  //   setOpenedAddonModal(false);
  // };


  // const handleImportAddonModalSave = (option: IItem) => {
  //   const extraAddons = option.addons;
  //   const uniqueAddonIds = Array.from(new Set([...(addons || []), ...extraAddons].map(addon => addon.id)));
  //   const mergedAddons = uniqueAddonIds.map(id => [...(addons || []), ...extraAddons].find(addon => addon.id === id));

  //   const extraAddonGroups = option.addonGroups;
  //   const uniqueAddonGroupIds = Array.from(
  //     new Set([...addonGroups.map(group => group.addonGroup.id), ...extraAddonGroups.map(group => group.addonGroup.id)])
  //   );
  //   const mergedAddonGroups = uniqueAddonGroupIds.map(id =>
  //     [...addonGroups, ...extraAddonGroups].find(addonGroup => addonGroup.addonGroup.id === id)
  //   );

  //   onFieldChange('addonGroups', mergedAddonGroups);
  //   onFieldChange('addons', mergedAddons);
  // };

  // const getAddons = () => {
  //   const updatedQuery = applyMatchModeMap(filterAddonState);
  //   dispatch(
  //     filterEntities({
  //       query: updatedQuery,
  //     })
  //   );
  // };

  // useEffect(() => {
  //   getAddons();
  // }, [filterAddonState?.filters?.groupId?.value]);



  // const handleAddonChange = (selectedAddon: IAddon) => {
  //   onFieldChange('addons', [...addons, selectedAddon]);
  // };

  // const handleRemoveAddon = (addon: string) => {
  //   const updatedAddons = addons.filter(a => a.id !== addon);
  //   onFieldChange('addons', updatedAddons);
  // };

  // const handleAddonOverridedPriceChange = (addonId, price) => {
  //   const updatedAddonPriceOverrides = [...addonPriceOverrides];
  //   const index = updatedAddonPriceOverrides.findIndex(override => override.id === addonId);
  //   if (price !== null && price !== undefined && price !== '') {
  //     if (index >= 0) {
  //       // Update existing price override
  //       updatedAddonPriceOverrides[index].price = price;
  //     } else {
  //       // Add new price override
  //       updatedAddonPriceOverrides.push({ id: addonId, price });
  //     }
  //   } else {
  //     // Remove price override if price is empty or null
  //     if (index >= 0) {
  //       updatedAddonPriceOverrides.splice(index, 1);
  //     }
  //   }



  // const handleAddonReorder = (event) => {
  //   onFieldChange('addons', event.value);
  // };

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

    // Ensure addonGroups is an array
    const updatedAddonGroups = Array.isArray(addonGroups) ? addonGroups : [];

    // Add the new group
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
    console.log(value)
    const updatedAddonGroups = [...addonGroups];
    console.log(updatedAddonGroups)
    const updatedItem = {
      ...updatedAddonGroups[addonGroupIndex],
      [fieldName]: value,
    };
    console.log(updatedItem)

    updatedAddonGroups[addonGroupIndex] = updatedItem;
    onFieldChange('addonGroups', updatedAddonGroups);
  };

  useEffect(() => {
    const updatedAddonGroups = addonGroups?.map(addonGroup => {
      const isRequired = addonGroup.minQuantity > 0;
      // Only update if 'required' has changed
      if (addonGroup.required !== isRequired) {
        return {
          ...addonGroup,
          required: isRequired,
        };
      }
      return addonGroup;
    });

    // Check if any changes were made
    const hasChanged = updatedAddonGroups.some((group, index) => group !== addonGroups[index]);

    if (hasChanged) {
      onFieldChange('addonGroups', updatedAddonGroups);
    }
  }, [addonGroups]);


  const handleAddonGroupExcludedChange = (
    e,
    addonGroupIndex: number,
    value: IAddon,
  ) => {
    const updatedAddonGroups = [...addonGroups];

    const updatedItem: IAddonGroups = {
      ...updatedAddonGroups[addonGroupIndex],
      excluded: !e.checked
        ? [...updatedAddonGroups[addonGroupIndex].excluded, value]
        : updatedAddonGroups[addonGroupIndex].excluded.filter(
          item => item.id !== value.id
        ),
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
        // Update existing price override without mutating the original object
        updatedAddonPriceOverrides[index] = { ...updatedAddonPriceOverrides[index], price };
      } else {
        // Add new price override
        updatedAddonPriceOverrides.push({ id: addonId, price });
      }
    } else {
      // Remove price override if price is empty or null
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
      <div className='d-flex gap-2 align-items-center'>
        <Dropdown
          value={selected}
          onChange={e => setSelected(e.value)}
          options={data}
          placeholder=""
          className="w-full md:w-14rem"
          onFocus={onFocus}
          optionLabel={'name'}
          optionValue={'id'}
          filter
        />
        <Button
          disabled={!selected}
          onClick={() => {
            onChange(options?.find(g => g?.id === selected))
            setSelected(null)
          }}
          color="primary"
          className='p-1 mr-2'
        >
          Assign
        </Button>
        <div className={'d-flex flex-column gap-1 flex-end justify-content-end col-2 pe-0'}>
          <div>
            <Button type="button" onClick={openImportAddonModal}>
              <Translate contentKey={'items.update.importAddons'}>Import</Translate>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const selectedItemAddonGroupIds = item?.addonGroups?.map(group => group.addonGroup.id) ?? [];
  const selectedVariantAddonGroupIds = item?.variants?.flatMap(variant => variant.addonGroups?.map(group => group.addonGroup.id) ?? []) ?? [];
  const allSelectedAddonGroupIds = [...selectedItemAddonGroupIds, ...selectedVariantAddonGroupIds];

  const filteredAddonGroupsOptions = addonGroupsOptions?.filter(
    option => !allSelectedAddonGroupIds.includes(option.id)
  );


  const handleImportAddonModalSave = (groups: IAddonGroups[]) => {
    const newAddonGroups = [...groups];

    onFieldChange('addonGroups', newAddonGroups);
    setOpenedAddonModal(false);
  }

  return (
    <>
      <Row>
        <Col md={6}>
          <label className={'font-semibold'}>
            <Translate contentKey={'items.update.addonGroups'}>Addon Groups</Translate>
          </label>
          <div>
            <OrderList
              value={addonGroups?.map(group => group.addonGroup) || []}
              onChange={handleAddonGroupReorder}
              style={{ padding: '0px' }}
              listStyle={{ padding: '0px' }}
              itemTemplate={(addonGroup: IAddonGroup) => {
                const index = addonGroups?.findIndex(group => group.addonGroup.id === addonGroup.id);

                return (
                  <div
                    className="p-orderlist-item d-flex gap-2 align-items-end p-0"
                    onClick={() => setSelectedAddonGroup(addonGroups[index])}
                  >
                    <span className='d-flex flex-column gap-1'>
                      <label>{addonGroup?.name}</label>
                      <InputText
                        value={addonGroups[index]?.name ?? addonGroup?.name}
                        onChange={e => handleAddonGroupFieldChange(index, 'name', e.target.value)}
                        style={{ width: '120px' }}
                        onKeyDown={(e) => {
                          if (e.key === ' ') {
                            e.stopPropagation();
                          }
                        }}
                      />
                    </span>
                    <span className='d-flex gap-1'>
                      <span className='d-flex flex-column gap-1'>
                        <label>{translate('items.update.min')}</label>
                        <InputNumber
                          value={addonGroups[index]?.minQuantity}
                          onChange={e => {
                            handleAddonGroupFieldChange(index, 'minQuantity', e.value)
                          }}
                          max={addonGroups?.[index]?.addonGroup?.addons?.length}
                          inputStyle={{ width: '40px' }}
                        />
                      </span>
                      <span className='d-flex flex-column gap-1'>
                        <label>{translate('items.update.max')}</label>
                        <InputNumber
                          value={addonGroups[index]?.maxQuantity}
                          onChange={e => handleAddonGroupFieldChange(index, 'maxQuantity', e.value)}
                          max={addonGroups?.[index]?.addonGroup?.addons?.length}
                          inputStyle={{ width: '40px' }}
                        />
                      </span>
                    </span>
                    {/* <span className='d-flex flex-column gap-1'>
                      <label>{translate('items.update.required')}</label>
                      <Checkbox
                        checked={addonGroups[index]?.required}
                        onChange={e => handleAddonGroupFieldChange(index, 'required', e.checked)}
                      />
                    </span> */}
                    <span className='d-flex flex-column gap-1'>
                      <label>{translate('items.update.addAutomatically')}</label>
                      <Checkbox
                        checked={addonGroups[index]?.addAutomatically}
                        onChange={e => handleAddonGroupFieldChange(index, 'addAutomatically', e.checked)}
                      />
                    </span>
                    <Button color="danger" size="sm" onClick={(e) => handleRemoveAddonGroup(e, addonGroup.id)}>
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
              dragdrop
              dataKey="id"
            />
          </div>
        </Col>
        {selectedAddonGroup && (
          <Col md={6}>
            <label className={'font-semibold d-flex justify-content-between'}>
              <span>
                <Translate contentKey={'items.update.relatedAddons'}>Related Addons</Translate>
              </span>
              <span className='d-flex flex-column gap-2'>
                <div className='d-flex gap-2 align-items-center'>
                  <div style={{
                    height: '12px',
                    width: '12px',
                    backgroundColor: 'red'
                  }} />
                  <div>
                    Price Modified
                  </div>
                </div>
                <div className='d-flex gap-2 align-items-center'>
                  <div style={{
                    height: '12px',
                    width: '12px',
                    backgroundColor: 'black'
                  }} />
                  <div>
                    Default Price
                  </div>
                </div>
              </span>
            </label>
            <div className='border'>
              <Table>
                <thead>
                  <tr>
                    <th>
                      <Translate contentKey={'items.update.name'}>Name</Translate>
                    </th>
                    <th>
                      <Translate contentKey={'items.update.price'}>Price</Translate>
                    </th>
                    <th>
                      <Translate contentKey={'items.update.include'}>Include</Translate>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAddonGroup?.addonGroup.addons?.map((addon, index) => (
                    <tr key={index}>
                      <td className='align-content-center'>{addon.name}</td>
                      <td className='align-content-center'>
                        <InputNumber
                          value={selectedAddonGroup.addonPriceOverrides?.find(override => override.id === addon.id)?.price || addon.price}
                          onChange={e => handleAddonGroupOverridedPriceChange(
                            addonGroups?.findIndex(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id),
                            addon.id,
                            e.value
                          )}
                          inputStyle={{
                            width: '50px',
                            color: selectedAddonGroup.addonPriceOverrides?.find(override => override.id === addon.id)?.price ? 'red' : 'black'
                          }}
                          mode="decimal"
                          minFractionDigits={2}
                          maxFractionDigits={2}
                        />
                      </td>
                      <td className='align-content-center'>
                        <Checkbox
                          checked={!addonGroups?.find(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id)?.excluded?.map(excluded => excluded.id).includes(addon.id)}
                          onChange={e => handleAddonGroupExcludedChange(
                            e,
                            addonGroups?.findIndex(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id),
                            addon
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Col>
        )}
      </Row>

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
