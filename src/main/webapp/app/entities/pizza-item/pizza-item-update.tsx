import React, {useState, useEffect, useMemo} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {Button, Row, Col, Spinner, FormGroup, Table} from 'reactstrap';
import {Button as PrimeButton} from "primereact/button"
import {getSortState, Translate} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';


import { getEntity, updateEntity, createEntity, reset } from './pizza-item.reducer';
import SharedItemUpdate from "app/shared/layout/item/shared-item-update";
import {IPizzaItem} from "app/shared/model/pizza-item.model";
import {Steps} from "primereact/steps";
import {MenuItem} from "primereact/menuitem";
import {Checkbox} from "primereact/checkbox";
import {SelectButton} from "primereact/selectbutton";
import {InputText} from "primereact/inputtext";
import Select from "react-select";
import {getEntities as getPredefinedPizzas} from "app/entities/pizza-settings/pizza-predefined/pizza-predefined.reducer";
import {getEntities as getPricingClasses} from "app/entities/pizza-settings/pizza-pricing-class/pizza-pricing-class.reducer"
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {InputNumber} from "primereact/inputnumber";

const items: MenuItem[] = [
  {
    label: 'Pizza Item Type',
  },
  {
    label: 'Create Your Pizza Item',
  },

];


export const PizzaItemUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const pizzaItemEntity = useAppSelector(state => state.pizzaItem.entity);
  const loading = useAppSelector(state => state.pizzaItem.loading);
  const updating = useAppSelector(state => state.pizzaItem.updating);
  const updateSuccess = useAppSelector(state => state.pizzaItem.updateSuccess);

  const predefinedPizzaOptions = useAppSelector(state => state.predefinedPizza.entities);
  const pizzaPricingClasses = useAppSelector(state => state.pizzaPricingClass.entities);
  console.log(pizzaPricingClasses, 'pizzaPricingClasses')
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const [pizzaItem, setPizzaItem] = useState<IPizzaItem>({
    ...pizzaItemEntity,
    itemType: "RESTAURANT",
    itemVariantType: "RESTAURANT_PIZZA",
    variants: [{
      multiple: false,
      multiplePizzaDetails: []
    }]
  });

  console.log(pizzaItem, 'pizzaItempizzaItem')

  const filteredOptions = useMemo(() => {
    const toppings = pizzaPricingClasses.filter(option => option.type === 'TOPPING');
    const crustTypes = pizzaPricingClasses.filter(option => option.type === 'CRUST_TYPE');
    const crustThicknesses = pizzaPricingClasses.filter(option => option.type === 'CRUST_THICKNESS');
    const itemPricingClass = pizzaPricingClasses.filter(option => option.type === 'PREDEFINED');

    return { toppings, crustTypes, crustThicknesses, itemPricingClass };
  }, [pizzaPricingClasses]);

  const [activeIndex, setActiveIndex] = useState(0);


  const handleFieldChange = (fieldName, value) => {
    setPizzaItem({
      ...pizzaItem,
      [fieldName]: value,
    });
  };

  const handleSinglePizzaValuesChange = (fieldName, value) => {
    console.log(fieldName, 'field', value, "value");
    setPizzaItem((prev) => {
      const updatedVariants = [
        {
          ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
          [fieldName]: fieldName === "predefinedPizza" ? [value] : value,
        },
      ];
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };
  const handleMultiplePizzaInputChange = (index, fieldName, value) => {
    setPizzaItem((prev) => {
      const updatedDetails = [...prev.variants[0].multiplePizzaDetails];
      updatedDetails[index][fieldName] = value;

      return {
        ...prev,
        variants: [
          {
            ...prev.variants[0],
            multiplePizzaDetails: updatedDetails,
          },
        ],
      };
    });
  };

  const addNewPizzaDetail = () => {
    setPizzaItem((prev) => {
      const newDetail = {
        numberOfPizza: 0,
        freeToppingsNumber: 0,
      };

      const updatedDetails = [...prev.variants[0].multiplePizzaDetails, newDetail];

      return {
        ...prev,
        variants: [
          {
            ...prev.variants[0],
            multiplePizzaDetails: updatedDetails,
          },
        ],
      };
    });
  };

  const multipleOptions = ["Simple", "Multiple"];
  const handleMultipleCheck = (e) => {

    setPizzaItem((prev) => {
      const updatedVariants = [
        {
          ...prev.variants[0],
          multiple: e.value === "Multiple",
        },
      ];
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };


  const handleClose = () => {
    navigate('/restaurant/pizza' + location.search);
  };

  useEffect(() => {
    if(isNew){
      dispatch(reset())
    }else{
      dispatch(getEntity(id));
    }
    dispatch(getPredefinedPizzas({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
    dispatch(getPricingClasses({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
  },[id]);

  useEffect(() => {
    if(!isNew){
      console.log(pizzaItemEntity, 'pizzaItemEntity')
      setPizzaItem(pizzaItemEntity);
    }
  }, [pizzaItemEntity]);


  const saveEntity = e => {
    e.preventDefault();
    const entity = {
      ...pizzaItem,
    };
    console.table(entity)
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };





  if(loading){
    return <Spinner />
  }


  return (
    <div>
      <Row>
        <Col md="8">
          <h2>
            {isNew ? "Create New Pizza Item" : `Edit Pizza Item`}
          </h2>
        </Col>
      </Row>
      {isNew ? <Steps model={items} activeIndex={activeIndex} onSelect={e => activeIndex === 1 && setActiveIndex(e.index)}
              readOnly={activeIndex === 0}/> : null}
        {activeIndex === 0 && isNew ?
            <div className={"d-flex justify-content-center"}>
              <div className={ "card d-flex flex-column"}>
            <div className={"  p-6  d-flex flex-column justify-content-center align-items-center"}>
              <label>Pizza Item Type</label>
              <SelectButton className={"p-3"}  value={pizzaItem?.variants?.[0]?.multiple ? 'Multiple' : 'Simple'} onChange={handleMultipleCheck} options={multipleOptions} />
            </div>
              <div className={"ml-auto"}>
                <Button onClick={() => setActiveIndex(1)}>Next</Button>
              </div>
            </div>
        </div>: null}
      <Row>
        {activeIndex === 1 || !isNew ?
          <form onSubmit={saveEntity}>
            <FormGroup>

          <Col md="8" className="d-flex flex-column p-3  bg-white">
            <SharedItemUpdate item={pizzaItem} onFieldChange={handleFieldChange}/>

            {!pizzaItem?.variants?.[0]?.multiple ?
              <Row className={"my-6"} >
                <Row>
                <Col md="6">
                  <div className={"d-flex flex-column gap-2"}>
                    <label>
                     Predefined Pizza
                    </label>
                  <Select
                    value={pizzaItem?.variants?.[0]?.predefinedPizza?.[0]}
                    options={predefinedPizzaOptions}
                    getOptionLabel={option => option.name}
                    getOptionValue={option => option.id}
                    onChange={(predefinedPizza) => handleSinglePizzaValuesChange("predefinedPizza", predefinedPizza)}
                    />
                  </div>
                </Col>
              </Row>
              <Row className={"mt-2"}>
                <Col md="3">
                  <div className={"d-flex flex-column gap-2"}>
                    <label>
                      Topping Pricing
                    </label>
                    <Select
                      value={pizzaItem?.variants?.[0]?.itemPricingClass}
                      options={filteredOptions?.itemPricingClass}
                      getOptionLabel={option => option.name}
                      getOptionValue={option => option.id}
                      onChange={(itemPriceOption) => handleSinglePizzaValuesChange("itemPricingClass", itemPriceOption)}
                    />
                  </div>
                </Col>

                <Col md="3">
                  <div className={"d-flex flex-column gap-2"}>
                    <label>
                      Topping Pricing
                    </label>
                    <Select
                      value={pizzaItem?.variants?.[0]?.toppingPricing}
                      options={filteredOptions?.toppings}
                      getOptionLabel={option => option.name}
                      getOptionValue={option => option.id}
                      onChange={(toppingPriceOption) => handleSinglePizzaValuesChange("toppingPricing", toppingPriceOption)}
                    />
                  </div>
                </Col>

                <Col md="3">
                  <div className={"d-flex flex-column gap-2"}>
                    <label>
                      Crust Type Pricing
                    </label>
                    <Select
                      value={pizzaItem?.variants?.[0]?.crustTypePricing}
                      options={filteredOptions?.crustTypes}
                      getOptionLabel={option => option.name}
                      getOptionValue={option => option.id}
                      onChange={(crustTypePriceOption) => handleSinglePizzaValuesChange("crustTypePricing", crustTypePriceOption)}
                    />
                  </div>
                </Col>

                <Col md="3">
                  <div className={"d-flex flex-column gap-2"}>
                    <label>
                      Crust Thickness Pricing
                    </label>
                    <Select
                      value={pizzaItem?.variants?.[0]?.crustThicknessPricing}
                      options={filteredOptions?.crustThicknesses}
                      getOptionLabel={option => option.name}
                      getOptionValue={option => option.id}
                      onChange={(crustThicknessPriceOption) => handleSinglePizzaValuesChange("crustThicknessPricing", crustThicknessPriceOption)}
                    />
                  </div>
                </Col>
              </Row>
            </Row>
              : null}

            {pizzaItem?.variants?.[0]?.multiple ? (
              <Row>
                <Col md="8">
                  <Table>
                    <thead>
                    <tr>
                      <th>Number of Pizza</th>
                      <th>Free Toppings Number</th>
                    </tr>
                    </thead>
                    <tbody>
                    {pizzaItem.variants[0].multiplePizzaDetails?.map((detail, index) => (
                      <tr key={index}>
                        <td>
                          <InputNumber
                            value={detail.numberOfPizza}
                            onChange={(e) =>
                              handleMultiplePizzaInputChange(index, "numberOfPizza", e.value)
                            }
                          />
                        </td>
                        <td>
                          <InputNumber
                            value={detail.freeToppingsNumber}
                            onChange={(e) =>
                              handleMultiplePizzaInputChange(index, "freeToppingsNumber", e.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2}>
                        <Button color="primary" onClick={addNewPizzaDetail}>
                          Add
                        </Button>
                      </td>
                    </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
            ) : null}

            <div className={"d-flex"}>
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/restaurant/pizza" replace
                      color="info">
                <FontAwesomeIcon icon="arrow-left"/>
                &nbsp;
                <span className="d-none d-md-inline">
                                  <Translate contentKey="entity.action.back">Back</Translate>
                              </span>
              </Button>
              &nbsp;
              <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit"
                      disabled={updating}>
                <FontAwesomeIcon icon="save"/>
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
            </div>
          </Col>
            </FormGroup>
          </form> : null}

      </Row>
    </div>
  );
};

export default PizzaItemUpdate;
