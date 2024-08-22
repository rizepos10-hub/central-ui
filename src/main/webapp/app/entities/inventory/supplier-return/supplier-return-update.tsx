import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input, Table } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, createEntity, reset, updateEntity } from './supplier-return.reducer';
import { IReturnLine, ISupplierReturn } from "app/shared/model/STOCK/supplier-return.model";
import { getEntities as getWarehouses } from "app/entities/inventory/warehouse/warehouse.reducer";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { getSortState, Translate, translate } from "react-jhipster";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { getEntities as getSalesLocations } from "app/entities/inventory/sales-location/sales-location.reducer";
import { getEntities as getPurchaseOrders, reset as resetPO, getEntity as getPurchaseOrder } from "app/entities/inventory/purchase-order/purchase-order.reducer";
import Select from "react-select";
import { InputNumber } from "primereact/inputnumber";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { IPurchaseOrder } from "app/shared/model/STOCK/purchase-order.model";
import { InputTextarea } from "primereact/inputtextarea";
import { ColumnGroup } from "primereact/columngroup";
import { Button as PrimeButton } from "primereact/button";
import { SelectButton } from "primereact/selectbutton";
import { Card } from "primereact/card";


const statusOptions: any = [
  "PARKED",
  "COMPLETED"
]

export const SupplierReturnUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const poId = searchParams.get('poId');
  const { id } = useParams<'id'>();
  const isNew = id === undefined;


  const supplierReturnEntity = useAppSelector(state => state.supplierReturn.entity);
  const purchaseOrderEntity = useAppSelector(state => state.purchaseOrder.entity);

  const purchaseOrderList = useAppSelector(state => state.purchaseOrder.entities);

  const loading = useAppSelector(state => state.supplierReturn.loading);
  const updating = useAppSelector(state => state.supplierReturn.updating);

  const [supplierReturn, setSupplierReturn] = useState<ISupplierReturn>({
    purchaseOrder: { id: poId },
  });

  const [selectedReturnLines, setSelectedReturnLines] = useState([])


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const returnedIds = supplierReturn?.returnLines?.map(returnLine => returnLine?.orderLineId);

  const filteredOrderLines = supplierReturn?.purchaseOrder?.orderLines?.filter((ordrLine) => !returnedIds?.includes(ordrLine?.id));


  const isDisabled = supplierReturnEntity?.status === "COMPLETED";
  console.log(isDisabled, 'isDisabled');
  console.log(supplierReturnEntity, 'supplierReturnEntity')
  const handleClose = () => {
    navigate('/inventory/supplier-return' + location.search);
  };


  useEffect(() => {
    if (supplierReturnEntity) {
      setSupplierReturn(supplierReturnEntity)
    }
    if (isNew && purchaseOrderEntity) {
      setSupplierReturn((prevState) => ({ ...prevState, purchaseOrder: purchaseOrderEntity }))
    }
  }, [supplierReturnEntity?.id, purchaseOrderEntity.id]);


  useEffect(() => {
    if (isNew && poId) {
      dispatch(getPurchaseOrder(poId));
    }
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    const timer = setTimeout(() => {
      if (!isDisabled) {
        console.log(isDisabled, 'isDisabled')
        dispatch(getPurchaseOrders({
          query: `status=COMPLETED&filterReturned=${true}`,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        }));
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      dispatch(resetPO());
    }

  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    const updatedReturnLines: IReturnLine[] = selectedReturnLines?.filter((orderLine) => orderLine.received - orderLine.returnedQuantity > 0)
      ?.map((orderLine) => ({
        orderLineId: orderLine?.id,
        itemName: orderLine?.item?.name,
        quantity: orderLine.received - orderLine.returnedQuantity,
        returnPrice: orderLine?.price
      }));
    console.log(selectedReturnLines, 'selectedReturnLines')
    setSupplierReturn((prevState) => ({
      ...prevState,
      returnLines: [...(prevState.returnLines || []), ...updatedReturnLines]
    }));
    setSelectedReturnLines([]);
  };

  const handleReturnQuantityChange = (index, quantity) => {
    const updatedReturnLines = [...(supplierReturn?.returnLines || [])];
    updatedReturnLines[index] = {
      ...updatedReturnLines[index],
      quantity
    };
    setSupplierReturn((prevState) => ({
      ...prevState,
      returnLines: updatedReturnLines
    }));
  };

  const handleReturnPriceChange = (index, returnPrice) => {
    const updatedReturnLines = [...(supplierReturn?.returnLines || [])];
    updatedReturnLines[index] = {
      ...updatedReturnLines[index],
      returnPrice
    };
    setSupplierReturn((prevState) => ({
      ...prevState,
      returnLines: updatedReturnLines
    }));
  };


  const tableFooterTemplate = (
    <div className={"d-flex justify-content-end"}>
      <PrimeButton onClick={handleAdd} disabled={selectedReturnLines?.length === 0}>Add To Return Lines</PrimeButton>
    </div>
  );


  const handleRemoveClick = (index) => {
    setSupplierReturn((prevState) => {
      const updatedReturnLines = prevState?.returnLines?.filter((_, i) => i !== index);
      return {
        ...prevState,
        returnLines: updatedReturnLines
      }
    });
  };


  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...supplierReturn,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;
          navigate(`/inventory/warehouse/${newId}/edit`)
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/inventory/warehouse/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? `${translate('tempApp.supplierReturn.createNew')}` : `${translate('tempApp.supplierReturn.edit')}`}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3">
          <Card>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <form>
                <FormGroup>
                  <div className={'d-flex flex-column'}>
                    <strong>
                      <Label for="purchaseOrder">
                        <Translate contentKey={"tempApp.supplierReturn.purchaseOrder"} />
                      </Label>
                    </strong>
                    <Select
                      value={supplierReturn?.purchaseOrder || null}
                      options={purchaseOrderList}
                      getOptionLabel={(option: IPurchaseOrder) => option?.id}
                      getOptionValue={option => option.id}
                      id="purchaseOrder"
                      isDisabled={!isNew}
                      onChange={purchaseOrder => setSupplierReturn(prv => ({ ...prv, purchaseOrder }))}
                    />
                  </div>

                  <div className={'d-flex flex-column mt-2'}>
                    <strong>
                      <Label for="status">
                        <Translate contentKey={"common.status"} />  Status
                      </Label>
                    </strong>
                    <SelectButton
                      value={supplierReturn?.status ?? 'PARKED'}
                      options={statusOptions}
                      id="status"
                      disabled={isDisabled}
                      onChange={e => setSupplierReturn(prv => ({ ...prv, status: e.value }))}
                    />
                  </div>

                  <div className={'d-flex flex-column mt-2'}>
                    <strong>
                      <Label for="comment">
                        <Translate contentKey={"common.comment"} />
                      </Label>
                    </strong>
                    <InputTextarea
                      value={supplierReturn?.comment || ''}
                      id="comment"
                      disabled={isDisabled}
                      onChange={e => setSupplierReturn(prv => ({ ...prv, comment: e.target.value }))}
                    />
                  </div>

                  {!isDisabled ? (
                    <Row className={'mt-3'}>
                      <DataTable
                        value={filteredOrderLines || []}
                        selectionMode="multiple"
                        dataKey="id"
                        header={translate("tempApp.supplier.orderLines")}
                        emptyMessage={translate("tempApp.supplier.noOrderLines")}
                        metaKeySelection={false}
                        footer={tableFooterTemplate}
                        selection={selectedReturnLines}
                        onSelectionChange={e => setSelectedReturnLines(e.value)}
                      >
                        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                        <Column field="item.name" header={translate("common.item")} />
                        <Column field="lineTotal" header={translate("tempApp.supplierReturn.lineTotal")} />
                        <Column field="price" header={translate("common.price")} />
                        <Column field="received" header={translate("tempApp.supplierReturn.receivedQuantity")} />
                        <Column field="returnedQuantity" header={translate("tempApp.supplierReturn.returnedQuantity")} />
                        <Column body={rowData => rowData.received - rowData.returnedQuantity} header={translate("tempApp.supplierReturn.availableQuantity")} />
                      </DataTable>
                    </Row>
                  ) : null}

                  <Row className={'mt-3'}>
                    <h3>
                      <Translate contentKey={"tempApp.supplierReturn.returnLines"} />
                    </h3>
                    <Table>
                      <tbody>
                        <tr>
                          <td className={'font-bold'}>Order Line ID</td>
                          <td className={'font-bold'}>Item</td>
                          <td className={'font-bold'}>Return Quantity</td>
                          <td className={'font-bold'}>Return Price</td>
                          <td></td>
                          {!isDisabled ? <td className={'font-bold'}>Action</td> : null}
                        </tr>
                        {supplierReturn?.returnLines?.map((returnLine, index) => (
                          <tr key={index}>
                            <td className={'w-4'}>{returnLine?.orderLineId}</td>
                            <td className={'w-2'}>{returnLine?.itemName}</td>
                            <td className={'w-1'}>
                              <InputNumber
                                value={returnLine.quantity}
                                disabled={isDisabled}
                                onChange={e => handleReturnQuantityChange(index, e.value)}
                              />
                            </td>
                            <td className={'w-2'}>
                              <InputNumber
                                value={returnLine.returnPrice}
                                disabled={isDisabled}
                                onChange={e => handleReturnPriceChange(index, e.value)}
                              />
                            </td>
                            <td></td>
                            {!isDisabled ? (
                              <td>
                                <PrimeButton label={'Remove'} severity={'danger'} raised onClick={() => handleRemoveClick(index)} />
                              </td>
                            ) : null}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Row>
                </FormGroup>
                <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => navigate(-1)} color="info">
                  <FontAwesomeIcon icon="arrow-left" />
                  &nbsp;
                  <span className="d-none d-md-inline">
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </span>
                </Button>
                &nbsp;
                <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating || isDisabled}>
                  <FontAwesomeIcon icon="save" />
                  &nbsp;
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
                &nbsp;
                <Button onClick={(e) => saveEntity(e, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating || isDisabled}>
                  <FontAwesomeIcon icon="save" />
                  &nbsp;
                  <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                </Button>
              </form>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SupplierReturnUpdate;
