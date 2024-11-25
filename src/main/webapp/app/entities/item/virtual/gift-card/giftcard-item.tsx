import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from 'primereact/button';
import {translate, Translate} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from './giftcard-item.reducer';
import { DataTable } from "primereact/datatable";
import {Column} from "primereact/column";
import {ISimpleItem} from "app/shared/model/ITEM/retail/simple-item.model";
import {SummarizeText} from "app/shared/util/SummarizeText";
import ImageDisplay from "app/shared/components/image/image-display";
import { updateTableFilters } from "app/shared/util/filter-match-model-util";
import { initialItemFilterState } from "app/shared/model/filter-state.model";


export const GiftCardItem = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const simpleItemsList:ISimpleItem[] = useAppSelector(state => state.GiftCardItem.entities)
  const loading = useAppSelector(state => state.GiftCardItem.loading);
  const totalItems = useAppSelector(state => state.GiftCardItem.totalItems);
  const [searchParams, setSearchParams]=  useSearchParams();
  const query = JSON.parse(searchParams.get("query")) || initialItemFilterState;
  const [localFilters, setLocalFilters] = useState(query?.filters);





  const getAllEntities = () => {
    dispatch(
      getEntities({})
    );
  };



  useEffect(() => {
    getAllEntities();
    return () => {
      searchParams.set("query", "")
    }
  }, [query?.first, query?.page]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const onSort = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true})
  };

  const onFilter = (newFilters) => {
      const newFilters1 = updateTableFilters(newFilters);
      setLocalFilters(newFilters1);
      query['first'] = 0;
      query['page'] = 0;
      query.filters = updateTableFilters({ ...localFilters });
      const queryParams = JSON.stringify(query);
      setSearchParams({query: queryParams}, {replace: true});
      getAllEntities();
  };


  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true})
  };

  const handleFilterValueChange = useCallback((field, value) => {
    const updatedFilters = {
      ...localFilters,
      [field]: value
    };

    const cleanedFilters = updateTableFilters(updatedFilters);
    setLocalFilters(cleanedFilters)
    // const newQuery = JSON.stringify({
    //   ...query,
    //   filters: cleanedFilters
    // });
    //
    // setSearchParams({ query: newQuery }, { replace: true });
  }, [query.filters, localFilters]);

  const handleClear = () => {
    setLocalFilters({});
    const newQuery = JSON.stringify({
      ...query,
      filters: {}
    });
    setSearchParams({ query: newQuery }, { replace: true });
  };



  const nameColumnTemplate = rowData => {
    const editUrl = `/gift-cards/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/gift-cards/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/gift-cards/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/gift-cards/new')
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'items.view.titles.tableTitle.giftcard'}>Gift Card Items</Translate></span>
      <div className="ms-auto">
        <Button label={translate('items.view.actions.refreshList')} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate('items.view.actions.createGiftCard')} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );


  return (
    <div>
      <h2>Gift Card Items</h2>
      <DataTable
        value={simpleItemsList} lazy filterDisplay="row" dataKey="id" paginator
        first={query.first} rows={query?.rows} totalRecords={totalItems} onPage={onPage}
        onSort={onSort} sortField={query.sortField} sortOrder={query.sortOrder}
        onFilter={onFilter} filters={query.filters} loading={loading} tableStyle={{ minWidth: '75rem' }}
        header={header}
        removableSort
        showGridlines
      >
        <Column
          field="name"
          header={translate('items.view.fields.name')}
          body={nameColumnTemplate}
          filterPlaceholder={translate('items.view.filters.name')}
          sortable
        />

        <Column
          header="Category"
          field="categories"
          body={rowData => rowData?.categories?.map(cat => cat?.name).join(' | ')}
          sortable
          showFilterMatchModes={false}
        />

        <Column
          header={translate('items.view.fields.image')}
          body={rowData => (
            <ImageDisplay
              imageType={'product'}
              imageUrl={rowData?.attachments?.[0]?.url || rowData?.variants?.[0]?.attachments?.[0]?.url}
              height={50}
              width={50}
            />
          )}
        />
        <Column
          field="desc"
          header={translate('items.view.fields.description')}
          body={rowData => <SummarizeText>{rowData.desc}</SummarizeText>}
        />

        <Column field="stock" sortable header={translate('items.view.fields.inStock')} />

        <Column
          header={translate('items.view.fields.edit')}
          body={editColumnTemplate}
          headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />

        <Column
          header={translate('items.view.fields.delete')}
          body={deleteColumnTemplate}
          headerStyle={{ width: '1%' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />
      </DataTable>
    </div>
  );
};

export default GiftCardItem;
