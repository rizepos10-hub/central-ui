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
import { searchEntities } from 'app/entities/addon-groups/addon-groups.reducer';
// import { exportEntities } from 'app/entities/addon-groups/addon-groups.reducer'; // TODO: Uncomment when backend is implemented
// import { confirmDialog } from 'primereact/confirmdialog';
// import { IAddonGroup } from 'app/shared/model/ADDON/addon-groups.model';

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

export const AddonGroups = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const addonList = useAppSelector(state => state.addonGroups.entities);
  const loading = useAppSelector(state => state.addonGroups.loading);
  const totalItems = useAppSelector(state => state.addonGroups.totalItems);
  const [searchParam, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParam.get('query')) || initialState;
  // const [selectedAddonGroups, setSelectedAddonGroups] = useState<IAddonGroup[]>([]);
  // const [isLoadingAction, setIsLoadingAction] = useState(false);

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      searchEntities({
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

  const onPage = event => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const nameColumnTemplate = rowData => {
    const editUrl = `/addon-groups/${rowData.id}/edit`;
    return <Link to={editUrl}>{rowData.name}</Link>;
  };
  const editColumnTemplate = rowData => {
    const editUrl = `/addon-groups/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = rowData => {
    const deleteUrl = `/addon-groups/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/addon-groups/new');
  };

  // TODO: Uncomment export functions when backend is implemented
  // const handleExportSelected = async () => {
  //   setIsLoadingAction(true);
  //   try {
  //     const result = await dispatch(exportEntities(selectedAddonGroups.map(group => group.id)));
  //     const payload = result.payload as any;
  //     
  //     if (payload?.data) {
  //       console.log('Export started:', payload.data);
  //     }
  //   } catch (error) {
  //     console.error('Export failed:', error);
  //   } finally {
  //     setIsLoadingAction(false);
  //     setSelectedAddonGroups([]);
  //   }
  // };

  // const handleExportAll = async () => {
  //   setIsLoadingAction(true);
  //   try {
  //     const result = await dispatch(exportEntities([]));
  //     const payload = result.payload as any;
  //     
  //     if (payload?.data) {
  //       console.log('Export all started:', payload.data);
  //     }
  //   } catch (error) {
  //     console.error('Export all failed:', error);
  //   } finally {
  //     setIsLoadingAction(false);
  //   }
  // };

  // const confirmBulkExport = () => {
  //   confirmDialog({
  //     message: `Are you sure you want to export ${selectedAddonGroups.length} selected addon groups?`,
  //     header: 'Export Selected Addon Groups',
  //     icon: 'pi pi-exclamation-triangle',
  //     defaultFocus: 'accept',
  //     accept: () => handleExportSelected(),
  //     reject: () => {}
  //   });
  // };

  // const confirmExportAll = () => {
  //   confirmDialog({
  //     message: 'Are you sure you want to export all addon groups?',
  //     header: 'Export All Confirmation',
  //     icon: 'pi pi-exclamation-triangle',
  //     defaultFocus: 'accept',
  //     accept: () => handleExportAll(),
  //     reject: () => {}
  //   });
  // };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">
        <Translate contentKey={'common.addonGroups'}>Addon Groups</Translate>
      </span>
      <div className="ms-auto">
        <ImportButton type={'ADDON_GROUPS'} />
        &nbsp;
        <Button
          label={translate('common.refreshList')}
          severity="secondary"
          raised
          className="me-2"
          color="info"
          onClick={handleSyncList}
          disabled={loading}
        >
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        {/* TODO: Uncomment export buttons when backend is implemented */}
        {/* <Button label="Export Selected" severity="help" raised className="me-2" onClick={confirmBulkExport} disabled={selectedAddonGroups.length === 0 || isLoadingAction}>
          <FontAwesomeIcon icon="download" className="me-1" />
        </Button>
        <Button label="Export All" severity="warning" raised className="me-2" onClick={confirmExportAll} disabled={loading || isLoadingAction}>
          <FontAwesomeIcon icon="file-export" className="me-1" />
        </Button> */}
        <Button label={translate('tempApp.addonGroup.createNewAddonGroup')} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <DataTable
        value={addonList}
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
        loading={loading}
        onSort={onSort}
        sortField={query.sortField}
        sortOrder={query.sortOrder}
        showGridlines
        // TODO: Uncomment selection when export is implemented
        // selectionMode="checkbox"
        // selection={selectedAddonGroups}
        // onSelectionChange={(e) => setSelectedAddonGroups(e.value)}
      >
        {/* TODO: Uncomment selection column when export is implemented */}
        {/* <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} /> */}
        <Column
          field="name"
          header={translate('common.name')}
          filter
          body={nameColumnTemplate}
          filterPlaceholder={translate('common.search.name')}
          sortable
        />

        <Column
          field="addons"
          header={translate('tempApp.addon.addons')}
          body={(rowData) => rowData.addons?.map(addon => addon.name).join(" | ")}
        />

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

export default AddonGroups;
