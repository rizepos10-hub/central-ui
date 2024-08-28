import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './pizza-size.reducer';
import { InputText } from "primereact/inputtext";
import { IPizzaSize } from "app/shared/model/PIZZA/pizza-size.model";
import { Card as PrimeCard } from 'primereact/card'
import { Translate } from 'react-jhipster';

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
    if (pizzaSizeEntity) {
      setPizzaSize(pizzaSizeEntity)
    }
  }, [pizzaSizeEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPizzaSize(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...pizzaSize,
      order: isNew ? Number(orderParam) : pizzaSize.order
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
            navigate(`/pizza-size/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/pizza-size/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? "Add New Size" : "Edit Size"}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 ">
          <PrimeCard>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <form>
                <FormGroup>
                  <div className={"d-flex flex-column"}>
                    <Label for="pizza-size-name">Name</Label>
                    <InputText
                      type="text"
                      name="name"
                      required={true}
                      id="pizza-size-name"
                      value={pizzaSize.name || ''}
                      onChange={handleChange}
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
          </PrimeCard>
        </Col>
      </Row>
    </div>
  );
};

export default PizzaSizeUpdate;
