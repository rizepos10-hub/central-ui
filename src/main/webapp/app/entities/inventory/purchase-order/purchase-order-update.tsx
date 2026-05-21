import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Link, useLocation, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import { ArrowLeft, FileText, Printer, Save, Trash2 } from 'lucide-react';

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
import {toLocalISOString} from "app/shared/util/date-utils";
import _ from "lodash";
import {applyMatchModeMap} from "app/shared/util/filter-match-model-util";
import AuditLogs from "app/shared/components/logs/audit-logs";
import { format } from 'date-fns';
import { formatVariant } from 'app/shared/util/variant-utils';
import { Loader2, CalendarIcon } from 'lucide-react';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { useReactToPrint } from 'react-to-print';
import ReportExportHeader from 'app/shared/components/report/report-export-header';
import { analyticsReportPrintStyles, createReportFileName, downloadElementAsPdf } from 'app/shared/util/report-export-utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getEntities as getOrderableItems, reset as resetOrderableItems } from './purchase-order-orderable-items.reducer';
import { IPurchaseOrderOrderableItem } from 'app/shared/model/STOCK/purchase-order-orderable-item.model';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { getEntities as getSupplierItems, reset as resetSupplierItems } from './purchase-order-supplier-items.reducer';
import { IPurchaseOrderSupplierItem } from 'app/shared/model/STOCK/purchase-order-supplier-item.model';


const statusOptions = [
  "PLACED",
  "RECEIVED"
]

const SUPPLIER_ITEMS_PAGE_SIZE = 20;

type ISupplierItemGroup = {
  id?: string;
  name?: string;
  variants: IPurchaseOrderSupplierItem[];
};

