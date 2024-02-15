import React, {useEffect, useMemo, useState} from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {Button, Row, Col, FormGroup, Label, Input, Table, Spinner} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './stock-config.reducer';
import {getEntities as getItemsForStock, searchEntities as searchItems} from './items-stock-config.reducer';
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
import VariantSelectionModal from "app/entities/inventory/stock-config/variant-selection-modal";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {Button as PrimeButton} from "primereact/button"
import StockQuantityModal from "app/entities/inventory/stock-config/stock-quantity-modal";

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedStock, setEditedStock] = useState();
  const stockConfigEntity = useAppSelector(state => state.stockConfig.entity);
  const itemsForStock = useAppSelector(state => state.itemForStock.entities);
  const loadingItems = useAppSelector(state => state.itemForStock.loading);
  const suppliers = useAppSelector(state => state.supplier.entities);

  const loading = useAppSelector(state => state.stockConfig.loading);
  const updating = useAppSelector(state => state.stockConfig.updating);
  const updateSuccess = useAppSelector(state => state.stockConfig.updateSuccess);
  const quantityUpdateSuccess = useAppSelector(state => state.stockQuantity.updateSuccess);

  console.log(quantityUpdateSuccess, 'quantityUpdateSuccess')


  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => !stockConfig.supplierConfigurations?.some(config => config.supplier.id === supplier.id))
  }, [stockConfig?.supplierConfigurations?.length, suppliers]);

  const filterItems = (e) => {
    if(!searchTerm) return;
    if(e.key !== "Enter") return;
    e.preventDefault();
    dispatch(searchItems({
      query: searchTerm
    }));
  };


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

    return () => {
      dispatch(reset())
    }

  }, [quantityUpdateSuccess]);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if(stockConfigEntity){
      setStockConfig(stockConfigEntity)
    }
  }, [updateSuccess, stockConfigEntity?.id, quantityUpdateSuccess]);

  const handleChange = e => {
    const { name, value } = e.target ;
    setStockConfig(prevState => ({ ...prevState, [name]: value }));
  };

  const handleNumberChange = (filed, num) => {
    setStockConfig(prevState => ({ ...prevState, [filed]: num }));
  }

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


  const toggleModal = () => {
   setIsModalOpen(prevState => !prevState)
  }

  const actionBodyTemplate = (rowData) => {

    const handleClick = () => {
      setEditedStock(rowData);
      toggleModal();
    }

    return (
      <PrimeButton type="button" icon="pi pi-cog" rounded onClick={handleClick}></PrimeButton>
    )
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

            <form onSubmit={saveEntity}>
              <FormGroup>
                <div className={"d-flex flex-column"}>
                  <label className={"mt-2"}>
                   <strong>
                     <Translate contentKey={"tempApp.stockConfig.item"}>Item</Translate>
                   </strong>
                  </label>
                {/*   <div className={"d-flex gap-1"}> */}
                {/*   <InputText value={stockConfig?.item?.name || null} onClick={toggleModal} /> */}
                {/*     <VariantSelectionModal isOpen={isModalOpen} toggle={toggleModal} onSelectItem={() => {}} /> */}


                {/*   </div> */}
                  <CascadeSelect value={stockConfig.item?.variant} onChange={handleVariantSelect} onGroupChange={handleItemSelect} options={itemsForStock}
                                 optionLabel="name" optionGroupLabel="name" optionGroupChildren={['variants']}
                                 className="w-full md:w-20rem" breakpoint="767px" placeholder="Select an Item" style={{ minWidth: '16rem' }}  />
                </div>


                <div className={"d-flex flex-column mt-2"}>
                  <strong>
                  <Label for="name">Name</Label>
                  </strong>
                  <InputText
                    type="text"
                    required
                    name="name"
                    id="name"
                    value={stockConfig.name}
                    onChange={handleChange}
                    className={"w-full md:w-20rem"}
                  />
                </div>

                <div className={"d-flex flex-column mt-2"}>
                  <strong>
                    <Label for="description">Description</Label>
                  </strong>
                  <InputText
                    type="text"
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
                    value={stockConfig?.defaultPrice}
                    onChange={(e) => handleNumberChange("defaultPrice", e.value)}
                    className={"w-full md:w-20rem"}
                    required
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
                    onChange={(e) => handleNumberChange("minOrderQuantity", e.value)}
                    className={"w-full md:w-20rem"}
                  />
                </div>

                <Row>
                  <DataTable
                    value={stockConfig?.stockQuantities}
                    editMode="row"
                    header={"Stock Config"}
                    removableSort
                    paginator
                    key={"id"}
                    totalRecords={stockConfig?.stockQuantities?.length}
                    rows={20}
                  >

                    <Column field="itemName" header={"Item"} />

                    <Column field="location.name" header={"Location"} />

                    <Column field="quantity" header={"Quantity"}  />

                    <Column bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />


                  </DataTable>
                </Row>

                <div className={"d-flex flex-column mt-2 "}>
                <strong>
                  <Label>Supplier Configuration</Label>
                </strong>
                <div className={"d-flex flex-column border p-3"}>
                  <Label>Select Supplier</Label>
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
              <Button tag={Link} to="/inventory/stock-config" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;Back
              </Button>
              &nbsp;
              <Button color="primary" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;Save
              </Button>
            </form>
        </Col>
      </Row>
      <StockQuantityModal isOpen={isModalOpen} stockQuantity={editedStock} toggle={toggleModal} />
    </div>
  );
};

export default StockConfigUpdate;
