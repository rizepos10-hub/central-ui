import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IStockQuantity } from "app/shared/model/STOCK/stock-quantity.model";
import { getStockQuantitiesForVariant } from "app/entities/inventory/stock-config/stock-quantity.reducer";
import { getEntities } from "app/entities/inventory/warehouse/warehouse.reducer";
import { Accordion, AccordionTab } from "primereact/accordion";
import { translate, Translate } from 'react-jhipster';
import { InputNumber } from "primereact/inputnumber";
import PurchaseConfigUpdateTab from "app/entities/inventory/stock-config/purchase-config-update-tab";
import { IPurchaseConfig } from "app/shared/model/STOCK/purchase-config.model";
import Select from "react-select";
import { IWarehouse } from "app/shared/model/STOCK/warehouse.model";
import { Col, Row } from "reactstrap";

const ItemStockAccordion = ({ variant, itemId, productPurchaseConfig, stockQuantityUpdate, variantIndex }) => {
  const dispatch = useAppDispatch();
  const [updatedStockQuantities, setUpdatedStockQuantities] = useState<IStockQuantity[]>([]);
  const stockQuantities = variant?.stockQuantities ? variant?.stockQuantities : [];
  const wareHouses = useAppSelector(state => state.warehouse.entities);
  const [selectedWarehouses, setSelectedWarehouses] = useState<IWarehouse[]>([]);
  const isNew = itemId === undefined;

  const handleConfigChange = (newConfig: IPurchaseConfig, variantIndex: number) => {
    productPurchaseConfig(newConfig, variantIndex);
  };

  useEffect(() => {
    const locationIds = stockQuantities.map(item => item.location.id);
    const filteredSelectedWarehouses = wareHouses.filter(warehouse => locationIds.includes(warehouse.id));

    if (isNew) {
      setSelectedWarehouses([]);
      setUpdatedStockQuantities([]);
    } else {
      setSelectedWarehouses(filteredSelectedWarehouses);
      setUpdatedStockQuantities(stockQuantities);
    }
  }, [wareHouses]);

  useEffect(() => {
    if (!isNew && variant?.id) {
      const query = `itemId=${itemId}&variantId=${variant?.id}`;
      dispatch(getStockQuantitiesForVariant(query));
    }

    dispatch(getEntities({}));
  }, [itemId, variant?.id]);

  useEffect(() => {
    stockQuantityUpdate(updatedStockQuantities, variantIndex);
  }, [updatedStockQuantities, variant?.id]);

  const handleStockQuantityChange = (field, value, index) => {
    setUpdatedStockQuantities((prevConfigs) => {
      const updatedConfigs = [...prevConfigs];
      updatedConfigs[index] = { ...updatedConfigs[index], [field]: value };
      return updatedConfigs;
    });
  };

  const handleWarehouseChange = (selectedWarehouses) => {
    setSelectedWarehouses(selectedWarehouses);
    const newStockQuantities = selectedWarehouses.map((warehouse) => {
      const existingStock = updatedStockQuantities.find(
        (stock) => stock.location?.id === warehouse.id
      );
      return (
        existingStock || {
          id: warehouse.id,
          location: warehouse,
          minimumStockLevel: 0,
          quantity: 0,
          unitCost: 0,
        }
      );
    });
    setUpdatedStockQuantities(newStockQuantities);
  };

  return (
    <div>
      <h4>Stock Management</h4>
      <label className="font-semibold pr-3">Select Warehouses</label>
      <Select
        isMulti
        value={selectedWarehouses}
        onChange={handleWarehouseChange}
        options={wareHouses}
        getOptionLabel={(option) => option.name}
        getOptionValue={(option) => option.id}
        placeholder="Select Warehouses"
      />

      {updatedStockQuantities.map((stock, index) => (
        <div key={stock.id} className="mb-3 mt-3">
          <Row>
            <Col md={12}>
              <h5>Location: {stock?.location?.name}</h5>
            </Col>
            <Col md='4'>
              <div className='col d-flex flex-column gap-2'>
                <label className="font-semibold">
                  <Translate contentKey='items.update.minimumStockLevel.title'>Minimum Stock Level</Translate>
                </label>
                <InputNumber
                  name="minimumStockLevel"
                  id="minimumStockLevel"
                  required
                  min={0}
                  maxFractionDigits={2}
                  inputClassName='w-1'
                  placeholder={translate('items.update.placeholders.minimumStockLevelPlaceHolder')}
                  value={stock?.minimumStockLevel ?? null}
                  onChange={(e) => handleStockQuantityChange("minimumStockLevel", e.value, index)}
                />
              </div>
            </Col>
            <Col md='4'>
              <div className='col d-flex flex-column gap-2'>
                <label className="font-semibold">
                  <Translate contentKey='items.update.stockQuantity.quantity'>Quantity</Translate>
                </label>
                <InputNumber
                  name="quantity"
                  id="quantity"
                  required
                  min={0}
                  maxFractionDigits={2}
                  inputClassName='w-1'
                  placeholder={translate('items.update.placeholders.quantity')}
                  value={stock?.quantity ?? null}
                  onChange={(e) => handleStockQuantityChange("quantity", e.value, index)}
                />
              </div>
            </Col>
            <Col md='4'>
              <div className='col d-flex flex-column gap-2'>
                <label className="font-semibold">
                  <Translate contentKey='items.update.stockQuantity.unitCost'>Unit Cost</Translate>
                </label>
                <InputNumber
                  name="unitCost"
                  id="unitCost"
                  required
                  min={0}
                  maxFractionDigits={2}
                  inputClassName='w-1'
                  placeholder={translate('items.update.placeholders.unitCost')}
                  value={stock?.unitCost ?? null}
                  onChange={(e) => handleStockQuantityChange("unitCost", e.value, index)}
                />
              </div>
            </Col>
          </Row>
        </div>
      ))}

      <PurchaseConfigUpdateTab purchaseConfigEntity={variant?.purchaseConfig} onConfigChange={handleConfigChange} variantIndex={variantIndex} id={variant?.id} />
    </div>
  );
};

export default ItemStockAccordion;
