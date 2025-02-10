import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from 'primereact/button';
import { translate, Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { DataTable, DataTableFilterEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { IComboItem } from "app/shared/model/ITEM/restaurant/combo-item.model";
import ImageDisplay from "app/shared/components/image/image-display";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import { deleteEntities, exportEntities, filterEntities, updateEntities, createEntity } from "app/entities/item/restaurant/combo-item/combo-item.reducer";
import DropDownFilter from "app/shared/components/filter/drop-down-filter";
import { initialItemFilterState } from "app/shared/model/filter-state.model";
import { IItem } from 'app/shared/model/ITEM/item.model';
import { Dropdown } from 'primereact/dropdown';
import { actionOptions, BulkEdit } from 'app/shared/components/item/bulk-edit';
import { confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { FaCopy } from 'react-icons/fa';
import _ from 'lodash';

export const ComboItem = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const comboItemsList: IComboItem[] = useAppSelector(state => state.comboItem.entities);
  const loading = useAppSelector(state => state.comboItem.loading);
  const totalItems = useAppSelector(state => state.comboItem.totalItems);
  const [searchParams, setSearchParams] = useSearchParams();

  const [localNameFilter, setLocalNameFilter] = useState("");

  const query = JSON.parse(searchParams.get("query")) || {
    first: 0,
    rows: 20,
    page: 0,
    sortField: null,
    sortOrder: null,
    query: '',
    filters: {
      "categories.id": { value: null, matchMode: FilterMatchMode.EQUALS },
      "attributes": { value: null, matchMode: FilterMatchMode.EQUALS },
      name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    }
  };

  const [selectedActionOption, setSelectedActionOption] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState<IItem[]>([]);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  console.log(JSON.parse(searchParams.get("query")))
  const getAllEntities = () => {
    console.log(query)
    const updatedQuery = applyMatchModeMap(query);
    console.log(updatedQuery, 'updatedQuery')
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
    setSearchParams({ query: queryParams }, { replace: true })
  };

  const debouncedFilter = useRef(_.debounce((event) => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  }, 300)).current

  const onFilter = (event: DataTableFilterEvent) => {
    debouncedFilter(event);
  };


  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  };


  const handleDropdownChange = (field, value) => {
    const newQuery = JSON.stringify({
      ...query,
      filters: {
        ...query.filters,
        [field]: value
      }
    });
    setSearchParams({ query: newQuery }, { replace: true });
  };

  const nameColumnTemplate = rowData => {
    const editUrl = `/restaurant/combo/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name} <br/>
        <span className="text-xs">
          #{rowData?.variants?.reduce((total, variant) => {
            return total + (variant?.comboPackages?.length || 0);
          }, 0)}
        </span>
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/restaurant/combo/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/restaurant/combo/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };

  const MenusTemplate = (rowData) => {
    const menus = []
    rowData?.rowData?.menus?.forEach(menu => {
      menus.push({
        name: menu.name,
        id: menu.id,
        type: menu.type,
      })
    })

    return <div>{menus.map((menu, idx) => (
      <Link key={idx} to={`/menu/${menu.id}/${menu.type}/edit?page=1&sort=id,asc`}>
        {menu.name} {idx === menus.length - 1 ? '' : ' | '}
      </Link>
    ))}</div>
  };

  const handleCreate = () => {
    navigate('/restaurant/combo/new')
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
    setIsLoadingAction(true);
    await dispatch(deleteEntities(selectedProducts.map(product => product.id))).finally(() => setIsLoadingAction(false));
    setSelectedProducts([]);
    setSelectedActionOption(null);
  }

  useEffect(() => {
    if (selectedActionOption?.code === "EXPORT") {
      confirm2()
    }
  }, [selectedActionOption])

  const nameFilterTemplate = () => {
    return (
      <InputText
        type="text"
        value={localNameFilter}
        onChange={(e) => {
          setLocalNameFilter(e.target.value);
          const newQuery = {
            ...query,
            filters: {
              ...query.filters,
              name: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS }
            }
          };
          debouncedFilter(newQuery);
        }}
        className="p-inputtext-sm"
        placeholder="Search by Name"
      />
    );
  };

  const confirm2 = () => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      accept: () => handleItemsExport(),
      reject: () => setSelectedActionOption(null)
    });
  };

  const handleItemsExport = async () => {
    setIsLoadingAction(true);
    await dispatch(exportEntities(selectedProducts.map(product => product.id))).finally(() => setIsLoadingAction(false));
    setSelectedProducts([]);
    setSelectedActionOption(null);
  }

  const duplicateColumnTemplate = (rowData) => {
    console.log(rowData)
    return (
      <Button
        className="d-flex justify-content-center w-100"
        onClick={() => confirmDialog({
          message: 'Are you sure you want to duplicate this product?',
          header: 'Duplicate Product',
          icon: 'pi pi-exclamation-triangle',
          accept() {
            const { id, ...entityWithoutId } = rowData;
            entityWithoutId.variants = entityWithoutId?.variants.map(({ id, ...variantWithoutId }) => ({
              ...variantWithoutId,
            }));
            dispatch(createEntity(entityWithoutId)).then(res => {
              const payload = res?.payload as any;
              const newProductId = payload?.data?.id;

              // @ts-expect-error -- unknown type
              if (!res?.error) {
                navigate(`/restaurant/combo/${newProductId}/edit`)
              }
            });
          }
        })}
        text
      >
        <FaCopy style={{ cursor: 'pointer', color: 'black', marginLeft: '0.3rem' }} />
      </Button>
    );
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
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
      <div className="ms-auto">
        <Button onClick={() => confirm2()}>
          Export All
        </Button>
        &nbsp;
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
      {selectedActionOption?.code === "EDIT" && selectedProducts.length > 0 && (
        <BulkEdit
          products={comboItemsList}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          setSelectedActionOption={setSelectedActionOption}
          refetchEntities={getAllEntities}
          loading={loading}
          updateEntities={updateEntities}
          isRetail={false}
        />
      )}
      <DataTable
        value={comboItemsList}
        loading={loading || isLoadingAction}
        editMode="row"
        header={header}
        removableSort
        filters={query.filters}
        filterDisplay="row"
        paginator
        totalRecords={totalItems}
        rowsPerPageOptions={[10, 20, 30, 40, 50, 100, 200]}
        rows={query?.rows}
        lazy
        first={query.first}
        onPage={onPage}
        onFilter={onFilter}
        onSort={onSort}
        sortField={query.sortField}
        sortOrder={query.sortOrder}
        showGridlines
        selectionMode='checkbox'
        selection={selectedProducts}
        onSelectionChange={(e) => setSelectedProducts(e.value)}
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        <Column field="name" filterElement={nameFilterTemplate} header={translate('items.view.fields.name')} filter body={nameColumnTemplate} filterPlaceholder={translate('items.view.filters.name')} sortable />

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

        <Column header={translate('items.view.fields.image')} body={(rowData) =>
          <ImageDisplay
            imageType={"product"}
            imageUrl={rowData?.attachments?.[0]?.url || rowData?.variants?.[0]?.attachments?.[0]?.url}
            height={50}
            width={50}
          />} />

        <Column header={translate('items.view.fields.menus')} body={(rowData) =>
          <MenusTemplate rowData={rowData} />}
        />

        <Column field="description" header={translate('items.view.fields.description')} />

        {/* <Column field="stock" sortable header={translate('items.view.fields.inStock')} /> */}

        <Column
          header={translate('items.view.fields.duplicate')}
          body={duplicateColumnTemplate}
          headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />

        <Column header={translate('items.view.fields.edit')} body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

        <Column header={translate('items.view.fields.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%', }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


      </DataTable>
    </div>
  );
};

export default ComboItem;
