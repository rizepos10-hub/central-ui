import { Button, Row, Table } from 'reactstrap';
import { getSortState, Translate } from 'react-jhipster';
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
import { IAddonGroup } from 'app/shared/model/ADDON/addon-groups.model';
import { getEntities as getAddonGroups } from 'app/entities/addon-groups/addon-groups.reducer';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { getEntities as getAddonsEntity } from 'app/entities/addon/addon.reducer';
import { OrderList } from 'primereact/orderlist';
import { Dropdown } from 'primereact/dropdown';

type SharedAddonProps = {
  onFieldChange: (field: string, value: IAddon[] | IItem['addonGroups']) => void;
  addons: IAddon[];
  addonGroups: IItem['addonGroups'];
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

const SharedAddon = ({ onFieldChange, addons, addonGroups }: SharedAddonProps) => {
  const currencySettingsEntity = useAppSelector(state => state.currencySettings.entity);

  const dispatch = useAppDispatch();
  const [openedAddonModal, setOpenedAddonModal] = useState(false);
  const [filterAddonState, setFilterAddonState] = useState(initialState);

  const addonOptions = useAppSelector(state => state.addon.entities);
  const loadingAddonOptions = useAppSelector(state => state.addon.loading);
  const addonGroupsOptions = useAppSelector(state => state.addonGroups.entities);
  const loadingAddonGroupsOptions = useAppSelector(state => state.addonGroups.loading);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const handleAddonGroupFilterChange = (selectedGroup: IAddonGroup) => {
    setFilterAddonState(prevState => ({
      ...prevState,
      filters: {
        ...prevState.filters,
        groupId: { value: selectedGroup?.id, matchMode: FilterMatchMode.EQUALS }
      }
    }))
  }
  const handleCheckboxChange = (addonGroupIndex: number) => {
    const updatedAddonGroups = cloneDeep([...addonGroups]);
    updatedAddonGroups[addonGroupIndex].required = !updatedAddonGroups[addonGroupIndex].required;
    onFieldChange('addonGroups', updatedAddonGroups);
  };


  const openImportAddonModal = () => {
    setOpenedAddonModal(true);
  };

  const handleImportAddonModalClose = () => {
    setOpenedAddonModal(false);
  };

  const handleAddonGroupChange = (
    selectedAddonGroup: IAddonGroup,
    actionMeta: ActionMeta<{ id: string; name: string }>
  ) => {
    // const existingAddonGroupsMap = new Map(addonGroups?.map(group => [group.addonGroup?.id, group]));
    // const updatedAddonGroups = selectedAddonGroup.map(selectedGroup => {
    //   const existingGroup = existingAddonGroupsMap.get(selectedGroup?.id);
    //   return {
    //     required: existingGroup ? existingGroup.required : false,
    //     addonGroup: selectedGroup,
    //   };
    // });
    const newGroup = {
      addonGroup: selectedAddonGroup,
      required: false,
    };
    onFieldChange('addonGroups', [...addonGroups, newGroup]);
  };

  const handleAddonChange = (selectedAddon: IAddon) => {
    onFieldChange('addons', [...addons, selectedAddon]);
  };

  const handleImportAddonModalSave = (option: IItem) => {
    const extraAddons = option.addons;
    const uniqueAddonIds = Array.from(new Set([...(addons || []), ...extraAddons].map(addon => addon.id)));
    const mergedAddons = uniqueAddonIds.map(id => [...(addons || []), ...extraAddons].find(addon => addon.id === id));

    const extraAddonGroups = option.addonGroups;
    const uniqueAddonGroupIds = Array.from(
      new Set([...addonGroups.map(group => group.addonGroup.id), ...extraAddonGroups.map(group => group.addonGroup.id)])
    );
    const mergedAddonGroups = uniqueAddonGroupIds.map(id =>
      [...addonGroups, ...extraAddonGroups].find(addonGroup => addonGroup.addonGroup.id === id)
    );

    onFieldChange('addonGroups', mergedAddonGroups);
    onFieldChange('addons', mergedAddons);
  };

  const getAddons = () => {
    const updatedQuery = applyMatchModeMap(filterAddonState);
    dispatch(
      filterEntities({
        query: updatedQuery,
      })
    );
  };

  useEffect(() => {
    getAddons();
  }, [filterAddonState?.filters?.groupId?.value]);

  const handleAddonGroupReorder = (event) => {
    const reorderedAddonGroups = event.value?.map(group => ({
      required: addonGroups.find(g => g.addonGroup.id === group.id)?.required || false,
      addonGroup: group,
    }));
    onFieldChange('addonGroups', reorderedAddonGroups);
  };

  const handleRemoveAddonGroup = (groupId: string) => {
    const updatedAddonGroups = addonGroups.filter(group => group.addonGroup.id !== groupId);
    onFieldChange('addonGroups', updatedAddonGroups);
  };

  const handleRemoveAddon = (addon: string) => {
    const updatedAddons = addons.filter(a => a.id !== addon);
    onFieldChange('addons', updatedAddons);
  };


  const handleAddonReorder = (event) => {
    onFieldChange('addons', event.value);
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
    const [selected, setSelected] = useState(value);

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
        />
        <Button onClick={() => onChange(options?.find(g => g?.id === selected))} color="primary" className='p-1 mr-2'>
          Assign
        </Button>
      </div>
    )
  }

  const selectedAddonGroupIds = addonGroups?.map(group => group.addonGroup.id);

  // Filter out selected addon groups from options
  const filteredAddonGroupsOptions = addonGroupsOptions?.filter(
    option => !selectedAddonGroupIds?.includes(option.id)
  );

  const filteredAddons = addonOptions?.filter(option => !addons?.map(addon => addon.id).includes(option.id));
  return (
    <>
      <Row>
        <div className="">
          <label className={'font-semibold'}>
            <Translate contentKey={'items.update.addonGroups'}>Addon Groups</Translate>
          </label>
          <div className="">
            <OrderList
              value={addonGroups?.map(group => group.addonGroup) || []}
              onChange={handleAddonGroupReorder}
              itemTemplate={(group) => (
                <div className="p-orderlist-item d-flex justify-content-between align-items-center">
                  <span>{group.name}</span>
                  <Button color="danger" size="sm" onClick={() => handleRemoveAddonGroup(group.id)}>
                    X
                  </Button>
                </div>
              )}
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
          <Table>
            <thead>
              <tr>
                <th>
                  <Translate contentKey={'items.update.name'}>Name</Translate>
                </th>
                <th>
                  <Translate contentKey={'items.update.required'}>Required</Translate>
                </th>
              </tr>
            </thead>
            <tbody>
              {addonGroups?.map((group, index) => (
                <tr key={index}>
                  <td>{group?.addonGroup?.name}</td>
                  <td>
                    <Checkbox checked={group?.required} onChange={e => handleCheckboxChange(index)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Row>

      <Row className={'my-3'}>
        <div className="row d-flex flex-column gap-2">
          <div className={'d-flex flex-row gap-4'}>
            <label className={'text-xl font-semibold'}>
              <Translate contentKey={'items.update.filterByGroup'}>Filter by Group</Translate>
            </label>
            <Select
              options={addonGroupsOptions}
              isLoading={loadingAddonGroupsOptions}
              isClearable
              getOptionLabel={option => option?.name}
              getOptionValue={option => option?.id}
              onChange={handleAddonGroupFilterChange}
              onMenuOpen={() => {
                dispatch(getAddonGroups({
                  page: paginationState.activePage - 1,
                  size: paginationState.itemsPerPage,
                  sort: `${paginationState.sort},${paginationState.order}`,
                }))
              }}
            />

            <div className={'d-flex flex-column gap-1 flex-end justify-content-end col-2 pe-0'}>
              <div>
                <Button type="button" onClick={openImportAddonModal}>
                  <Translate contentKey={'items.update.importAddons'}>Import Addons</Translate>
                </Button>
              </div>
            </div>
          </div>
          <div className={'d-flex flex-column gap-2'}>
            <label className={'text-xl font-semibold'}>
              <Translate contentKey={'items.update.addons'}>Addons</Translate>
            </label>

            <OrderList
              value={addons || []}
              onChange={handleAddonReorder}
              itemTemplate={(addon) => (
                <div className="p-orderlist-item d-flex justify-content-between align-items-center">
                  <span>{addon.name}</span>
                  <Button color="danger" size="sm" onClick={() => handleRemoveAddon(addon.id)}>
                    X
                  </Button>
                </div>
              )}
              dragdrop
              dataKey="id"
              header={
                reorderHeader(
                  filteredAddons,
                  handleAddonChange,
                  addons,
                  addonOptions,
                  () => {
                    getAddons()
                  }
                )
              }
            />
          </div>
        </div>
      </Row>
      {openedAddonModal && (
        <AddonImportModal
          showModal={openedAddonModal}
          handleSave={handleImportAddonModalSave}
          handleClose={handleImportAddonModalClose}
        />
      )}
    </>
  );
};

export default SharedAddon;
