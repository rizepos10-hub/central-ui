import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getTaxonomies } from 'app/entities/taxonomy/taxonomy.reducer';

import {getEntity, updateEntity, createEntity, reset, getToppingGroups, createToppingGroup} from './pizza-topping.reducer';

import {InputText} from "primereact/inputtext";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {getSortState} from "react-jhipster";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {ITopping} from "app/shared/model/topping.model";
import CreatableSelect from "react-select/creatable";

export const PizzaToppingUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [pizzaTopping, setPizzaTopping] = useState<ITopping>({
    name: '',
    group: {
      id: "",
      name: ""
    },
  });
  const pizzaToppingGroups = useAppSelector(state => state.pizzaTopping.toppingGroups).map(tpngGrp => ({...tpngGrp, label: tpngGrp.name, value: tpngGrp.id}));
  const pizzaToppingEntity = useAppSelector(state => state.pizzaTopping.entity);
  const taxonomies = useAppSelector(state => state.taxonomy.entities);
  console.log(pizzaToppingGroups, 'pizzaToppingGroups')

  const loading = useAppSelector(state => state.pizzaTopping.loading);
  const updating = useAppSelector(state => state.pizzaTopping.updating);
  const updateSuccess = useAppSelector(state => state.pizzaTopping.updateSuccess);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const handleClose = () => {
    navigate('/pizza-topping' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    // dispatch(getTaxonomies({
    //   page: paginationState.activePage - 1,
    //   size: paginationState.itemsPerPage,
    //   sort: `${paginationState.sort},${paginationState.order}`,
    // }));
    dispatch(getToppingGroups({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      }));
  }, []);

  console.log(pizzaToppingGroups, 'pizzaToppingGroups')
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

  const handleGroupChange = (selectedGroup) => {
    console.log("clicked", selectedGroup)
    const selectedToppingGroup = selectedGroup ? selectedGroup : null
    setPizzaTopping((prev) => ({...prev, group: selectedToppingGroup}))
  }

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



   const handleCreate = (inputValue: string) => {
      const entity = {
        // taxonomy: { id : taxonomies.find(otherEntity => otherEntity?.name === 'Topping Groups')?.id },
        name: inputValue
      };
        dispatch(createToppingGroup(entity));
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
                    value={pizzaTopping.name || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className={"d-flex flex-column"}>
                  <Label for="pizza-topping-group">Topping Group</Label>
                  <CreatableSelect
                    isDisabled={updating}
                    isLoading={updating}
                    options={pizzaToppingGroups}
                    value={pizzaTopping.group}
                    onCreateOption={handleCreate}
                    onChange={handleGroupChange}
                    isClearable={true}
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
