import React, { useEffect, useState } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './pizza-size.reducer';
import {InputText} from "primereact/inputtext";
import {IPizzaSize} from "app/shared/model/PIZZA/pizza-size.model";
import {Card as PrimeCard} from 'primereact/card'

export const PizzaSizeUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const orderParam = urlParams.get('order');
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [pizzaSize, setPizzaSize] = useState<IPizzaSize>({
    name: '',
  });

  const pizzaSizeEntity = useAppSelector(state => state.pizzaSize.entity);
  const loading = useAppSelector(state => state.pizzaSize.loading);
  const updating = useAppSelector(state => state.pizzaSize.updating);
  const updateSuccess = useAppSelector(state => state.pizzaSize.updateSuccess);


  const handleClose = () => {
    navigate('/pizza-size' + location.search);
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
    if(pizzaSizeEntity){
      setPizzaSize(pizzaSizeEntity)
    }
  }, [updateSuccess, pizzaSizeEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPizzaSize(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...pizzaSize,
     order: isNew ? Number(orderParam) : pizzaSize.order
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
          <h2>{isNew ?  "Add New Size" : "Edit Size"}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 ">
          <PrimeCard>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <FormGroup>
                <div className={"d-flex flex-column"}>
                <Label for="pizza-size-name">Name</Label>
                <InputText
                  type="text"
                  name="name"
                  required={true}
                  id="pizza-size-name"
                  value={pizzaSize.name}
                  onChange={handleChange}
                />
                </div>
              </FormGroup>
              <Button tag={Link} to="/pizza-size" replace color="info">
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
          </PrimeCard>
        </Col>
      </Row>
    </div>
  );
};

export default PizzaSizeUpdate;
