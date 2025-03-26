import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IStockQuantity } from "app/shared/model/STOCK/stock-quantity.model";
import { getStockQuantitiesForVariant } from "app/entities/inventory/stock-config/stock-quantity.reducer";
import { getEntities as getWarehouses } from "app/entities/inventory/warehouse/warehouse.reducer";
import { getEntities as getSalesLocations } from "app/entities/inventory/sales-location/sales-location.reducer";
import { getSortState, translate, Translate } from 'react-jhipster';
import { InputNumber } from "primereact/inputnumber";
import PurchaseConfigUpdateTab from "app/entities/inventory/stock-config/purchase-config-update-tab";
import { IPurchaseConfig } from "app/shared/model/STOCK/purchase-config.model";
import { IWarehouse } from "app/shared/model/STOCK/warehouse.model";
import { Col, Row } from "reactstrap";
import { TabPanel, TabView } from "primereact/tabview";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { IVariableItemVariant } from "app/shared/model/ITEM/retail/variable-item.model";
import { Dialog } from "primereact/dialog";
import { Button as PrimeButton } from 'primereact/button';
import { InputTextarea } from "primereact/inputtextarea";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  handleVariantFieldChange: (
    variantIndex: number,
    fieldName: keyof IVariableItemVariant,
    value: any,
    index: number
  ) => void;
}) => {
  const dispatch = useAppDispatch();
  const wareHouses = useAppSelector((state) => state.warehouse.entities);
  const salesLocations = useAppSelector((state) => state.salesLocation.entities);
  const [dialogOpen, setDialogOpen] = useState<boolean[]>([]);
  const [salesLocationsindex, setSalesLocationsindex] = useState<boolean[]>([]);
  const [wareHousesIndex, setWareHousesIndex] = useState<boolean[]>([]);
  const isNew = itemId === undefined;
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, "id"), location.search)
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

      const findStock = variant?.stockQuantities?.find(
        (stock) => stock.location.id === warehouse.id
      );

      const inputQuantity = !isNew ? findStock?.quantity ? true : false : isNew ? false : !!findStock?.stockChangeReason?.trim();
          wareHousesIndex.push(inputQuantity);
    })

    setWareHousesIndex(wareHousesIndex);
  }, [wareHouses, itemId]);

  useEffect(() => {
    const salesLocationsindex: boolean[] = [];
    salesLocations?.map((salesLocation, index) => {
      const findStock = variant?.stockQuantities?.find(
        (stock) => stock.location.id === salesLocation.id
      );

      const inputQuantity = !isNew ? findStock?.quantity ? true : false : isNew ? false : !!findStock?.stockChangeReason?.trim();
    salesLocationsindex.push(inputQuantity);
    })

    setSalesLocationsindex(salesLocationsindex);
  }, [salesLocations, itemId]);

  const enableSaleHouseInput = (index: number, value: string) => {
    if(value.trim() === '') {
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
  }

  const enableWareHouseInput = (index: number, value: string) => {
    if(value.trim() === '') {
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

  }
  const handleStockQuantityChange = (
    location: IWarehouse,
    field: "minimumStockLevel" | "quantity" | "unitCost" | "stockChangeReason",
    value: number | string,
    index: number
  ) => {

    const currentStockQuantities = variant?.stockQuantities || [];
    const locationIndex = currentStockQuantities.findIndex((sq) => sq.location.id === location.id);
    let updatedStockQuantities;
    if (locationIndex > -1) {
      updatedStockQuantities = currentStockQuantities.map((sq, idx) =>
        idx === locationIndex ? { ...sq, [field]: value } : sq
      );
    } else {
      updatedStockQuantities = [...currentStockQuantities, { location, [field]: value }];
    }
    handleVariantFieldChange(variantIndex, "stockQuantities", updatedStockQuantities, index);
  };

  return (
    <div>
      <h4>Stock Management</h4>
      <TabView>
        <TabPanel header="Warehouses">
          {wareHouses?.map((warehouse, index) => (
            <Row className="align-items-center" key={index}>
              <Col md="3" className="d-flex align-items-center">
                <div className="col d-flex flex-column gap-2">
                  <label className="font-semibold">
                    <Translate contentKey="items.update.name">Name</Translate>
                  </label>
                  <div>{warehouse?.name}</div>
                </div>
              </Col>
              <Col md="3" className="d-flex align-items-center">
                <div className="col d-flex flex-column gap-2">
                  <label className="font-semibold">
                    <Translate contentKey="items.update.minimumStockLevel.title">
                      Minimum Stock Level
                    </Translate>
                  </label>
                  <InputNumber
                    name="minimumStockLevel"
                    id="minimumStockLevel"
                    required
                    min={0}
                    maxFractionDigits={2}
                    inputClassName="w-1"
                    placeholder={translate("items.update.placeholders.minimumStockLevelPlaceHolder")}
                    value={
                      variant?.stockQuantities?.find((stock) => stock.location.id === warehouse.id)
                        ?.minimumStockLevel ?? null
                    }
                    onChange={(e) =>
                      handleStockQuantityChange(warehouse, "minimumStockLevel", e.value, index)
                    }
                  />
                </div>
              </Col>
              <Col md="3" className="d-flex align-items-center">
                <div className="col d-flex flex-column gap-2">
                  <label className="font-semibold">
                    <Translate contentKey="items.update.stockQuantity.quantity">
                      Quantity
                    </Translate>
                  </label>
                  <div className="d-flex">
                    <InputNumber
                      name="quantity"
                      id="quantity"
                      required
                      maxFractionDigits={2}
                      inputClassName="w-1"
                      placeholder={translate("items.update.placeholders.quantity")}
                      value={
                        variant?.stockQuantities?.find((stock) => stock.location.id === warehouse.id)
                          ?.quantity ?? null
                      }
                      disabled={wareHousesIndex[index]}
                      onChange={(e) =>
                        handleStockQuantityChange(warehouse, "quantity", e.value, index)
                      }
                    />
                    
                    { !isNew &&
                      <div className="d-flex justify-content-end align-items-center">
                        <FontAwesomeIcon onClick={(e) => { e.preventDefault(); handleOpen(index); }} icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
                      </div>
                    }
                  </div>
                </div>
              </Col>
              <Col md="3" className="d-flex align-items-center">
                <div className="col d-flex flex-column gap-2">
                  <label className="font-semibold">
                    <Translate contentKey="items.update.stockQuantity.unitCost">
                      Unit Cost
                    </Translate>
                  </label>
                  <InputNumber
                    name="unitCost"
                    id="unitCost"
                    required
                    min={0}
                    maxFractionDigits={2}
                    inputClassName="w-1"
                    placeholder={translate("items.update.placeholders.unitCost")}
                    value={
                      variant?.stockQuantities?.find((stock) => stock.location.id === warehouse.id)
                        ?.unitCost ?? null
                    }
                    onChange={(e) =>
                      handleStockQuantityChange(warehouse, "unitCost", e.value, index)
                    }
                  />
                </div>
              </Col>

              <Dialog visible={dialogOpen[index] || false} onHide={() => handleClose(index)}  header="Stock Quantity Information" footer={
                  <div>
                    <PrimeButton color="primary" onClick={() => handleClose(index)} className="p-button-text mr-2">
                      <Translate contentKey='common.buttons.cancel'>Cancel</Translate>
                    </PrimeButton>
                    <PrimeButton onClick={() => handleClose(index)} className="p-button-primary">
                    <Translate contentKey='common.buttons.save'>Save</Translate>
                    </PrimeButton>
                  </div>
                }>
                  <div className="d-flex flex-column gap-2">
                    <label className="font-semibold">
                      <Translate contentKey='items.update.stockQuantity.stockChangeReason'>Stock Change Reason</Translate>
                    </label>
                    <InputTextarea
                        name="stockChangeReason"
                        id={`stockChangeReason-${index}`}
                        required
                        placeholder={translate('items.update.placeholders.stockChangeReason')}
                        value={variant?.stockQuantities?.find(
                          (stock) => stock.location.id === warehouse.id
                        )?.stockChangeReason ?? ""}
                        onChange={(e) => {
                          handleStockQuantityChange(warehouse, "stockChangeReason", e.target.value, index)
                          enableWareHouseInput(index, e.target.value);
                        }}
                        autoResize
                        rows={3}
                        cols={30}
                      />
                  </div>
                </Dialog>

            </Row>
          ))}
        </TabPanel>
        <TabPanel header="Sales Locations">
          <Row>
            {salesLocations?.map((salesLocation, index) => (
              <Row className="align-items-center" key={index}>
                <Col md="3" className="d-flex align-items-center">
                  <div className="col d-flex flex-column gap-2">
                    <label className="font-semibold">
                      <Translate contentKey="items.update.name">Name</Translate>
                    </label>
                    <div>{salesLocation?.name}</div>
                  </div>
                </Col>
                <Col md="3" className="d-flex align-items-center">
                  <div className="col d-flex flex-column gap-2">
                    <label className="font-semibold">
                      <Translate contentKey="items.update.minimumStockLevel.title">
                        Minimum Stock Level
                      </Translate>
                    </label>
                    <InputNumber
                      name="minimumStockLevel"
                      id="minimumStockLevel"
                      required
                      min={0}
                      maxFractionDigits={2}
                      inputClassName="w-1"
                      placeholder={translate("items.update.placeholders.minimumStockLevelPlaceHolder")}
                      value={
                        variant?.stockQuantities?.find(
                          (stock) => stock.location.id === salesLocation.id
                        )?.minimumStockLevel ?? null
                      }
                      onChange={(e) =>
                        handleStockQuantityChange(salesLocation, "minimumStockLevel", e.value, index)
                      }
                    />
                  </div>
                </Col>
                <Col md="3" className="d-flex align-items-center">
                  <div className="col d-flex flex-column gap-2">
                    <label className="font-semibold">
                      <Translate contentKey="items.update.stockQuantity.quantity">
                        Quantity
                      </Translate>
                    </label>
                    <div className="d-flex">
                      <InputNumber
                        name="quantity"
                        id="quantity"
                        required
                        maxFractionDigits={2}
                        inputClassName="w-1"
                        placeholder={translate("items.update.placeholders.quantity")}
                        value={
                          variant?.stockQuantities?.find(
                            (stock) => stock.location.id === salesLocation.id
                          )?.quantity ?? null
                        }
                        disabled={salesLocationsindex[index]}
                        onChange={(e) =>
                          handleStockQuantityChange(salesLocation, "quantity", e.value, index)
                        }
                      />
                      { !isNew &&
                        <div className="d-flex justify-content-end align-items-center">
                        <FontAwesomeIcon onClick={(e) => { e.preventDefault(); handleOpen(index); }} icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
                      </div>
                      }
                    </div>
                  </div>
                </Col>
                <Col md="3" className="d-flex align-items-center">
                  <div className="col d-flex flex-column gap-2">
                    <label className="font-semibold">
                      <Translate contentKey="items.update.stockQuantity.unitCost">
                        Unit Cost
                      </Translate>
                    </label>
                    <InputNumber
                      name="unitCost"
                      id="unitCost"
                      required
                      min={0}
                      maxFractionDigits={2}
                      inputClassName="w-1"
                      placeholder={translate("items.update.placeholders.unitCost")}
                      value={
                        variant?.stockQuantities?.find(
                          (stock) => stock.location.id === salesLocation.id
                        )?.unitCost ?? null
                      }
                      onChange={(e) =>
                        handleStockQuantityChange(salesLocation, "unitCost", e.value, index)
                      }
                    />
                  </div>
                </Col>

                <Dialog visible={dialogOpen[index] || false} onHide={() => handleClose(index)}  header="Stock Quantity Information" footer={
                  <div>
                    <PrimeButton color="primary" onClick={() => handleClose(index)} className="p-button-text mr-2">
                      <Translate contentKey='common.buttons.cancel'>Cancel</Translate>
                    </PrimeButton>
                    <PrimeButton onClick={() => handleClose(index)} className="p-button-primary">
                    <Translate contentKey='common.buttons.save'>Save</Translate>
                    </PrimeButton>
                  </div>
                }>
                  <div className="d-flex flex-column gap-2">
                    <label className="font-semibold">
                      <Translate contentKey='items.update.stockQuantity.stockChangeReason'>Stock Change Reason</Translate>
                    </label>
                    <InputTextarea
                        name="stockChangeReason"
                        id={`stockChangeReason-${index}`}
                        required
                        placeholder={translate('items.update.placeholders.stockChangeReason')}
                        value={variant?.stockQuantities?.find(
                          (stock) => stock.location.id === salesLocation.id
                        )?.stockChangeReason ?? ""}
                        onChange={(e) => {
                          handleStockQuantityChange(salesLocation, "stockChangeReason", e.target.value, index);
                          enableSaleHouseInput(index, e.target.value);
                        }}
                        autoResize
                        rows={3}
                        cols={30}
                      />
                  </div>
                </Dialog>

              </Row>
            ))}
          </Row>
        </TabPanel>
      </TabView>
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
