import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {Button, Row, Col, Spinner, FormGroup, Table} from 'reactstrap';
import {getSortState, Translate} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import {Button as PrimeButton} from "primereact/button"

import { getEntity, updateEntity, createEntity, reset } from './pizza-item.reducer';
import SharedItemUpdate from "app/shared/layout/item/shared-item-update";
import {IPizzaItem} from "app/shared/model/pizza-item.model";
import {Steps} from "primereact/steps";
import {MenuItem} from "primereact/menuitem";
import Select from "react-select";
import {getEntities as getPredefinedPizzas} from "app/entities/pizza-settings/pizza-predefined/pizza-predefined.reducer";
import {getEntities as getPricingClasses} from "app/entities/pizza-settings/pizza-pricing-class/pizza-pricing-class.reducer"
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {InputNumber} from "primereact/inputnumber";
import {Accordion, AccordionTab} from "primereact/accordion";
import AsyncSelect from "react-select/async";
import {IPizzaPricingClass} from "app/shared/model/pizza-pricing-class.model";
import {getEntities as getToppings} from "app/entities/pizza-settings/pizza-topping/pizza-topping.reducer";
import {ITopping} from "app/shared/model/topping.model";
import {ICrustType} from "app/shared/model/crust-type.model";
import {getEntities as getCrustTypes} from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-type.reducer";
import {getEntities as getCrustThicknesses} from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-thickness.reducer";
import {ICrustThickness} from "app/shared/model/crust-thickness.model";

const items: MenuItem[] = [
  {
    label: "Choose Pizza Type",
  },
  {
    label: "Create Your Pizza",
  },

];

const pricingClassesMap = {
  "toppingPricing" : "topping",
  "crustTypePricing" : "crustType",
  "crustThicknessPricing" : "crustThickness",
}

