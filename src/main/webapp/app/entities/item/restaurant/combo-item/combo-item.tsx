import React, {  useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from 'primereact/button';
import { translate, Translate} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {IComboItem} from "app/shared/model/ITEM/restaurant/combo-item.model";
import ImageDisplay from "app/shared/layout/image/image-display";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import { filterEntities } from "app/entities/item/restaurant/combo-item/combo-item.reducer";
import { initialItemFilterState } from "app/shared/components/filter/initial-item-filter-state.model";
import DropDownFilter from "app/shared/components/filter/drop-down-filter";

export const ComboItem = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const comboItemsList:IComboItem[] = useAppSelector(state => state.comboItem.entities);
  const loading = useAppSelector(state => state.comboItem.loading);
  const totalItems = useAppSelector(state => state.comboItem.totalItems);
  const [searchParams, setSearchParams]=  useSearchParams();
  const query = JSON.parse(searchParams.get("query")) || initialItemFilterState;


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
  }, [searchParams]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const onSort = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true})
  };

  const onFilter = (event: any) => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true})
  };


  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true})
  };


  const handleDropdownChange = (field, value) => {
    const newQuery = JSON.stringify(  {
      ...query,
      filters: {
        ...query.filters,
        [field] : value
      }
    });
    setSearchParams({query: newQuery}, {replace: true});
  };

  const nameColumnTemplate = rowData => {
    const editUrl = `/restaurant/combo/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/restaurant/combo/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/restaurant/combo/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/restaurant/combo/new')
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'items.view.titles.tableTitle.combo'}>Combo Items</Translate></span>
      <div className="ms-auto">
        <Button label={translate('items.view.actions.refreshList')} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate('items.view.actions.createCombo')} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );




  return (
    <div>
      <DataTable
        value={comboItemsList} loading={loading} editMode="row" header={header} removableSort  filters={query.filters} filterDisplay="row"
        paginator totalRecords={totalItems} rows={20} lazy  first={query.first}  onPage={onPage} onFilter={onFilter}
        onSort={onSort} sortField={query.sortField} sortOrder={query.sortOrder} showGridlines
      >

          <Column field="name" header={translate('items.view.fields.name')} filter body={nameColumnTemplate} filterPlaceholder={translate('items.view.filters.name')}  sortable  />

          <Column
            header="Category"
            field="categories"
            body={rowData => rowData?.categories?.map(cat => cat?.name).join(" | ")}
            sortable
            filter
            showFilterMatchModes={false}
            filterElement={
              <DropDownFilter
                dropDownOptionType={"RESTAURANT_CATEGORY"}
                selectedOption={query?.filters?.["categories.id"]?.value}
                fieldName={"categories.id"}
                handleDropdownChange={handleDropdownChange}
              />
            }
          />

          <Column header={translate('items.view.fields.image')}  body={(rowData) =>
            <ImageDisplay
              imageType={"product"}
              imageUrl={rowData?.attachments?.[0]?.url || rowData?.variants?.[0]?.attachments?.[0]?.url }
              height={50}
              width={50}
            />} />
          <Column field="description" header={translate('items.view.fields.description')} />

          <Column field="stock" sortable header={translate('items.view.fields.inStock')} />

          <Column header={translate('items.view.fields.edit')}  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header={translate('items.view.fields.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


        </DataTable>
      </div>
  );
};

export default ComboItem;
