import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IStockQuantity } from 'app/shared/model/STOCK/stock-quantity.model';
import { getStockQuantitiesForVariant } from 'app/entities/inventory/stock-config/stock-quantity.reducer';
import { getEntities as getWarehouses } from 'app/entities/inventory/warehouse/warehouse.reducer';
import { getEntities as getSalesLocations } from 'app/entities/inventory/sales-location/sales-location.reducer';
import { getSortState, translate, Translate } from 'react-jhipster';
import PurchaseConfigUpdateTab from 'app/entities/inventory/stock-config/purchase-config-update-tab';
import { IPurchaseConfig } from 'app/shared/model/STOCK/purchase-config.model';
import { IWarehouse } from 'app/shared/model/STOCK/warehouse.model';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { IVariableItemVariant } from 'app/shared/model/ITEM/retail/variable-item.model';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil } from 'lucide-react';
const ItemStock = ({
  variant,
  itemId,
  productPurchaseConfig,
  variantIndex,
  handleVariantFieldChange,
}: {
  variant: IVariableItemVariant;
  itemId: string;
  productPurchaseConfig: (purchaseConfig: IPurchaseConfig, variantIndex: number) => void;
  variantIndex: number;
  handleVariantFieldChange: (variantIndex: number, fieldName: keyof IVariableItemVariant, value: any, index: number) => void;
}) => {
  const dispatch = useAppDispatch();
  const wareHouses = useAppSelector(state => state.warehouse.entities);
  const salesLocations = useAppSelector(state => state.salesLocation.entities);
  const [dialogOpen, setDialogOpen] = useState<boolean[]>([]);
  const [salesLocationsindex, setSalesLocationsindex] = useState<boolean[]>([]);
  const [wareHousesIndex, setWareHousesIndex] = useState<boolean[]>([]);
  const isNew = itemId === undefined;
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(window.location, ITEMS_PER_PAGE, 'id'), window.location.search)
  );

  const handleConfigChange = (newConfig: IPurchaseConfig, variantIndex: number) => {
    productPurchaseConfig(newConfig, variantIndex);
  };

  const handleOpen = (index: number) => {
    setDialogOpen(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };
  const handleClose = (index: number) => {
    setDialogOpen(prev => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });
  };

  useEffect(() => {
    if (!isNew && variant?.id) {
      const query = `itemId=${itemId}&variantId=${variant?.id}`;
      dispatch(getStockQuantitiesForVariant(query));
    }
    dispatch(getWarehouses({}));
    dispatch(
      getSalesLocations({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  }, [itemId, variant?.id]);

  useEffect(() => {
    const wareHousesIndex: boolean[] = [];
    wareHouses?.map((warehouse, index) => {
      const findStock = variant?.stockQuantities?.find(stock => stock.location.id === warehouse.id);

      const inputQuantity = !isNew ? (findStock?.quantity ? true : false) : isNew ? false : !!findStock?.stockChangeReason?.trim();
      wareHousesIndex.push(inputQuantity);
    });

    setWareHousesIndex(wareHousesIndex);
  }, [wareHouses, itemId]);

  useEffect(() => {
    const salesLocationsindex: boolean[] = [];
    salesLocations?.map((salesLocation, index) => {
      const findStock = variant?.stockQuantities?.find(stock => stock.location.id === salesLocation.id);

      const inputQuantity = !isNew ? (findStock?.quantity ? true : false) : isNew ? false : !!findStock?.stockChangeReason?.trim();
      salesLocationsindex.push(inputQuantity);
    });

    setSalesLocationsindex(salesLocationsindex);
  }, [salesLocations, itemId]);

  const enableSaleHouseInput = (index: number, value: string) => {
    if (value.trim() === '') {
      setSalesLocationsindex(prev => {
        const newState = [...prev];
        newState[index] = true;
        return newState;
      });
    } else {
      setSalesLocationsindex(prev => {
        const newState = [...prev];
        newState[index] = false;
        return newState;
      });
    }
  };

  const enableWareHouseInput = (index: number, value: string) => {
    if (value.trim() === '') {
      setWareHousesIndex(prev => {
        const newState = [...prev];
        newState[index] = true;
        return newState;
      });
    } else {
      setWareHousesIndex(prev => {
        const newState = [...prev];
        newState[index] = false;
        return newState;
      });
    }
  };
  
  const handleStockQuantityChange = (
    location: IWarehouse,
    field: 'minimumStockLevel' | 'quantity' | 'unitCost' | 'stockChangeReason',
    value: number | string,
    index: number
  ) => {
    const currentStockQuantities = variant?.stockQuantities || [];
    const locationIndex = currentStockQuantities.findIndex(sq => sq.location.id === location.id);
    let updatedStockQuantities;
    if (locationIndex > -1) {
      updatedStockQuantities = currentStockQuantities.map((sq, idx) => (idx === locationIndex ? { ...sq, [field]: value } : sq));
    } else {
      updatedStockQuantities = [...currentStockQuantities, { location, [field]: value }];
    }
    handleVariantFieldChange(variantIndex, 'stockQuantities', updatedStockQuantities, index);
  };

  return (
    <div>
      {(wareHouses?.length > 0 || salesLocations?.length > 0) && (
        <>
          <h4 className="text-base font-semibold mb-3">Stock Management</h4>
          <Tabs defaultValue={wareHouses?.length > 0 ? "warehouses" : "salesLocations"}>
            <TabsList className="w-full justify-start">
              {wareHouses?.length > 0 && (
                <TabsTrigger value="warehouses" className="text-xs h-7">Warehouses</TabsTrigger>
              )}
              {salesLocations?.length > 0 && (
                <TabsTrigger value="salesLocations" className="text-xs h-7">Sales Locations</TabsTrigger>
              )}
            </TabsList>

            {wareHouses?.length > 0 && (
              <TabsContent value="warehouses">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">
                        <Translate contentKey="items.update.name">Name</Translate>
                      </TableHead>
                      <TableHead className="text-xs">
                        <Translate contentKey="items.update.minimumStockLevel.title">Minimum Stock Level</Translate>
                      </TableHead>
                      <TableHead className="text-xs">
                        <Translate contentKey="items.update.stockQuantity.quantity">Quantity</Translate>
                      </TableHead>
                      <TableHead className="text-xs">
                        <Translate contentKey="items.update.stockQuantity.unitCost">Unit Cost</Translate>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wareHouses.map((warehouse, index) => {
                      const stockQuantity = variant?.stockQuantities?.find(stock => stock.location.id === warehouse.id);
                      return (
                        <TableRow key={warehouse.id}>
                          <TableCell className="text-xs font-bold">{warehouse.name}</TableCell>
                          <TableCell className="text-xs">
                            <Input
                              type="number"
                              name="minimumStockLevel"
                              id={`warehouse-minimumStockLevel-${index}`}
                              className="h-8 text-xs"
                              placeholder={translate('items.update.placeholders.minimumStockLevelPlaceHolder')}
                              value={stockQuantity?.minimumStockLevel ?? ''}
                              onChange={e => handleStockQuantityChange(warehouse, 'minimumStockLevel', parseFloat(e.target.value) || 0, index)}
                              step="0.01"
                              min="0"
                            />
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                name="quantity"
                                id={`warehouse-quantity-${index}`}
                                className="h-8 text-xs"
                                placeholder={translate('items.update.placeholders.quantity')}
                                value={stockQuantity?.quantity ?? ''}
                                disabled={wareHousesIndex[index]}
                                onChange={e => handleStockQuantityChange(warehouse, 'quantity', parseFloat(e.target.value) || 0, index)}
                                step="0.01"
                              />
                              {!isNew && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={e => {
                                    e.preventDefault();
                                    handleOpen(index);
                                  }}
                                >
                                  <Pencil className="h-3 w-3 text-gray-400" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <Input
                              type="number"
                              name="unitCost"
                              id={`warehouse-unitCost-${index}`}
                              className="h-8 text-xs"
                              placeholder={translate('items.update.placeholders.unitCost')}
                              value={stockQuantity?.unitCost ?? ''}
                              onChange={e => handleStockQuantityChange(warehouse, 'unitCost', parseFloat(e.target.value) || 0, index)}
                              step="0.01"
                              min="0"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Dialog for warehouses */}
                {wareHouses?.map((warehouse, index) => (
                  <Dialog key={`warehouse-dialog-${index}`} open={dialogOpen[index] || false} onOpenChange={open => !open && handleClose(index)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-base">Stock Quantity Information</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">
                          <Translate contentKey="items.update.stockQuantity.stockChangeReason">Stock Change Reason</Translate>
                        </label>
                        <Textarea
                          name="stockChangeReason"
                          id={`warehouse-stockChangeReason-${index}`}
                          className="text-xs min-h-[80px]"
                          placeholder={translate('items.update.placeholders.stockChangeReason')}
                          value={variant?.stockQuantities?.find(stock => stock.location.id === warehouse.id)?.stockChangeReason ?? ''}
                          onChange={e => {
                            handleStockQuantityChange(warehouse, 'stockChangeReason', e.target.value, index);
                            enableWareHouseInput(index, e.target.value);
                          }}
                          rows={3}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleClose(index)}>
                          <Translate contentKey="common.buttons.cancel">Cancel</Translate>
                        </Button>
                        <Button size="sm" className="h-8 text-xs" onClick={() => handleClose(index)}>
                          <Translate contentKey="common.buttons.save">Save</Translate>
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ))}
              </TabsContent>
            )}

            {salesLocations?.length > 0 && (
              <TabsContent value="salesLocations">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">
                        <Translate contentKey="items.update.name">Name</Translate>
                      </TableHead>
                      <TableHead className="text-xs">
                        <Translate contentKey="items.update.minimumStockLevel.title">Minimum Stock Level</Translate>
                      </TableHead>
                      <TableHead className="text-xs">
                        <Translate contentKey="items.update.stockQuantity.quantity">Quantity</Translate>
                      </TableHead>
                      <TableHead className="text-xs">
                        <Translate contentKey="items.update.stockQuantity.unitCost">Unit Cost</Translate>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesLocations.map((salesLocation, index) => {
                      const stockQuantity = variant?.stockQuantities?.find(stock => stock.location.id === salesLocation.id);
                      return (
                        <TableRow key={salesLocation.id}>
                          <TableCell className="text-xs font-bold">{salesLocation.name}</TableCell>
                          <TableCell className="text-xs">
                            <Input
                              type="number"
                              name="minimumStockLevel"
                              id={`salesLocation-minimumStockLevel-${index}`}
                              className="h-8 text-xs"
                              placeholder={translate('items.update.placeholders.minimumStockLevelPlaceHolder')}
                              value={stockQuantity?.minimumStockLevel ?? ''}
                              onChange={e => handleStockQuantityChange(salesLocation, 'minimumStockLevel', parseFloat(e.target.value) || 0, index)}
                              step="0.01"
                              min="0"
                            />
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                name="quantity"
                                id={`salesLocation-quantity-${index}`}
                                className="h-8 text-xs"
                                placeholder={translate('items.update.placeholders.quantity')}
                                value={stockQuantity?.quantity ?? ''}
                                disabled={salesLocationsindex[index]}
                                onChange={e => handleStockQuantityChange(salesLocation, 'quantity', parseFloat(e.target.value) || 0, index)}
                                step="0.01"
                              />
                              {!isNew && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={e => {
                                    e.preventDefault();
                                    handleOpen(index);
                                  }}
                                >
                                  <Pencil className="h-3 w-3 text-gray-400" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <Input
                              type="number"
                              name="unitCost"
                              id={`salesLocation-unitCost-${index}`}
                              className="h-8 text-xs"
                              placeholder={translate('items.update.placeholders.unitCost')}
                              value={stockQuantity?.unitCost ?? ''}
                              onChange={e => handleStockQuantityChange(salesLocation, 'unitCost', parseFloat(e.target.value) || 0, index)}
                              step="0.01"
                              min="0"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Dialog for sales locations */}
                {salesLocations?.map((salesLocation, index) => (
                  <Dialog key={`salesLocation-dialog-${index}`} open={dialogOpen[index] || false} onOpenChange={open => !open && handleClose(index)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-base">Stock Quantity Information</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">
                          <Translate contentKey="items.update.stockQuantity.stockChangeReason">Stock Change Reason</Translate>
                        </label>
                        <Textarea
                          name="stockChangeReason"
                          id={`salesLocation-stockChangeReason-${index}`}
                          className="text-xs min-h-[80px]"
                          placeholder={translate('items.update.placeholders.stockChangeReason')}
                          value={variant?.stockQuantities?.find(stock => stock.location.id === salesLocation.id)?.stockChangeReason ?? ''}
                          onChange={e => {
                            handleStockQuantityChange(salesLocation, 'stockChangeReason', e.target.value, index);
                            enableSaleHouseInput(index, e.target.value);
                          }}
                          rows={3}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleClose(index)}>
                          <Translate contentKey="common.buttons.cancel">Cancel</Translate>
                        </Button>
                        <Button size="sm" className="h-8 text-xs" onClick={() => handleClose(index)}>
                          <Translate contentKey="common.buttons.save">Save</Translate>
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ))}
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
      <PurchaseConfigUpdateTab
        purchaseConfig={variant?.purchaseConfig}
        onConfigChange={handleConfigChange}
        variantIndex={variantIndex}
        id={variant?.id}
      />
    </div>
  );
};

export default ItemStock;
