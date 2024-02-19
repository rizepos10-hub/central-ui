import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntities, getEntities } from './tax.reducer';
import {Button as ReactStrapButton } from "reactstrap";
// import { ITax } from 'app/shared/model/tax.model';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {Button} from "primereact/button";
import {FilterMatchMode} from "primereact/api";
import {InputText} from "primereact/inputtext";
import AddTaxModal from "app/entities/settings/taxes/add-tax-modal";

export const Tax = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const taxList = useAppSelector(state => state.tax.entities);
  const loading = useAppSelector(state => state.tax.loading);
  const totalItems = useAppSelector(state => state.tax.totalItems);


  console.log(taxList, 'lol')



  const [isModalVisible, setModalVisible] = useState(false)

  const [selectedTaxId, setSelectedTaxId] = useState(null);


  const handleCreate = () => {
    setSelectedTaxId(null)

    setModalVisible(true);
  };

  console.log("Selected Tax ID:", selectedTaxId);
  console.log("Modal Visibility:", isModalVisible);

  const handleEdit = (id) => {
    setModalVisible(true);
    setSelectedTaxId(id)
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };



  const [filters, setFilters] = useState({
    code: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    description: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    value: { value: null, matchMode: FilterMatchMode.STARTS_WITH },

  });



  // console.log(taxList,'taxList')





  const getTaxes = () => {
  dispatch(getEntities({}))
  };


  useEffect(() => {
    getTaxes()
  }, []);






  const codeColumnTemplate = (rowData) => {
    return (
      <Link to={'#'} onClick={() => handleEdit(rowData.id)} >
        {rowData.code}
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
  const editColumnTemplate = (rowData) => {
    return (
      <ReactStrapButton raised onClick={() => handleEdit(rowData.id)} disabled={loading}>

        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </ReactStrapButton>
    );
  };

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
      <span className="text-xl text-900 font-bold">Taxes</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={getTaxes} disabled={loading}>
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

        <DataTable value={taxList} editMode="row" header={header}  paginator filters={filters} filterDisplay="row" totalRecords={totalItems} rows={20}>
          <Column
            field="code" header="Code" filter
            body={codeColumnTemplate}
            filterElement={ <InputText  placeholder="Search by Code" onChange={handleNameFilterChange}/> }
            filterField="code"  sortable
          />
          <Column field="value" header="Value" filter filterPlaceholder="Search by value"  sortable   />

          <Column field="description" header="Description"   sortable   />


          {/* <Column header="Tax Inclusive" body={activeColumnTemplate} style={{width: '10%'}}   /> */}

          <Column header="Edit"  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          {/* <Column  header="Delete" body={deleteColumnTemplate} headerStyle={{ width: '1%',  }} */}
          {/*          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} /> */}
        </DataTable>
        {isModalVisible && <AddTaxModal visible={isModalVisible} onHide={handleCloseModal} taxId={selectedTaxId}/>}
      </div>
  );
};

export default Tax;