type IOrderLineItemDetails = IItem & {
  itemId?: string;
  variantId?: string;
  variantName?: string;
  supplierCode?: string | null;
  stockAtLocation?: IPurchaseOrderOrderableItem['stockAtLocation'];
  minOrderQuantity?: number | null;
};

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

  const [selectedItem, setSelectedItem] = useState<ISupplierItemGroup | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<IPurchaseOrderSupplierItem | null>(null);
  const [selectedVariantDefaults, setSelectedVariantDefaults] = useState<IPurchaseOrderOrderableItem | null>(null);
  const [supplierItemsSearch, setSupplierItemsSearch] = useState('');
  const [supplierItemsPage, setSupplierItemsPage] = useState(0);

  const [purchaseOrderLine, setPurchaseOrderLine] = useState<OrderLine | null>()
  const [purchaseCostLine, setPurchaseCostLine] = useState<CostLine | null>()
  const [busyAction, setBusyAction] = useState<'pdf' | 'print' | null>(null);
  const [exportTimestamp, setExportTimestamp] = useState<string | null>(null);
  const exportContentRef = useRef<HTMLDivElement>(null);
  const supplierList = useAppSelector(state => state.supplier.entities);
  const warehouseList = useAppSelector(state => state.warehouse.entities);
  const supplierItems = useAppSelector(state => state.purchaseOrderSupplierItems.entities);
  const loadingItems  = useAppSelector(state => state.purchaseOrderSupplierItems.loading);
  const loadingMoreItems  = useAppSelector((state: any) => state.purchaseOrderSupplierItems.loadingMore);
  const totalSupplierItems  = useAppSelector(state => state.purchaseOrderSupplierItems.totalItems || 0);
  const orderableItemRows: IPurchaseOrderOrderableItem[] = useAppSelector(state => state.purchaseOrderOrderableItems.entities);


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
  const isItemPickerDisabled = isOrderReceived || !purchaseOrder?.supplier;
  const isOrderLineEditorDisabled = isOrderReceived || !purchaseOrder?.supplier;
  const canExportPurchaseOrder = Boolean(purchaseOrderEntity?.id);
  const canLoadOrderableItems = Boolean(purchaseOrder?.supplier?.id && purchaseOrder?.warehouse?.id);
  const hasMoreSupplierItems = supplierItems.length < totalSupplierItems;

  const purchaseOrderFileName = useMemo(
    () => createReportFileName('purchase-order', [purchaseOrderEntity?.id || purchaseOrder?.id || null]),
    [purchaseOrderEntity?.id, purchaseOrder?.id]
  );

  const orderSubtotal = useMemo(
    () => (purchaseOrder?.orderLines || []).reduce((sum, line) => sum + ((line?.price || 0) * (line?.quantity || 0)), 0),
    [purchaseOrder?.orderLines]
  );

  const totalAdditionalCosts = useMemo(
    () => (purchaseOrder?.costLines || []).reduce((sum, line) => sum + (line?.cost || 0), 0),
    [purchaseOrder?.costLines]
  );

  const grandTotal = orderSubtotal + totalAdditionalCosts;

  const formatMoney = (value?: number | null) => (value ?? 0).toFixed(2);

  const orderableItemMap = useMemo(() => {
    const variantMap = new Map<string, IPurchaseOrderOrderableItem>();
    orderableItemRows.forEach(row => {
      if (row?.variantId) {
        variantMap.set(row.variantId, row);
      }
    });
    return variantMap;
  }, [orderableItemRows]);

  const groupedSupplierItems = useMemo<ISupplierItemGroup[]>(() => {
    const itemMap = new Map<string, ISupplierItemGroup>();

    supplierItems.forEach(row => {
      if (!row?.itemId) {
        return;
      }

      if (!itemMap.has(row.itemId)) {
        itemMap.set(row.itemId, {
          id: row.itemId,
          name: row.itemName || '-',
          variants: [],
        });
      }

      itemMap.get(row.itemId).variants.push(row);
    });

    return Array.from(itemMap.values());
  }, [supplierItems]);

  const getOrderLineItemDetails = (line: OrderLine) => {
    const itemWithVariantDetails = line.item as IOrderLineItemDetails;
    const variantLabel = itemWithVariantDetails?.variantName
      || ((itemWithVariantDetails as any)?.attributeValues
        ? formatVariant(itemWithVariantDetails?.name || '', (itemWithVariantDetails as any).attributeValues)
        : null);

    return {
      itemName: itemWithVariantDetails?.name || '-',
      variantLabel: variantLabel === itemWithVariantDetails?.name ? null : variantLabel,
    };
  };

  const selectedVariantStock = selectedVariantDefaults?.stockAtLocation;

  const buildOrderLineFromOrderableItem = (variant: IPurchaseOrderOrderableItem): OrderLine => ({
    item: {
      id: variant.itemId,
      itemId: variant.itemId,
      variantId: variant.variantId,
      name: variant.itemName,
      variantName: variant.variantName,
      supplierCode: variant.supplierCode,
      stockAtLocation: variant.stockAtLocation,
      minOrderQuantity: variant.minOrderQuantity,
    } as IOrderLineItemDetails,
    price: variant?.supplierPrice ?? variant?.defaultPrice ?? 0,
    quantity: variant?.minOrderQuantity || 1,
    received: 0,
    returnedQuantity: 0,
  });

  const prepareExportTimestamp = async () => {
    setExportTimestamp(new Date().toISOString());
    await new Promise(resolve => setTimeout(resolve, 0));
  };

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

  const loadSupplierItems = (page = 0, name = '', append = false) => {
    if (!purchaseOrder?.supplier?.id) {
      return;
    }

    dispatch(getSupplierItems({
      supplierId: purchaseOrder.supplier.id,
      page,
      size: SUPPLIER_ITEMS_PAGE_SIZE,
      name,
      append,
    }));
  };

  const loadItems = useMemo(
    () =>
      _.debounce((inputValue: string, e) => {
        if (e.action !== 'input-change' || !purchaseOrder?.supplier?.id) {
          return;
        }

        setSupplierItemsSearch(inputValue || '');
        setSupplierItemsPage(0);
        loadSupplierItems(0, inputValue || '', false);
      }, 300),
    [purchaseOrder?.supplier?.id]
  );

  const filterSuppliers = (inputValue: string) => {
    return supplierList.filter((sup) => {
        return (
          sup.name.toLowerCase().includes(inputValue.toLowerCase())
        )
      }
    );
  };

  useEffect(() => {
    if (!canLoadOrderableItems) {
      dispatch(resetOrderableItems());
      if (isNew && !items) {
        setPurchaseOrder(prevState => ({
          ...prevState,
          orderLines: [],
        }));
      }
      return;
    }

    dispatch(getOrderableItems({
      supplierId: purchaseOrder.supplier.id,
      locationId: purchaseOrder.warehouse.id,
      query: '',
      page: 0,
      size: 500,
    }));
  }, [canLoadOrderableItems, dispatch, purchaseOrder?.supplier?.id, purchaseOrder?.warehouse?.id]);

  useEffect(() => {
    if (!isNew || items || !canLoadOrderableItems) {
      return;
    }

    setPurchaseOrder(prevState => ({
      ...prevState,
      orderLines: orderableItemRows.map(buildOrderLineFromOrderableItem),
    }));
  }, [orderableItemRows, isNew, items, canLoadOrderableItems]);

  useEffect(() => {
    if (!purchaseOrder?.supplier?.id) {
      dispatch(resetSupplierItems());
      setSupplierItemsSearch('');
      setSupplierItemsPage(0);
      setSelectedItem(null);
      setSelectedVariant(null);
      setSelectedVariantDefaults(null);
      setPurchaseOrderLine(null);
      return;
    }

    setSupplierItemsSearch('');
    setSupplierItemsPage(0);
    setSelectedItem(null);
    setSelectedVariant(null);
    setSelectedVariantDefaults(null);
    setPurchaseOrderLine(null);
    loadSupplierItems(0, '', false);
  }, [dispatch, purchaseOrder?.supplier?.id]);

  useEffect(() => {
    if (!selectedVariant) {
      return;
    }

    const orderableVariantDefaults = orderableItemMap.get(selectedVariant?.variantId);
    setSelectedVariantDefaults(orderableVariantDefaults || null);

    const price =
      orderableVariantDefaults?.supplierPrice
      ?? selectedVariant?.supplierPrice
      ?? orderableVariantDefaults?.defaultPrice
      ?? selectedVariant?.defaultPrice
      ?? 0;

    setPurchaseOrderLine(prevState => ({
      ...prevState,
      item: {
        id: selectedItem?.id,
        itemId: selectedItem?.id,
        variantId: selectedVariant.variantId,
        name: selectedItem?.name,
        variantName: selectedVariant.variantName,
        supplierCode: orderableVariantDefaults?.supplierCode ?? selectedVariant?.supplierCode ?? '',
        stockAtLocation: orderableVariantDefaults?.stockAtLocation,
        minOrderQuantity: orderableVariantDefaults?.minOrderQuantity ?? selectedVariant?.minOrderQuantity,
      } as IOrderLineItemDetails,
      price,
      quantity: orderableVariantDefaults?.minOrderQuantity || selectedVariant?.minOrderQuantity || 1,
      received: 0,
      returnedQuantity: 0,
    }));
  }, [orderableItemMap, selectedItem, selectedVariant]);

  useEffect(() => {
    return () => {
      loadItems.cancel();
    };
  }, [loadItems]);

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

  const handleSelectVariant = (variant: IPurchaseOrderSupplierItem) => {
    setSelectedVariant(variant);
  };

  const handleAdd = (type) => {
    if(type === "orderLine"){
      setPurchaseOrder((prevState) => ({
        ...prevState,
        orderLines: [...(prevState.orderLines || []), purchaseOrderLine]
      }))
      setPurchaseOrderLine(null);
      setSelectedItem(null);
      setSelectedVariant(null);
      setSelectedVariantDefaults(null);
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

  const handlePdfExport = async () => {
    if (!exportContentRef.current || !canExportPurchaseOrder) {
      return;
    }

    try {
      setBusyAction('pdf');
      await prepareExportTimestamp();
      await downloadElementAsPdf(exportContentRef.current, {
        fileName: purchaseOrderFileName,
        orientation: 'portrait',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => exportContentRef.current,
    documentTitle: purchaseOrderFileName,
    pageStyle: analyticsReportPrintStyles('portrait'),
    onBeforeGetContent: async () => {
      setBusyAction('print');
      await prepareExportTimestamp();
    },
    onAfterPrint: () => {
      setBusyAction(null);
    },
  });

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
          const updatedField = (prevState?.orderLines || []).reduce((acc, line, i) => {
            if (i !== rowIndex) {
              acc.push(line);
            }
            return acc;
          }, []);
          return { ...prevState, orderLines: updatedField };
        } else {
          const updatedField = (prevState?.costLines || []).reduce((acc, line, i) => {
            if (i !== rowIndex) {
              acc.push(line);
            }
            return acc;
          }, []);
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
    <div className="min-h-screen bg-slate-50/70 p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Inventory
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  Purchase Order
                </span>
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                {isNew
                  ? `${translate("tempApp.purchaseOrder.addNew")}`
                  : isDisabled
                    ? `${translate("tempApp.purchaseOrder.view")}`
                    : `${translate("tempApp..purchaseOrder.edit")}`}
              </h2>
              <p className="text-sm text-slate-500">
                Build supplier orders with warehouse-aware availability and compact line management.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Supplier</div>
                <div className="mt-1 truncate text-sm font-medium text-slate-900">{purchaseOrder?.supplier?.name || '-'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Warehouse</div>
                <div className="mt-1 truncate text-sm font-medium text-slate-900">{purchaseOrder?.warehouse?.name || '-'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Lines</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{purchaseOrder?.orderLines?.length || 0}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">${formatMoney(grandTotal)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="mx-auto mt-4 grid max-w-[1500px] gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form className="min-w-0">
            <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="space-y-6 p-4 md:p-5">
                {/* Supplier, Warehouse, Delivery Info */}
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-slate-900">Order Context</h3>
                      <p className="text-xs text-slate-500">Choose the supplier and warehouse before adding lines.</p>
                    </div>
                    <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="supplier" className="w-24 text-xs font-medium whitespace-nowrap text-slate-600">
                        <Translate contentKey={"tempApp.purchaseOrder.supplier"} />
                      </Label>
                      <div className="flex-1">
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
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor="warehouse" className="w-24 text-xs font-medium whitespace-nowrap text-slate-600">
                        <Translate contentKey={"tempApp.purchaseOrder.warehouse"} />
                      </Label>
                      <div className="flex-1">
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

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-slate-900">Scheduling</h3>
                      <p className="text-xs text-slate-500">Track when the order is placed and expected to arrive.</p>
                    </div>
                    <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="datePlaced" className="w-24 text-xs font-medium whitespace-nowrap text-slate-600">
                        <Translate contentKey={"tempApp.purchaseOrder.orderDate"} />
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 text-xs justify-start flex-1 rounded-xl bg-white" disabled={isDisabled}>
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
                      <Label htmlFor="dateDelivered" className="w-24 text-xs font-medium whitespace-nowrap text-slate-600">
                        <Translate contentKey={"tempApp.purchaseOrder.deliveryDate"} />
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 text-xs justify-start flex-1 rounded-xl bg-white" disabled={isDisabled}>
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
                </div>

                {/* Order Lines */}
                <div className="space-y-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        <Translate contentKey={"tempApp.purchaseOrder.orderLines"} />
                      </h3>
                      <p className="text-xs text-slate-500">Add supplier-approved variants and fine-tune quantity, price, and delivery dates.</p>
                    </div>
                    {!canLoadOrderableItems && !isOrderReceived ? (
                      <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700">
                        Select supplier and warehouse to auto-fill draft lines
                      </div>
                    ) : null}
                  </div>
                  {!isOrderReceived && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-8 xl:items-end">
                        <div>
                          <Label className="text-xs font-medium text-slate-600"><Translate contentKey={"common.item"} /></Label>
                          <Select
                            onInputChange={loadItems}
                            onMenuScrollToBottom={() => {
                              if (!purchaseOrder?.supplier?.id || loadingMoreItems || loadingItems || !hasMoreSupplierItems) {
                                return;
                              }
                              const nextPage = supplierItemsPage + 1;
                              setSupplierItemsPage(nextPage);
                              loadSupplierItems(nextPage, supplierItemsSearch, true);
                            }}
                            options={groupedSupplierItems}
                            getOptionValue={option => option.id}
                            getOptionLabel={option => option.name}
                            onChange={item => {
                              setSelectedItem(item);
                              setSelectedVariant(null);
                              setSelectedVariantDefaults(null);
                              setPurchaseOrderLine(null);
                            }}
                            value={selectedItem || null}
                            isDisabled={isItemPickerDisabled}
                            isLoading={loadingItems || loadingMoreItems}
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-medium text-slate-600"><Translate contentKey={"common.variant"} /></Label>
                          <Select
                            options={selectedItem?.variants || []}
                            getOptionValue={option => option.variantId}
                            getOptionLabel={option => option.variantName || '-'}
                            onChange={handleSelectVariant}
                            isDisabled={isDisabled || !selectedItem}
                            value={selectedVariant || null}
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-medium text-slate-600"><Translate contentKey={"common.description"} /></Label>
                          <Textarea
                            value={purchaseOrderLine?.description || ''}
                            disabled={isOrderLineEditorDisabled}
                            onChange={e => handleOrderLineChange('description', e.target.value)}
                            className="min-h-[36px] text-xs resize-none rounded-xl bg-white"
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-medium text-slate-600"><Translate contentKey={"common.quantity"} /></Label>
                          <Input
                            type="number"
                            value={purchaseOrderLine?.quantity ?? ''}
                            disabled={isOrderLineEditorDisabled}
                            onChange={e => handleOrderLineChange('quantity', Number(e.target.value))}
                            className="h-9 text-xs rounded-xl bg-white"
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-medium text-slate-600"><Translate contentKey={"tempApp.purchaseOrder.costPrice"} /></Label>
                          <Input
                            type="number"
                            value={purchaseOrderLine?.price ?? ''}
                            disabled={isOrderLineEditorDisabled}
                            onChange={e => handleOrderLineChange('price', Number(e.target.value))}
                            className="h-9 text-xs rounded-xl bg-white"
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-medium text-slate-600"><Translate contentKey={"tempApp.purchaseOrder.deliveryDate"} /></Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-9 text-xs w-full justify-start rounded-xl bg-white" disabled={isOrderLineEditorDisabled}>
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
                          <Label className="text-xs font-medium text-slate-600"><Translate contentKey={"common.subtotal"} /></Label>
                          <Input
                            type="number"
                            disabled
                            value={purchaseOrderLine?.price * purchaseOrderLine?.quantity || 0}
                            className="h-9 text-xs rounded-xl bg-white"
                          />
                        </div>

                        <div className="xl:justify-self-end">
                          <Button
                            type="button"
                            disabled={isOrderLineEditorDisabled || !purchaseOrderLine?.item}
                            size="sm"
                            className="h-9 w-full text-xs rounded-xl xl:w-auto"
                            onClick={() => handleAdd('orderLine')}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                      {selectedVariant && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Supplier Code</div>
                            <div className="mt-1 text-xs font-medium text-slate-900">{selectedVariantDefaults?.supplierCode || '-'}</div>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Stock</div>
                            <div className="mt-1 text-xs font-medium text-slate-900">{selectedVariantStock?.quantity ?? 0}</div>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Min Stock</div>
                            <div className="mt-1 text-xs font-medium text-slate-900">{selectedVariantStock?.minimumStockLevel ?? 0}</div>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Min Order Qty</div>
                            <div className="mt-1 text-xs font-medium text-slate-900">{selectedVariantDefaults?.minOrderQuantity ?? selectedVariant?.minOrderQuantity ?? 1}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80">
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
                            <TableCell className="text-xs">
                              {getOrderLineItemDetails(line).itemName}
                              {getOrderLineItemDetails(line).variantLabel ? (
                                <div className="text-[11px] text-muted-foreground">{getOrderLineItemDetails(line).variantLabel}</div>
                              ) : null}
                            </TableCell>
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
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      <Translate contentKey={"tempApp.purchaseOrder.costLines"} />
                    </h3>
                    <p className="text-xs text-slate-500">Track additional supplier or logistics costs alongside the order.</p>
                  </div>
                  {!isDisabled && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 xl:items-end">
                        <div>
                          <Label className="text-xs font-medium text-slate-600"><Translate contentKey={"tempApp.purchaseOrder.supplier"} /></Label>
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
                          <Label className="text-xs font-medium text-slate-600"><Translate contentKey={"tempApp.purchaseOrder.cost"} /></Label>
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
                            className="h-9 text-xs rounded-xl bg-white"
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-medium text-slate-600"><Translate contentKey={"tempApp.purchaseOrder.costDate"} /></Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-9 text-xs w-full justify-start rounded-xl bg-white" disabled={isDisabled}>
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
                          <Label className="text-xs font-medium text-slate-600"><Translate contentKey={"tempApp.purchaseOrder.comments"} /></Label>
                          <Textarea
                            name="comment"
                            disabled={isDisabled}
                            value={purchaseCostLine?.comment || ''}
                            onChange={handleCostLineChange}
                            className="min-h-[36px] text-xs resize-none rounded-xl bg-white"
                          />
                        </div>

                        <div className="xl:justify-self-end">
                          <Button
                            type="button"
                            disabled={!purchaseCostLine}
                            size="sm"
                            className="h-9 w-full text-xs rounded-xl xl:w-auto"
                            onClick={() => handleAdd('costLine')}
                          >
                            <Translate contentKey={"common.add"} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80">
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

          <div className="w-full xl:w-80">
            <Card className="sticky top-4 rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">
                  <Translate contentKey={"common.actions"} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Items Subtotal</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">${formatMoney(orderSubtotal)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Extra Costs</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">${formatMoney(totalAdditionalCosts)}</div>
                    </div>
                    <div className="col-span-2 rounded-xl bg-white px-3 py-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Grand Total</div>
                      <div className="mt-1 text-lg font-semibold text-slate-950">${formatMoney(grandTotal)}</div>
                    </div>
                  </div>
                </div>
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

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs rounded-xl"
                    asChild
                  >
                    <Link to="/inventory/purchase-order">
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      <Translate contentKey={"common.back"} />
                    </Link>
                  </Button>

                  {canExportPurchaseOrder && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs rounded-xl"
                        disabled={busyAction !== null}
                        onClick={handlePrint}
                      >
                        {busyAction === 'print' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Printer className="h-3 w-3 mr-1" />}
                        Print
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs rounded-xl"
                        disabled={busyAction !== null}
                        onClick={handlePdfExport}
                      >
                        {busyAction === 'pdf' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileText className="h-3 w-3 mr-1" />}
                        Export PDF
                      </Button>
                    </>
                  )}

                  {isOrderReceived && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 text-xs rounded-xl"
                      onClick={handleSupplierReturn}
                    >
                      <Translate contentKey={"tempApp.purchaseOrder.returnItems"} />
                    </Button>
                  )}

                  {canSplit && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 text-xs rounded-xl"
                      onClick={handleOrderSplit}
                    >
                      <Translate contentKey={"tempApp.purchaseOrder.splitAndComplete"} />
                    </Button>
                  )}

                  {purchaseOrderEntity?.status !== 'RECEIVED' && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 text-xs rounded-xl"
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

      <div className="pointer-events-none fixed -left-[10000px] top-0 w-fit max-w-none bg-white p-6" aria-hidden="true">
        <div ref={exportContentRef} className="report-export-root space-y-4">
          <ReportExportHeader
            reportTitle="Purchase Order"
            hiddenOnScreen
            forceVisible={busyAction === 'pdf'}
            meta={[
              { label: 'PO ID', value: purchaseOrderEntity?.id || purchaseOrder?.id || '-' },
              { label: 'Status', value: purchaseOrder?.status || '-' },
            ]}
            filters={[
              { label: 'Supplier', value: purchaseOrder?.supplier?.name || '-' },
              { label: 'Warehouse', value: purchaseOrder?.warehouse?.name || '-' },
              { label: 'Order Date', value: purchaseOrder?.datePlaced ? formatDateForDisplay(purchaseOrder.datePlaced, 'PP') : '-' },
              { label: 'Delivery Date', value: purchaseOrder?.dateDelivered ? formatDateForDisplay(purchaseOrder.dateDelivered, 'PP') : '-' },
              { label: 'Delivery', value: purchaseOrder?.delivery || '-' },
              { label: 'Address', value: purchaseOrder?.address || '-' },
              { label: 'Printed', value: exportTimestamp ? formatDateForDisplay(exportTimestamp, 'PPpp') : '-' },
            ]}
          />

          <div className="rounded-md border bg-white p-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold">Order Lines</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Item</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Qty</TableHead>
                  <TableHead className="text-xs">Received</TableHead>
                  <TableHead className="text-xs">Returned</TableHead>
                  <TableHead className="text-xs">Unit Cost</TableHead>
                  <TableHead className="text-xs">Delivery Date</TableHead>
                  <TableHead className="text-xs text-right">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(purchaseOrder?.orderLines || []).map((line, index) => (
                  <TableRow key={`export-order-line-${index}`}>
                    <TableCell className="text-xs">
                      {getOrderLineItemDetails(line).itemName}
                      {getOrderLineItemDetails(line).variantLabel ? (
                        <div className="text-[11px] text-muted-foreground">{getOrderLineItemDetails(line).variantLabel}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-xs">{line.description || '-'}</TableCell>
                    <TableCell className="text-xs">{line.quantity || 0}</TableCell>
                    <TableCell className="text-xs">{line.received || 0}</TableCell>
                    <TableCell className="text-xs">{line.returnedQuantity || 0}</TableCell>
                    <TableCell className="text-xs">{formatMoney(line.price)}</TableCell>
                    <TableCell className="text-xs">{line.deliveryDate ? formatDateForDisplay(line.deliveryDate, 'yyyy-MM-dd') : '-'}</TableCell>
                    <TableCell className="text-xs text-right">{formatMoney((line.price || 0) * (line.quantity || 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {(purchaseOrder?.costLines?.length || 0) > 0 ? (
            <div className="rounded-md border bg-white p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold">Additional Costs</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Supplier</TableHead>
                    <TableHead className="text-xs">Cost</TableHead>
                    <TableHead className="text-xs">Cost Date</TableHead>
                    <TableHead className="text-xs">Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(purchaseOrder?.costLines || []).map((line, index) => (
                    <TableRow key={`export-cost-line-${index}`}>
                      <TableCell className="text-xs">{line.supplier?.name || '-'}</TableCell>
                      <TableCell className="text-xs">{formatMoney(line.cost)}</TableCell>
                      <TableCell className="text-xs">{line.costDate ? formatDateForDisplay(line.costDate, 'yyyy-MM-dd') : '-'}</TableCell>
                      <TableCell className="text-xs">{line.comment || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          <div className="rounded-md border bg-white p-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Items Subtotal</div>
                <div className="mt-1 text-sm font-medium">{formatMoney(orderSubtotal)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Additional Costs</div>
                <div className="mt-1 text-sm font-medium">{formatMoney(totalAdditionalCosts)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Grand Total</div>
                <div className="mt-1 text-sm font-semibold">{formatMoney(grandTotal)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderUpdate;
