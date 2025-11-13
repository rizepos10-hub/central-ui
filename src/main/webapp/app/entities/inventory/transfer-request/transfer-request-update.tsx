import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, createEntity, reset, updateEntity } from './transfer-request.reducer';
import { ITransferRequest, ITRItem } from "app/shared/model/STOCK/transfer-request.model";
import { getEntities as getWarehouses } from "app/entities/inventory/warehouse/warehouse.reducer";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { getSortState, Translate, translate } from "react-jhipster";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { searchEntities as getStockItems } from "app/entities/inventory/stock-config/stock-quantity.reducer";
import { getEntities as getSuppliers } from '../supplier/supplier.reducer';
import { getEntities as getSalesLocations } from "app/entities/inventory/sales-location/sales-location.reducer";
import Select from 'app/shared/components/select/select';
import AsyncSelect from "react-select/async";
import { IPurchaseConfig } from "app/shared/model/STOCK/purchase-config.model";
import AuditLogs from "app/shared/components/logs/audit-logs";
import { ISupplier } from 'app/shared/model/STOCK/supplier.model';
import { CostLine, IPurchaseOrder } from 'app/shared/model/STOCK/purchase-order.model';
import { toLocalISOString } from 'app/shared/util/date-utils';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

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
    navigate(-1);
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
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleClick}>
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
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
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">
        {isNew ? `${translate('tempApp.transferRequest.createNew')}` : `${translate('tempApp.transferRequest.edit')}`}
      </h2>
      {loading ? (
        <p className="text-xs">Loading...</p>
      ) : (
        <div className="flex gap-4">
          <form  className="flex-1">
            <div className="space-y-4 bg-white p-4 rounded-md border">
              <div className="space-y-2">
                <Label htmlFor="source" className="text-xs">
                  <Translate contentKey={"tempApp.transferRequest.source"} />
                </Label>
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

              <div className="space-y-2">
                <Label htmlFor="destination" className="text-xs">
                  <Translate contentKey={"tempApp.transferRequest.destination"} />
                </Label>
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

              {!isDisabled && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">
                    <Translate contentKey={"tempApp.transferRequest.transferItems"} />
                  </h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">
                            <Translate contentKey={"tempApp.transferRequest.item"} />
                          </TableHead>
                          <TableHead className="text-xs w-24">
                            <Translate contentKey={"tempApp.transferRequest.quantityInSource"} />
                          </TableHead>
                          <TableHead className="text-xs w-24">
                            <Translate contentKey={"tempApp.transferRequest.quantityToTransfer"} />
                          </TableHead>
                          <TableHead className="text-xs w-24">
                            <Translate contentKey={"tempApp.transferRequest.receivedQuantity"} />
                          </TableHead>
                          <TableHead className="text-xs w-20"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-xs">
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
                          </TableCell>
                          <TableCell className="text-xs">
                            <Input
                              type="number"
                              value={transferRequestItem?.item?.quantity ?? ''}
                              disabled
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell className="text-xs">
                            <Input
                              type="number"
                              value={transferRequestItem?.quantity ?? ''}
                              disabled={isDisabled || transferRequestItem?.item?.quantity <= 0}
                              max={transferRequestItem?.item?.quantity}
                              onChange={e =>
                                setTransferRequestItem(prevState => ({
                                  ...prevState,
                                  quantity: Number(e.target.value),
                                }))
                              }
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell className="text-xs">
                            <Input
                              type="number"
                              value={transferRequestItem?.receivedQuantity ?? ''}
                              disabled={transferRequestItem?.item?.quantity <= 0 || isDisabled}
                              max={transferRequestItem?.item?.quantity}
                              onChange={e =>
                                setTransferRequestItem(prevState => ({
                                  ...prevState,
                                  receivedQuantity: Number(e.target.value),
                                }))
                              }
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell className="text-xs">
                            <Button
                              disabled={
                                isDisabled ||
                                transferRequestItem?.item?.quantity <= 0 ||
                                !transferRequestItem?.item
                              }
                              size="sm"
                              className="h-8 text-xs"
                              onClick={handleAdd}
                              type="button"
                            >
                              Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">
                  {translate("tempApp.transferRequest.transferredItems")}
                </h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">{translate("common.item")}</TableHead>
                        <TableHead className="text-xs">{translate("tempApp.transferRequest.transferredQuantity")}</TableHead>
                        <TableHead className="text-xs">{translate("tempApp.transferRequest.receivedQuantity")}</TableHead>
                        {transferRequestEntity.status !== 'CONFIRMED' && (
                          <TableHead className="text-xs w-16">{translate("common.delete")}</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transferRequest?.transferItems?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs">{item.item?.name}</TableCell>
                          <TableCell className="text-xs">{item.quantity}</TableCell>
                          <TableCell className="text-xs">{item.receivedQuantity}</TableCell>
                          {transferRequestEntity.status !== 'CONFIRMED' && (
                            <TableCell className="text-xs">
                              {deleteColumnTemplate(item, { rowIndex: index }, 'transferItems')}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">
                  <Translate contentKey={"tempApp.transferRequest.costLines"} />
                </h3>
                {!isDisabled && (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">
                            <Translate contentKey={"tempApp.transferRequest.supplier"} />
                          </TableHead>
                          <TableHead className="text-xs w-24">
                            <Translate contentKey={"tempApp.transferRequest.cost"} />
                          </TableHead>
                          <TableHead className="text-xs w-32">
                            <Translate contentKey={"tempApp.transferRequest.costDate"} />
                          </TableHead>
                          <TableHead className="text-xs">
                            <Translate contentKey={"common.comments"} />
                          </TableHead>
                          <TableHead className="text-xs w-20"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-xs">
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
                          </TableCell>
                          <TableCell className="text-xs">
                            <Input
                              type="number"
                              value={costLines?.cost ?? ''}
                              disabled={isDisabled}
                              onChange={e =>
                                setCostLines(prevState => ({
                                  ...prevState,
                                  cost: Number(e.target.value),
                                }))
                              }
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell className="text-xs">
                            <Input
                              type="date"
                              name="costDate"
                              id="costDate"
                              disabled={isDisabled}
                              onChange={e => {
                                const date = new Date(e.target.value);
                                const isoDateString = toLocalISOString(date);
                                setCostLines((prevState) => ({ ...prevState, costDate: isoDateString }));
                              }}
                              value={costLines?.costDate ? format(new Date(costLines.costDate), 'yyyy-MM-dd') : ''}
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell className="text-xs">
                            <Textarea
                              name={'comment'}
                              disabled={isDisabled}
                              value={costLines?.comment || ''}
                              onChange={handleCostLineChange}
                              className="h-8 text-xs resize-none"
                            />
                          </TableCell>
                          <TableCell className="text-xs">
                            <Button
                              disabled={!costLines || !costLines?.supplier || !costLines?.cost || !costLines?.costDate}
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => handleAdd('costLine')}
                              type="button"
                            >
                              Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">{translate("tempApp.transferRequest.supplier")}</TableHead>
                        <TableHead className="text-xs">{translate("tempApp.transferRequest.cost")}</TableHead>
                        <TableHead className="text-xs">{translate("tempApp.transferRequest.costDate")}</TableHead>
                        <TableHead className="text-xs">{translate("common.comment")}</TableHead>
                        {!isDisabled && (
                          <TableHead className="text-xs w-16">{translate("common.delete")}</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transferRequest?.costLines?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs">{item.supplier?.name}</TableCell>
                          <TableCell className="text-xs">{item.cost}</TableCell>
                          <TableCell className="text-xs">
                            {item.costDate ? format(new Date(item.costDate), 'yyyy-MM-dd') : ''}
                          </TableCell>
                          <TableCell className="text-xs">{item.comment}</TableCell>
                          {!isDisabled && (
                            <TableCell className="text-xs">
                              {deleteColumnTemplate(item, { rowIndex: index }, 'costLines')}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </form>

          <div className="w-80">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">
                  <Translate contentKey={"common.actions"} />
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs">
                    <Translate contentKey={"common.status"} />
                  </Label>
                  <Select
                    value={statusOptions.find(opt => opt === transferRequest?.status) ? { label: transferRequest?.status, value: transferRequest?.status } : { label: 'PLACED', value: 'PLACED' }}
                    options={statusOptions.map(opt => ({ label: opt, value: opt }))}
                    id="status"
                    isDisabled={isDisabled}
                    onChange={e => setTransferRequest(prv => ({ ...prv, status: e.value as "PLACED" | "CONFIRMED" }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs flex-1" asChild>
                    <Link to="/inventory/transfer-request">
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      <Translate contentKey={"common.back"} />
                    </Link>
                  </Button>

                  {!isConfirmed && (
                    <Button size="sm" className="h-8 text-xs flex-1" type="button" onClick={saveEntity} disabled={updating || isDisabled}>
                      <Save className="h-4 w-4 mr-1" />
                      <Translate contentKey={"common.save"} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {transferRequestEntity?.id && <AuditLogs entityId={transferRequestEntity?.id} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferRequestUpdate;
