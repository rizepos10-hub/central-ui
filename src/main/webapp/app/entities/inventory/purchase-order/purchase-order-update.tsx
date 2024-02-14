import React, {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {Button, Row, Col, FormGroup, Label, Input, Table, Spinner} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './purchase-order.reducer';
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
import {IStockConfig} from "app/shared/model/STOCK/stock-config.model";
import {getEntities as getStockItems} from "app/entities/inventory/stock-config/stock-config.reducer";
import {InputNumber} from "primereact/inputnumber";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {SummarizeText} from "app/shared/util/SummarizeText";
import {InputTextarea} from "primereact/inputtextarea";
import {convertDateTimeToServer, toLocalISOString} from "app/shared/util/date-utils";
import {SelectButton} from "primereact/selectbutton";


const statusOptions = [
  "PLACED",
  "COMPLETED"
]

export const PurchaseOrderUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [purchaseOrder, setPurchaseOrder] = useState<IPurchaseOrder>({
    status: "PLACED"
  });

  const [purchaseOrderLine, setPurchaseOrderLine] = useState<OrderLine | null>()
  const [purchaseCostLine, setPurchaseCostLine] = useState<CostLine | null>()
  const supplierList = useAppSelector(state => state.supplier.entities);
  const warehouseList = useAppSelector(state => state.warehouse.entities);
  const stockConfigList = useAppSelector(state => state.stockConfig.entities);

  const purchaseOrderEntity = useAppSelector(state => state.purchaseOrder.entity);
  const loading = useAppSelector(state => state.purchaseOrder.loading);
  const updating = useAppSelector(state => state.purchaseOrder.updating);
  const updateSuccess = useAppSelector(state => state.purchaseOrder.updateSuccess);




  const handleClose = () => {
    navigate('/inventory/purchase-order' + location.search);
  };

  const handleBranchChange = (selectedBranch: IBranch) => {
    setPurchaseOrder(prevState => ({...prevState, branch: selectedBranch}))
  }

  const isDisabled = !purchaseOrder.supplier || purchaseOrderEntity?.status === "COMPLETED"

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

    dispatch(getStockItems({
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
    return stockConfigList.filter((i) => {
        return (
          i.description.toLowerCase().includes(inputValue.toLowerCase())
        )
      }
    );
  };

  const loadItems = (
    inputValue: string,
    callback: (options: IStockConfig[]) => void
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

  const handleSelectItem = (stockItemConfig: IStockConfig) => {
    const itemSupplierConfig = stockItemConfig?.supplierConfigurations?.find((supConfig) =>
    supConfig.supplier?.id === purchaseOrder?.supplier?.id);

    const price = itemSupplierConfig ? itemSupplierConfig?.defaultPrice : stockItemConfig.defaultPrice;
    const newItem = {
      item: stockItemConfig,
      price,
      quantity: stockItemConfig?.minOrderQuantity || 1,
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
      setPurchaseOrderLine(null)
    }else{
      setPurchaseOrder((prevState) => ({
        ...prevState,
        costLines: [...(prevState.costLines || []), purchaseCostLine]
      }))
      setPurchaseCostLine({});
    }
  };

  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...purchaseOrder,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const deleteColumnTemplate = (rowData, index) => {
    const {rowIndex} = index
    const handleClick = () =>  {
      setPurchaseOrder((prevState) => {
        const updatedOrderLines = prevState?.orderLines?.filter((_, i) => i !== rowIndex);
        return {
          ...prevState,
          orderLines: updatedOrderLines
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
          <h2>{isNew ?  "Add New Purchase Order" : isDisabled ? "View Purchase Order" :"Edit Purchase Order"}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="12" className="d-flex flex-column p-3 bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <FormGroup>
                <Row>
             <Col md={4} className={"d-flex flex-column gap-2"}>
               <div className={"d-flex gap-2 mt-2"}>
                 <Label for="supplier" className={"mt-2"}>Supplier</Label>
               <Select
                 options={supplierList}
                 name="supplier"
                 id="supplier"
                 placeholder={"Select supplier"}
                 value={purchaseOrder?.supplier}
                 isDisabled={purchaseOrderEntity?.status === "COMPLETED"}
                 getOptionLabel={(option: ISupplier) => option.name}
                 getOptionValue={option => option.id}
                 onChange={(selectedSupplier) => setPurchaseOrder((prev) => ({...prev, supplier: selectedSupplier}))}
                 />
               </div>

               <div className={"d-flex gap-2 mt-2"}>
                 <Label for="warehouse" className={"mt-2"}>warehouse</Label>
                 <Select
                   name="warehouse"
                   id="warehouse"
                   placeholder={"Select warehouse"}
                   options={warehouseList}
                   value={purchaseOrder?.warehouse}
                   isDisabled={isDisabled}
                   getOptionLabel={(option: IWarehouse) => option.name}
                   getOptionValue={option => option.id}
                   onChange={(selectedWarehouse) => setPurchaseOrder((prev) => ({...prev, warehouse: selectedWarehouse}))}
                 />
               </div>
             </Col>

              <Col md={4} className={"d-flex flex-column gap-2"}>
                <div className={"d-flex gap-2 mt-2"}>
                  <Label for="delivery" className={"mt-2"}>Delivery</Label>
                  <InputText
                    name="delivery"
                    id="delivery"
                    value={purchaseOrder?.delivery}
                    disabled={isDisabled}
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex gap-2 mt-2"}>
                  <Label for="address" className={"mt-2"}>Address</Label>
                  <InputText
                    name="address"
                    id="address"
                    value={purchaseOrder?.address}
                    disabled={isDisabled}
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex flex-column mt-2"}>
                  <Label for="status">Status</Label>
                  <SelectButton
                    value={purchaseOrder?.status ?? "PLACED"}
                    options={statusOptions}
                    id="status"
                    disabled={purchaseOrderEntity?.status === "COMPLETED"}
                    onChange={(e) => setPurchaseOrder((prv) => ({...prv, status: e.value}))}
                  />
                </div>
              </Col>

                <Col md={4} className={"d-flex flex-column gap-2"}>
                  <div className={"d-flex gap-2  mt-2"}>
                    <Label for="datePlaced" className={"mt-2"}>Order Date</Label>
                    <Calendar
                      name="datePlaced"
                      id="datePlaced"
                      value={new Date(purchaseOrder.datePlaced)}
                      disabled={isDisabled}
                      onChange={(e) =>handleDateChange("datePlaced", e)}
                    />
                  </div>

                  <div className={"d-flex gap-2 mt-2"}>
                    <Label for="dateDelivered" className={"mt-2"}>Delivery Date</Label>
                    <Calendar
                      name="dateDelivered"
                      id="dateDelivered"
                      value={new Date(purchaseOrder.dateDelivered)}
                      disabled={isDisabled}
                      onChange={(e) =>handleDateChange("dateDelivered", e)}
                    />
                  </div>
                </Col>
                </Row>

                {/* Order Lines */}
                <Row className={"mt-3"}>
                  <h3>Order Lines</h3>
                  {!isDisabled ? <Table>
                    <tbody>
                    <tr>
                      <td>Item</td>
                      <td>Description</td>
                      <td>Quantity</td>
                      <td>Received Quantity</td>
                      <td>Price</td>
                      <td>Delivery Date</td>
                      <td>Sub Total</td>
                    </tr>
                    <tr>
                      <td className={'w-2'}>
                        <AsyncSelect
                          cacheOptions
                          loadOptions={loadItems}
                          defaultOptions={stockConfigList}
                          getOptionValue={option => option.id}
                          getOptionLabel={option => option.name}
                          onChange={handleSelectItem}
                          value={purchaseOrderLine?.item || null}
                          isDisabled={isDisabled}

                        />
                      </td>

                      <td className={'w-1'}>
                        <InputText
                          value={purchaseOrderLine?.description} disabled={isDisabled}
                          onChange={(e) => handleOrderLineChange("description", e.target.value)}/>

                      </td>

                      <td className={'w-1'}>
                        <InputNumber
                          value={purchaseOrderLine?.quantity} disabled={isDisabled}
                          onChange={(e) => handleOrderLineChange("quantity", e.value)}/>

                      </td>
                      <td className={'w-1'}>
                        <InputNumber
                          value={purchaseOrderLine?.received} disabled={isDisabled}
                          onChange={(e) => handleOrderLineChange("received", e.value)}/>

                      </td>
                      <td className={'w-1'}>
                        <InputNumber
                          value={purchaseOrderLine?.price} disabled={isDisabled}
                          onChange={(e) => handleOrderLineChange("price", e.value)}/>
                      </td>

                      <td className={'w-1'}>
                        <Calendar
                          name="deliveryDate"
                          id="deliveryDate"
                          disabled={isDisabled}
                          onSelect={(e) => handleOrderLineChange("deliveryDate", e.value)}
                          value={new Date(purchaseOrderLine?.deliveryDate)}
                        />
                      </td>

                      <td className={'w-1'}>
                        <InputNumber disabled={true}
                                     value={(purchaseOrderLine?.price * purchaseOrderLine?.quantity) || null}/>
                      </td>
                      <td className={'w-2'}>
                        <Button disabled={!purchaseOrderLine?.item} color={"success"}
                                onClick={() => handleAdd("orderLine")}>Add</Button>
                      </td>

                    </tr>
                    </tbody>
                  </Table> : null}

                  <DataTable
                    value={purchaseOrder?.orderLines}
                    editMode="row"
                    header={"Order Lines"}
                    removableSort
                    paginator
                    totalRecords={purchaseOrder?.orderLines?.length}
                    rows={20}
                  >
                    <Column field="item.name" header={"Item"} />
                    <Column field="description" header={"Description"} />
                    <Column field="quantity" header={"Quantity"} />
                    <Column field="received" header={"Received Quantity"} />
                    <Column field="price" header={"Price"} />
                    <Column field="deliveryDate" header={"Delivery Date"} body={(rowData) => new Date(rowData.deliveryDate).toDateString()} />
                    <Column  header={"Sub Total"} body={(rowData) => rowData.price * rowData.quantity} />
                    {!isDisabled ? <Column header={"Delete"} body={deleteColumnTemplate} headerStyle={{width: '1%',}}
                             bodyStyle={{textAlign: '-moz-initial', overflow: 'visible'}}/> : null}
                  </DataTable>
                </Row>

                <Row className={"mt-3"}>
                  <h3>Cost Lines</h3>
                  {!isDisabled ? <Table>
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
                          name={"supplier"}
                          onChange={(supplier) => setPurchaseCostLine((prevState => ({...prevState, supplier})))}
                          value={purchaseCostLine?.supplier || null}
                          isDisabled={isDisabled}

                        />
                      </td>
                      <td className={'w-1'}>
                        <InputNumber value={purchaseCostLine?.cost} disabled={isDisabled}
                                     onChange={(e) => setPurchaseCostLine((prevState) => ({
                                       ...prevState,
                                       cost: e.value
                                     }))}/>

                      </td>
                      <td className={'w-1'}>
                        <Calendar
                          name="costDate"
                          id="costDate"
                          disabled={isDisabled}
                          onSelect={(e) => handleDateChange("costDate", e)}
                          value={new Date(purchaseCostLine?.costDate)}
                        />
                      </td>

                      <td className={'w-1'}>
                        <InputTextarea name={"comment"} disabled={isDisabled} value={purchaseCostLine?.comment || ''}
                                       onChange={handleCostLineChange}/>
                      </td>
                      <td className={'w-2'}>
                        <Button disabled={!purchaseCostLine} color={"success"}
                                onClick={() => handleAdd("costLine")}>Add</Button>
                      </td>

                    </tr>
                    </tbody>
                  </Table> : null}

                  <DataTable
                    value={purchaseOrder?.costLines}
                    editMode="row"
                    header={"Cost Lines"}
                    removableSort
                    paginator
                    totalRecords={purchaseOrder?.costLines?.length}
                    rows={20}
                  >

                    <Column field="supplier.name" header={"Supplier"} />

                    <Column field="cost" header={"Cost"} />

                    <Column field="costDate" header={"Cost Date"}  />

                    <Column field="comment" header={"Comment"}  />

                    {!isDisabled ? <Column header={"Delete"} body={deleteColumnTemplate} headerStyle={{width: '1%',}}
                             bodyStyle={{textAlign: '-moz-initial', overflow: 'visible'}}/> : null}

                  </DataTable>
                </Row>

              </FormGroup>
              <Button tag={Link} to="/inventory/purchase-order" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;Back
              </Button>
              &nbsp;
              {purchaseOrderEntity?.status !== "COMPLETED" ? <Button color="primary" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save"/>
                &nbsp;Save
              </Button> : null}
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default PurchaseOrderUpdate;
