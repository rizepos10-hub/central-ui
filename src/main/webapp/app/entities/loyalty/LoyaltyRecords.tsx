import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from 'app/entities/loyalty/loyalty-records.reducer';
import { searchCustomers } from 'app/entities/customer/customer.reducer';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {Link} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Card, CardBody, CardHeader, Col, FormGroup, Row} from "reactstrap";
import {InputText} from "primereact/inputtext";
import {InputNumber} from "primereact/inputnumber";
import {Button} from "primereact/button";
import {ILoyaltyExChange} from "app/shared/model/loyalty.model";
import  {updateEntity as updateExchange, getEntity as getLoyaltyExchange} from "app/entities/loyalty/loyalty-exchange.reducer";
import {translate, Translate} from "react-jhipster";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: any;
  filters: any;
}

export const LoyaltyRecords = () => {
  const ROWS_PER_PAGE = 5;
  const dispatch = useAppDispatch();

  const loyaltyExchangeEntity :ILoyaltyExChange= useAppSelector(state => state.loyaltyExchange.entity)
  const records = useAppSelector(state => state.loyalty.entities);
  const loading = useAppSelector(state => state.loyalty.loading);
  const totalItems = useAppSelector(state => state.loyalty.totalItems);
  const errorMessage = useAppSelector(state => state.loyalty.errorMessage);




  const [loyaltyPointExchange, setLoyaltyPointExchange] = useState<ILoyaltyExChange>();

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: ROWS_PER_PAGE,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      'customer.id': {value: '', matchMode: 'CONTAINS'},
      'customer.firstName': {value: '', matchMode: 'CONTAINS'},
      'customer.lastName': {value: '', matchMode: 'CONTAINS'},
      'customer.email': {value: '', matchMode: 'CONTAINS'},
      'customer.phone': {value: '', matchMode: 'CONTAINS'},
      points: {value: '', matchMode: 'EQUALS'}
    },
  });

  const handleLoyaltyExchangeChange = (field,value) => {
    setLoyaltyPointExchange((prevState) => ({
      ...prevState,
        [field]: value
    }))
  }

  const handleOnFilter = (e) => {
    setLazyState(prev => {
      return {
        ...prev,
        first: 0,
        page: 0,
        filters: {
          'customer.id': e.filters['customer.id'],
          'customer.firstName': e.filters['customer.firstName'],
          'customer.lastName': e.filters['customer.lastName'],
          'customer.email': e.filters['customer.email'],
          'customer.phone': e.filters['customer.phone'],
          points: e.filters.points
        }
      }
    });
  };
  const handleOnSort = (e) => {
    setLazyState(prev => {
      return { ...prev, sortField: e.sortField, sortOrder: e.sortOrder}
    })
  }

  const handleOnPage = (e) => {
    setLazyState(prev => {
      return { ...prev, first: e.first, page: e.page }
    })
  };
  const mapMatchMode = (matchMode: string): string =>{
    switch (matchMode){
      case 'equals':
        return 'EQUALS';
      case 'notEquals':
        return 'NOT_EQUALS';
      case 'startsWith':
        return 'STARTS_WITH';
      case 'endsWith':
        return "END_WITH";
      case 'contains':
        return 'CONTAINS';
      case 'notContains':
        return 'NOT_CONTAINS';
      default:
        return "CONTAINS";
    }
  }
  const getCustomersIdsAsync = () => {
    const getCustomersFilters = (keys: string[])=> {
      const customersFilters: any = {};
      keys.forEach((key)=>{
        if (lazyState.filters[`customer.${key}`].value)
          customersFilters[key] = {
            value: lazyState.filters[`customer.${key}`].value,
            matchMode: mapMatchMode(lazyState.filters[`customer.${key}`].matchMode)
          };
      })
      return customersFilters;
    }

    return dispatch(searchCustomers({
      first: 0,
      rows: 999999999,
      page: 0,
      sortField: null,
      sortOrder: null,
      filters: getCustomersFilters(['id', 'firstName', 'lastName', 'email', 'phone']),
    }))
  }

  const hasCustomerFilters =
    lazyState.filters['customer.id'].value ||
    lazyState.filters['customer.email'].value ||
    lazyState.filters['customer.firstName'].value ||
    lazyState.filters['customer.lastName'].value ||
    lazyState.filters['customer.phone'].value;

  useEffect(() => {
    const filters: any = {};

    if (lazyState.filters['points']?.value){
      filters['points'] = {value: +(lazyState.filters.points.value), matchMode: 'EQUALS'};
    }

    // set filters by customer id
    if (hasCustomerFilters) {
      getCustomersIdsAsync().then((res:any) => {
        const ids = res?.payload.data.map(customer => customer.id);
        if (ids.length > 0)
          filters['customer.id'] = {
            operator: "OR",
            constraints: ids.map(id => {return {value: id, matchMode: 'EQUALS'}})
          };
        else filters['customer.id'] = {value: '', matchMode: "EQUALS"}

        const params = {
          first: lazyState.first || 0,
          rows: lazyState.rows || ROWS_PER_PAGE,
          page: lazyState.page || 0,
          sortField: lazyState.sortField || null,
          sortOrder: lazyState.sortOrder || null,
          filters,
        }
        dispatch(
          getEntities(params)
        );
        return;
      });
    }

    const params = {
      first: lazyState.first || 0,
      rows: lazyState.rows || ROWS_PER_PAGE,
      page: lazyState.page || 0,
      sortField: lazyState.sortField || null,
      sortOrder: lazyState.sortOrder || null,
      filters,
    }
    dispatch(
      getEntities(params)
    );

  }, [lazyState]);


  useEffect(() => {
    dispatch(getLoyaltyExchange());

    if(loyaltyExchangeEntity) {
      setLoyaltyPointExchange(loyaltyExchangeEntity)
    }
  },[loyaltyExchangeEntity?.cashToPointExchange])


  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'loyalty.view.table.title'}>Loyalty Records</Translate></span>
    </div>
  );

  const editColumnTemplate = (rowData) => {
    const editUrl = `/loyalty/${rowData.customer?.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const handleSave = () => {
    dispatch(updateExchange(loyaltyPointExchange));
  }

  return (
    <>
      <h1>Loyalty Points View</h1>
      <div className={"my-3 w-6 d-flex gap-3"} >
      <Card>
        <FormGroup>

        <CardHeader>
          Loyalty Points Exchange
        </CardHeader>
        <CardBody  className={" d-flex gap-3"}>
            <div className={"d-flex flex-column gap-2"}>
              <label className={"text-xl font-bold"}>
                Cash To Point Exchange
              </label>
              <InputNumber
                name="cashToPointExchange"
                id="cashToPointExchange"
                required={true}
                maxFractionDigits={5}
                placeholder="Cash To Point "
                value={loyaltyPointExchange?.cashToPointExchange}
                onChange={(e) => handleLoyaltyExchangeChange('cashToPointExchange', e.value)}
              />
            </div>

            <div className={"d-flex flex-column gap-2"}>
              <label className={"text-xl font-bold"}>
                Point To Cash Exchange
              </label>
              <InputNumber
                name="pointToCashExchange"
                id="pointToCashExchange"
                required={true}
                maxFractionDigits={5}
                placeholder="Point To Cash"
                value={loyaltyPointExchange?.pointToCashExchange}
                onChange={(e) => handleLoyaltyExchangeChange('pointToCashExchange', e.value)}
              />
            </div>

            <div className={"d-flex flex-column gap-2 mt-1"}>
             <Button label={"Save"} className={"mt-5 .3rem"} raised onClick={handleSave} />
            </div>
        </CardBody>
        </FormGroup>
      </Card>
      </div>

      <div className="col-12 mt-3">
        <DataTable
          lazy
          value={records.filter(record => record.customer !== null)}
          dataKey='id'
          header={header}
          paginator
          rows={ROWS_PER_PAGE}
          removableSort
          totalRecords={totalItems}
          filterDisplay="row"
          className="datatable-responsive"
          emptyMessage="No Customers found."
          loading={loading}

          first={lazyState.first}
          onFilter={handleOnFilter}
          filters={lazyState.filters}
          onPage={handleOnPage}
          // onSort={handleOnSort}
          sortField={lazyState.sortField}
          sortOrder={lazyState.sortOrder}
        >
          <Column
            field="customer.email"
            header={translate('loyalty.view.table.fields.email')}
            // sortable
            filter
            filterPlaceholder={translate('loyalty.view.table.search.search')}
            body={(rowData)=>{return rowData.customer?.email}}
            headerStyle={{ minWidth: '12rem' }}
          />
          <Column
            field="customer.firstName"
            header={translate('loyalty.view.table.fields.firstName')}
            body={(rowData)=>{return rowData.customer?.firstName}}
            // sortable
            filter
            filterPlaceholder={translate('loyalty.view.table.search.search')}
            headerStyle={{ minWidth: '12rem' }}
          />
          <Column
            field="customer.lastName"
            header={translate('loyalty.view.table.fields.lastName')}
            body={(rowData)=>{return rowData.customer?.lastName}}
            // sortable
            filter
            filterPlaceholder={translate('loyalty.view.table.search.search')}
            headerStyle={{ minWidth: '12rem' }}
          />
          <Column
            field="customer.phone"
            header={translate('loyalty.view.table.fields.phone')}
            filter
            filterPlaceholder={translate('loyalty.view.table.search.search')}
            body={(rowData)=>{return rowData.customer?.phone}}
            // sortable
            headerStyle={{ minWidth: '12rem' }}
          />
          <Column
            field="points"
            header={translate('loyalty.view.table.fields.points')}
            // sortable
            filter
            filterPlaceholder={translate('loyalty.view.table.search.search')}
            showFilterMenu={false}
            headerStyle={{ minWidth: '12rem' }}
          />
          <Column header={translate('loyalty.view.table.fields.edit')}  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />
        </DataTable>
      </div>
    </>
  );
};
