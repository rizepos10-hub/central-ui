import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './pizza-crust-thickness.reducer';
import { InputText } from "primereact/inputtext";
import Select from "react-select";
import { getEntities } from "app/entities/pizza-settings/pizza-size/pizza-size.reducer";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { getSortState, Translate } from "react-jhipster";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { ICrustThickness } from "app/shared/model/PIZZA/crust-thickness.model";
import { getEntities as getPricingClasses } from "app/entities/pizza-settings/pizza-pricing-class/pizza-pricing-class.reducer";
import { Checkbox } from "primereact/checkbox";

export const PizzaCrustThicknessUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [pizzaCrustThickness, setPizzaCrustThickness] = useState<ICrustThickness>({
    name: '',
    hiddenOnSizes: [],
    pricingClass: {}
  });

  const pizzaCrustThicknessEntity = useAppSelector(state => state.pizzaCrustThickness.entity);
  const crustThicknessPricingClasses = useAppSelector(state => state.pizzaPricingClass.entities).filter(option => option.type === 'CRUST_THICKNESS');

  const pizzaSizes = useAppSelector(state => state.pizzaSize.entities);
  const loading = useAppSelector(state => state.pizzaCrustThickness.loading);
  const updating = useAppSelector(state => state.pizzaCrustThickness.updating);

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
    if (pizzaCrustThicknessEntity) {
      setPizzaCrustThickness(pizzaCrustThicknessEntity)
    }
  }, [pizzaCrustThicknessEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPizzaCrustThickness(prevState => ({ ...prevState, [name]: value }));
  };

  const handleHiddenChange = (selectedSizes) => {
    setPizzaCrustThickness(prevState => ({ ...prevState, hiddenOnSizes: selectedSizes }))
  }

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...pizzaCrustThickness,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;
          navigate(`/pizza-crust-thickness/${newId}/edit`)
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/pizza-crust-thickness/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? "Add New Crust Thickness" : "Edit Crust Thickness"}</h2>
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
                  <Label for="pizza-curstThickness-name">Name</Label>
                  <InputText
                    type="text"
                    name="name"
                    required={true}
                    id="pizza-curstThickness-name"
                    value={pizzaCrustThickness.name || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex flex-column my-3"}>
                  <Label for="pizza-curstThickness-hiddenOn">Hidden On</Label>
                  <Select
                    options={pizzaSizes}
                    isMulti
                    getOptionValue={option => option.id}
                    getOptionLabel={option => option.name}
                    id="pizza-curstThickness-hiddenOn"
                    value={pizzaCrustThickness?.hiddenOnSizes || []}
                    onChange={handleHiddenChange}
                  />
                </div>

                <div className={"d-flex flex-column  my-3"}>
                  <label>
                    Pricing Class
                  </label>
                  <Select
                    value={pizzaCrustThickness?.pricingClass || null}
                    required
                    options={crustThicknessPricingClasses}
                    getOptionLabel={option => option.name}
                    getOptionValue={option => option.id}
                    onChange={(toppingPriceOption) => setPizzaCrustThickness((prevState) => ({ ...prevState, pricingClass: toppingPriceOption }))}
                  />
                </div>

                <div className={"d-flex my-3 gap-2"}>
                  <label>
                    Chosen By Default
                  </label>
                  <Checkbox
                    checked={pizzaCrustThickness?.chosenByDefault}
                    onChange={(e) => setPizzaCrustThickness((prev) =>
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

export default PizzaCrustThicknessUpdate;
