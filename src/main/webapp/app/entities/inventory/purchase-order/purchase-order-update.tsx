import React, {useEffect, useMemo, useState} from 'react';
import {Link, useLocation, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import {getEntity, updateEntity, createEntity, reset, splitOrder} from './purchase-order.reducer';
import {CostLine, IPurchaseOrder, OrderLine} from "app/shared/model/STOCK/purchase-order.model";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {translate, Translate} from "react-jhipster";
import Select from 'app/shared/components/select/select';
import {IBranch} from "app/shared/model/branch.model";
import {  getEntities as getSuppliers } from '../supplier/supplier.reducer';
import {  getEntities as getWarehouses } from '../warehouse/warehouse.reducer';
import {ISupplier} from "app/shared/model/STOCK/supplier.model";
import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";
import AsyncSelect from 'app/shared/components/select/async-select';
import {IPurchaseConfig} from "app/shared/model/STOCK/purchase-config.model";
import {getEntities as getInventoryItems, searchEntities as searchInventoryItems} from "app/entities/inventory/stock-config/inventory-items.reducer";
import {toLocalISOString} from "app/shared/util/date-utils";
import {IInventoryItem, IInventoryItemVariant} from "app/shared/model/STOCK/inventory-item.model";
import _ from "lodash";
import {applyMatchModeMap} from "app/shared/util/filter-match-model-util";
import AuditLogs from "app/shared/components/logs/audit-logs";
import { format } from 'date-fns';
import { formatVariant } from 'app/shared/util/variant-utils';
import { Loader2, CalendarIcon } from 'lucide-react';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


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
  const items = JSON.parse(decodeURIComponent(searchLocation.get('items')));
  const [purchaseOrder, setPurchaseOrder] = useState<IPurchaseOrder>({
    orderLines: items ? items?.map((orderLine) => ({
      item: {name: orderLine.itemName, itemId: orderLine.itemId, variantId: orderLine.variantId},
      price: 0,
      quantity: 1,
      received: 0,
      returnedQuantity: 0
    })): [],
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



  const purchaseOrderEntity = !items ? useAppSelector(state => state.purchaseOrder.entity) : {};
  const loading = useAppSelector(state => state.purchaseOrder.loading);
  const updating = useAppSelector(state => state.purchaseOrder.updating);
  const updateSuccess = useAppSelector(state => state.purchaseOrder.updateSuccess);



  const handleClose = () => {
    navigate(-1);
  };

  const handleBranchChange = (selectedBranch: IBranch) => {
    setPurchaseOrder(prevState => ({...prevState, branch: selectedBranch}))
  };


  const isOrderReceived = purchaseOrderEntity?.status === "RECEIVED";
  const canSplit = !isOrderReceived && purchaseOrderEntity?.id;
  const isDisabled = !purchaseOrder.supplier || !purchaseOrder.warehouse || isOrderReceived;

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

    if (purchaseOrderEntity?.id) {
      setPurchaseOrder(purchaseOrderEntity);
    } else if (!items) {
      setPurchaseOrder({});
    }
  }, [updateSuccess, purchaseOrderEntity, items]);


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

  const handleDateChange = (field, date: Date) => {
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

  const handleOrderLineEdit = (index: number, field: string, value: any) => {
    if (field === 'received' && (value < 0 || value > purchaseOrder.orderLines[index].quantity)) {
      alert("Received quantity must be greater than or equal to 0 and less than or equal to the ordered quantity for all order lines.");
      return;
    }

    setPurchaseOrder((prevState) => {
      const updatedOrderLines = prevState?.orderLines?.map((line, i) => {
        if (i === index) {
          return { ...line, [field]: value };
        }
        return line;
      });

      return {
        ...prevState,
        orderLines: updatedOrderLines
      };
    });
  };

  const deleteColumnTemplate = (rowIndex: number, field: 'orderLines' | 'costLines') => {
    const handleClick = () =>  {
      setPurchaseOrder((prevState) => {
        if (field === 'orderLines') {
          const updatedField = (prevState?.orderLines || []).filter((_, i) => i !== rowIndex);
          return { ...prevState, orderLines: updatedField };
        } else {
          const updatedField = (prevState?.costLines || []).filter((_, i) => i !== rowIndex);
          return { ...prevState, costLines: updatedField };
        }
      })
    }
    return (
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleClick}>
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    );
  };

  if(loading){
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold">
          {isNew ?
          `${translate("tempApp.purchaseOrder.addNew")}`
            :
          isDisabled ?
        `${translate("tempApp.purchaseOrder.view")}`
            :
        `${translate("tempApp..purchaseOrder.edit")}`}
        </h2>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="flex gap-4">
          <form  className="flex-1">
            <Card>
              <CardContent className="p-4">
                {/* Supplier, Warehouse, Delivery Info */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="supplier" className="text-xs whitespace-nowrap">
                        <Translate contentKey={"tempApp.purchaseOrder.supplier"} />
                      </Label>
                      <Select
                        options={supplierList}
                        name="supplier"
                        id="supplier"
                        placeholder={translate("tempApp.purchaseOrder.selectSupplier")}
                        value={purchaseOrder?.supplier}
                        isDisabled={isOrderReceived}
                        getOptionLabel={(option: ISupplier) => option.name}
                        getOptionValue={option => option.id}
                        onChange={selectedSupplier => setPurchaseOrder(prev => ({ ...prev, supplier: selectedSupplier }))}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor="warehouse" className="text-xs whitespace-nowrap">
                        <Translate contentKey={"tempApp.purchaseOrder.warehouse"} />
                      </Label>
                      <Select
                        name="warehouse"
                        id="warehouse"
                        placeholder={translate("tempApp.purchaseOrder.selectWarehouse")}
                        options={warehouseList}
                        value={purchaseOrder?.warehouse}
                        isDisabled={isOrderReceived || !purchaseOrder?.supplier}
                        getOptionLabel={(option: IWarehouse) => option.name}
                        getOptionValue={option => option.id}
                        onChange={selectedWarehouse => setPurchaseOrder(prev => ({ ...prev, warehouse: selectedWarehouse }))}
                      />
                    </div>
                  </div>
{/* 
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="delivery" className="text-xs whitespace-nowrap">
                        <Translate contentKey={"tempApp.purchaseOrder.delivery"} />
                      </Label>
                      <Input
                        name="delivery"
                        id="delivery"
                        value={purchaseOrder?.delivery || ''}
                        disabled={isDisabled}
                        onChange={handleChange}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor="address" className="text-xs whitespace-nowrap">
                        <Translate contentKey={"common.address"} />
                      </Label>
                      <Input
                        name="address"
                        id="address"
                        value={purchaseOrder?.address || ''}
                        disabled={isDisabled}
                        onChange={handleChange}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div> */}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="datePlaced" className="text-xs whitespace-nowrap">
                        <Translate contentKey={"tempApp.purchaseOrder.orderDate"} />
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs justify-start flex-1" disabled={isDisabled}>
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {purchaseOrder.datePlaced ? formatDateForDisplay(purchaseOrder.datePlaced, 'PP') : 'Pick date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={purchaseOrder.datePlaced ? new Date(purchaseOrder.datePlaced) : undefined}
                            onSelect={(date) => date && handleDateChange('datePlaced', date)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor="dateDelivered" className="text-xs whitespace-nowrap">
                        <Translate contentKey={"tempApp.purchaseOrder.deliveryDate"} />
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs justify-start flex-1" disabled={isDisabled}>
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {purchaseOrder.dateDelivered ? formatDateForDisplay(purchaseOrder.dateDelivered, 'PP') : 'Pick date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={purchaseOrder.dateDelivered ? new Date(purchaseOrder.dateDelivered) : undefined}
                            onSelect={(date) => date && handleDateChange('dateDelivered', date)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Order Lines */}
                <div className="mt-6">
                  <h3 className="text-sm font-bold mb-2">
                    <Translate contentKey={"tempApp.purchaseOrder.orderLines"} />
                  </h3>
                  {!isDisabled && (
                    <div className="mb-2 border rounded-md p-2">
                      <div className="grid grid-cols-8 gap-2 items-end">
                        <div>
                          <Label className="text-xs"><Translate contentKey={"common.item"} /></Label>
                          <Select
                            onInputChange={loadItems}
                            options={inventoryItemList}
                            getOptionValue={option => option.id}
                            getOptionLabel={option => option.name}
                            onChange={item => setSelectedItem(item)}
                            value={selectedItem || null}
                            isDisabled={isDisabled}
                            isLoading={loadingItems}
                          />
                        </div>

                        <div>
                          <Label className="text-xs"><Translate contentKey={"common.variant"} /></Label>
                          <Select
                            options={selectedItem?.variants}
                            getOptionValue={option => option.id}
                            getOptionLabel={option => formatVariant(option.name, option.attributeValues)}
                            onChange={handleSelectVariant}
                            isDisabled={isDisabled || !selectedItem}
                            value={selectedVariant || null}
                          />
                        </div>

                        <div>
                          <Label className="text-xs"><Translate contentKey={"common.description"} /></Label>
                          <Textarea
                            value={purchaseOrderLine?.description || ''}
                            disabled={isDisabled}
                            onChange={e => handleOrderLineChange('description', e.target.value)}
                            className="h-8 text-xs resize-none"
                          />
                        </div>

                        <div>
                          <Label className="text-xs"><Translate contentKey={"common.quantity"} /></Label>
                          <Input
                            type="number"
                            value={purchaseOrderLine?.quantity ?? ''}
                            disabled={isDisabled}
                            onChange={e => handleOrderLineChange('quantity', Number(e.target.value))}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div>
                          <Label className="text-xs"><Translate contentKey={"tempApp.purchaseOrder.costPrice"} /></Label>
                          <Input
                            type="number"
                            value={purchaseOrderLine?.price ?? ''}
                            disabled={isDisabled}
                            onChange={e => handleOrderLineChange('price', Number(e.target.value))}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div>
                          <Label className="text-xs"><Translate contentKey={"tempApp.purchaseOrder.deliveryDate"} /></Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 text-xs w-full justify-start" disabled={isDisabled}>
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {purchaseOrderLine?.deliveryDate ? formatDateForDisplay(purchaseOrderLine.deliveryDate, 'PP') : 'Pick'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={purchaseOrderLine?.deliveryDate ? new Date(purchaseOrderLine.deliveryDate) : undefined}
                                onSelect={(date) => date && handleOrderLineChange('deliveryDate', date)}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div>
                          <Label className="text-xs"><Translate contentKey={"common.subtotal"} /></Label>
                          <Input
                            type="number"
                            disabled
                            value={purchaseOrderLine?.price * purchaseOrderLine?.quantity || 0}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div>
                          <Button
                            type="button"
                            disabled={!purchaseOrderLine?.item}
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleAdd('orderLine')}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">{translate("common.item")}</TableHead>
                          <TableHead className="text-xs">{translate("common.description")}</TableHead>
                          <TableHead className="text-xs">{translate("common.quantity")}</TableHead>
                          <TableHead className="text-xs">{translate("tempApp.purchaseOrder.receivedQuantity")}</TableHead>
                          <TableHead className="text-xs">Returned Quantity</TableHead>
                          <TableHead className="text-xs">{translate("tempApp.purchaseOrder.costPrice")}</TableHead>
                          <TableHead className="text-xs">{translate("common.deliveryDate")}</TableHead>
                          <TableHead className="text-xs">Sub Total</TableHead>
                          {!isDisabled && <TableHead className="text-xs w-16">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseOrder?.orderLines?.map((line, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-xs">{line.item?.name}</TableCell>
                            <TableCell className="text-xs">
                              {!isDisabled ? (
                                <Input
                                  value={line.description || ''}
                                  onChange={(e) => handleOrderLineEdit(index, 'description', e.target.value)}
                                  className="h-7 text-xs"
                                />
                              ) : (
                                line.description
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {!isDisabled ? (
                                <Input
                                  type="number"
                                  value={line.quantity}
                                  onChange={(e) => handleOrderLineEdit(index, 'quantity', Number(e.target.value))}
                                  className="h-7 text-xs w-20"
                                />
                              ) : (
                                line.quantity
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {!isDisabled ? (
                                <Input
                                  type="number"
                                  value={line.received}
                                  onChange={(e) => handleOrderLineEdit(index, 'received', Number(e.target.value))}
                                  className="h-7 text-xs w-20"
                                  max={line.quantity}
                                />
                              ) : (
                                line.received
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {!isDisabled ? (
                                <Input
                                  type="number"
                                  value={line.returnedQuantity || 0}
                                  onChange={(e) => handleOrderLineEdit(index, 'returnedQuantity', Number(e.target.value))}
                                  className="h-7 text-xs w-20"
                                  max={line.received}
                                />
                              ) : (
                                line.returnedQuantity || 0
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {!isDisabled ? (
                                <Input
                                  type="number"
                                  value={line.price}
                                  onChange={(e) => handleOrderLineEdit(index, 'price', Number(e.target.value))}
                                  className="h-7 text-xs w-20"
                                />
                              ) : (
                                line.price
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {line.deliveryDate ? formatDateForDisplay(line.deliveryDate, 'yyyy-MM-dd') : ''}
                            </TableCell>
                            <TableCell className="text-xs">{line.price * line.quantity}</TableCell>
                            {!isDisabled && (
                              <TableCell className="text-xs">
                                {deleteColumnTemplate(index, 'orderLines')}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Cost Lines */}
                <div className="mt-6">
                  <h3 className="text-sm font-bold mb-2">
                    <Translate contentKey={"tempApp.purchaseOrder.costLines"} />
                  </h3>
                  {!isDisabled && (
                    <div className="mb-2 border rounded-md p-2">
                      <div className="grid grid-cols-5 gap-2 items-end">
                        <div>
                          <Label className="text-xs"><Translate contentKey={"tempApp.purchaseOrder.supplier"} /></Label>
                          <AsyncSelect
                            cacheOptions
                            loadOptions={loadSuppliers}
                            defaultOptions={supplierList}
                            getOptionValue={(option: ISupplier) => option.id}
                            getOptionLabel={option => option.name}
                            onChange={supplier => setPurchaseCostLine(prevState => ({ ...prevState, supplier }))}
                            value={purchaseCostLine?.supplier || null}
                            isDisabled={isDisabled}
                          />
                        </div>

                        <div>
                          <Label className="text-xs"><Translate contentKey={"tempApp.purchaseOrder.cost"} /></Label>
                          <Input
                            type="number"
                            value={purchaseCostLine?.cost ?? ''}
                            disabled={isDisabled}
                            onChange={e =>
                              setPurchaseCostLine(prevState => ({
                                ...prevState,
                                cost: Number(e.target.value),
                              }))
                            }
                            className="h-8 text-xs"
                          />
                        </div>

                        <div>
                          <Label className="text-xs"><Translate contentKey={"tempApp.purchaseOrder.costDate"} /></Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 text-xs w-full justify-start" disabled={isDisabled}>
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {purchaseCostLine?.costDate ? format(new Date(purchaseCostLine.costDate), 'PP') : 'Pick'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={purchaseCostLine?.costDate ? new Date(purchaseCostLine.costDate) : undefined}
                                onSelect={(date) => date && handleDateChange('costDate', date)}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div>
                          <Label className="text-xs"><Translate contentKey={"tempApp.purchaseOrder.comments"} /></Label>
                          <Textarea
                            name="comment"
                            disabled={isDisabled}
                            value={purchaseCostLine?.comment || ''}
                            onChange={handleCostLineChange}
                            className="h-8 text-xs resize-none"
                          />
                        </div>

                        <div>
                          <Button
                            type="button"
                            disabled={!purchaseCostLine}
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleAdd('costLine')}
                          >
                            <Translate contentKey={"common.add"} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">{translate("tempApp.purchaseOrder.supplier")}</TableHead>
                          <TableHead className="text-xs">{translate("tempApp.purchaseOrder.cost")}</TableHead>
                          <TableHead className="text-xs">{translate("tempApp.purchaseOrder.costDate")}</TableHead>
                          <TableHead className="text-xs">{translate("tempApp.purchaseOrder.comment")}</TableHead>
                          {!isDisabled && <TableHead className="text-xs w-16">Delete</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseOrder?.costLines?.map((line, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-xs">{line.supplier?.name}</TableCell>
                            <TableCell className="text-xs">{line.cost}</TableCell>
                            <TableCell className="text-xs">
                              {line.costDate ? format(new Date(line.costDate), 'yyyy-MM-dd') : ''}
                            </TableCell>
                            <TableCell className="text-xs">{line.comment}</TableCell>
                            {!isDisabled && (
                              <TableCell className="text-xs">
                                {deleteColumnTemplate(index, 'costLines')}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>

          <div className="w-80">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm">
                  <Translate contentKey={"common.actions"} />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs">
                    <Translate contentKey={"common.status"} />
                  </Label>
                  <div className="flex gap-2">
                    {statusOptions.map((status) => (
                      <Button
                        key={status}
                        type="button"
                        variant={purchaseOrder?.status === status ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs flex-1"
                        disabled={isOrderReceived || isNew}
                        onClick={() => setPurchaseOrder(prv => ({ ...prv, status: status as "PLACED" | "RECEIVED" }))}
                      >
                        <Translate contentKey={`tempApp.purchaseOrder.${status}`} />
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    asChild
                  >
                    <Link to="/inventory/purchase-order">
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      <Translate contentKey={"common.back"} />
                    </Link>
                  </Button>

                  {isOrderReceived && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleSupplierReturn}
                    >
                      <Translate contentKey={"tempApp.purchaseOrder.returnItems"} />
                    </Button>
                  )}

                  {canSplit && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleOrderSplit}
                    >
                      <Translate contentKey={"tempApp.purchaseOrder.splitAndComplete"} />
                    </Button>
                  )}

                  {purchaseOrderEntity?.status !== 'RECEIVED' && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={updating || isDisabled}
                      onClick={saveEntity}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      <Translate contentKey={"common.save"} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {purchaseOrderEntity?.id && <AuditLogs entityId={purchaseOrderEntity?.id} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderUpdate;
