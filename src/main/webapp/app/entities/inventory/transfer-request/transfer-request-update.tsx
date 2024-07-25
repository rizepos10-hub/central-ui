import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input, Table, Card, CardHeader, CardBody } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, createEntity, reset, updateEntity } from './transfer-request.reducer';
import { ITransferRequest, ITRItem } from "app/shared/model/STOCK/transfer-request.model";
import { getEntities as getWarehouses } from "app/entities/inventory/warehouse/warehouse.reducer";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { getSortState } from "react-jhipster";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { searchEntities as getStockItems } from "app/entities/inventory/stock-config/stock-quantity.reducer";
import { getEntities as getSuppliers } from '../supplier/supplier.reducer';
import { getEntities as getSalesLocations } from "app/entities/inventory/sales-location/sales-location.reducer";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { InputNumber } from "primereact/inputnumber";
import { IPurchaseConfig } from "app/shared/model/STOCK/purchase-config.model";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { SelectButton } from "primereact/selectbutton";
import AuditLogs from "app/shared/components/logs/audit-logs";
import { ISupplier } from 'app/shared/model/STOCK/supplier.model';
import { CostLine, IPurchaseOrder } from 'app/shared/model/STOCK/purchase-order.model';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { toLocalISOString } from 'app/shared/util/date-utils';
import { format } from 'date-fns';

const statusOptions = [
  "PLACED",
  "CONFIRMED"
]

