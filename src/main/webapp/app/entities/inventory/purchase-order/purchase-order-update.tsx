import React, { useEffect, useState } from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './purchase-order.reducer';
import {InputText} from "primereact/inputtext";
import {IPurchaseOrder} from "app/shared/model/STOCK/purchase-order.model";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {Translate} from "react-jhipster";
import Select from "react-select";
import {IBranch} from "app/shared/model/branch.model";
import {  getEntities as getSuppliers } from '../supplier/supplier.reducer';
import {  getEntities as getWarehouses } from '../warehouse/warehouse.reducer';
import {ISupplier} from "app/shared/model/STOCK/supplier.model";
import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";
import {Calendar} from "primereact/calendar";


export const PurchaseOrderUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [purchaseOrder, setPurchaseOrder] = useState<IPurchaseOrder>({
  });
  const branchList = useAppSelector(state => state.branch.entities);
  const supplierList = useAppSelector(state => state.supplier.entities);
  const warehouseList = useAppSelector(state => state.warehouse.entities);

  const purchaseOrderEntity = useAppSelector(state => state.purchaseOrder.entity);
  const loading = useAppSelector(state => state.purchaseOrder.loading);
  const updating = useAppSelector(state => state.purchaseOrder.updating);
  const updateSuccess = useAppSelector(state => state.purchaseOrder.updateSuccess);



  const handleClose = () => {
    navigate('/inventory/purchase-order' + location.search);
  };

  const handleBranchChange = (selectedBranch: IBranch) => {
    setPurchaseOrder(prevState => ({...prevState, branch: selectedBranch}))
  }

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
    }))

  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if(purchaseOrderEntity){
      setPurchaseOrder(purchaseOrderEntity)
    }
  }, [updateSuccess, purchaseOrderEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPurchaseOrder(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...purchaseOrder,
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
          <h2>{isNew ?  "Add New Sales Location" : "Edit Sales Location"}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="12" className="d-flex flex-column p-3 bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <FormGroup>
                <Row>
             <Col md={4} className={"d-flex flex-column gap-2"}>
               <div className={"d-flex gap-2 mt-2"}>
                 <Label for="supplier" className={"mt-2"}>Supplier</Label>
               <Select
                 options={supplierList}
                 name="supplier"
                 id="supplier"
                 placeholder={"Select supplier"}
                 getOptionLabel={(option: ISupplier) => option.name}
                 getOptionValue={option => option.id}
                 onChange={(selectedSupplier) => setPurchaseOrder((prev) => ({...prev, supplier: selectedSupplier}))}
                 />
               </div>

               <div className={"d-flex gap-2 mt-2"}>
                 <Label for="warehouse" className={"mt-2"}>warehouse</Label>
                 <Select
                   name="warehouse"
                   id="warehouse"
                   placeholder={"Select warehouse"}
                   options={warehouseList}
                   getOptionLabel={(option: IWarehouse) => option.name}
                   getOptionValue={option => option.id}
                   onChange={(selectedWarehouse) => setPurchaseOrder((prev) => ({...prev, warehouse: selectedWarehouse}))}
                 />
               </div>
             </Col>

              <Col md={4} className={"d-flex flex-column gap-2"}>
                <div className={"d-flex gap-2 mt-2"}>
                  <Label for="delivery" className={"mt-2"}>Delivery</Label>
                  <InputText
                    name="delivery"
                    id="delivery"
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex gap-2 mt-2"}>
                  <Label for="address" className={"mt-2"}>Address</Label>
                  <InputText
                    name="address"
                    id="address"
                    onChange={handleChange}
                  />
                </div>
              </Col>

                <Col md={4} className={"d-flex flex-column gap-2"}>
                  <div className={"d-flex gap-2  mt-2"}>
                    <Label for="datePlaced" className={"mt-2"}>Order Date</Label>
                    <Calendar
                      name="datePlaced"
                      id="datePlaced"
                      onChange={handleChange}
                    />
                  </div>

                  <div className={"d-flex gap-2 mt-2"}>
                    <Label for="dateDelivered" className={"mt-2"}>Delivery Date</Label>
                    <Calendar
                      name="dateDelivered"
                      id="dateDelivered"
                      onChange={handleChange}
                    />
                  </div>
                </Col>
                </Row>
              </FormGroup>
              <Button tag={Link} to="/inventory/purchase-order" replace color="info">
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

export default PurchaseOrderUpdate;
