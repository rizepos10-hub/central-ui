import React, {  useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from 'primereact/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {FilterMatchMode} from "primereact/api";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import { filterEntities } from "app/entities/brand/brand.reducer";
import ImageDisplay from "app/shared/components/image/image-display";
import { translate } from "react-jhipster";



const initialState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  }
};


export const Brand = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();


  const brandList = useAppSelector(state => state.brand.entities);
  const loading = useAppSelector(state => state.brand.loading);
  const totalItems = useAppSelector(state => state.brand.totalItems);
  const [searchParam, setSearchParams]=  useSearchParams();
  const query = JSON.parse(searchParam.get("query")) || initialState;




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
  }, [searchParam]);




  const onSort = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true})
  };


  const onFilter  = (event: any) => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true});
  }



  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true})
  };



  const nameColumnTemplate = rowData => {
    const editUrl = `/brand/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };

  const editColumnTemplate = (rowData) => {
    const editUrl = `/brand/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/brand/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };

  const handleCreate = () => {
    navigate('/brand/new')
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">
        {translate("tempApp.brand.home.title")}
      </span>
      <div className="ms-auto">
        <Button label={translate("common.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate("tempApp.brand.createTitle")} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );






  return (
    <div>

      <DataTable
        value={brandList} editMode="row" header={header} removableSort  filters={query.filters} filterDisplay="row"
        paginator totalRecords={totalItems} rows={20} lazy  first={query.first}  onPage={onPage} onFilter={onFilter}
        filterDelay={500}
        onSort={onSort} sortField={query.sortField} sortOrder={query.sortOrder} showGridlines
      >
        <Column
          field="name"
          header={translate("tempApp.brand.name")}
          filter
          body={nameColumnTemplate}
          filterPlaceholder={translate("tempApp.brand.searchByName")}
          sortable
        />

        <Column
          header={translate("tempApp.brand.image")}
          body={rowData => (
            <ImageDisplay
              imageType={'product'}
              imageUrl={rowData?.logo?.url}
              height={50}
              width={50}
            />
          )}
        />


        <Column
          header={translate("common.edit")}
          body={editColumnTemplate}
          headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }}
        />

        <Column
          header={translate("common.delete")}
          body={deleteColumnTemplate}
          headerStyle={{ width: '1%',  }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />


      </DataTable>
    </div>
  );
};

export default Brand;
