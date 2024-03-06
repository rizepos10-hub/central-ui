import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import {  getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {getEntities, reset} from './pizza-pricing-class.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {FilterMatchMode} from "primereact/api";
import {IPredefinedPizza} from "app/shared/model/PIZZA/predefined-pizza.model";
import {IPizzaPricingClass} from "app/shared/model/PIZZA/pizza-pricing-class.model";
import {TabPanel, TabView} from "primereact/tabview";
import {PizzaPricingClassType} from "app/shared/model/ENUMS/pizza-pricing-class-type.model";
import {TabMenu} from "primereact/tabmenu";

const tabItems = Object.keys(PizzaPricingClassType).map(priceType => ({ label: priceType, value: PizzaPricingClassType[priceType]}));
const reverseMapping: { [key: string]: string } = {};
 Object.keys(PizzaPricingClassType).forEach((key) => {
  const value = PizzaPricingClassType[key];
  reverseMapping[value] = key;
});

export const PizzaPricingClass = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const urlSearchParams = new URLSearchParams(window.location.search);
  const pizzaPriceClassType :any  = urlSearchParams.get("type");

  const [selectedType, setSelectedType] = useState({
    label: reverseMapping[pizzaPriceClassType],
    value: pizzaPriceClassType
  });
  const pizzaPricingClassList :IPizzaPricingClass[] = useAppSelector(state => state.pizzaPricingClass.entities);

  const filteredPizzaPricingClassList = pizzaPricingClassList.filter(priceClass =>  priceClass.type === selectedType?.value);
  const loading = useAppSelector(state => state.pizzaPricingClass.loading);
  const updateSuccess = useAppSelector(state => state.pizzaPricingClass.updateSuccess);
  const totalItems = useAppSelector(state => state.pizzaPricingClass.totalItems);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [activeIndex, setActiveIndex] = useState(() => {
    const selectedIndex = tabItems.findIndex(item => {return item.value === selectedType.value});
    return selectedIndex >= 0 ? selectedIndex : 0;
  });

  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const getAllEntities = () => {

      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
  };




  useEffect(() => {
    getAllEntities();

    return () => {
      reset()
    }
  }, [paginationState.activePage, paginationState.order, paginationState.sort,updateSuccess]);





  const handleSyncList = () => {
    getAllEntities();
  };



  console.log(pizzaPricingClassList, 'pizzaPricingClassList')


  const nameColumnTemplate = rowData => {
    const editUrl = `/pizza-pricing-class/${rowData.id}/edit?type=${selectedType?.value}&page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/pizza-pricing-class/${rowData.id}/edit?type=${selectedType?.value}&page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/pizza-pricing-class/${rowData.id}/delete?type=${selectedType?.value}&page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate(`/pizza-pricing-class/new?type=${selectedType?.value}`)
  }
  const header = (
    <>

    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Pizza Pricing Class</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={`Add New ${selectedType?.label} Price`} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
      <TabMenu className={"mt-2"} model={tabItems} activeIndex={activeIndex} onTabChange={(e:any) => {
        setActiveIndex(e.index)
        setSelectedType(e.value)
      }} />
    </>
  );




  return (
    <div>

        <DataTable loading={loading} value={filteredPizzaPricingClassList} editMode="row" header={header} removableSort   filters={filters} filterDisplay="row"  paginator totalRecords={totalItems}
                   rows={20}>
          <Column field="name" header="Name" filter body={nameColumnTemplate} filterPlaceholder={"Search by name"}  sortable  />


          <Column field="type" header="Type"  body={(rowData)=> reverseMapping[rowData.type]}   sortable  />

          <Column header="Edit"  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header="Delete" body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


        </DataTable>
    </div>
  );
};

export default PizzaPricingClass;
