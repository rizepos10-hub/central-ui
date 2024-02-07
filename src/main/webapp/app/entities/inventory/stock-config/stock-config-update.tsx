import React, {useEffect, useMemo, useState} from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {Button, Row, Col, FormGroup, Label, Input, Table} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './stock-config.reducer';
import {getEntities as getItemsForStock} from './items-stock-config.reducer';
import {getEntities as getSuppliers} from '../supplier/supplier.reducer';
import {InputText} from "primereact/inputtext";
import {IStockConfig} from "app/shared/model/STOCK/stock-config.model";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {getSortState, translate, Translate} from "react-jhipster";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import Select from "react-select";
import {IBranch} from "app/shared/model/branch.model";
import {CascadeSelect} from "primereact/cascadeselect";
import {InputNumber} from "primereact/inputnumber";
import {Dropdown} from "primereact/dropdown";
import {ISupplier} from "app/shared/model/STOCK/supplier.model";

export const StockConfigUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [stockConfig, setStockConfig] = useState<IStockConfig>({
    supplierConfigurations: []
  });
  const [showInput, setShowInput] = useState(false)
  const stockConfigEntity = useAppSelector(state => state.stockConfig.entity);
  const itemsForStock = useAppSelector(state => state.itemForStock.entities);
  const suppliers = useAppSelector(state => state.supplier.entities);

  const loading = useAppSelector(state => state.stockConfig.loading);
  const updating = useAppSelector(state => state.stockConfig.updating);
  const updateSuccess = useAppSelector(state => state.stockConfig.updateSuccess);
  const filteredSuppliers = useMemo(() => {

    return suppliers.filter(supplier => !stockConfig.supplierConfigurations?.some(config => config.supplier.id === supplier.id))
  }, [stockConfig?.supplierConfigurations?.length, suppliers]);



  const handleClose = () => {
    navigate('/inventory/stock-config' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getItemsForStock({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getSuppliers({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if(stockConfigEntity){
      setStockConfig(stockConfigEntity)
    }
  }, [updateSuccess, stockConfigEntity?.id]);

  const handleChange = e => {
    const { name, value } = e.target ;
    setStockConfig(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSearchClick = () => {
    if(!showInput) {
      setShowInput(true)
      return
    }
  };

  const handleItemSelect = (selectedItem) => {
    const { value: item } = selectedItem;
     setStockConfig((prevState) => ({...prevState, item, itemId: item?.id}))
  };

  const handleVariantSelect = (selectedVariant) => {
    const { value: variant } = selectedVariant;
    setStockConfig((prevState) => ({
      ...prevState,
      variantId: variant?.id,
      item: {...prevState.item, variant}
    }))
  };


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
          if(configIndex === index){
            supConfig.defaultPrice = price
          }
          return supConfig
        })
        return {...prevState, supplierConfigurations: updatedConfigurations}
      })
  };




  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...stockConfig,
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
          <h2>{isNew ?  "Add New Stock Config" : "Edit Stock Config"}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <FormGroup>

                <div className={"d-flex flex-column"}>
                  <label className={"mt-2"}>
                   <strong>
                     <Translate contentKey={"tempApp.stockConfig.item"}>Item</Translate>
                   </strong>
                  </label>
                  <div className={"d-flex gap-1"}>
                  <CascadeSelect value={stockConfig.item?.variant} onChange={handleVariantSelect} onGroupChange={handleItemSelect} options={itemsForStock}
                                 optionLabel="name" optionGroupLabel="name" optionGroupChildren={['variants']}
                                 className="w-full md:w-20rem" breakpoint="767px" placeholder="Select an Item" style={{ minWidth: '16rem' }}  />
                    {showInput ? <InputText/> : null}
                  <i
                    className="pi pi-search mt-2 cursor-pointer"
                    style={{ fontSize: '1.8rem' }}
                    onClick={handleSearchClick}
                  />
                  </div>
                </div>

                <div className={"d-flex flex-column mt-2"}>
                  <strong>
                  <Label for="description">Description</Label>
                  </strong>
                  <InputText
                    type="text"
                    required
                    name="description"
                    id="description"
                    value={stockConfig.description}
                    onChange={handleChange}
                    className={"w-full md:w-20rem"}
                  />
                </div>



                <div className={"d-flex flex-column mt-2"}>
                  <strong>
                    <Label for="defaultPrice">Default Price</Label>
                  </strong>
                  <InputNumber
                    name="defaultPrice"
                    id="defaultPrice"
                    value={stockConfig.defaultPrice}
                    onValueChange={handleChange}
                    className={"w-full md:w-20rem"}

                  />
                </div>

                <div className={"d-flex flex-column mt-2"}>
                  <strong>
                  <Label for="minOrderQuantity">Minimum Order Quantity</Label>
                  </strong>
                  <InputNumber
                    name="minOrderQuantity"
                    id="minOrderQuantity"
                    value={stockConfig.minOrderQuantity}
                    onValueChange={handleChange}
                    className={"w-full md:w-20rem"}

                  />
                </div>

                <div className={"d-flex flex-column mt-2 "}>

                  <strong>
                    <Label>Supplier Configuration</Label>
                  </strong>
                  <div className={"d-flex flex-column border p-3"}>

                    <Dropdown
                      options={filteredSuppliers}
                      placeholder="Select a Supplier"
                      className="w-full md:w-14rem"
                      optionLabel={"name"}
                      filter
                      onChange={handleAddSupplier}
                    />
                <Table bordered className={"mt-2"}>
                  <thead>
                  <tr>
                  <th>Supplier</th>
                  <th>Price</th>
                  </tr>
                  </thead>
                  <tbody>
                  {stockConfig?.supplierConfigurations?.map((supConfig, index) => (
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
              <Button tag={Link} to="/inventory/stockConfig" replace color="info">
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

export default StockConfigUpdate;
