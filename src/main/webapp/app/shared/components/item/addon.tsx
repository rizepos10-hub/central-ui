import { Button, Row, Table } from 'reactstrap';
import { Translate } from 'react-jhipster';
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
  const dispatch = useAppDispatch();
  const [openedAddonModal, setOpenedAddonModal] = useState(false);
  const [filterAddonState, setFilterAddonState] = useState(initialState);

  const restaurantItemsOptions = useAppSelector(state => state.restaurantItems.entities);
  const addonOptions = useAppSelector(state => state.addon.entities);
  const loadingAddonOptions = useAppSelector(state => state.addon.loading);
  const addonGroupsOptions  = useAppSelector(state => state.addonGroups.entities);
  const loadingAddonGroupsOptions  = useAppSelector(state => state.addonGroups.loading);



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
    selectedAddonGroups: MultiValue<{ id: string; name: string }>,
    actionMeta: ActionMeta<{ id: string; name: string }>
  ) => {
    const existingAddonGroupsMap = new Map(addonGroups?.map(group => [group.addonGroup?.id, group]));
    const updatedAddonGroups = selectedAddonGroups.map(selectedGroup => {
      const existingGroup = existingAddonGroupsMap.get(selectedGroup?.id);
      return {
        required: existingGroup ? existingGroup.required : false,
        addonGroup: selectedGroup,
      };
    });
    onFieldChange('addonGroups', updatedAddonGroups);
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

  return (
    <>
      <Row>
        <div className="">
          <label className={'font-semibold'}>
            <Translate contentKey={'items.update.addonGroups'}>Addon Groups</Translate>
          </label>
          <div className="">
            <Select
              isMulti={true}
              value={addonGroups?.map(group => ({
                id: group?.addonGroup?.id,
                name: group?.addonGroup?.name,
              }))}
              getOptionLabel={option => option?.name}
              getOptionValue={option => option?.id}
              options={addonGroupsOptions}
              onChange={handleAddonGroupChange}
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
        <div className="row">
          <div className={'d-flex flex-row gap-4'}>
            <div className={'d-flex flex-column gap-2 col-3'}>
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
              />
            </div>
            <div className={'d-flex flex-column gap-2 col-5'}>
              <label className={'text-xl font-semibold'}>
                <Translate contentKey={'items.update.addons'}>Addons</Translate>
              </label>
              <Select
                value={addons}
                isMulti={true}
                isLoading={loadingAddonOptions}
                isDisabled={loadingAddonOptions}
                options={addonOptions}
                getOptionLabel={option => option.name}
                getOptionValue={option => option.id}
                onChange={selectedAddons => onFieldChange('addons', selectedAddons as IAddon[])}
              />
            </div>
            <div className={'d-flex flex-column gap-1 flex-end justify-content-end col-2 pe-0'}>
              <div>
                <Button type="button" onClick={openImportAddonModal}>
                  <Translate contentKey={'items.update.importAddons'}>Import Addons</Translate>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Row>
      {openedAddonModal && (
        <AddonImportModal
          showModal={openedAddonModal}
          handleSave={handleImportAddonModalSave}
          handleClose={handleImportAddonModalClose}
          itemOptions={restaurantItemsOptions}
        />
      )}
    </>
  );
};

export default SharedAddon;
