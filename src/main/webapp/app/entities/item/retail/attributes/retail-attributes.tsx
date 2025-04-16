import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { getSortState, translate, Translate, } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities } from './retail-attribute.reducer';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { FilterMatchMode } from "primereact/api";
import { Col, FormGroup, Row } from 'reactstrap';
import RetailAttributeAdd from "app/entities/item/retail/attributes/retail-attribute-add";
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';

const initialState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  },
};

export const RetailAttributes = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();

  const [searchParam, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParam.get('query')) || initialState;

  const retailAttributeList = useAppSelector(state => state.retailAttribute.entities);
  const loading = useAppSelector(state => state.retailAttribute.loading);
  const totalItems = useAppSelector(state => state.retailAttribute.totalItems);


  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      searchEntities({
        query: updatedQuery,
      })
    );
  };

  useEffect(() => {
    getAllEntities();
  }, [searchParam]);

  const nameColumnTemplate = rowData => {
    const editUrl = `/retail/attributes/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/retail/attributes/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/retail/attributes/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>

        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };



  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'retailAttributes.view.table.title'}>Retail Attributes</Translate></span>

    </div>
  );

  const onPage = event => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const onSort = event => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const onFilter = event => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };


  return (
    <div>
      <Col md={"6"}>
        <RetailAttributeAdd type={"Attribute"} />
      </Col>
      <Row>

        <Col md={"12"}>
          <DataTable
            value={retailAttributeList}
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
            filterDelay={500}
            loading={loading}
            onSort={onSort}
            sortField={query.sortField}
            sortOrder={query.sortOrder}
            showGridlines
          >
            <Column field="name" header={translate('retailAttributes.view.table.fields.name')} filter body={nameColumnTemplate} filterPlaceholder={translate('retailAttributes.view.table.search.name')} sortable />


            <Column header={translate('retailAttributes.view.table.fields.configure')} body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
              bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

            <Column header={translate('retailAttributes.view.table.fields.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%', }}
              bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

          </DataTable>
        </Col>
      </Row>
    </div>
  );
};

export default RetailAttributes;