export const PizzaItemUpdate = () => {
  const dispatch = useAppDispatch();


  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const pizzaItemEntity = useAppSelector(state => state.pizzaItem.entity);
  const loading = useAppSelector(state => state.pizzaItem.loading);
  const updating = useAppSelector(state => state.pizzaItem.updating);
  const updateSuccess = useAppSelector(state => state.pizzaItem.updateSuccess);
  const pizzaToppingList = useAppSelector(state => state.pizzaTopping.entities);
  const crustTypeList = useAppSelector(state => state.pizzaCrustType.entities);
  const crustThicknessList = useAppSelector(state => state.pizzaCrustThickness.entities);

  const predefinedPizzaOptions = useAppSelector(state => state.predefinedPizza.entities);
  const pizzaPricingClasses = useAppSelector(state => state.pizzaPricingClass.entities);
  console.log(pizzaPricingClasses, 'pizzaPricingClasses')
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const [pizzaItem, setPizzaItem] = useState<IPizzaItem>({});

  const isMultiple = pizzaItem?.variants?.[0]?.multiple === true
  const filteredOptions = useMemo(() => {
    const toppings = pizzaPricingClasses.filter(option => option.type === 'TOPPING');
    const crustTypes = pizzaPricingClasses.filter(option => option.type === 'CRUST_TYPE');
    const crustThicknesses = pizzaPricingClasses.filter(option => option.type === 'CRUST_THICKNESS');
    const itemPricingClass = pizzaPricingClasses.filter(option => option.type === 'PREDEFINED');

    return { toppings, crustTypes, crustThicknesses, itemPricingClass };
  }, [pizzaPricingClasses]);

  const [activeIndex, setActiveIndex] = useState(0);


  const handleFieldChange = useCallback((fieldName, value) => {
    setPizzaItem((prevState) => {
      const updatedState = {
        ...prevState,
        [fieldName]: value,
      };

      if (fieldName === 'name') {
        const updatedVariant = {
          ...prevState.variants[0],
          name: value,
        };
        updatedState.variants = [updatedVariant];
      }

      return updatedState;
    });
  }, []);


  const handleSinglePizzaValuesChange = (fieldName, value) => {
    setPizzaItem((prev) => {
      const updatedVariants = [
        {
          ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
          [fieldName]: fieldName === "predefinedPizza" ? [value] : value,
          ...(fieldName === "predefinedPizza" && { name : value.name })
        },
      ];
      return {
        ...prev,
        name: fieldName === "predefinedPizza" ? value?.name : prev?.name,
        variants: updatedVariants,
      };
    });
  };

  const handlePricingClassChange = (fieldName, values) => {
    setPizzaItem((prev) => {
      const existingVariants = prev.variants && prev.variants.length > 0 ? prev.variants[0][fieldName] || [] : [];

      const newValues = values.map(value => {
        const existingValue = existingVariants.find(existing => existing[pricingClassesMap[fieldName]]?.id === value?.id);

        return {
          [pricingClassesMap[fieldName]]: value,
          pricingClass: existingValue ? existingValue.pricingClass : value.pricingClass
        };
      });

      const updatedVariants = [
        {
          ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
          [fieldName]: newValues,
        },
      ];

      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };


  const handlePricingClassChangeSecondSelect = (fieldName, selectedPricingClass, index) => {
    setPizzaItem((prev) => {
      const updatedVariants = [...(prev.variants || [])];
      const updatedFieldPricing = [...(updatedVariants[0]?.[fieldName] || [])];
      console.log(updatedFieldPricing, 'updatedFieldPricingupdatedFieldPricing')

      updatedFieldPricing[index] = {
        ...updatedFieldPricing[index],
        pricingClass: selectedPricingClass,
      };

      updatedVariants[0] = {
        ...updatedVariants[0],
        [fieldName]: updatedFieldPricing,
      };

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
  const handleRemoveMultiplePizzaInput = (index) => {
    setPizzaItem((prev) => {
      const updatedPizzaDetails = prev?.variants?.[0]?.multiplePizzaDetails.filter((_, i) => i !== index);

      return {
        ...prev,
        variants: [
          {
            ...prev.variants[0],
            multiplePizzaDetails: updatedPizzaDetails,
          },
        ],
      };
    });
  };
  const addNewPizzaDetail = () => {
    setPizzaItem((prev) => {
      const newDetail = {
        numberOfPizza: 2,
        freeToppingsNumber: null,
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

  const multipleOptions = ["Single", "Multiple"];

  const handleMultipleClick = (type) => {
    setPizzaItem((prev) => {
      const updatedVariants = [
        {
          ...prev.variants[0],
          multiple: type === "MULTIPLE",
        },
      ];
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };

  const handleNextClick = () => {
    // Clear multiplePizzaDetails if its not multiple
    if (!pizzaItem?.variants?.[0].multiple) {
      setPizzaItem((prev) => {
        const updatedVariants = {...pizzaItem.variants}
        updatedVariants[0].multiplePizzaDetails = [];
        return {
          ...pizzaItem,
          variants: updatedVariants
        }
      });
    }
    setActiveIndex(1)
  }

  const handleNavigate = (pizzaItemId) => {
    navigate(`/restaurant/pizza/${pizzaItemId}/edit` + location.search);
  };

  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate("/restaurant/pizza");

    }
  }

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
    dispatch(getToppings({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getCrustTypes({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getCrustThicknesses({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));


  },[id, isNew]);

  useEffect(() => {

    if(!isNew){
      setPizzaItem(pizzaItemEntity);
    }else{
      setPizzaItem({
        ...pizzaItemEntity,
        itemType: "RESTAURANT",
        itemVariantType: "RESTAURANT_PIZZA",
        variants: [{
          multiple: false,
          multiplePizzaDetails: []
        }]
      })
    }
    const pizzaItemId = pizzaItemEntity?.id
    if(updateSuccess){
      handleNavigate(pizzaItemId);
    }

  }, [pizzaItemEntity, updateSuccess]);


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
      {isNew ?
        <div className="card">
        <Steps
        model={items}
        activeIndex={activeIndex}
        onSelect={e => activeIndex === 1 && setActiveIndex(e.index)}
        readOnly={activeIndex === 0}
        />
        </div>: null}
        {activeIndex === 0 && isNew ?
            <div className={"d-flex justify-content-center"}>
              <div className={ "card d-flex flex-column w-7 h-40rem "}>
            <div className={"  p-6  d-flex flex-column justify-content-center align-items-center"}>
              <h4>Pizza Item Type</h4>
              <div className="p-selectbutton d-flex gap-8 p-buttonset p-component p-3" role="group" data-pc-name="selectbutton"
                   data-pc-section="root">
                <div className={`p-button h-20rem w-20rem p-component ${!isMultiple ? "p-highlight" : "" }`} role="button" aria-label="Single" aria-pressed="true"
                     tabIndex={0} data-pc-section="button" onClick={() => handleMultipleClick("SINGLE")}>
                  <span className="p-button-label p-c" data-pc-section="label">Single</span>
                  <span role="presentation" className="p-ink" style={{height: "78.0256px", width:"78.0256px"}}></span>
                </div>
                <div className={`p-button  h-20rem w-20rem  p-component ${isMultiple ? "p-highlight" : "" }`} role="button" aria-label="Multiple" aria-pressed="false"
                     tabIndex={0} data-pc-section="button"  onClick={() => handleMultipleClick("MULTIPLE")}>
                  <span className="p-button-label p-c" data-pc-section="label">Multiple</span>
                  <span role="presentation" className="p-ink" style={{height: "78.0256px", width:"78.0256px"}}></span>
                </div>
              </div>
              {/* <SelectButton className={"p-3"}  value={pizzaItem?.variants?.[0]?.multiple ? 'Multiple' : 'Single'} onChange={handleMultipleClick} options={multipleOptions} /> */}
            </div>
              <div className={"ml-auto"}>
                <Button onClick={handleNextClick}>Next</Button>
              </div>
            </div>
        </div>: null}
      <Row>
        {activeIndex === 1 || !isNew ?
          <form onSubmit={saveEntity}>
            <FormGroup  className={`${isNew ? "d-flex justify-content-center bg-white mt-3" : ""}`}>

          <Col md="8" className={`d-flex flex-column p-3  bg-white mt-3 `} >
            {!pizzaItem?.variants?.[0]?.multiple ?<Row>
              <Col md="6">
                <div className={"d-flex flex-column gap-2"}>
                  <label className={"text-xl font-bold"}>
                  Predefined Pizza
                  </label>
                  <Select
                    value={pizzaItem?.variants?.[0]?.predefinedPizza?.[0]}
                    required
                    options={predefinedPizzaOptions}
                    getOptionLabel={option => option.name}
                    getOptionValue={option => option.id}
                    onChange={(predefinedPizza) => handleSinglePizzaValuesChange("predefinedPizza", predefinedPizza)}
                  />
                </div>
              </Col>
            </Row> : null}

            <SharedItemUpdate item={pizzaItem} onFieldChange={handleFieldChange}/>

              <Row className={"my-6"} >
              <Row className={"mt-2"}>
                {!pizzaItem?.variants?.[0]?.multiple ? <Col md="3">
                  <div className={"d-flex flex-column gap-2"}>
                    <label className={"text-xl font-bold"}>
                      Item Pricing
                    </label>
                    <Select
                      value={pizzaItem?.variants?.[0]?.itemPricingClass}
                      options={filteredOptions?.itemPricingClass}
                      isClearable
                      getOptionLabel={option => option.name}
                      getOptionValue={option => option.id}
                      onChange={(itemPriceOption) => handleSinglePizzaValuesChange("itemPricingClass", itemPriceOption)}
                    />
                  </div>
                </Col> : null}

              </Row>
            </Row>
            <Row>
              <Accordion multiple activeIndex={[0]} className={"my-3"}>
                  <AccordionTab  header={"Toppings"}>
                    <div className={"d-flex gap-3"}>
                      <label className={"mt-2"}>Add Toppings</label>
                      <Col md={"6"}>
                        <Select
                          value={pizzaItem?.variants?.[0]?.toppingPricing?.map((toppingPrice) => toppingPrice.topping)}
                          isMulti
                          getOptionLabel={(option: ITopping) => option.name}
                          getOptionValue={(option: ITopping) => option.id}
                          onChange={(toppingPriceOption) => handlePricingClassChange("toppingPricing", toppingPriceOption)}
                          options={pizzaToppingList}
                        />
                        <Table>
                          <thead>
                          <tr>
                            <th>Topping</th>
                            <th>Pricing Class</th>
                          </tr>
                          </thead>
                          <tbody>
                          {pizzaItem?.variants?.[0]?.toppingPricing?.map((toppingPrice, index) => (
                            <tr key={index}>
                              <td>{toppingPrice.topping.name}</td>
                              <td>
                                <Select
                                  value={toppingPrice.pricingClass}
                                  getOptionLabel={(option: IPizzaPricingClass) => option.name}
                                  getOptionValue={(option: IPizzaPricingClass) => option.id}
                                  onChange={(selectedPricingClass) =>
                                    handlePricingClassChangeSecondSelect("toppingPricing", selectedPricingClass, index)
                                  }
                                  options={filteredOptions.toppings}
                                />
                              </td>
                            </tr>
                          ))}
                          </tbody>
                        </Table>
                      </Col>
                    </div>
                  </AccordionTab>
              </Accordion>

              <Accordion multiple activeIndex={[0]} className={"my-3"}>
                <AccordionTab  header={"Crust Type"}>
                  <div className={"d-flex gap-3"}>
                    <label className={"mt-2"}>Add Crust Types</label>
                    <Col md={"6"}>
                      <Select
                        value={pizzaItem?.variants?.[0]?.crustTypePricing?.map((crustTypePricing) => crustTypePricing?.crustType)}
                        isMulti
                        getOptionLabel={(option: ICrustType) => option.name}
                        getOptionValue={(option: ICrustType) => option.id}
                        onChange={(crustTypeOption) => handlePricingClassChange("crustTypePricing", crustTypeOption)}
                        options={crustTypeList}
                      />
                      <Table>
                        <thead>
                        <tr>
                          <th>Crust Type</th>
                          <th>Pricing Class</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pizzaItem?.variants?.[0]?.crustTypePricing?.map((crustTypePricing, index) => {
                          return (
                            <tr key={index}>
                              <td>{crustTypePricing?.crustType?.name}</td>
                              <td>
                                <Select
                                  value={crustTypePricing?.pricingClass}
                                  getOptionLabel={(option: IPizzaPricingClass) => option.name}
                                  getOptionValue={(option: IPizzaPricingClass) => option.id}
                                  onChange={(selectedPricingClass) =>
                                    handlePricingClassChangeSecondSelect("crustTypePricing", selectedPricingClass, index)
                                  }
                                  options={filteredOptions.crustTypes}
                                />
                              </td>
                            </tr>
                          )
                        })}
                        </tbody>
                      </Table>
                    </Col>
                  </div>
                </AccordionTab>
              </Accordion>

              <Accordion multiple activeIndex={[0]} className={"my-3"}>
                <AccordionTab  header={"Crust Thickness"}>
                  <div className={"d-flex gap-3"}>
                    <label className={"mt-2"}>Add Crust Thicknesses</label>
                    <Col md={"6"}>
                      <Select
                        value={pizzaItem?.variants?.[0]?.crustThicknessPricing?.map((crustThicknessPricing) => crustThicknessPricing.crustThickness)}
                        isMulti
                        getOptionLabel={(option: ICrustThickness) => option.name}
                        getOptionValue={(option: ICrustThickness) => option.id}
                        onChange={(crustThicknessOption) => handlePricingClassChange("crustThicknessPricing", crustThicknessOption)}
                        options={crustThicknessList}
                      />
                      <Table>
                        <thead>
                        <tr>
                          <th>Crust Thickness</th>
                          <th>Pricing Class</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pizzaItem?.variants?.[0]?.crustThicknessPricing?.map((crustThicknessPricing, index) => (
                          <tr key={index}>
                            <td>{crustThicknessPricing?.crustThickness?.name}</td>
                            <td>
                              <Select
                                value={crustThicknessPricing?.pricingClass}
                                getOptionLabel={(option: IPizzaPricingClass) => option.name}
                                getOptionValue={(option: IPizzaPricingClass) => option.id}
                                onChange={(selectedPricingClass) =>
                                  handlePricingClassChangeSecondSelect("crustThicknessPricing", selectedPricingClass, index)
                                }
                                options={filteredOptions?.crustThicknesses}
                              />
                            </td>
                          </tr>
                        ))}
                        </tbody>
                      </Table>
                    </Col>
                  </div>
                </AccordionTab>
              </Accordion>
            </Row>

            {pizzaItem?.variants?.[0]?.multiple ? (
              <Row>
                <Col md="8">
                  <Table>
                    <thead>
                    <tr>
                      <th>Number of Pizzas</th>
                      <th>Free Toppings Number</th>
                      <th>Remove</th>
                    </tr>
                    </thead>
                    <tbody>
                    {pizzaItem?.variants?.[0]?.multiplePizzaDetails?.map((detail, index) => (
                      <tr key={index}>
                        <td>
                          <InputNumber
                            value={detail?.numberOfPizza}
                            min={2}
                            onChange={(e) =>
                              handleMultiplePizzaInputChange(index, "numberOfPizza", e.value)
                            }
                          />
                        </td>
                        <td>
                          <InputNumber
                            value={detail?.freeToppingsNumber}
                            required
                            onChange={(e) =>
                              handleMultiplePizzaInputChange(index, "freeToppingsNumber", e.value)
                            }
                          />
                        </td>
                        <td>
                         <PrimeButton type={"button"} onClick={() => handleRemoveMultiplePizzaInput(index)} severity={"danger"} >Remove</PrimeButton>
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
              <Button  id="cancel-save" data-cy="entityCreateCancelButton" onClick={handleBackClick} replace
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
