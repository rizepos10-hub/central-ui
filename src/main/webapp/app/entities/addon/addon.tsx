import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chip } from 'primereact/chip';
import { FilterMatchMode } from 'primereact/api';
import ImportButton from 'app/shared/components/data-import/data-import';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { filterEntities, exportEntities } from 'app/entities/addon/addon.reducer';
import { Dropdown } from 'primereact/dropdown';
import { getEntities } from 'app/entities/addon-groups/addon-groups.reducer';
import { IAddonGroup } from "app/shared/model/ADDON/addon-groups.model";
import { IProfileGroup } from 'app/shared/model/TAX/profile-group.model';
import { confirmDialog } from 'primereact/confirmdialog';
import { IAddon } from 'app/shared/model/ADDON/addon.model';

const initialState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    groupId: { value: null, matchMode: FilterMatchMode.CONTAINS },
  },
};

// Define action options with edit and move to trash disabled as requested
const actionOptions = [
  { name: 'Edit', code: 'EDIT', disabled: true },
  { name: 'Move To Trash', code: 'MOVE_TO_TRASH', disabled: true },
  { name: 'Export', code: 'EXPORT', disabled: false },
];

export const Addon = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const addonList = useAppSelector(state => state.addon.entities);
  const loading = useAppSelector(state => state.addon.loading);
  const totalItems = useAppSelector(state => state.addon.totalItems);
  const addonGroups = useAppSelector(state => state.addonGroups.entities);
  const loadingGroups = useAppSelector(state => state.addonGroups.loading);
  const [searchParam, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParam.get('query')) || initialState;

  // Bulk actions state
  const [selectedActionOption, setSelectedActionOption] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState<IAddon[]>([]);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      filterEntities({
        query: updatedQuery,
      })
    );
  };

  const handleSyncList = () => {
    getAllEntities();
  };

  useEffect(() => {
    getAllEntities();
  }, [searchParam, query?.rows]);

  useEffect(() => {
    dispatch(
      getEntities({
        page: 0,
        size: 100,
      })
    );
  }, []);

  // Export functionality
  useEffect(() => {
    if (selectedActionOption?.code === "EXPORT") {
      confirmExport();
    }
  }, [selectedActionOption]);

  const confirmExport = () => {
    confirmDialog({
      message: 'Are you sure you want to export selected addons?',
      header: 'Export Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleExportAddons(),
      reject: () => setSelectedActionOption(null)
    });
  };

  const handleExportAddons = async () => {
    setIsLoadingAction(true);
    await dispatch(exportEntities(selectedAddons.map(addon => addon.id))).finally(() => setIsLoadingAction(false));
    setSelectedAddons([]);
    setSelectedActionOption(null);
  };

  // Export All functionality
  const confirmExportAll = () => {
    confirmDialog({
      message: 'Are you sure you want to export all addons?',
      header: 'Export All Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleExportAllAddons(),
    });
  };

  const handleExportAllAddons = async () => {
    setIsLoadingAction(true);
    await dispatch(exportEntities([])).finally(() => setIsLoadingAction(false));
  };

  const onSort = event => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const onFilter = event => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const handleGroupFilter = e => {
    const queryParams = { ...query, filters: { ...query.filters, groupId: { value: e.value, matchMode: FilterMatchMode.EQUALS } } };
    setSearchParams({ query: JSON.stringify(queryParams) }, { replace: true });
  };

  const onPage = event => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const nameColumnTemplate = rowData => {
    const editUrl = `/addon/${rowData.id}/edit`;
    return <Link to={editUrl}>{rowData.name}</Link>;
  };
  const editColumnTemplate = rowData => {
    const editUrl = `/addon/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = rowData => {
    const deleteUrl = `/addon/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/addon/new');
  };

  const addonGroupRowFilterTemplate = () => {
    return (
      <Dropdown
        value={query?.filters?.['groupId']?.value}
        options={addonGroups}
        onChange={handleGroupFilter}
        showFilterClear
        loading={loadingGroups}
        placeholder={translate("common.selectOne")}
        className="p-column-filter"
        showClear
        style={{ minWidth: '12rem' }}
        optionLabel={'name'}
        optionValue={'id'}
      />
    );
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold px-2">
      <Dropdown
          value={selectedActionOption}
          onChange={(e) => setSelectedActionOption(e.value)}
          options={actionOptions}
          optionLabel="name"
          placeholder="Bulk Actions"
          className="w-full md:w-14rem"
          disabled={selectedAddons.length < 1}
          optionDisabled={(option) => option.disabled}
        />
      </span>
      <div className="flex align-items-center gap-2">
        <ImportButton type={'ADDON'} />
        <Button
          icon="pi pi-file-export"
          raised
          onClick={confirmExportAll}
          tooltip="Export All"
          data-pr-position="top"
        />
        <Button
          label={translate('common.refreshList')}
          severity="secondary"
          raised
          className="me-5"
          color="info"
          onClick={handleSyncList}
          disabled={loading}
        >
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate('tempApp.addon.createNewAddon')} raised onClick={handleCreate} disabled={loading}>
        </Button>
      </div>
    </div>
  );
  const renderDiscounts = rowData => {
    const discounts = rowData.discounts || [];
    return discounts.map((discount, index) => (
      <>
        <Chip
          key={index}
          label={discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}
          className="p-mr-2 p-mb-2"
        />
      </>
    ));
  };

  const renderAccountingGroups = rowData => {
    return (
      <>
        {rowData?.accountingGroups?.map((grp: IProfileGroup) =>
          grp.profiles
            ?.map((profile) => (
              <Link key={profile.id} to={`/tax-profiles/${profile.id}/edit`}>
                {profile.name}
              </Link>
            ))
            .reduce((prev, curr) => (
              <>
                {prev} | {curr}
              </>
            ))
        )}
      </>
    );
  };

  return (
    <div>
      <DataTable
        value={addonList}
        loading={loading || isLoadingAction}
        editMode="row"
        header={header}
        removableSort
        filters={query.filters}
        filterDisplay="row"
        paginator
        totalRecords={totalItems}
        rowsPerPageOptions={[10, 20, 30, 40, 50, 100, 200]}
        rows={query?.rows}
        lazy
        first={query.first}
        onPage={onPage}
        onFilter={onFilter}
        filterDelay={500}
        onSort={onSort}
        sortField={query.sortField}
        sortOrder={query.sortOrder}
        showGridlines
        selectionMode='checkbox'
        selection={selectedAddons}
        onSelectionChange={(e) => setSelectedAddons(e.value)}
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>

        <Column
          field="name"
          header={translate('common.name')}
          filter
          body={nameColumnTemplate}
          filterPlaceholder={translate('common.search.name')}
          sortable
        />

        <Column
          field="addonGroups"
          body={(rowData) => rowData?.addonGroups?.map((grp: IAddonGroup) => grp.name).join(" | ")}
          header={translate('tempApp.addon.addonGroups')}
          filter
          filterPlaceholder={translate('tempApp.addon.searchAddonGroups')}
          filterElement={addonGroupRowFilterTemplate}
          showFilterMenu={false}
          sortable
        />

        <Column field="price" header={translate('common.price')} sortable />
        <Column field="discounts" header={translate('common.discounts')} body={renderDiscounts} sortable />
        <Column field="accountingGroups" header={translate('common.taxProfiles')} body={renderAccountingGroups} sortable />

        <Column
          header={translate('common.edit')}
          body={editColumnTemplate}
          headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />

        <Column
          header={translate('common.delete')}
          body={deleteColumnTemplate}
          headerStyle={{ width: '1%' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />
      </DataTable>
    </div>
  );
};

export default Addon;
