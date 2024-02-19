import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities } from './business-detail.reducer';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { FilterMatchMode } from 'primereact/api';
import { InputText } from 'primereact/inputtext';

export const Business = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const businessDetailList = useAppSelector(state => state.businessDetail.entities);
  const loading = useAppSelector(state => state.businessDetail.loading);
  const totalItems = useAppSelector(state => state.businessDetail.totalItems);

  const [filters, setFilters] = useState({
    firstName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    lastName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    email: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    username: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    phone: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const modifiedbusinessDetailList = businessDetailList.map(user => ({
    ...user,
    name: `${user.firstName} ${user.lastName !== null ? user.lastName : ''}`,
  }));

  console.log(businessDetailList, 'businessDetailList');

  const getBusinessDetails = () => {
    dispatch(getEntities({}));
  };

  useEffect(() => {
    getBusinessDetails();
  }, []);

  const nameColumnTemplate = rowData => {
    const editUrl = `/details/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return <Link to={editUrl}>{rowData.name}</Link>;
  };

  const handleNameFilterChange = e => {
    const filterValue = e.target.value;
    if (filterValue === '') {
      setFilters({
        ...filters,
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
      });
    } else {
      setFilters({
        ...filters,
        name: { value: filterValue, matchMode: FilterMatchMode.CONTAINS },
      });
    }
  };
  const editColumnTemplate = rowData => {
    const editUrl = `/details/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = rowData => {
    const deleteUrl = `/details/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/details/new');
  };

  const activeColumnTemplate = rowData => {
    return rowData.enabled ? <p className="text-success ml-2  ">&#10004;</p> : <p className="text-danger ml-2 ">&#10006;</p>;
  };

  console.log(businessDetailList, 'businessDetailList');
  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Settings</span>
      <div className="ms-auto">
        <Button
          label="Refresh List"
          severity="secondary"
          raised
          className="me-5"
          color="info"
          onClick={getBusinessDetails}
          disabled={loading}
        >
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label="Override Business Setting" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );
  return (

      <div>
        <DataTable
          value={modifiedbusinessDetailList}
          editMode="row"
          header={header}
          paginator
          globalFilterFields={['firstName', 'lastName']}
          loading={loading}
          filters={filters}
          filterDisplay="row"
          totalRecords={totalItems}
          rows={20}
        >
          <Column field="businessName" header="Name" />

          <Column field="slogan" header="Slogan" />

          <Column
            header="Edit"
            body={editColumnTemplate}
            headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
            bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
          />

          {/* <Column  header="Delete" body={deleteColumnTemplate} headerStyle={{ width: '1%',  }} */}
          {/*          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} /> */}
        </DataTable>
      </div>
  );
};

export default Business;
