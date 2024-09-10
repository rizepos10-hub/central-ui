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
import { deleteEntities, filterEntities, getEntities, updateEntities } from "app/entities/item/retail/product/product.reducer";
import { IProduct } from "app/shared/model/ITEM/retail/product.model";
import { Accordion, AccordionTab } from "primereact/accordion";
import ImportButton from "app/shared/components/data-import/data-import";
import { Dropdown } from "primereact/dropdown";
import { Col, Container, Row, Spinner } from "reactstrap";
import { IoMdCloseCircle } from "react-icons/io";
import { getEntities as getCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';

import { IItem } from "app/shared/model/ITEM/item.model";
import { actionOptions, BulkEdit } from "app/shared/components/item/bulk-edit";
import { confirmDialog } from "primereact/confirmdialog";

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

  const [selectedActionOption, setSelectedActionOption] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState<IItem[]>([]);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      filterEntities({
        query: updatedQuery,
      })
    );
  };

  useEffect(() => {
    dispatch(
      getCategories({
        page: 0,
        size: 1000,
        sort: `id,desc`,
      })
    );
  }, [])

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
    const editUrl = `/product/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/product/${rowData.id}/edit`;

    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData: IProduct) => {
    const deleteUrl = `/product/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };

  const handleCreate = () => {
    navigate(`/product/new`)
  }

  useEffect(() => {
    if (selectedActionOption?.code === "MOVE_TO_TRASH") {
      confirm1()
    }
  }, [selectedActionOption])


  const confirm1 = () => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      accept: () => handleItemsDelete(),
      reject: () => setSelectedActionOption(null)
    });
  };

  const handleItemsDelete = async () => {
    setIsLoadingDelete(true);
    await dispatch(deleteEntities(selectedProducts.map(product => product.id))).finally(() => setIsLoadingDelete(false));
    setSelectedProducts([]);
    setSelectedActionOption(null);
  }

  const header = (
    <div className="bg-dark bg-opacity-10 mb-3 p-4 d-flex justify-content-between">
      <span className="text-xl">
        <Dropdown
          value={selectedActionOption}
          onChange={(e) => setSelectedActionOption(e.value)}
          options={actionOptions}
          optionLabel="name"
          placeholder="Bulk Actions"
          className="w-full md:w-14rem"
          disabled={selectedProducts.length < 1}
          optionDisabled={(option) => option.disabled}
        />
      </span>
      <div className="flex align-items-center justify-content-end gap-3">
        <Button label={translate('items.view.actions.refreshList')} severity="secondary" raised color="info" onClick={handleSyncList} disabled={loading}>
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <ImportButton type={"REGULAR_RESTAURANT"} />
        <Button label={translate('items.view.actions.createItem')} raised onClick={handleCreate} disabled={loading}>
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      {selectedActionOption?.code === "EDIT" && selectedProducts.length > 0 && (
        <BulkEdit
          products={products}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          setSelectedActionOption={setSelectedActionOption}
          refetchEntities={getAllEntities}
          loading={loading}
          updateEntities={updateEntities}
          isRetail={true}
        />
      )}
      {header}
      <Accordion
        activeIndex={1}
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
        value={products}
        lazy
        filterDisplay="row"
        dataKey="id"
        paginator
        first={query.first}
        rows={query?.rows}
        totalRecords={totalItems}
        onPage={onPage}
        onSort={onSort}
        sortField={query.sortField}
        sortOrder={query.sortOrder}
        onFilter={onFilter}
        filters={query.filters}
        loading={loading || isLoadingDelete}
        tableStyle={{ minWidth: '75rem' }}
        removableSort
        showGridlines
        className={"mt-3"}
        selectionMode='checkbox'
        selection={selectedProducts}
        onSelectionChange={(e) => setSelectedProducts(e.value)}
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
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
