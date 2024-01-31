import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {Button, Row, Col, FormText, Spinner, FormGroup, Table} from 'reactstrap';
import {getSortState, isNumber, Translate, translate, ValidatedField, ValidatedForm} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import {mapIdList, overridePaginationStateWithQueryParams} from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IItem } from 'app/shared/model/ITEM/item.model';
import { getEntities as getItems } from 'app/entities/item/restaurant/regular-item/item.reducer';
import { IAddon } from 'app/shared/model/addon.model';
import {
  getEntity as getRetailAttribute,
  updateEntity as updateRetailAttribute,
  createEntity as createRetailAttribute,
  reset as resetRetailAttribute
} from './retail-attribute.reducer';
import {
  getEntities as getRetailAttributeValues,
  updateEntity as updateRetailAttributeValue,
  createEntity as createRetailAttributeValue,
  reset as resetRetailAttributeValues, deleteEntity,

} from './retail-attribute-values.reducer';
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import RetailAttributeAdd from "app/entities/item/retail/attributes/retail-attribute-add";
import {DataTable, DataTableRowEditCompleteEvent} from "primereact/datatable";
import {Column} from "primereact/column";
import {InputText} from "primereact/inputtext";


export const RetailAttributeValuesUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const retailAttributeValues = useAppSelector(state => state.retailAttributeValue.entities);
  const loadingAttributeValue = useAppSelector(state => state.retailAttributeValue.loading);
  const updatingAttributeValue= useAppSelector(state => state.retailAttributeValue.updating);
  const updateSuccessAttributeValue = useAppSelector(state => state.retailAttributeValue.updateSuccess);
  const totalItems = useAppSelector(state => state.retailAttributeValue.totalItems);

  const retailAttributeEntity = useAppSelector(state => state.retailAttribute.entity);
  const loadingAttribute = useAppSelector(state => state.retailAttribute.loading);
  const updatingAttribute = useAppSelector(state => state.retailAttribute.updating);
  const updateSuccessAttribute = useAppSelector(state => state.retailAttribute.updateSuccess);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  console.log(retailAttributeEntity, 'retailAttributeEntity')
  console.log(retailAttributeValues, 'retailAttributeValues')


  const handleClose = () => {
    navigate('/retail/attributes' + location.search);
  };

  useEffect(() => {
  dispatch(getRetailAttribute(id));
  dispatch(getRetailAttributeValues({
    id:  id,
    page: paginationState.activePage - 1,
    size: paginationState.itemsPerPage,
    sort: `${paginationState.sort},${paginationState.order}`,
  }));
    return () => {
      resetRetailAttribute()
      resetRetailAttributeValues()
    }
  }, [updateSuccessAttributeValue]);


  const textEditor = (options) => {
    return <InputText type="text" value={options.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => options.editorCallback(e.target.value)} />;
  };


  const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
    const attrValues = [...retailAttributeValues];
    const { newData } = e;
    const { id: editedAttrId } = newData;

    dispatch(updateRetailAttributeValue(newData))
    console.log(newData, 'newData' )
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'retailAttributes.update.edit.table.title'} interpolate={{attribute: retailAttributeEntity?.key}}>{retailAttributeEntity?.key} Values</Translate></span>

    </div>
  );

  const deleteColumnTemplate = (rowData) => {
    const deleteAttr = () => {
      const isConfirmed = window.confirm(translate('retailAttributes.update.edit.confirmDelete', {value: rowData?.name}));
      if(isConfirmed){
        dispatch(deleteEntity(rowData?.id))
      }
    }
    return (

        <FontAwesomeIcon onClick={deleteAttr}  icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
    );
  };


  if(loadingAttribute){
    return <Spinner />
  }


  return (
    <div>
      <Row>
        <Col md="8">
          <h2 >
            <Translate contentKey={'retailAttributes.update.edit.title'} interpolate={{attribute: retailAttributeEntity?.key}}>
              {`Add New ${retailAttributeEntity?.key}`}
            </Translate>
          </h2>
        </Col>
      </Row>
      <Row className="  bg-white" >
        <Col md="4"  className="d-flex flex-column p-3 ">
          <FormGroup>
          <RetailAttributeAdd type={"Attribute Value"} attributeId={retailAttributeEntity?.id} />
          </FormGroup>
        </Col>
        <Row>
        <Col md="12"  className="d-flex flex-column p-3 ">

          <DataTable
            header={header}
            loading={loadingAttributeValue || updatingAttributeValue}
            value={retailAttributeValues}
            editMode="row"
            dataKey="id"
            removableSort
            onRowEditComplete={onRowEditComplete}
            filterDisplay="row"
            paginator
            totalRecords={totalItems}
            rows={20}
          >
            <Column field="name" header={translate('retailAttributes.update.edit.table.fields.name')} editor={(options) => textEditor(options)} style={{ width: '20%' }}></Column>

            <Column rowEditor  headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}} bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />
            <Column  body={deleteColumnTemplate}  headerStyle={{ width: '1%',  }} bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}  />

          </DataTable>
        </Col>
        </Row>
      </Row>
    </div>
  );
};

export default RetailAttributeValuesUpdate;
