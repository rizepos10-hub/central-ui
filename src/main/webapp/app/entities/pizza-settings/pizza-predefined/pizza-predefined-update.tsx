import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './pizza-predefined.reducer';

import {getEntities as getToppings} from "app/entities/pizza-settings/pizza-topping/pizza-topping.reducer";

import {InputText} from "primereact/inputtext";
import {IPredefinedPizza} from "app/shared/model/predefined-pizza.model";
import Select from "react-select";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {getSortState} from "react-jhipster";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";

export const PredefinedPizzaUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [predefinedPizza, setPredefinedPizza] = useState<IPredefinedPizza>({
    name: '',
    toppings: []
  });
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const predefinedPizzaEntity = useAppSelector(state => state.predefinedPizza.entity);
  const loading = useAppSelector(state => state.predefinedPizza.loading);
  const updating = useAppSelector(state => state.predefinedPizza.updating);
  const updateSuccess = useAppSelector(state => state.predefinedPizza.updateSuccess);
  const pizzaToppingList = useAppSelector(state => state.pizzaTopping.entities);


  console.log(pizzaToppingList, 'pizzaToppingList')
  const handleClose = () => {
    navigate('/predefined-pizza' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getToppings({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if(predefinedPizzaEntity){
      setPredefinedPizza(predefinedPizzaEntity)
    }
  }, [updateSuccess, predefinedPizzaEntity?.name, pizzaToppingList[0]?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPredefinedPizza(prevState => ({ ...prevState, [name]: value }));
  };

  const handleOptionChange = (selectedOptions) => {
    console.log(selectedOptions, 'selectedOptions')
    setPredefinedPizza((prevState => ({...prevState, toppings: selectedOptions})))
  }

  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...predefinedPizza,
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
          <h2>{isNew ? "Add New Predefined Pizza" : "Edit Predefined Pizza"}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <FormGroup>
                <div className={"d-flex flex-column mb-3"}>
                  <Label for="predefined-pizza-name">Name</Label>
                  <InputText
                    type="text"
                    name="name"
                    required={true}
                    id="predefined-pizza-name"
                    value={predefinedPizza.name}
                    onChange={handleChange}
                  />
                </div>
                <div className={"d-flex flex-column mb-3"}>
                  <Label for="predefined-pizza-toppings">Toppings</Label>
                  <Select
                    name="toppings"
                    options={pizzaToppingList}
                    isMulti
                    getOptionLabel={(option) => option.name}
                    getOptionValue={(option => option.id)}
                    required={true}
                    id="predefined-pizza-toppings"
                    value={predefinedPizza.toppings}
                    onChange={handleOptionChange}
                  />

                </div>
              </FormGroup>
              <Button tag={Link} to="/predefined-pizza" replace color="info">
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

export default PredefinedPizzaUpdate;
