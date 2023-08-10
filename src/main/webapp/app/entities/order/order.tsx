import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, InputGroup, FormGroup, Form, Row, Col, Table } from 'reactstrap';
import {getSortState, JhiItemCount, JhiPagination, TextFormat, Translate, translate} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './order.css'
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';


import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IOrder } from 'app/shared/model/order.model';
import { searchEntities, getEntities } from './order.reducer';
import {ASC, DESC, ITEMS_PER_PAGE, SORT} from "app/shared/util/pagination.constants";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";

import { searchEntities as searchBranches, getEntities as getBranches } from '../branch/branch.reducer';
import {format} from "date-fns";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";

export const Order = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [selectAll, setSelectAll] = useState(false);
  const [fromDate, setFromDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format((new Date()), "yyyy-MM-dd"));
  const [selectedOrder, setSelectedOrders] = useState(null);

  const orderList = useAppSelector(state => state.order.entities);
  const branchList = useAppSelector(state => state.branch.entities);

  const loading = useAppSelector(state => state.order.loading);
  const totalOrders = useAppSelector(state => state.order.totalOrders)

  console.log(orderList, 'orderList')

  const getBranchName = (branchId) => {
    const branch = branchList.find(branch => branch.id === branchId);
    return branch ? branch.name : 'Unknown Branch';
  };

  const handleFromDateChange = (event) => {
    setFromDate(event.target.value);
  };

  const handleToDateChange = (event) => {
    setToDate(event.target.value);
  };

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
        getEntities(({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        }))
      );
    }
  };




  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (location.search !== endURL) {
      navigate(`${location.pathname}${endURL}`);
    }
  };

  useEffect(() => {
    sortEntities();
   dispatch(getBranches({}))
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





  const handleSyncList = () => {
    sortEntities();
  };

  const onSelectionChange = (event) => {
    const value = event.value;
    setSelectedOrders(value)
    setSelectAll(value.length === orderList);
  };


  return (
    <div>
      <h2 id="order-heading" data-cy="OrderHeading">
        <Translate contentKey="tempApp.order.home.title">Orders</Translate>
        <div className="d-flex justify-content-end">
          <Button className="me-2" color="info" onClick={handleSyncList} disabled={loading}>
            <FontAwesomeIcon icon="sync" spin={loading} />{' '}
            <Translate contentKey="tempApp.order.home.refreshListLabel">Refresh List</Translate>
          </Button>
        </div>
      </h2>
      <Row>
        <Col sm="12">
          <form onSubmit={() => {}}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="fromDate" className="form-label">From Date:</label>
                <input type="date" id="fromDate" className="form-control" value={fromDate} onChange={handleFromDateChange} />
              </div>
              <div className="col-md-6">
                <label htmlFor="toDate" className="form-label">To Date:</label>
                <input type="date" id="toDate" className="form-control" value={toDate} onChange={handleToDateChange} />
              </div>
            </div>
            <div className="text-center">
              <button type="submit" className="btn btn-primary">{loading? "Loading..." : "Get Orders"}</button>
            </div>
          </form>
        </Col>
      </Row>
      <div >
        {orderList && orderList.length > 0 ? (
          <div className="cardox">


            <DataTable value={orderList} lazy filterDisplay="row" dataKey="id" tableStyle={{ minWidth: '75rem' }} paginator rows={10}
                       totalRecords={300}  selectAll={selectAll} selection={selectedOrder} onSelectionChange={onSelectionChange}
            >
              <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
              <Column
                field="id"
                header="Order ID"
                body={(rowData): any => (
                  <Link to={`/order/${rowData.id}`}>
                    {rowData.id}
                  </Link>
                )}
              />
              <Column field="branchId" sortable filter header="Order Branch" body={rowData => getBranchName(rowData.branchId)}/>
              <Column field="createdDate" filter header="Order Date" body={rowData => rowData.createdDate?
                <TextFormat type="date" value={rowData.createdDate} format={APP_DATE_FORMAT} /> : null} />
              <Column field="byClient" sortable filter header="Order Source" />
              <Column field="discount" sortable filter header="Order Discount" body={rowData => rowData.discount? <p className="text-success ">&#10004;</p>:
                <p className="text-danger   ">&#10006;</p> } filterMatchMode="custom"
              />

              <Column field="byClient" filter header="Order Source" />
              <Column field="tables" filter header="Order Tables" />
              <Column field="status" filter header="Order Status" />
              createdAt
            </DataTable>

          </div>
        ) : (
          !loading && (
            <div className="alert alert-warning">
              <Translate contentKey="tempApp.order.home.notFound">No Orders found</Translate>
            </div>
          )
        )}
      </div>

    </div>
  );
};

export default Order;
