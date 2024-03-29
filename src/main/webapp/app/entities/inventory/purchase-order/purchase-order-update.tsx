import React, {useEffect, useMemo, useState} from 'react';
import {Link, useLocation, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {
  Button,
  Row,
  Col,
  FormGroup,
  Label,
  Input,
  Table,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  CardFooter
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import {getEntity, updateEntity, createEntity, reset, splitOrder} from './purchase-order.reducer';
import {InputText} from "primereact/inputtext";
import {CostLine, IPurchaseOrder, OrderLine} from "app/shared/model/STOCK/purchase-order.model";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {translate, Translate} from "react-jhipster";
import Select from "react-select";
import {IBranch} from "app/shared/model/branch.model";
import {  getEntities as getSuppliers } from '../supplier/supplier.reducer';
import {  getEntities as getWarehouses } from '../warehouse/warehouse.reducer';
import {ISupplier} from "app/shared/model/STOCK/supplier.model";
import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";
import {Calendar} from "primereact/calendar";
import AsyncSelect from "react-select/async";
import {IPurchaseConfig} from "app/shared/model/STOCK/purchase-config.model";
import {getEntities as getInventoryItems, searchEntities as searchInventoryItems} from "app/entities/inventory/stock-config/inventory-items.reducer";
import {InputNumber, InputNumberValueChangeEvent} from "primereact/inputnumber";
import {DataTable, DataTableRowEditCompleteEvent} from "primereact/datatable";
import {Column, ColumnEditorOptions} from "primereact/column";
import {SummarizeText} from "app/shared/util/SummarizeText";
import {InputTextarea} from "primereact/inputtextarea";
import {convertDateTimeToServer, toLocalISOString} from "app/shared/util/date-utils";
import {SelectButton} from "primereact/selectbutton";
import {IInventoryItem, IInventoryItemVariant} from "app/shared/model/STOCK/inventory-item.model";
import _ from "lodash";
import {applyMatchModeMap} from "app/shared/util/util-func";
import AuditLogs from "app/shared/components/logs/audit-logs";


const statusOptions = [
  "PLACED",
  "RECEIVED"
]

export const PurchaseOrderUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const searchLocation = new URLSearchParams(location.search)
  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const [searchParam]=  useSearchParams();

  const query = JSON.parse(searchLocation.get("query")) ;
  const [purchaseOrder, setPurchaseOrder] = useState<IPurchaseOrder>({
    status: "PLACED"
  });

  const [selectedItem, setSelectedItem] = useState<IInventoryItem>();
  const [selectedVariant, setSelectedVariant] = useState<IInventoryItemVariant>();

  const [purchaseOrderLine, setPurchaseOrderLine] = useState<OrderLine | null>()
  const [purchaseCostLine, setPurchaseCostLine] = useState<CostLine | null>()
  const supplierList = useAppSelector(state => state.supplier.entities);
  const warehouseList = useAppSelector(state => state.warehouse.entities);
  const inventoryItemList :IInventoryItem[] = useAppSelector(state => state.inventoryItem.entities);
  const loadingItems  = useAppSelector(state => state.inventoryItem.loading);



  const purchaseOrderEntity = useAppSelector(state => state.purchaseOrder.entity);
  const loading = useAppSelector(state => state.purchaseOrder.loading);
  const updating = useAppSelector(state => state.purchaseOrder.updating);
  const updateSuccess = useAppSelector(state => state.purchaseOrder.updateSuccess);



  const handleClose = () => {
    navigate(`/inventory/purchase-order/${purchaseOrderEntity?.id}/edit` + location.search);
  };

  const handleBranchChange = (selectedBranch: IBranch) => {
    setPurchaseOrder(prevState => ({...prevState, branch: selectedBranch}))
  };


  const isOrderReceived = purchaseOrderEntity?.status === "RECEIVED";
  const canSplit = !isOrderReceived && purchaseOrderEntity?.id;
  const isDisabled = !purchaseOrder.supplier || !purchaseOrder.warehouse || isOrderReceived;

  console.log(isDisabled, 'isDisabled')



  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getBranches({
      page: 0,
      size: 500,
      sort: 'asc',
    }));

    dispatch(getSuppliers({
      page: 0,
      size: 500,
      sort: 'asc',
    }));

    dispatch(getWarehouses({
      page: 0,
      size: 500,
      sort: 'asc',
    }));

    dispatch(getInventoryItems({
      page: 0,
      size: 500,
      sort: 'asc',
    }));

  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if(purchaseOrderEntity){
      setPurchaseOrder(purchaseOrderEntity)
    }
  }, [updateSuccess, purchaseOrderEntity?.id]);


  const filterItems = (inputValue: string) => {
    return inventoryItemList.filter((i) => {
        return (
          i.name.toLowerCase().includes(inputValue.toLowerCase())
        )
      }
    );
  };

  const loadItems = _.debounce((inputValue: string, e) => {
    if(e.action !== 'input-change') return;
    dispatch(searchInventoryItems({query: `name=${inputValue}`}));
  }, 300);

  const filterSuppliers = (inputValue: string) => {
    return supplierList.filter((sup) => {
        return (
          sup.name.toLowerCase().includes(inputValue.toLowerCase())
        )
      }
    );
  };

  const handleDateChange = (field, e) => {
    const date = new Date(e.value);
    const isoDateString = toLocalISOString(date);
    if(field === "costDate"){
      setPurchaseCostLine((prevState) => ({...prevState, costDate: isoDateString}))
    }else if(field === "dateDelivered" || field === "datePlaced"){
      setPurchaseOrder(prevState => ({ ...prevState, [field]: date }));
    }
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

  const handleSupplierReturn = () => {
    const supplierReturnLink = `/inventory/supplier-return/new?poId=${purchaseOrderEntity?.id}`;
    navigate(supplierReturnLink);
  };

  const handleOrderSplit = () => {
    const hasQuantityToSplit = purchaseOrder?.orderLines?.some((orderLine) => orderLine.received < orderLine.quantity);
    if(hasQuantityToSplit) {
      dispatch(splitOrder(purchaseOrderEntity?.id));
    }else{
      alert("All items in this order have already been received, so splitting isn't possible.")
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setPurchaseOrder(prevState => ({ ...prevState, [name]: value }));
  };

  const handleCostLineChange = e => {
    const { name, value } = e.target;
    setPurchaseCostLine(prevState => ({ ...prevState, [name]: value }));
  };

  const handleOrderLineChange = (field, value) => {
    setPurchaseOrderLine(prevState => ({ ...prevState, [field]: value }));
  };

  const handleSelectVariant = (variant: IInventoryItemVariant) => {
    setSelectedVariant(variant);

    const {itemPurchasingConfig: purchasingConfig } = variant;
    const itemSupplierConfig = purchasingConfig?.supplierConfigurations?.find((supConfig) =>
    supConfig.supplier?.id === purchaseOrder?.supplier?.id);

    const price = itemSupplierConfig ? itemSupplierConfig?.defaultPrice : purchasingConfig?.defaultPrice ?  purchasingConfig?.defaultPrice  : 0;
    const newItem = {
      item: {...variant, itemId: selectedItem.id, variantId: variant.id},
      price,
      quantity: purchasingConfig?.minOrderQuantity || 1,
      received: 0,
      returnedQuantity: 0
    }

    setPurchaseOrderLine(prevState => ({
      ...prevState,
      ...newItem
    }))
  }

  const handleAdd = (type) => {
    if(type === "orderLine"){
      setPurchaseOrder((prevState) => ({
        ...prevState,
        orderLines: [...(prevState.orderLines || []), purchaseOrderLine]
      }))
      setPurchaseOrderLine(null);
      setSelectedItem(null);
      setSelectedVariant(null);
    }else{
      setPurchaseOrder((prevState) => ({
        ...prevState,
        costLines: [...(prevState.costLines || []), purchaseCostLine]
      }))
      setPurchaseCostLine({});
    }
  };

  const validateQuantity = () => {
    const isValid = purchaseOrder?.orderLines?.every((orderLine) => orderLine.received >= 0 && orderLine.received <= orderLine.quantity);
    if (!isValid) {
      alert("Received quantity must be greater than 1 and less than or equal to the ordered quantity for all order lines.");
      return false;
    }
    return true;
  };

  const saveEntity = (e) => {
    e.preventDefault();

    if (purchaseOrder?.status === "RECEIVED") {
      const isValid = validateQuantity();
      if (!isValid) {
        return;
      }
    }
    const updatedQuery = applyMatchModeMap(query);

    const entity = {
      purchaseOrder: {
        ...purchaseOrder,
      },
      query: updatedQuery
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
      }
  };

  const textEditor = (options: ColumnEditorOptions) => {
    return <InputText type="text" value={options.value} onKeyDown={handleKeyDown} onChange={(e: React.ChangeEvent<HTMLInputElement>) => options?.editorCallback(e.target.value)} />;
  };

  const numberEditor = (options: ColumnEditorOptions) => {
    return <InputNumber value={options.value} onKeyDown={handleKeyDown}  onValueChange={(e: InputNumberValueChangeEvent) => options.editorCallback(e.value)} />;
  };

  const receivedEditor = (options: ColumnEditorOptions) => {
    const {rowData} = options;
    const {quantity} = rowData;
    return <InputNumber value={options.value} onKeyDown={handleKeyDown} max={quantity} onChange={(e) => options.editorCallback(e.value)} />

  };


  const onRowEditComplete = (e: DataTableRowEditCompleteEvent, field) => {
    const { newData, index } = e;
    if(newData.received < 0 || newData.received > newData.quantity){
      alert("Received quantity must be greater than or equal to 0 and less than or equal to the ordered quantity for all order lines.");
      return
    }
    setPurchaseOrder((prevState) => {
      const updatedField = prevState?.[field]?.map((row, i) => {
        if (i === index) {
          return newData
        }
        return row
      });

      return {
        ...prevState,
        [field]: updatedField
      }
    })
  };


  const deleteColumnTemplate = (rowData, index, field) => {
    console.log(rowData, index, field, 'dsds')
    const {rowIndex} = index
    const handleClick = () =>  {
      setPurchaseOrder((prevState) => {
        const updatedField = prevState?.[field]?.filter((_, i) => i !== rowIndex);
        return {
          ...prevState,
          [field]: updatedField
        }
      })
    }
    return (
        <FontAwesomeIcon onClick={handleClick} icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
    );
  };

  if(loading){
    return <Spinner />
  }

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? 'Add New Purchase Order' : isDisabled ? 'View Purchase Order' : 'Edit Purchase Order'}</h2>
        </Col>
      </Row>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Row>
          <form onSubmit={saveEntity} className={'d-flex'}>
            <Col md="9" className="d-flex flex-column p-3 bg-white">
              <FormGroup>
                <Row>
                  <Col md={4} className={'d-flex flex-column gap-2'}>
                    <div className={'d-flex gap-2 mt-2'}>
                      <Label for="supplier" className={'mt-2'}>
                        Supplier
                      </Label>
                      <Select
                        options={supplierList}
                        name="supplier"
                        id="supplier"
                        placeholder={'Select supplier'}
                        value={purchaseOrder?.supplier}
                        isDisabled={isOrderReceived}
                        getOptionLabel={(option: ISupplier) => option.name}
                        getOptionValue={option => option.id}
                        onChange={selectedSupplier => setPurchaseOrder(prev => ({ ...prev, supplier: selectedSupplier }))}
                      />
                    </div>

                    <div className={'d-flex gap-2 mt-2'}>
                      <Label for="warehouse" className={'mt-2'}>
                        warehouse
                      </Label>
                      <Select
                        name="warehouse"
                        id="warehouse"
                        placeholder={'Select warehouse'}
                        options={warehouseList}
                        value={purchaseOrder?.warehouse}
                        isDisabled={isOrderReceived || !purchaseOrder?.supplier}
                        getOptionLabel={(option: IWarehouse) => option.name}
                        getOptionValue={option => option.id}
                        onChange={selectedWarehouse => setPurchaseOrder(prev => ({ ...prev, warehouse: selectedWarehouse }))}
                      />
                    </div>
                  </Col>

                  <Col md={4} className={'d-flex flex-column gap-2'}>
                    <div className={'d-flex gap-2 mt-2'}>
                      <Label for="delivery" className={'mt-2'}>
                        Delivery
                      </Label>
                      <InputText
                        name="delivery"
                        id="delivery"
                        value={purchaseOrder?.delivery}
                        disabled={isDisabled}
                        onChange={handleChange}
                      />
                    </div>

                    <div className={'d-flex gap-2 mt-2'}>
                      <Label for="address" className={'mt-2'}>
                        Address
                      </Label>
                      <InputText name="address" id="address" value={purchaseOrder?.address} disabled={isDisabled} onChange={handleChange} />
                    </div>
                  </Col>

                  <Col md={4} className={'d-flex flex-column gap-2'}>
                    <div className={'d-flex gap-2  mt-2'}>
                      <Label for="datePlaced" className={'mt-2'}>
                        Order Date
                      </Label>
                      <Calendar
                        name="datePlaced"
                        id="datePlaced"
                        value={new Date(purchaseOrder.datePlaced)}
                        disabled={isDisabled}
                        onChange={e => handleDateChange('datePlaced', e)}
                      />
                    </div>

                    <div className={'d-flex gap-2 mt-2'}>
                      <Label for="dateDelivered" className={'mt-2'}>
                        Delivery Date
                      </Label>
                      <Calendar
                        name="dateDelivered"
                        id="dateDelivered"
                        value={new Date(purchaseOrder.dateDelivered)}
                        disabled={isDisabled}
                        onChange={e => handleDateChange('dateDelivered', e)}
                      />
                    </div>
                  </Col>
                </Row>

                {/* Order Lines */}
                <Row className={'mt-3'}>
                  <h3>Order Lines</h3>
                  {!isDisabled ? (
                    <Table>
                      <tbody>
                        <tr>
                          <td>Item</td>
                          <td>Variant</td>
                          <td>Description</td>
                          <td>Quantity</td>
                          <td>Cost Price</td>
                          <td>Delivery Date</td>
                          <td>Sub Total</td>
                        </tr>
                        <tr>
                          <td className={'col-md-3'}>
                            <Select
                              onInputChange={loadItems}
                              options={inventoryItemList}
                              getOptionValue={option => option.id}
                              getOptionLabel={option => option.name}
                              onChange={item => setSelectedItem(item)}
                              value={selectedItem || null}
                              onFocus={(e: any) => {
                                e.preventDefault();
                              }}
                              onBlur={(e: any) => {
                                e.preventDefault();
                              }}
                              isDisabled={isDisabled}
                              isLoading={loadingItems}
                            />
                          </td>

                          <td className={'col-md-3'}>
                            <Select
                              options={selectedItem?.variants}
                              getOptionValue={option => option.id}
                              getOptionLabel={option => option.name}
                              onChange={handleSelectVariant}
                              isDisabled={isDisabled || !selectedItem}
                              value={selectedVariant}
                            />
                          </td>

                          <td className={'col-md-2'}>
                            <InputTextarea
                              value={purchaseOrderLine?.description || ''}
                              disabled={isDisabled}
                              onChange={e => handleOrderLineChange('description', e.target.value)}
                            />
                          </td>
                          <td className={'col-md-1'}>
                            <InputNumber
                              value={purchaseOrderLine?.quantity}
                              disabled={isDisabled}
                              size={4}
                              onChange={e => handleOrderLineChange('quantity', e.value)}
                            />
                          </td>

                          <td className={'col-md-1'}>
                            <InputNumber
                              size={4}
                              value={purchaseOrderLine?.price}
                              disabled={isDisabled}
                              onChange={e => handleOrderLineChange('price', e.value)}
                            />
                          </td>
                          <td className={'col-md-2'}>
                            <Calendar
                              name="deliveryDate"
                              id="deliveryDate"
                              disabled={isDisabled}
                              onSelect={e => handleOrderLineChange('deliveryDate', e.value)}
                              value={new Date(purchaseOrderLine?.deliveryDate)}
                            />
                          </td>
                          <td className={'col-md-2'}>
                            <InputNumber disabled={true} size={4} value={purchaseOrderLine?.price * purchaseOrderLine?.quantity || null} />
                          </td>
                          <td className={'col-md-1'}>
                            <Button disabled={!purchaseOrderLine?.item} color={'success'} onClick={() => handleAdd('orderLine')}>
                              Add
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  ) : null}

                  <DataTable
                    value={purchaseOrder?.orderLines}
                    editMode="row"
                    header={'Order Lines'}
                    removableSort
                    paginator
                    totalRecords={purchaseOrder?.orderLines?.length}
                    rows={20}
                    onRowEditComplete={e => onRowEditComplete(e, 'orderLines')}
                  >
                    <Column field="item.name" header={'Item'} />
                    <Column field="description" editor={options => textEditor(options)} header={'Description'} />
                    <Column field="quantity" editor={options => numberEditor(options)} header={'Quantity'} />
                    <Column field="received" editor={options => receivedEditor(options)} header={'Received Quantity'} />
                    <Column field="returnedQuantity" header={'Returned Quantity'} />
                    <Column field="price" editor={options => numberEditor(options)} header={'Cost Price'} />
                    <Column
                      field="deliveryDate"
                      header={'Delivery Date'}
                      body={rowData => (rowData.deliveryDate ? new Date(rowData.deliveryDate).toDateString() : '')}
                    />
                    <Column header={'Sub Total'} body={rowData => rowData.price * rowData.quantity} />
                    {!isDisabled ? (
                      <Column rowEditor headerStyle={{ width: '10%', minWidth: '8rem' }} bodyStyle={{ textAlign: 'center' }} />
                    ) : null}

                    {!isDisabled ? (
                      <Column
                        header={'Delete'}
                        body={(rowData, index) => deleteColumnTemplate(rowData, index, 'orderLines')}
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
                              onChange={supplier => setPurchaseCostLine(prevState => ({ ...prevState, supplier }))}
                              value={purchaseCostLine?.supplier || null}
                              isDisabled={isDisabled}
                            />
                          </td>
                          <td className={'w-1'}>
                            <InputNumber
                              value={purchaseCostLine?.cost}
                              disabled={isDisabled}
                              onChange={e =>
                                setPurchaseCostLine(prevState => ({
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
                              value={new Date(purchaseCostLine?.costDate)}
                            />
                          </td>
                          <td className={'w-1'}>
                            <InputTextarea
                              name={'comment'}
                              disabled={isDisabled}
                              value={purchaseCostLine?.comment || ''}
                              onChange={handleCostLineChange}
                            />
                          </td>
                          <td className={'w-2'}>
                            <Button disabled={!purchaseCostLine} color={'success'} onClick={() => handleAdd('costLine')}>
                              Add
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  ) : null}

                  <DataTable
                    value={purchaseOrder?.costLines}
                    editMode="row"
                    header={'Cost Lines'}
                    removableSort
                    paginator
                    totalRecords={purchaseOrder?.costLines?.length}
                    rows={20}
                  >
                    <Column field="supplier.name" header={'Supplier'} />
                    <Column field="cost" header={'Cost'} />
                    <Column field="costDate" header={'Cost Date'} />
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
                      value={purchaseOrder?.status ?? 'PLACED'}
                      options={statusOptions}
                      id="status"
                      disabled={isOrderReceived || isNew}
                      onChange={e => setPurchaseOrder(prv => ({ ...prv, status: e.value }))}
                    />
                  </div>
                </CardBody>
                <div className={'d-flex gap-3 mt-2'}>
                  <Button tag={Link} to="/inventory/purchase-order" replace color="info">
                    <FontAwesomeIcon icon="arrow-left" />
                    &nbsp;Back
                  </Button>
                  {isOrderReceived ? (
                    <Button color={'primary'} id="returnItems" onClick={handleSupplierReturn}>
                      Return Items
                    </Button>
                  ) : null}
                  {canSplit ? (
                    <Button color={'primary'} id="splitOrder" onClick={handleOrderSplit}>
                      Split & Complete Order
                    </Button>
                  ) : null}
                  {purchaseOrderEntity?.status !== 'RECEIVED' ? (
                    <Button color="primary" type="submit" disabled={updating || isDisabled}>
                      <FontAwesomeIcon icon="save" />
                      &nbsp;Save
                    </Button>
                  ) : null}
                </div>
              </Card>

              {purchaseOrderEntity?.id && <AuditLogs entityId={purchaseOrderEntity?.id} />}
            </Col>
          </form>
        </Row>
      )}
    </div>
  );
};

export default PurchaseOrderUpdate;
