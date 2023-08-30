import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

// import { ITax } from 'app/shared/model/tax.model';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {Button} from "primereact/button";
import {FilterMatchMode} from "primereact/api";
import {InputText} from "primereact/inputtext";
import AddTaxModal from "app/modules/administration/settings/AddTaxtModal";

export const Tax = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  // const taxList = useAppSelector(state => state.tax.entities);
  // const loading = useAppSelector(state => state.tax.loading);
  // const totalItems = useAppSelector(state => state.tax.totalItems);
  //
  const loading = false


  const [isModalVisible, setModalVisible] = useState(false);

  const handleCreate = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const dummyTaxData = [
    {
      id: 1,
      code: 'TAX001',
      description: 'Dummy Tax 1',
      rate: 10,
      taxInclusive: true,
    },
    {
      id: 2,
      code: 'TAX002',
      description: 'Dummy Tax 2',
      rate: 15,
      taxInclusive: false,
    },
  ];


  const [filters, setFilters] = useState({
    code: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    description: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    taxInclusive: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    rate: { value: null, matchMode: FilterMatchMode.STARTS_WITH },

  });



  // console.log(taxList,'taxList')





  const getTaxs = () => {

  };


  useEffect(() => {
    getTaxs()
  }, []);






  const nameColumnTemplate = (rowData) => {
    const editUrl = `/tax/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };

  const handleNameFilterChange = (e) => {
    const filterValue = e.target.value;
    if (filterValue === '') {
      setFilters({
        ...filters,
        code: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
      });
    } else {
      setFilters({
        ...filters,
        code: { value: filterValue, matchMode: FilterMatchMode.CONTAINS },
      });
    }
  };
  // const editColumnTemplate = (rowData) => {
  //   const editUrl = `/tax/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
  //   return (
  //     <Link to={editUrl}>
  //       <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
  //     </Link>
  //   );
  // };
  //
  // const deleteColumnTemplate = (rowData) => {
  //   const deleteUrl = `/tax/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
  //   return (
  //     <Link to={deleteUrl}>
  //       <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
  //     </Link>
  //   );
  // };


  const activeColumnTemplate = rowData => {
    return rowData.taxInclusive ?<p className="text-success ml-2  ">&#10004;</p>:
      <p className="text-danger ml-2 ">&#10006;</p>
  };


  // console.log(taxList, 'taxList')
  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Taxs</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={getTaxs} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label="Create new Tax" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );
  return (
    <div>
      <h2 >
        Taxs View

      </h2>

      <div >
        <DataTable value={dummyTaxData} editMode="row" header={header}  paginator filters={filters} filterDisplay="row" totalRecords={dummyTaxData.length} rows={5}>
          <Column
            field="code" header="Code" filter
            filterElement={ <InputText  placeholder="Search by name" onChange={handleNameFilterChange}/> }
            filterField="code"  sortable
          />

          <Column field="description" header="Description" filter filterPlaceholder="Search by taxname"  sortable   />

          <Column field="rate" header="Rate" filter filterPlaceholder="Search by email"  sortable   />

          <Column header="Tax Inclusive" body={activeColumnTemplate} style={{width: '10%'}}   />


        </DataTable>
        <AddTaxModal visible={isModalVisible} onHide={handleCloseModal} />
      </div>
    </div>
  );
};

export default Tax;
