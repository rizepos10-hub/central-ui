import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Row, Col, FormGroup, Label, Table } from 'reactstrap';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { reset } from './purchase-config.reducer';
import { getEntities as getSuppliers } from '../supplier/supplier.reducer';
import { IPurchaseConfig } from "app/shared/model/STOCK/purchase-config.model";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { getSortState, translate, Translate } from "react-jhipster";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Card as PrimeCard } from 'primereact/card';
import { InputText } from 'primereact/inputtext';

interface PurchaseConfigUpdateTabProps {
  id?: string; // Make `id` optional,
  variantIndex: number;
  onConfigChange: (config: IPurchaseConfig, variantIndex: number) => void;
  purchaseConfigEntity: IPurchaseConfig;
}

export const PurchaseConfigUpdateTab: React.FC<PurchaseConfigUpdateTabProps> = ({ variantIndex, id, onConfigChange, purchaseConfigEntity }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isNew = id === undefined;
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [purchaseConfig, setStockConfig] = useState<IPurchaseConfig>({
    supplierConfigurations: []
  });

  const suppliers = useAppSelector(state => state.supplier.entities);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => !purchaseConfig.supplierConfigurations?.some(config => config.supplier.id === supplier.id))
  }, [purchaseConfig?.supplierConfigurations?.length, suppliers]);

  useEffect(() => {
    onConfigChange(purchaseConfig, variantIndex);
  }, [purchaseConfig]);

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    }

    dispatch(getSuppliers({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    return () => {
      dispatch(reset())
    }

  }, [variantIndex, id]);

  useEffect(() => {
    if (purchaseConfigEntity) {
      setStockConfig(purchaseConfigEntity)
    }
  }, [purchaseConfigEntity?.id]);

  const handleNumberChange = (field, num) => {
    setStockConfig(prevState => ({ ...prevState, [field]: num }));
  };

  const handleAddSupplier = (selectedSupplier) => {
    const newConfig = {
      supplier: selectedSupplier.value,
      defaultPrice: null,
      code: ""
    };

    setStockConfig((prevState) => ({
      ...prevState,
      supplierConfigurations: [...(prevState.supplierConfigurations || []), newConfig]
    }));
  };

  const handleSupplierConfigChange = (configIndex, price) => {
    setStockConfig((prevState) => {
      const updatedConfigurations = prevState?.supplierConfigurations?.map((supConfig, index) => {
        return { ...supConfig, defaultPrice: configIndex === index ? price : supConfig.defaultPrice }
      });
      return { ...prevState, supplierConfigurations: updatedConfigurations }
    });
  };

  const handleSupplierCodeChange = (configIndex, newCode) => {
    setStockConfig((prevState) => {
      const updatedConfigurations = prevState?.supplierConfigurations?.map((supConfig, index) => {
        return index === configIndex ? { ...supConfig, code: newCode } : supConfig;
      });
      return { ...prevState, supplierConfigurations: updatedConfigurations }
    });
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? translate("tempApp.stockConfig.addNewPurchaseConfig") : translate("tempApp.stockConfig.editPurchaseConfig")}</h2>
        </Col>
      </Row>
      <Row>
        <Col className="d-flex flex-column p-3">
          <FormGroup>
            <Row>
              <Col md="6">
                <div className={"d-flex flex-column mt-2"}>
                  <strong>
                    <Label for="defaultPrice">{translate("tempApp.stockConfig.defaultPrice")}</Label>
                  </strong>
                  <InputNumber
                    name="defaultPrice"
                    id="defaultPrice"
                    value={purchaseConfig?.defaultPrice}
                    onChange={(e) => handleNumberChange("defaultPrice", e.value)}
                    className={"w-full md:w-20rem"}
                    required
                  />
                </div>
              </Col>
              <Col md="6">
                <div className={"d-flex flex-column mt-2"}>
                  <strong>
                    <Label for="minOrderQuantity">{translate("tempApp.stockConfig.minOrderQuantity")}</Label>
                  </strong>
                  <InputNumber
                    name="minOrderQuantity"
                    id="minOrderQuantity"
                    value={purchaseConfig.minOrderQuantity}
                    onChange={(e) => handleNumberChange("minOrderQuantity", e.value)}
                    className={"w-full md:w-20rem"}
                  />
                </div>
              </Col>
            </Row>

            <div className={"d-flex flex-column mt-2 "}>
              <strong>
                <Label>{translate("tempApp.stockConfig.supplierConfig")}</Label>
              </strong>
              <div className={"d-flex flex-column border p-3"}>
                <Label>{translate("tempApp.stockConfig.selectSupplier")}</Label>
                <Dropdown
                  options={filteredSuppliers}
                  placeholder={translate("tempApp.stockConfig.selectSupplier")}
                  className="w-full md:w-14rem"
                  optionLabel={"name"}
                  filter
                  onChange={handleAddSupplier}
                />
                <Table bordered className={"mt-2"}>
                  <thead>
                    <tr>
                      <th>{translate("common.supplier")}</th>
                      <th>{translate("common.costPrice")}</th>
                      <th>{translate("common.supplierCode")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseConfig?.supplierConfigurations?.map((supConfig, index) => (
                      <tr key={supConfig.supplier.id}>
                        <td>{supConfig.supplier.name}</td>
                        <td>
                          <InputNumber
                            required
                            onWheel={(e: any) => e.target.blur()}
                            size={60}
                            value={supConfig?.defaultPrice}
                            onChange={e => handleSupplierConfigChange(index, e.value)}
                          />
                        </td>
                        <td>
                          <InputText
                            value={supConfig.code}
                            onChange={e => handleSupplierCodeChange(index, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </FormGroup>
        </Col>
      </Row>
    </div>
  );
};

export default PurchaseConfigUpdateTab;
