import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntities } from './supplier.reducer';
// import { exportEntities } from './supplier.reducer'; // TODO: Uncomment when backend is implemented
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { FilterMatchMode } from 'primereact/api';
import { confirmDialog } from 'primereact/confirmdialog';
import { ISupplier } from 'app/shared/model/STOCK/supplier.model';
import ImportButton from 'app/shared/components/data-import/data-import';

const initialState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    email: { value: null, matchMode: FilterMatchMode.CONTAINS },
    address: { value: null, matchMode: FilterMatchMode.CONTAINS },
    phoneNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
  },
};

export const Supplier = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const supplierList = useAppSelector(state => state.supplier.entities);
  const loading = useAppSelector(state => state.supplier.loading);
  const totalItems = useAppSelector(state => state.supplier.totalItems);
  const [searchParam, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParam.get('query')) || initialState;
  // const [selectedSuppliers, setSelectedSuppliers] = useState<ISupplier[]>([]);
  // const [isLoadingAction, setIsLoadingAction] = useState(false);

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      searchEntities({
        query: updatedQuery,
      })
    );
  };

  useEffect(() => {
    getAllEntities();
  }, [searchParam]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const nameColumnTemplate = rowData => {
    const editUrl = `/inventory/supplier/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/inventory/supplier/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/inventory/supplier/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/inventory/supplier/new')
  }

  // TODO: Uncomment export functions when backend is implemented
  // const handleExportSelected = async () => {
  //   setIsLoadingAction(true);
  //   try {
  //     const result = await dispatch(exportEntities(selectedSuppliers.map(supplier => supplier.id)));
  //     const payload = result.payload as any;
  //     
  //     if (payload?.data) {
  //       console.log('Export started:', payload.data);
  //     }
  //   } catch (error) {
  //     console.error('Export failed:', error);
  //   } finally {
  //     setIsLoadingAction(false);
  //     setSelectedSuppliers([]);
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
  //     message: `Are you sure you want to export ${selectedSuppliers.length} selected suppliers?`,
  //     header: 'Export Selected Suppliers',
  //     icon: 'pi pi-exclamation-triangle',
  //     defaultFocus: 'accept',
  //     accept: () => handleExportSelected(),
  //     reject: () => {}
  //   });
  // };

  // const confirmExportAll = () => {
  //   confirmDialog({
  //     message: 'Are you sure you want to export all suppliers?',
  //     header: 'Export All Confirmation',
  //     icon: 'pi pi-exclamation-triangle',
  //     defaultFocus: 'accept',
  //     accept: () => handleExportAll(),
  //     reject: () => {}
  //   });
  // };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'tempApp.supplier.title'}>Suppliers</Translate></span>
      <div className="ms-auto">
        <ImportButton type={'SUPPLIER'} />
        &nbsp;
        <Button label={translate("common.refreshList")} severity="secondary" raised className="me-2" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        {/* TODO: Uncomment export buttons when backend is implemented */}
        {/* <Button label="Export Selected" severity="help" raised className="me-2" onClick={confirmBulkExport} disabled={selectedSuppliers.length === 0 || isLoadingAction}>
          <FontAwesomeIcon icon="download" className="me-1" />
        </Button>
        <Button label="Export All" severity="warning" raised className="me-2" onClick={confirmExportAll} disabled={loading || isLoadingAction}>
          <FontAwesomeIcon icon="file-export" className="me-1" />
        </Button> */}
        <Button label={translate("tempApp.supplier.createNew")} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );

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

  return (
    <div >
      <DataTable
        value={supplierList}
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
        // selection={selectedSuppliers}
        // onSelectionChange={(e) => setSelectedSuppliers(e.value)}
      >
        {/* TODO: Uncomment selection column when export is implemented */}
        {/* <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} /> */}
        <Column field="name" header={translate('common.name')} filter body={nameColumnTemplate} filterPlaceholder={translate('common.search.name')} sortable />
        <Column field="address" header={translate('common.address')}
          filter filterPlaceholder={translate('common.search.address')} sortable />

        <Column field="email" header={translate('common.email')}
          filter filterPlaceholder={translate('common.search.email')} sortable />

        <Column field="phoneNumber" header={translate('common.phone')}
          filter filterPlaceholder={translate('common.search.phone')} sortable />

        <Column header={translate('common.edit')} body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

        <Column header={translate('common.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%', }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


      </DataTable>
    </div>
  );
};

export default Supplier;
