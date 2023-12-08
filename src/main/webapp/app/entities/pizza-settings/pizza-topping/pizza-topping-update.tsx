import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './pizza-topping.reducer';
import {InputText} from "primereact/inputtext";

export const PizzaToppingUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [pizzaTopping, setPizzaTopping] = useState({
    name: '',
  });

  const pizzaToppingEntity = useAppSelector(state => state.pizzaTopping.entity);
  const loading = useAppSelector(state => state.pizzaTopping.loading);
  const updating = useAppSelector(state => state.pizzaTopping.updating);
  const updateSuccess = useAppSelector(state => state.pizzaTopping.updateSuccess);

  const handleClose = () => {
    navigate('/pizza-topping' + location.search);
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
    if(pizzaToppingEntity){
      setPizzaTopping(pizzaToppingEntity)
    }
  }, [updateSuccess, pizzaToppingEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPizzaTopping(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...pizzaTopping,
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
          <h2>{isNew ? "Add New Topping" : "Edit Topping"}</h2>
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
                  <Label for="pizza-topping-name">Name</Label>
                  <InputText
                    type="text"
                    name="name"
                    required={true}
                    id="pizza-topping-name"
                    value={pizzaTopping.name}
                    onChange={handleChange}
                  />
                </div>
              </FormGroup>
              <Button tag={Link} to="/pizza-topping" replace color="info">
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

export default PizzaToppingUpdate;
