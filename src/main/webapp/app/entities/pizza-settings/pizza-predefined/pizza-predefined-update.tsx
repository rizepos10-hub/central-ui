import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './pizza-predefined.reducer';

import { getEntities as getToppings } from "app/entities/pizza-settings/pizza-topping/pizza-topping.reducer";

import { InputText } from "primereact/inputtext";
import { IPredefinedPizza } from "app/shared/model/PIZZA/predefined-pizza.model";
import Select from "react-select";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { getSortState, Translate } from "react-jhipster";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";

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
    if (predefinedPizzaEntity) {
      setPredefinedPizza(predefinedPizzaEntity)
    }
  }, [predefinedPizzaEntity?.name, pizzaToppingList[0]?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPredefinedPizza(prevState => ({ ...prevState, [name]: value }));
  };

  const handleOptionChange = (selectedOptions) => {
    console.log(selectedOptions, 'selectedOptions')
    setPredefinedPizza((prevState => ({ ...prevState, toppings: selectedOptions })))
  }

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...predefinedPizza,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/predefined-pizza/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/predefined-pizza/new`)
        }
      })
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
            <form>
              <FormGroup>
                <div className={"d-flex flex-column mb-3"}>
                  <Label for="predefined-pizza-name">Name</Label>
                  <InputText
                    type="text"
                    name="name"
                    required={true}
                    id="predefined-pizza-name"
                    value={predefinedPizza.name || ''}
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
                    value={predefinedPizza.toppings || []}
                    onChange={handleOptionChange}
                  />

                </div>
              </FormGroup>
              <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => navigate(-1)} color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
              &nbsp;
              <Button onClick={(e) => saveEntity(e, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
              </Button>
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default PredefinedPizzaUpdate;
