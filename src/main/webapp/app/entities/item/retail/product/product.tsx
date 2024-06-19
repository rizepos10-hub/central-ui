import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from 'primereact/button';
import { getSortState, translate, Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { DataTable, DataTableFilterEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { ISimpleItem } from "app/shared/model/ITEM/retail/simple-item.model";
import { SummarizeText } from "app/shared/util/SummarizeText";
import ImageDisplay from "app/shared/components/image/image-display";
import { applyMatchModeMap, updateTableFilters } from "app/shared/util/filter-match-model-util";
import DropDownFilter from "app/shared/components/filter/drop-down-filter";
import SharedFilter from "app/shared/components/item/shared-filter";
import { initialItemFilterState } from "app/shared/model/filter-state.model";
import AttributeFilter from "app/shared/components/filter/attribute-filter";
import { filterEntities, getEntities } from "app/entities/item/retail/product/product.reducer";
import { IProduct } from "app/shared/model/ITEM/retail/product.model";
import { Accordion, AccordionTab } from "primereact/accordion";
import ImportButton from "app/shared/components/data-import/data-import";


export const Product = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const products: IProduct[] = useAppSelector(state => state.product.entities)
  const loading = useAppSelector(state => state.product.loading);
  const totalItems = useAppSelector(state => state.product.totalItems);

  const [searchParams, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParams.get("query")) || initialItemFilterState;
  const [localFilters, setLocalFilters] = useState(query?.filters);
  const filteredAttributes = localFilters?.["attributes.attributeTerms.id"]?.constraints || [];





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
    return () => {
      searchParams.set("query", "")
    }
  }, [query?.first, query?.page]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const onSort = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  };

  const onFilter = (newFilters) => {
    const newFilters1 = updateTableFilters(newFilters);
    setLocalFilters(newFilters1);
    query['first'] = 0;
    query['page'] = 0;
    query.filters = updateTableFilters({ ...localFilters });
    const queryParams = JSON.stringify(query);
    setSearchParams({ query: queryParams }, { replace: true });
    getAllEntities();
  };


  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
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
    const newQuery = JSON.stringify({ ...initialItemFilterState });
    setSearchParams({ query: newQuery }, { replace: true });
    dispatch(getEntities({}))
  };





  const nameColumnTemplate = rowData => {
    const itemVariantType = rowData.itemVariantType // "RETAIL_VARIABLE" | "RETAIL_SIMPLE"
    const editUrl = itemVariantType === "RETAIL_SIMPLE" ?
      `/retail/simple/${rowData.id}/edit`
      :
      `/retail/variable/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const itemVariantType = rowData.itemVariantType // "RETAIL_VARIABLE" | "RETAIL_SIMPLE"
    const editUrl = itemVariantType === "RETAIL_SIMPLE" ?
      `/retail/simple/${rowData.id}/edit`
      :
      `/retail/variable/${rowData.id}/delete`;

    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData: IProduct) => {
    const itemVariantType = rowData.itemVariantType // "RETAIL_VARIABLE" | "RETAIL_SIMPLE"
    const deleteUrl = itemVariantType === "RETAIL_SIMPLE" ?
      `/retail/simple/${rowData.id}/delete`
      :
      `/retail/variable/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };

  const handleCreate = (type: "simple" | "variable") => {
    navigate(`/retail/${type}/new`)
  }

  const header = (
    <div className="bg-dark bg-opacity-10 mb-3 p-4 d-flex justify-content-between">
      <span className="text-xl">
        Add, view and edit your products in one place.
      </span>
    <div className="flex align-items-center justify-content-end gap-3">
      <Button label={translate('items.view.actions.refreshList')} severity="secondary" raised color="info" onClick={handleSyncList} disabled={loading}>
        <FontAwesomeIcon icon="sync" spin={loading} />{' '}
      </Button>
      <ImportButton type={"REGULAR_RESTAURANT"} />
      <Button label={translate('items.view.actions.createVariable')} raised onClick={() => handleCreate("variable")} disabled={loading}>
      </Button>
      <Button label={translate('items.view.actions.createSimple')} raised onClick={() => handleCreate("simple")} disabled={loading}>
      </Button>
    </div>
    </div>
  );


  return (
    <div>
      {header}
      <Accordion
        activeIndex={0}
      >
        <AccordionTab header='Filters'>
          <div className="d-flex flex-column gap-3">
            <div className="d-flex gap-3">
              <SharedFilter filteredAttributes={filteredAttributes} onFilterValueChange={handleFilterValueChange} filters={localFilters} itemType={'RETAIL'} handleSearch={onFilter} />
            </div>
            <div className={'d-flex gap-2 justify-content-center'}>
              <Button type={'button'} severity={"info"} label={'Clear Filters'} onClick={handleClear} />
              <Button type={'submit'} label={'Search'} onClick={() => onFilter(localFilters)} />
            </div>
          </div>
        </AccordionTab>
      </Accordion>

      <DataTable
        value={products} lazy filterDisplay="row" dataKey="id" paginator
        first={query.first} rows={query?.rows} totalRecords={totalItems} onPage={onPage}
        onSort={onSort} sortField={query.sortField} sortOrder={query.sortOrder}
        onFilter={onFilter} filters={query.filters} loading={loading} tableStyle={{ minWidth: '75rem' }}
        removableSort
        showGridlines
        className={"mt-3"}
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

export default Product;