export const TransferRequestUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;


  const transferRequestEntity = useAppSelector(state => state.transferRequest.entity);
  const warehouseList = useAppSelector(state => state.warehouse.entities);
  const salesLocationList = useAppSelector(state => state.salesLocation.entities);

  const loading = useAppSelector(state => state.transferRequest.loading);
  const updating = useAppSelector(state => state.transferRequest.updating);
  const updateSuccess = useAppSelector(state => state.transferRequest.updateSuccess);
  const stockItemsList = useAppSelector(state => state.stockQuantity.entities);

  const supplierList = useAppSelector(state => state.supplier.entities);

  const [transferRequest, setTransferRequest] = useState<ITransferRequest>({});
  const [transferRequestItem, setTransferRequestItem] = useState<ITRItem>();
  const [costLines, setCostLines] = useState<CostLine | null>()


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const warehousesAndSalesLocations = [...(warehouseList || []), ...(salesLocationList || [])];

  const filteredStockItems = useMemo(() => {
    return stockItemsList.filter(stockConfig => !transferRequest.transferItems?.some(TRItem => TRItem.item.variantId === stockConfig.variantId))
  }, [transferRequest.transferItems?.length, stockItemsList, transferRequest.source?.id]);

  // filtering the destination if the selected source if from type sales location because we cant transfer from sales location to a sales location
  const destinationOptions = transferRequest?.source?.type === "SALES_LOCATION" ?
    warehousesAndSalesLocations?.filter((opt) => opt.id !== transferRequest?.source.id || opt.type !== "SALES_LOCATION")
    :
    warehousesAndSalesLocations?.filter((opt) => opt.id !== transferRequest?.source?.id);

  const query = transferRequest?.source?.id ? `location=${transferRequest?.source?.id}&` : null;

  const isConfirmed = transferRequestEntity?.status === "CONFIRMED"

  const isDisabled = !transferRequest.source || isConfirmed;

  const handleClose = () => {
    navigate('/inventory/transfer-request' + location.search);
  };

  const handleAdd = (type) => {
    if (type === "costLine") {
      setTransferRequest((prevState) => ({
        ...prevState,
        costLines: [...(prevState.costLines || []), costLines]
      }))
      setCostLines({});
    } else {
      setTransferRequest((prevState) => ({
        ...prevState,
        transferItems: [...(prevState.transferItems || []), transferRequestItem]
      }));
      setTransferRequestItem(null);
    }
  };


  const handleSelectItem = (selectedItem) => {
    const itemToTransfer = {
      ...selectedItem,
      name: selectedItem.itemName
    }
    setTransferRequestItem(prevState => ({ ...prevState, item: itemToTransfer }))
  }

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getWarehouses({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`
    }));

    dispatch(getSalesLocations({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getSuppliers({
      page: 0,
      size: 500,
      sort: 'asc',
    }));
  }, []);

  useEffect(() => {
    {
      query &&
        dispatch(getStockItems({
          query,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        }));
    }
  }, [query])



  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if (transferRequestEntity) {
      setTransferRequest(transferRequestEntity)
    }
  }, [updateSuccess, transferRequestEntity?.id]);

  const filterItems = (inputValue: string) => {
    return filteredStockItems.filter((i) => {
      return (
        i?.itemName?.toLowerCase().includes(inputValue.toLowerCase())
      )
    }
    );
  };

  const loadItems = (
    inputValue: string,
    callback: (options: IPurchaseConfig[]) => void
  ) => {
    setTimeout(() => {
      try {
        const filteredOptions = filterItems(inputValue);
        callback(filteredOptions);
      } catch (error) {
        console.error('Error loading items:', error);
      }
    }, 1000);
  };


  const deleteColumnTemplate = (rowData, index, field) => {
    const { rowIndex } = index
    const handleClick = () => {
      setTransferRequest((prevState) => {
        const updatedField = prevState?.[field]?.filter((_, i) => i !== rowIndex);
        return {
          ...prevState,
          [field]: updatedField
        }
      })
    }
    return (
      <FontAwesomeIcon onClick={handleClick} icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
    );
  };


  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...transferRequest,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity))
    }
  };

  const filterSuppliers = (inputValue: string) => {
    return supplierList.filter((sup) => {
      return (
        sup.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    }
    );
  };


  const loadSuppliers = (
    inputValue: string,
    callback: (options: ISupplier[]) => void
  ) => {
    setTimeout(() => {
      try {
        const filteredOptions = filterSuppliers(inputValue);
        callback(filteredOptions);
      } catch (error) {
        console.error('Error loading suppliers:', error);
      }
    }, 1000);
  };

  const handleDateChange = (field, e) => {
    const date = new Date(e.value);
    const isoDateString = toLocalISOString(date);
    if (field === "costDate") {
      setCostLines((prevState) => ({ ...prevState, costDate: isoDateString }))
    } else if (field === "dateDelivered" || field === "datePlaced") {
      setTransferRequest(prevState => ({ ...prevState, [field]: date }));
    }
  };

  const handleCostLineChange = e => {
    const { name, value } = e.target;
    setCostLines(prevState => ({ ...prevState, [name]: value }));
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? 'Add New Transfer Request' : 'View Transfer Request'}</h2>
        </Col>
      </Row>
      <Row>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <Row>
            <form onSubmit={saveEntity} className={'d-flex'}>
              <Col md="9" className="d-flex flex-column p-3 bg-white">
                <FormGroup>
                  <div className={'d-flex flex-column'}>
                    <Label for="source">Source</Label>
                    <Select
                      value={transferRequest?.source}
                      options={warehousesAndSalesLocations}
                      getOptionLabel={option => option?.name}
                      getOptionValue={option => option.id}
                      id="source"
                      isDisabled={transferRequestEntity.status === 'CONFIRMED'}
                      onChange={source => setTransferRequest(prv => ({ ...prv, source, transferItems: [] }))}
                    />
                  </div>

                  <div className={'d-flex flex-column mt-2'}>
                    <Label for="destination">Destination</Label>
                    <Select
                      value={transferRequest?.destination}
                      options={destinationOptions}
                      getOptionLabel={option => option?.name}
                      getOptionValue={option => option.id}
                      id="destination"
                      isDisabled={isDisabled}
                      onChange={destination => setTransferRequest(prv => ({ ...prv, destination }))}
                    />
                  </div>

                  {!isDisabled ? (
                    <Row className={'mt-3'}>
                      <h3>Transfer Items</h3>
                      <Table>
                        <tbody>
                          <tr>
                            <td>Item</td>
                            <td>Quantity in Source</td>
                            <td>Quantity To Transfer</td>
                            <td>Received Quantity</td>
                          </tr>
                          <tr>
                            <td>
                              <AsyncSelect
                                cacheOptions
                                loadOptions={loadItems}
                                defaultOptions={filteredStockItems}
                                getOptionValue={option => option.variantId}
                                getOptionLabel={option => option.itemName}
                                onChange={handleSelectItem}
                                value={transferRequestItem?.item || null}
                                isDisabled={isDisabled}
                              />
                            </td>
                            <td className={'w-1 '}>
                              <InputNumber value={transferRequestItem?.item?.quantity} size={8} disabled />
                            </td>
                            <td className={'w-1'}>
                              <InputNumber
                                size={8}
                                value={transferRequestItem?.quantity}
                                disabled={isDisabled || transferRequestItem?.item?.quantity <= 0}
                                max={transferRequestItem?.item?.quantity}
                                onValueChange={e =>
                                  setTransferRequestItem(prevState => ({
                                    ...prevState,
                                    quantity: e.value,
                                  }))
                                }
                              />
                            </td>

                            <td className={'w-1'}>
                              <InputNumber
                                size={8}
                                value={transferRequestItem?.receivedQuantity}
                                disabled={transferRequestItem?.item?.quantity <= 0 || isDisabled}
                                max={transferRequestItem?.item?.quantity}
                                onValueChange={e =>
                                  setTransferRequestItem(prevState => ({
                                    ...prevState,
                                    receivedQuantity: e.value,
                                  }))
                                }
                              />
                            </td>

                            <td className={'w-2'}>
                              <Button
                                disabled={
                                  isDisabled ||
                                  transferRequestItem?.item?.quantity <= 0 ||
                                  !transferRequestItem?.item ||
                                  !transferRequestItem?.receivedQuantity
                                }
                                color={'success'}
                                onClick={handleAdd}
                              >
                                Add
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Row>
                  ) : null}
                  <Row className={'mt-3'}>
                    <DataTable
                      value={transferRequest?.transferItems}
                      editMode="row"
                      header={'Transferred Items'}
                      removableSort
                      paginator
                      totalRecords={transferRequest?.transferItems?.length}
                      rows={10}
                    >
                      <Column field="item.name" header={'Item'} />
                      <Column field="quantity" header={'Transferred Quantity'} />
                      <Column field="receivedQuantity" header={'Received Quantity'} />

                      {transferRequestEntity.status !== 'CONFIRMED' ? (
                        <Column
                          header={'Delete'}
                          body={(rowData, index) => deleteColumnTemplate(rowData, index, 'transferItems')}
                          headerStyle={{ width: '1%' }}
                          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
                        />
                      ) : null}
                    </DataTable>
                  </Row>

                  <Row className={'mt-3'}>
                    <h3>Cost Lines</h3>
                    {!isDisabled ? (
                      <Table>
                        <tbody>
                          <tr>
                            <td>Supplier</td>
                            <td>Cost</td>
                            <td>Cost Date</td>
                            <td>Comments</td>
                          </tr>
                          <tr>
                            <td className={'w-2'}>
                              <AsyncSelect
                                cacheOptions
                                loadOptions={loadSuppliers}
                                defaultOptions={supplierList}
                                getOptionValue={(option: ISupplier) => option.id}
                                getOptionLabel={option => option.name}
                                name={'supplier'}
                                onChange={supplier => setCostLines(prevState => ({ ...prevState, supplier }))}
                                value={costLines?.supplier || null}
                                isDisabled={isDisabled}
                              />
                            </td>
                            <td className={'w-1'}>
                              <InputNumber
                                value={costLines?.cost}
                                disabled={isDisabled}
                                onChange={e =>
                                  setCostLines(prevState => ({
                                    ...prevState,
                                    cost: e.value,
                                  }))
                                }
                              />
                            </td>
                            <td className={'w-1'}>
                              <Calendar
                                name="costDate"
                                id="costDate"
                                disabled={isDisabled}
                                onSelect={e => handleDateChange('costDate', e)}
                                value={new Date(costLines?.costDate)}
                              />
                            </td>
                            <td className={'w-1'}>
                              <InputTextarea
                                name={'comment'}
                                disabled={isDisabled}
                                value={costLines?.comment || ''}
                                onChange={handleCostLineChange}
                              />
                            </td>
                            <td className={'w-2'}>
                              <Button disabled={!costLines} color={'success'} onClick={() => handleAdd('costLine')}>
                                Add
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    ) : null}

                    <DataTable
                      value={transferRequest?.costLines}
                      editMode="row"
                      header={'Cost Lines'}
                      removableSort
                      paginator
                      totalRecords={transferRequest?.costLines?.length}
                      rows={20}
                    >
                      <Column field="supplier.name" header={'Supplier'} />
                      <Column field="cost" header={'Cost'} />
                      <Column field="costDate" header={'Cost Date'} body={(rowData) => format(new Date(rowData?.costDate), 'yyyy-MM-dd')} />
                      <Column field="comment" header={'Comment'} />
                      {!isDisabled ? (
                        <Column
                          header={'Delete'}
                          body={(rowData, index) => deleteColumnTemplate(rowData, index, 'costLines')}
                          headerStyle={{ width: '1%' }}
                          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
                        />
                      ) : null}
                    </DataTable>
                  </Row>
                </FormGroup>
              </Col>

              <Col md="3" className={'ml-3'}>
                <Card>
                  <CardHeader>Actions</CardHeader>
                  <CardBody>
                    <div className={'d-flex flex-column mt-2'}>
                      <Label for="status">Status</Label>
                      <SelectButton
                        value={transferRequest?.status ?? 'PLACED'}
                        options={statusOptions}
                        id="status"
                        disabled={isDisabled}
                        onChange={e => setTransferRequest(prv => ({ ...prv, status: e.value }))}
                      />
                    </div>
                  </CardBody>
                  <div className={'d-flex gap-3 mt-2'}>
                    <Button tag={Link} to="/inventory/transfer-request" replace color="info">
                      <FontAwesomeIcon icon="arrow-left" />
                      &nbsp;Back
                    </Button>

                    {!isConfirmed ? (
                      <Button color="primary" type="submit" disabled={updating || isDisabled}>
                        <FontAwesomeIcon icon="save" />
                        &nbsp;Save
                      </Button>
                    ) : null}
                  </div>
                </Card>

                {transferRequestEntity?.id && <AuditLogs entityId={transferRequestEntity?.id} />}
              </Col>
            </form>
          </Row>
        )}
      </Row>
    </div>
  );
};

export default TransferRequestUpdate;
