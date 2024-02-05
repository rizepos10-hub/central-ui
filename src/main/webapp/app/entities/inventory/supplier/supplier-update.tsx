import React, { useEffect, useState } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './supplier.reducer';
import {InputText} from "primereact/inputtext";
import {ISupplier} from "app/shared/model/STOCK/supplier.model";

export const SupplierUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [supplier, setSupplier] = useState<ISupplier>({
    name: '',
    address: '',
    phoneNumber: null,
    email: ''
  });

  const supplierEntity = useAppSelector(state => state.supplier.entity);
  const loading = useAppSelector(state => state.supplier.loading);
  const updating = useAppSelector(state => state.supplier.updating);
  const updateSuccess = useAppSelector(state => state.supplier.updateSuccess);


  const handleClose = () => {
    navigate('/inventory/supplier' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if(supplierEntity){
      setSupplier(supplierEntity)
    }
  }, [updateSuccess, supplierEntity?.name]);

  const handleChange = e => {

    const { name, value } = e.target ;
    setSupplier(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...supplier,
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
          <h2>{isNew ?  "Add New Supplier" : "Edit Supplier"}</h2>
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
                  <Label for="name">Name</Label>
                  <InputText
                    type="text"
                    name="name"
                    required={true}
                    id="name"
                    value={supplier.name}
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex flex-column mt-2"}>
                  <Label for="address">Address</Label>
                  <InputText
                    type="text"
                    name="address"
                    required={true}
                    id="address"
                    value={supplier.address}
                    onChange={handleChange}
                  />
                </div>


                <div className={"d-flex flex-column gap-2 mt-2"}>
                  <strong><label className={"text-xl"}>Contact Information</label></strong>
                  <div className={"d-flex flex-column"}>
                  <Label for="email">Email</Label>
                  <InputText
                    type="email"
                    name="email"
                    required={true}
                    id="email"
                    value={supplier?.email}
                    onChange={handleChange}
                  />
                  </div>

                  <div className={"d-flex flex-column"}>
                    <Label for="phoneNumber">Phone Number</Label>
                    <InputText
                      name="phoneNumber"
                      required={true}
                      id="phoneNumber"
                      value={supplier?.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </FormGroup>
              <Button tag={Link} to="/inventory/supplier" replace color="info">
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

export default SupplierUpdate;
