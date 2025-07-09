import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { getSortState, translate, Translate, } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, updateEntity } from './retail-attribute.reducer';
import { DataTable, DataTableRowEditCompleteEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { FilterMatchMode } from "primereact/api";
import { Col, FormGroup, Row } from 'reactstrap';
import RetailAttributeAdd from "app/entities/item/retail/attributes/retail-attribute-add";
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { InputText } from "primereact/inputtext";

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
  const updating = useAppSelector(state => state.retailAttribute.updating);
  const updateSuccess = useAppSelector(state => state.retailAttribute.updateSuccess);
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
  }, [searchParam, updateSuccess]);

  const textEditor = (options) => {
    return (
      <InputText 
        type="text" 
        value={options.value} 
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => options.editorCallback(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            // Find the save button and click it
            const saveButton = (e.target as HTMLElement).closest('tr')?.querySelector('[data-pc-section="roweditorsavebutton"]');
            if (saveButton) {
              (saveButton as HTMLElement).click();
            }
          }
        }}
      />
    );
  };

  const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
    const { newData } = e;
    dispatch(updateEntity(newData));
  };

  const nameColumnTemplate = rowData => {
    const editUrl = `/retail/attributes/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };

  const viewColumnTemplate = (rowData) => {
    const viewUrl = `/retail/attributes/${rowData.id}/edit`;
    return (
      <Link to={viewUrl}>
        <FontAwesomeIcon icon="eye" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
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
            dataKey="id"
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
            loading={loading || updating}
            onSort={onSort}
            onRowEditComplete={onRowEditComplete}
            sortField={query.sortField}
            sortOrder={query.sortOrder}
            showGridlines
          >
            <Column 
              field="name" 
              header={translate('retailAttributes.view.table.fields.name')} 
              filter 
              editor={(options) => textEditor(options)}
              filterPlaceholder={translate('retailAttributes.view.table.search.name')} 
              sortable 
            />

            <Column 
              rowEditor 
              headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
              bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} 
              header={translate('retailAttributes.view.table.fields.configure')}
            />


            <Column header={translate('retailAttributes.view.table.fields.view')} body={viewColumnTemplate} headerStyle={{ width: '1%', }}
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
