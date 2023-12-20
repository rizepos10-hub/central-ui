import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './pizza-crust-type.reducer';
import {InputText} from "primereact/inputtext";

export const PizzaCrustTypeUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [pizzaCrustType, setPizzaCrustType] = useState({
    name: '',
  });

  const pizzaCrustTypeEntity = useAppSelector(state => state.pizzaCrustType.entity);
  const loading = useAppSelector(state => state.pizzaCrustType.loading);
  const updating = useAppSelector(state => state.pizzaCrustType.updating);
  const updateSuccess = useAppSelector(state => state.pizzaCrustType.updateSuccess);

  const handleClose = () => {
    navigate('/pizza-crust' + location.search);
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
    if(pizzaCrustTypeEntity){
      setPizzaCrustType(pizzaCrustTypeEntity)
    }
  }, [updateSuccess, pizzaCrustTypeEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPizzaCrustType(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...pizzaCrustType,
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
          <h2>{isNew ?  "Add New Crust Type" : "Edit Crust Type"}</h2>
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
                  <Label for="pizza-crustType-name">Name</Label>
                  <InputText
                    type="text"
                    name="name"
                    required={true}
                    id="pizza-crustType-name"
                    value={pizzaCrustType.name}
                    onChange={handleChange}
                  />
                </div>
              </FormGroup>
              <Button tag={Link} to="/pizza-crust" replace color="info">
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

export default PizzaCrustTypeUpdate;
