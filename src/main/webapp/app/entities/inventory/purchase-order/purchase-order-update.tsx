import React, {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {Button, Row, Col, FormGroup, Label, Input, Table} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './purchase-order.reducer';
import {InputText} from "primereact/inputtext";
import {IPurchaseOrder, OrderLine} from "app/shared/model/STOCK/purchase-order.model";
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


export const PurchaseOrderUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [purchaseOrder, setPurchaseOrder] = useState<IPurchaseOrder>({
  });

  const [selectedItemForOrderLine, setSelectedItemForOrderLine] = useState<OrderLine | null>()
  const supplierList = useAppSelector(state => state.supplier.entities);
  const warehouseList = useAppSelector(state => state.warehouse.entities);
  const stockConfigList = useAppSelector(state => state.stockConfig.entities);

  const purchaseOrderEntity = useAppSelector(state => state.purchaseOrder.entity);
  const loading = useAppSelector(state => state.purchaseOrder.loading);
  const updating = useAppSelector(state => state.purchaseOrder.updating);
  const updateSuccess = useAppSelector(state => state.purchaseOrder.updateSuccess);

  const filteredStockItems = useMemo(() => {

    return stockConfigList.filter(stockConfig => !purchaseOrder.orderLines?.some(orderLine => orderLine.item.id === stockConfig.id))
  }, [purchaseOrder.orderLines?.length, stockConfigList]);


  const handleClose = () => {
    navigate('/inventory/purchase-order' + location.search);
  };

  const handleBranchChange = (selectedBranch: IBranch) => {
    setPurchaseOrder(prevState => ({...prevState, branch: selectedBranch}))
  }

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
  }, [updateSuccess, purchaseOrderEntity?.name]);

  const filterItems = (inputValue: string) => {

    return filteredStockItems.filter((i) => {
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

  const handleChange = e => {
    const { name, value } = e.target;
    setPurchaseOrder(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSelectedItemForOrderLineValuesChange = (field, value) => {
    setSelectedItemForOrderLine(prevState => ({ ...prevState, [field]: value }));
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
    setSelectedItemForOrderLine(newItem)
  }

  const handleAddToOrderLine = () => {
    setPurchaseOrder((prevState) => ({
      ...prevState,
      orderLines: [...(prevState.orderLines || []), selectedItemForOrderLine]
    }))
    setSelectedItemForOrderLine(null)
  }
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

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ?  "Add New Sales Location" : "Edit Sales Location"}</h2>
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
                   isDisabled={!purchaseOrder.supplier}
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
                    disabled={!purchaseOrder.supplier}
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex gap-2 mt-2"}>
                  <Label for="address" className={"mt-2"}>Address</Label>
                  <InputText
                    name="address"
                    id="address"
                    disabled={!purchaseOrder.supplier}
                    onChange={handleChange}
                  />
                </div>
              </Col>

                <Col md={4} className={"d-flex flex-column gap-2"}>
                  <div className={"d-flex gap-2  mt-2"}>
                    <Label for="datePlaced" className={"mt-2"}>Order Date</Label>
                    <Calendar
                      name="datePlaced"
                      id="datePlaced"
                      disabled={!purchaseOrder.supplier}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={"d-flex gap-2 mt-2"}>
                    <Label for="dateDelivered" className={"mt-2"}>Delivery Date</Label>
                    <Calendar
                      name="dateDelivered"
                      id="dateDelivered"
                      disabled={!purchaseOrder.supplier}
                      onChange={handleChange}
                    />
                  </div>
                </Col>
                </Row>

                {/* Order Lines */}
                <Row className={"mt-3"}>
                  <h3>Order Lines</h3>
                  <Table>
                    <tbody>
                    <tr>
                      <td>Item</td>
                      <td>Quantity</td>
                      <td>Price</td>
                      <td>Sub Total</td>
                    </tr>
                    <tr>
                          <td className={'w-2'}>
                            <AsyncSelect
                            cacheOptions
                            loadOptions={loadItems}
                            defaultOptions={filteredStockItems}
                            getOptionValue={option => option.id}
                            getOptionLabel={option => option.description}
                            onChange={handleSelectItem}
                            value={selectedItemForOrderLine?.item || null}
                            isDisabled={!purchaseOrder.supplier}

                          />
                          </td>
                          <td className={'w-1'}>
                            <InputNumber value={selectedItemForOrderLine?.quantity} disabled={!purchaseOrder.supplier}
                                         onChange={(e) => handleSelectedItemForOrderLineValuesChange("quantity", e.value )} />

                          </td>
                          <td className={'w-1'}>
                            <InputNumber value={selectedItemForOrderLine?.price} disabled={!purchaseOrder.supplier}
                                         onChange={(e) => handleSelectedItemForOrderLineValuesChange("price", e.value )}  />
                          </td>

                          <td className={'w-1'}>
                            <InputNumber disabled={true} value={(selectedItemForOrderLine?.price * selectedItemForOrderLine?.quantity) || null}/>
                          </td>
                      <td className={'w-2'}>
                        <Button disabled={!selectedItemForOrderLine} color={"success"} onClick={handleAddToOrderLine}>Add</Button>
                      </td>

                    </tr>
                    </tbody>
                  </Table>
                </Row>

                <Row>
                  {/* <Table> */}
                  {/*   <tbody> */}
                  {/*   <tr> */}
                  {/*     <td>Item</td> */}
                  {/*     <td>Quantity</td> */}
                  {/*     <td>Price</td> */}
                  {/*     <td>Sub Total</td> */}
                  {/*   </tr> */}

                  {/*     {purchaseOrder?.orderLines?.map((orderLine) => ( */}
                  {/*       <> */}
                  {/*       <tr> */}
                  {/*         <td> */}
                  {/*           {orderLine?.item?.item?.name} */}
                  {/*         </td> */}
                  {/*         <td> */}
                  {/*           {orderLine?.quantity} */}
                  {/*         </td> */}
                  {/*         <td> */}
                  {/*           {orderLine?.price} */}
                  {/*         </td> */}
                  {/*         <td> */}
                  {/*           {(orderLine?.price * orderLine?.quantity) || null} */}
                  {/*         </td> */}
                  {/*       </tr> */}
                  {/*       </> */}
                  {/*     ))} */}

                  {/*   </tbody> */}

                  {/* </Table> */}

                  <DataTable
                    value={purchaseOrder?.orderLines}
                    editMode="row"
                    header={"Order Lines"}
                    removableSort
                    paginator
                    totalRecords={purchaseOrder?.orderLines?.length}
                    rows={20}
                  >

                    <Column field="item.item.name" header={"Item"} />

                    <Column field="quantity" header={"Quantity"} />

                    <Column field="price" header={"Price"} />

                    <Column  header={"Sub Total"} body={(rowData) => rowData.price * rowData.quantity} />

                    <Column  header={"Delete"} body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                             bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

                  </DataTable>
                </Row>

              </FormGroup>
              <Button tag={Link} to="/inventory/purchase-order" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;Back
              </Button>
              &nbsp;
              <Button color="primary" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;Save
              </Button>
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default PurchaseOrderUpdate;
