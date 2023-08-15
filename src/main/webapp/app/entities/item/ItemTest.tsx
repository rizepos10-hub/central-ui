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
import { searchEntities, getEntities } from './item.reducer';
import {DataTable} from "primereact/datatable";
import { Column } from 'primereact/column';
import {Tag} from "primereact/tag";
import {Rating} from "primereact/rating";
import {Button} from "primereact/button";
import VariantViewTest from "app/entities/item/VariantViewTest";
import {Modal} from "reactstrap";

export const Item = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [itemNameProp,setItemNameProp] = useState([])
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState([]);

  const itemList = useAppSelector(state => state.item.entities);
  const loading = useAppSelector(state => state.item.loading);
  const totalItems = useAppSelector(state => state.item.totalItems);

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
    navigate('/item/new')
  }


  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Items</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label="Create new Item" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );


  const editColumnTemplate = (rowData) => {
    const editUrl = `/item/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
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
          setSelectedVariants(rowData.variants);
          setItemNameProp(rowData.name)
          toggleModal();
        }}>
          Show Variants
        </Button>
      </div>
    );
  };
  console.log(itemList, 'itemList')

  return (
    <div>
      <h2 id="item-heading" data-cy="ItemHeading">
        <Translate contentKey="tempApp.item.home.title">Items View</Translate>

      </h2>

      <div >
        <DataTable value={itemList} header={header} paginator rows={10}
                   loading={loading}
                   totalRecords={totalItems}
                   tableStyle={{ minWidth: '60rem' }}>
          
          <Column field="name" header="Name" />
          <Column header="Image" body={(rowData) =>
          <img src={rowData.attachments[0]?.url} alt={rowData.attachments[0]?.name}  className="w-6rem shadow-2 border-round" /> } />
          {/* <Column field="desc" header="Description" /> */}
          <Column header="Variant" body={variantColumnTemplate} />
          {/* <Column field="price" header="Price" body={priceBodyTemplate} /> */}
          <Column  header="Category" body={(rowData) => rowData.terms[0]?.name}  />
          <Column field="avgRating" header="Reviews" body={ratingBodyTemplate} />
          <Column field="orderCount" header="Order Count" />
          <Column field="stock" header="In Stock" />
          <Column header="Status" body={statusBodyTemplate}></Column>
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
            <VariantViewTest variants={selectedVariants} itemName={itemNameProp} />
          </div>
        </Modal>

      </div>

    </div>
  );
};

export default Item;
