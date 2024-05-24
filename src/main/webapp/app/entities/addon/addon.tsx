import React, {  useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from 'primereact/button';
import { Translate, translate, } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {Chip} from "primereact/chip";
import {FilterMatchMode} from "primereact/api";
import ImportButton from "app/shared/components/data-import/data-import";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import { filterEntities } from "app/entities/addon/addon.reducer";
import _ from "lodash";
import { InputText } from "primereact/inputtext";


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


export const Addon = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();


  const addonList = useAppSelector(state => state.addon.entities);
  const loading = useAppSelector(state => state.addon.loading);
  const totalItems = useAppSelector(state => state.addon.totalItems);
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

  useEffect(() => {
    getAllEntities();
  }, [searchParam]);

  const handleSyncList = () => {
    getAllEntities();
  };


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
    const editUrl = `/addon/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/addon/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/addon/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/addon/new')
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'addons.view.table.title'}>Addons</Translate></span>
      <div className="ms-auto">
        <ImportButton type={"ADDON"} />
          &nbsp;
        <Button label={translate("addons.view.table.buttons.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate("addons.view.table.buttons.createNewAddon")} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
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





  return (
    <div>

      <DataTable
        value={addonList} editMode="row" header={header} removableSort  filters={query.filters} filterDisplay="row"
        paginator totalRecords={totalItems} rows={20} lazy  first={query.first}  onPage={onPage} onFilter={onFilter}
        filterDelay={500}
        onSort={onSort} sortField={query.sortField} sortOrder={query.sortOrder} showGridlines
      >
          <Column field="name" header={translate('addons.view.table.fields.name')}
                  filter
                  body={nameColumnTemplate} filterPlaceholder={translate('addons.view.table.search.name')}  sortable  />
          <Column field="price" header={translate('addons.view.table.fields.price')} sortable  />
          <Column
            field="discounts"
            header={translate('addons.view.table.fields.discounts')}
            body={renderDiscounts}
            sortable
          />

          <Column header={translate('addons.view.table.fields.edit')}  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header={translate('addons.view.table.fields.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


        </DataTable>
    </div>
  );
};

export default Addon;
