import React, {useEffect, useMemo, useState} from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {Button, Row, Col, FormGroup, Label, Input, Table, Spinner} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './purchase-config.reducer';
import {getEntities as getSuppliers} from '../supplier/supplier.reducer';
import {IPurchaseConfig} from "app/shared/model/STOCK/purchase-config.model";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {getSortState, translate, Translate} from "react-jhipster";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {InputNumber} from "primereact/inputnumber";
import {Dropdown} from "primereact/dropdown";
import {Card as PrimeCard} from 'primereact/card'

export const PurchaseConfigUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const variantId = searchParams.get('variantId');
  const itemId = searchParams.get('itemId');
  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [purchaseConfig, setStockConfig] = useState<IPurchaseConfig>({
    supplierConfigurations: []
  });

  const purchaseConfigEntity = useAppSelector(state => state.purchaseConfig.entity);
  const suppliers = useAppSelector(state => state.supplier.entities);

  const loading = useAppSelector(state => state.purchaseConfig.loading);
  const updating = useAppSelector(state => state.purchaseConfig.updating);
  const updateSuccess = useAppSelector(state => state.purchaseConfig.updateSuccess);



  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => !purchaseConfig.supplierConfigurations?.some(config => config.supplier.id === supplier.id))
  }, [purchaseConfig?.supplierConfigurations?.length, suppliers]);



  const handleClose = () => {
    navigate(`/inventory/stock/purchase-config/${purchaseConfigEntity.id}/edit` + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getSuppliers({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    return () => {
      dispatch(reset())
    }

  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if(purchaseConfigEntity){
      setStockConfig(purchaseConfigEntity)
    }
  }, [updateSuccess, purchaseConfigEntity?.id]);



  const handleNumberChange = (filed, num) => {
    setStockConfig(prevState => ({ ...prevState, [filed]: num }));
  }



  const handleAddSupplier = (selectedSupplier) => {
    const newConfig = {
      supplier: selectedSupplier.value,
      defaultPrice: null
    };

    setStockConfig((prevState) => ({
      ...prevState,
      supplierConfigurations: [...(prevState.supplierConfigurations || []), newConfig]
    }));
  };


  const handleSupplierConfigChange = (configIndex, price) => {
      setStockConfig((prevState) => {
        const updatedConfigurations = prevState?.supplierConfigurations?.map((supConfig, index) => {

          return {...supConfig, defaultPrice: configIndex === index ? price : supConfig.defaultPrice}
        })
        return {...prevState, supplierConfigurations: updatedConfigurations}
      })
  };




  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...purchaseConfig,
      ...(isNew && { variantId, itemId }),
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? translate("tempApp.stockConfig.addNewPurchaseConfig") : translate("tempApp.stockConfig.editPurchaseConfig")}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3">
          <PrimeCard>
            <form onSubmit={saveEntity}>
              <FormGroup>

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
                  <th>{translate("common.price")}</th>
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
                    </tr>
                  ))}
                  </tbody>
                </Table>
                </div>
              </div>

              </FormGroup>
              <Button tag={Link} to="/inventory/stock" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;{translate("common.back")}
              </Button>
              &nbsp;
              <Button color="primary" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;{translate("common.save")}
              </Button>
            </form>
          </PrimeCard>
        </Col>
      </Row>
    </div>
  );
};

export default PurchaseConfigUpdate;
