import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import {  getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {  filterFloorPlans } from './floor-plan.reducer';
import {DataTable, DataTableFilterMeta, DataTableFilterMetaData} from "primereact/datatable";
import {Column, ColumnFilterElementTemplateOptions} from "primereact/column";
import {FilterMatchMode} from "primereact/api";
import {IFloorPlan} from "app/shared/model/floor-plan.model";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {InputText} from "primereact/inputtext";
import {Dropdown} from "primereact/dropdown";
import {format} from "date-fns";
import {DataTableLazyModel} from "app/shared/model/enumerations/data-table-lazy.model";
import {TriStateCheckbox, TriStateCheckboxChangeEvent} from "primereact/tristatecheckbox";
import {classNames} from "primereact/utils";
import {DropdownItem} from "reactstrap";
import {isBoolean} from "lodash";


interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: 0 | 1 | -1 | null;
  filters: DataTableFilterMeta;
}

export const FloorPlan = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [lazyState, setLazyState] = useState<any>({
    first: 0,
    rows: 10,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      name:{value: '', matchMode: 'startsWith'},
      branch: { value: '', matchMode: 'equals' },
      active: { value: null, matchMode: FilterMatchMode.EQUALS },
    }});

  const floorPlanList :IFloorPlan[] = useAppSelector(state => state.floorPlan.entities);
  const loading = useAppSelector(state => state.floorPlan.loading);
  const totalItems = useAppSelector(state => state.floorPlan.totalItems);
  const branchList = useAppSelector(state => state.branch.entities);





  const filteredBranchOptions = branchList
    .map((branch) => ({
      label: branch.name,
      value: branch.id,
    }));

  const filterBranchElement = () => (
    <Dropdown
      value={(lazyState.filters.branch as DataTableFilterMetaData)?.value || ''}

      options={filteredBranchOptions}
      onChange={(e) => {
        const selectedBranchId = e.value;
        setLazyState((prevState) => ({
          ...prevState,
          filters: {
            ...prevState.filters,
            branch: { value: selectedBranchId, matchMode: 'equals' } ,
          },
        }));
      }}
      placeholder="Select a branch"
    />);


  // const filteredActiveOptions: {label: string, value: null | boolean}[] = [{ label: "active", value: null}];
  //
  // const filteractiveElement = () => (
  //   <Dropdown
  //     value={(lazyState.filters.active as DataTableFilterMetaData)?.value || ''}
  //
  //     options={filteredBranchOptions}
  //     onChange={(e) => {
  //       const selectedBranchId = e.value;
  //       setLazyState((prevState) => ({
  //         ...prevState,
  //         filters: {
  //           ...prevState.filters,
  //           branch: { value: selectedBranchId, matchMode: 'equals' } ,
  //         },
  //       }));
  //     }}
  //     placeholder="Select a branch"
  //   />)
  // const activeColumnTemplate = rowData => {
  //   return rowData.active ?<p className="text-success ml-2  ">&#10004;</p>:
  //     <p className="text-danger ml-2 ">&#10006;</p>
  // };



  useEffect(() => {
    handleSyncList()

  },[lazyState])

  const onFilter = (event) => {
    event['first'] = 0;
    setLazyState(event);
  };





  const onSort = (event) => {
    console.log(event, 'event');
    const sortField = event.sortField;
    const sortOrder = event.sortOrder;
    setLazyState((prev) => ({
      ...prev,
      first: 10,
      sortField: sortField,
      sortOrder: sortOrder,
    }));
  };
  const onPage = (event) => {
    setLazyState(event);
  };







  const handleSyncList = () => {
    const queryParams = {
      first: lazyState.first,
      page: lazyState.page ,
      size: lazyState.rows ,
      filters: {}
    };
    if (lazyState.filters.branch?.value) {
      queryParams.filters['branch.id'] = {
        value: lazyState.filters.branch.value,
        matchMode: DataTableLazyModel[lazyState.filters.branch.matchMode],
      };
    }

    if (lazyState.filters.name?.value) {
      queryParams.filters['name'] = {
        value: lazyState.filters.name.value,
        matchMode: DataTableLazyModel[lazyState.filters.name.matchMode],
      };
    }
    if (isBoolean(lazyState.filters.active?.value)) {
      queryParams.filters['active'] = {
        value: lazyState.filters.active.value,
        matchMode: DataTableLazyModel[lazyState.filters.active.matchMode],
      };
    }
    dispatch(filterFloorPlans(queryParams));
    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`
    }))
  };


console.log("floorPlanList", floorPlanList)


  const nameColumnTemplate = rowData => {
    const editUrl = `/floor-plan/${rowData.id}/manage?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };


  const verifiedBodyTemplate = (rowData) => {
    console.log(rowData, 'hello')
    return <i className={classNames('pi', { 'text-green-500 pi-check-circle': rowData.active, 'text-red-500 pi-times-circle': !rowData.active })}></i>;
  };

  const verifiedFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
    console.log(options, 'lollol');

    const handleDropdownChange = (e) => {
      setLazyState((prev) => ({
        ...prev,
        filters: {
          ...prev.filters,
          active: { value: e.value, matchMode: 'equals' },
        },
      }));

    };

    const dropdownItems = [
      { label: 'All', value: null },
      { label: 'Active', value: true },
      { label: 'Not Active', value: false },
    ];

    return (
        <Dropdown
          options={dropdownItems}
          value={lazyState?.filters?.active?.value}
          onChange={handleDropdownChange}
          placeholder={"Filter by active"}
        />
    );
  };

  const manageColumnTemplate = (rowData) => {
    const editUrl = `/floor-plan/${rowData.id}/manage?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        Manage
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/floor-plan/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/floor-plan/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/floor-plan/new')
  }
  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Floor Plans</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label="Add New Floor Plan" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );




  return (
    <div>
      <h2 >
        Floor Plans View
      </h2>

      <div >
        <DataTable
          value={floorPlanList}
          lazy
          filterDisplay="row"
          dataKey="id"
          paginator
          header={header}
          first={lazyState.first}
          rows={20}
          totalRecords={totalItems}
          onPage={onPage}
          onSort={onSort}
          sortOrder={lazyState.sortOrder}
          sortField={lazyState.sortField}
          filters={lazyState.filters}
          onFilter={onFilter}
          loading={loading}
          removableSort
          emptyMessage="No Floor Plans Found"
          tableStyle={{ minWidth: '75rem' , alignContent: 'center'}}
        >
          <Column field="name" header="Name" filter body={nameColumnTemplate} filterPlaceholder={"Search by name"}  sortable  />

          <Column sortable filter header="Branch" showFilterMenu={false} filterElement={filterBranchElement} body={(data) => (data.branch?.name)} />

          <Column header="Active" field={"active"} body={verifiedBodyTemplate} showFilterMatchModes={false}
                  dataType="boolean" bodyClassName="text-center" style={{width: '10%'}} filter filterElement={verifiedFilterTemplate}  />

          <Column header="Manage"  body={manageColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />
          <Column header="Edit"  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header="Delete" body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />



        </DataTable>
      </div>
    </div>
  );
};

export default FloorPlan;
