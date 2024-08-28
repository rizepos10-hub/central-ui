import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './pizza-crust-type.reducer';
import { InputText } from "primereact/inputtext";
import Select from "react-select";
import { ICrustType } from "app/shared/model/PIZZA/crust-type.model";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { getSortState, Translate } from "react-jhipster";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { getEntities } from "app/entities/pizza-settings/pizza-size/pizza-size.reducer";
import { getEntities as getPricingClasses } from "app/entities/pizza-settings/pizza-pricing-class/pizza-pricing-class.reducer";
import { Checkbox } from "primereact/checkbox";

export const PizzaCrustTypeUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [pizzaCrustType, setPizzaCrustType] = useState<ICrustType>({
    name: '',
    hiddenOnSizes: [],
    pricingClass: {}
  });
  const crustTypePricingClasses = useAppSelector(state => state.pizzaPricingClass.entities)
    .filter(option => option.type === 'CRUST_TYPE');

  const pizzaCrustTypeEntity = useAppSelector(state => state.pizzaCrustType.entity);
  const pizzaSizes = useAppSelector(state => state.pizzaSize.entities);
  const loading = useAppSelector(state => state.pizzaCrustType.loading);
  const updating = useAppSelector(state => state.pizzaCrustType.updating);
  const updateSuccess = useAppSelector(state => state.pizzaCrustType.updateSuccess);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const handleClose = () => {
    navigate('/pizza-crust' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getEntities({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
    dispatch(getPricingClasses({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
  }, []);

  useEffect(() => {
    if (pizzaCrustTypeEntity) {
      setPizzaCrustType(pizzaCrustTypeEntity)
    }
  }, [pizzaCrustTypeEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPizzaCrustType(prevState => ({ ...prevState, [name]: value }));
  };


  const handleHiddenChange = (selectedSizes) => {
    setPizzaCrustType(prevState => ({ ...prevState, hiddenOnSizes: selectedSizes }))
  }

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...pizzaCrustType,
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
            navigate(`/pizza-crust-type/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/pizza-crust-type/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? "Add New Crust Type" : "Edit Crust Type"}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form>
              <FormGroup>
                <div className={"d-flex flex-column"}>
                  <Label for="pizza-crustType-name">Name</Label>
                  <InputText
                    type="text"
                    name="name"
                    required={true}
                    id="pizza-crustType-name"
                    value={pizzaCrustType.name || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className={"d-flex flex-column my-3"}>
                  <Label for="pizza-crustType-hiddenOn">Hidden On</Label>
                  <Select
                    options={pizzaSizes}
                    isMulti
                    getOptionValue={option => option.id}
                    getOptionLabel={option => option.name}
                    id="pizza-crustType-hiddenOn"
                    value={pizzaCrustType?.hiddenOnSizes || []}
                    onChange={handleHiddenChange}
                  />
                </div>

                <div className={"d-flex flex-column  my-3"}>
                  <label>
                    Pricing Class
                  </label>
                  <Select
                    value={pizzaCrustType?.pricingClass || null}
                    required
                    options={crustTypePricingClasses}
                    getOptionLabel={option => option.name}
                    getOptionValue={option => option.id}
                    onChange={(toppingPriceOption) => setPizzaCrustType((prevState) => ({ ...prevState, pricingClass: toppingPriceOption }))}
                  />
                </div>

                <div className={"d-flex my-3 gap-2"}>
                  <label>
                    Chosen By Default
                  </label>
                  <Checkbox
                    checked={pizzaCrustType?.chosenByDefault}
                    onChange={(e) => setPizzaCrustType((prev) =>
                      ({ ...prev, chosenByDefault: e.checked }))}
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

export default PizzaCrustTypeUpdate;
