import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './pizza-pricing-class.reducer';

import { getEntities as getSizes } from "app/entities/pizza-settings/pizza-size/pizza-size.reducer";

import { InputText } from "primereact/inputtext";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { getSortState, isNumber, Translate } from "react-jhipster";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { IPizzaPricingClass } from "app/shared/model/PIZZA/pizza-pricing-class.model";
import { InputNumber } from "primereact/inputnumber";

export const PizzaPricingClassTypeUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const urlSearchParams = new URLSearchParams(window.location.search);
  const pizzaPriceClassType: any = urlSearchParams.get("type");
  const [pizzaPricingClass, setPizzaPricingClass] = useState<IPizzaPricingClass>({
    name: '',
    prices: {},
    type: ''
  });
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const pizzaPricingClassEntity = useAppSelector(state => state.pizzaPricingClass.entity);
  const loading = useAppSelector(state => state.pizzaPricingClass.loading);
  const updating = useAppSelector(state => state.pizzaPricingClass.updating);
  const pizzaSizesList = useAppSelector(state => state.pizzaSize.entities);

  const sizesMap = useMemo(() => {

    return pizzaSizesList?.slice()?.sort((size1, size2) => size1?.order - size2?.order)?.reduce((acc, size) => {
      acc[size.id] = size;
      return acc;
    }, {});
  }, [pizzaSizesList?.length]);

  const handleClose = (id) => {
    navigate(`/pizza-pricing-class/${id}/edit?type=${pizzaPriceClassType}`);
  };

  console.log(sizesMap, 'sizesMap')

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
      setPizzaPricingClass({
        name: '',
        prices: {},
        type: pizzaPriceClassType
      });
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getSizes({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));


  }, []);

  useEffect(() => {
    if (!isNew) {
      const existingPrices = pizzaPricingClassEntity?.prices || {};

      const existingSizeIds = new Set(Object.keys(existingPrices));

      const missingSizeIds = pizzaSizesList
        .filter((size) => !existingSizeIds.has(size.id))
        .map((size) => size.id);

      const initialPricesForMissingSizes = missingSizeIds.reduce((acc, sizeId) => {
        acc[sizeId] = null;
        return acc;
      }, {});

      const updatedPrices = {
        ...existingPrices,
        ...initialPricesForMissingSizes,
      };
      setPizzaPricingClass({ ...pizzaPricingClassEntity, prices: updatedPrices });
    } else {
      const priceType = urlSearchParams.get("type");
      const initialPrices = pizzaSizesList.reduce((acc, size) => {
        acc[size.id] = null;
        return acc;
      }, {});
      setPizzaPricingClass((prevState) => ({ ...prevState, type: priceType, prices: initialPrices }));
    }
  }, [pizzaSizesList?.length, pizzaPricingClassEntity]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPizzaPricingClass(prevState => ({ ...prevState, [name]: value }));
  };


  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity = {
      ...pizzaPricingClass,
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
            navigate(`/pizza-pricing-class/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/pizza-pricing-class/new?type=${pizzaPriceClassType}`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? `Add New Pizza Price Class ${pizzaPriceClassType} ` : `Edit Pizza Price Class ${pizzaPriceClassType}`}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className={`d-flex flex-column p-3 bg-white`}>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form>
              <FormGroup>
                <div className={"d-flex flex-column mb-3"}>
                  <Label for="pizza-pricing-class-name">Name</Label>
                  <InputText
                    type="text"
                    name="name"
                    required={true}
                    id="pizza-pricing-class-name"
                    value={pizzaPricingClass.name || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  {pizzaPricingClass?.prices &&
                    Object.entries(pizzaPricingClass.prices)
                      .sort(([sizeId1], [sizeId2]) => sizesMap[sizeId1]?.order - sizesMap[sizeId2]?.order)
                      .map(([sizeId, value], index) => {
                        return (
                          <div key={index} className={"d-flex flex-column my-3"}>
                            <Label for={`${sizesMap[sizeId]?.name}`}>{sizesMap[sizeId]?.name}</Label>
                            <InputNumber
                              id={sizesMap[sizeId]?.name}
                              value={value}
                              maxFractionDigits={2}
                              onChange={(e) => {
                                setPizzaPricingClass((prevState) => ({
                                  ...prevState,
                                  prices: {
                                    ...prevState.prices,
                                    [sizeId]: e.value,
                                  },
                                }));
                              }}
                            />
                          </div>
                        )
                      })}
                </div>

              </FormGroup>
              <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => navigate('/pizza-pricing-class')} color="info">
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

export default PizzaPricingClassTypeUpdate;
