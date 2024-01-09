import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IItem } from 'app/shared/model/item.model';
import {searchEntities, getEntities, importData} from './item.reducer';
import {DataTable} from "primereact/datatable";
import { Column } from 'primereact/column';
import {Tag} from "primereact/tag";
import {Rating} from "primereact/rating";
import {Button} from "primereact/button";
import VariantView from "app/entities/item/restaurant/regular-item/variant-view";
import {Modal} from "reactstrap";
import {FilterMatchMode} from "primereact/api";
import {Dropdown} from "primereact/dropdown";

import { getRestaurantItemCategories} from '../../../term/term.reducer';
import ImageDisplay from "app/shared/layout/image/image-display";


export const Item = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [itemProp, setItemProp] = useState();

  const itemList = useAppSelector(state => state.regularItem.entities);
  const loading = useAppSelector(state => state.regularItem.loading);
  const errorMessage = useAppSelector(state => state.regularItem.errorMessage);

  const totalItems = useAppSelector(state => state.regularItem.totalItems);

  const termList = useAppSelector(state => state.regularItem.entities)


  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    categoryForSorting: { value: null, matchMode: FilterMatchMode.EQUALS },
  });


console.log(errorMessage, 'errorMessage')

  const getAllEntities = () => {
    if (search) {
      dispatch(
        searchEntities({
          query: search,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    } else {
      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }
  };


  const startSearching = e => {
    if (search) {
      setPaginationState({
        ...paginationState,
        activePage: 1,
      });
      dispatch(
        searchEntities({
          query: search,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }
    e.preventDefault();
  };

  const clear = () => {
    setSearch('');
    setPaginationState({
      ...paginationState,
      activePage: 1,
    });
    dispatch(getEntities({}));
  };

  const handleSearch = event => setSearch(event.target.value);

  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (location.search !== endURL) {
      navigate(`${location.pathname}${endURL}`);
    }
  };

  useEffect(() => {
    sortEntities();
    dispatch(getRestaurantItemCategories({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
  }, [paginationState.activePage, paginationState.order, paginationState.sort, search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = params.get('page');
    const sort = params.get(SORT);
    if (page && sort) {
      const sortSplit = sort.split(',');
      setPaginationState({
        ...paginationState,
        activePage: +page,
        sort: sortSplit[0],
        order: sortSplit[1],
      });
    }
  }, [location.search]);

  const sort = p => () => {
    setPaginationState({
      ...paginationState,
      order: paginationState.order === ASC ? DESC : ASC,
      sort: p,
    });
  };

  const handlePagination = currentPage =>
    setPaginationState({
      ...paginationState,
      activePage: currentPage,
    });

  const handleSyncList = () => {
    sortEntities();
  };

  async function handleImportData (selectedFile) {
   const response = await dispatch(importData(selectedFile)).then((response) => {
     console.log(response, 'ba33')
     const errMsg = response.payload.response.data.message
     alert(`Error importing data: ${errMsg} `)
   })
    console.log(response, 'resopp')
  };

  const getSeverity = (item) => {
    switch (item.status) {
      case 'ENABLED':
        return 'success';

      case 'VISIBLE':
        return 'warning';

      case 'DISABLED':
        return 'danger';

      default:
        return null;
    }
  };

  const categoryNames = itemList && new  Set(itemList?.map((item) => item.categories[0]?.name));
  const categoryFilterOptions = Array.from(categoryNames)?.map((categoryName) => ({
    label: categoryName,
    value: categoryName,
  }));

  const categoryFilter = (
    <Dropdown
      value={filters.categoryForSorting?.value}
      options={termList?.map((term) => term.name)}
      onChange={(e) => {
        const updatedFilters = {
          ...filters,
          categoryForSorting: { value: e.value, matchMode: FilterMatchMode.EQUALS },
        };
        setFilters(updatedFilters);
      }}
      placeholder="Select a category"
    />
  );
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };


  const priceBodyTemplate = (item) => {
    const price = item.variants[0].price
    return formatCurrency(price);
  };

  const ratingBodyTemplate = (item) => {
    return <Rating value={item.avgRating} readOnly cancel={false} />;
  };

  const statusBodyTemplate = (item) => {
    return <Tag value={item.status} severity={getSeverity(item)}></Tag>;
  };

  const handleCreate = () => {
    navigate('/restaurant/regular/new')
  }


  const handleImportButtonClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx';
    fileInput.onchange = (e) => {
      const inputElement = e.target as HTMLInputElement;
      const selectedFile = inputElement.files?.[0] || null;
      handleImportData(selectedFile);
    };
    fileInput.click();
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Items</span>
      <div className="ms-auto">
        <Button label="Import Data" severity="help" raised className="me-5" color="help"  onClick={handleImportButtonClick} disabled={loading} />

        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label="Create New Regular Item" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );

  const nameColumnTemplate = rowData => {
    const editUrl = `/restaurant/regular/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };


  const editColumnTemplate = (rowData) => {
    const editUrl = `/restaurant/regular/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/restaurant/regular/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };

  const toggleModal = () => {
    setModalIsOpen(!modalIsOpen);
  };

  const variantColumnTemplate = (rowData) => {
    return (
      <div>
        <Button  onClick={() => {
          setItemProp(rowData)
          toggleModal();
        }}>
          Show Variants
        </Button>
      </div>
    );
  };
  console.log(itemList, 'itemList')

  const processedItemList = itemList?.map(item => ({
    ...item,
    categoryForSorting: item.categories[0]?.name || '',
  }));


  return (
    <div>
      <h2 id="item-heading" data-cy="ItemHeading">
        <Translate contentKey="tempApp.item.home.title">Items View</Translate>

      </h2>

      <div >
        <DataTable value={processedItemList} header={header} paginator rows={10}
                   removableSort
                   loading={loading}
                   totalRecords={totalItems}
                   globalFilterFields={['name',  ]}
                   filters={filters} filterDisplay="row"
                   tableStyle={{ minWidth: '60rem' }}>

          <Column field="name"  sortable header="Name" filter filterPlaceholder="Search by name" body={nameColumnTemplate} />
          <Column header="Image"  body={(rowData) =>
            <ImageDisplay
              imageType={"product"}
              imageUrl={rowData?.attachments?.[0]?.url || rowData?.variants?.[0]?.attachments?.[0]?.url }
              height={50}
              width={50}
            />} />
          {/* <Column field="desc" header="Description" /> */}
          <Column header="Variant"  body={variantColumnTemplate} />
          {/* <Column field="price" header="Price" body={priceBodyTemplate} /> */}
          <Column
            header="Category"
            field="categoryForSorting"
            sortable
            filter
            filterElement={categoryFilter}
          />
          <Column field="avgRating" header="Reviews" body={ratingBodyTemplate} />
          <Column field="orderCount" header="Order Count" />
          <Column field="stock" sortable header="In Stock" />
          <Column header="Status"  sortable body={statusBodyTemplate}></Column>
          <Column header="Edit"  body={editColumnTemplate} headerStyle={{ width: '5%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header="Delete" body={deleteColumnTemplate} headerStyle={{ width: '5%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />
        </DataTable>
        <Modal
          isOpen={modalIsOpen}
          toggle={toggleModal}
          contentClassName="custom-modal-content"
          size="lg"
        >
          <div className="modal-header">
            <h5 className="modal-title">Variant Details</h5>
              <i onClick={toggleModal} className="pi pi-times cursor-pointer  " style={{ fontSize: '1.5rem' }}></i>
          </div>
          <div className="modal-body">
            <VariantView item={itemProp} />
          </div>
        </Modal>

      </div>

    </div>
  );
};

export default Item;
