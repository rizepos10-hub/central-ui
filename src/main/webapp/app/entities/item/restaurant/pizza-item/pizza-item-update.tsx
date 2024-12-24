import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, Spinner, FormGroup, Table, Card, CardBody, CardHeader } from 'reactstrap';
import { getSortState, translate, Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button as PrimeButton } from "primereact/button"

import { getEntity, updateEntity, createEntity, reset } from './pizza-item.reducer';
import SharedItemUpdate from "app/shared/components/item/shared-item-update";
import { IBasePizzaDetail, IPizzaItem, IPizzaItemVariant, PizzaVariantTypeEnum } from "app/shared/model/ITEM/restaurant/pizza-item.model";
import { Steps } from "primereact/steps";
import { MenuItem } from "primereact/menuitem";
import Select from "react-select";
import { getEntitiesForPizzaItem as getPredefinedPizzas, reset as resetPredefined } from "app/entities/pizza-settings/pizza-predefined/pizza-predefined.reducer";
import { getEntities as getPricingClasses } from "app/entities/pizza-settings/pizza-pricing-class/pizza-pricing-class.reducer"
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { InputNumber } from "primereact/inputnumber";
import { Accordion, AccordionTab } from "primereact/accordion";
import AsyncSelect from "react-select/async";
import { IPizzaPricingClass } from "app/shared/model/PIZZA/pizza-pricing-class.model";
import { getEntities as getToppings } from "app/entities/pizza-settings/pizza-topping/pizza-topping.reducer";
import { ITopping } from "app/shared/model/PIZZA/topping.model";
import { ICrustType } from "app/shared/model/PIZZA/crust-type.model";
import { getEntities as getCrustTypes } from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-type.reducer";
import { getEntities as getSizes } from "app/entities/pizza-settings/pizza-size/pizza-size.reducer";
import { getEntities as getCrustThicknesses } from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-thickness.reducer";
import { ICrustThickness } from "app/shared/model/PIZZA/crust-thickness.model";
import { TabPanel, TabView } from "primereact/tabview";
import Visibility from "app/shared/Visibility/Visibility";
import ItemLoyaltyTab from "app/shared/components/item/item-loyalty-tab";
import { getEntities as getDiscounts } from "app/entities/discount/discount.reducer";
import { getEntities as getMixAndMatchRules } from "app/entities/mix-and-match-rule/mix-and-match-rule.reducer";
import AuditLogs from "app/shared/components/logs/audit-logs";
import { preventEnterSubmit } from "app/shared/util/form-utils";
import { IPizzaSize } from 'app/shared/model/PIZZA/pizza-size.model';
import CustomDefinitionValuesWrapper from 'app/shared/components/custom-definition-values/custom-definition-values-wrapper';
import { CustomDefinitionEntityType } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition-value.model';
import { InputTextarea } from 'primereact/inputtextarea';
import SharedAddon from 'app/shared/components/item/addon';
import { IPredefinedPizza } from 'app/shared/model/PIZZA/predefined-pizza.model';

const items: MenuItem[] = [
  {
    label: translate('items.update.pizza.createNewPizzaSteps.choosePizzaType'),
  },
  {
    label: translate('items.update.pizza.createNewPizzaSteps.createYourPizza'),
  },

];

const pricingClassesMap = {
  "toppingPricing": "topping",
  "crustTypePricing": "crustType",
  "crustThicknessPricing": "crustThickness",
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
  const sizeList = useAppSelector(state => state.pizzaSize.entities);
  const discountList = useAppSelector(state => state.discount.entities);
  const mixAndMatchRuleList = useAppSelector(state => state.mixAndMatchRule.entities);
  const predefinedPizzaOptions: IPredefinedPizza[] = useAppSelector(state => state.predefinedPizza.entities);
  const pizzaPricingClasses = useAppSelector(state => state.pizzaPricingClass.entities);
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



  const handlePizzaVariantChange = (fieldName: keyof IPizzaItemVariant, value) => {
    setPizzaItem((prev) => ({
      ...prev,
      variants: [
        {
          ...(prev.variants && prev?.variants?.[0] ? prev.variants[0] : {}),
          [fieldName]: value,
        }
      ]
    }))
  };


  const handleSinglePizzaValuesChange = (fieldName, value) => {
    setPizzaItem((prev) => {
      const updatedVariants = [
        {
          ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
          [fieldName]: value,
          ...(fieldName === "predefinedPizza" && { name: value.name })
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

  const handleDefaultPizzasChange = (fieldName, value, pizzaIndex) => {
    setPizzaItem((prev) => {
      const updatedVariants = [...prev.variants];
      const multiplePizzaDetails = updatedVariants[0].multiplePizzaDetails || {
        pizzaDefaults: []
      }; // Ensure it's initialized
      const pizzaDefaults = multiplePizzaDetails.pizzaDefaults || []; // Initialize pizzaDefaults if undefined

      const updatedPizzaDefaults = [...pizzaDefaults];
      updatedPizzaDefaults[pizzaIndex] = {
        ...updatedPizzaDefaults[pizzaIndex],
        [fieldName]: value,
      };

      return {
        ...prev,
        variants: [
          {
            ...updatedVariants[0],
            multiplePizzaDetails: {
              ...multiplePizzaDetails,
              pizzaDefaults: updatedPizzaDefaults,
            },
          },
        ],
      };
    });
  };

  const resetDefaultPizza = () => {
    setPizzaItem((prev) => {
      const updatedVariants = prev.variants.map((variant) => ({
        ...variant,
        multiplePizzaDetails: {
          ...variant.multiplePizzaDetails,
          pizzaDefaults: []
        }
      }));

      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  }


  const handlePricingClassChangeSecondSelect = (fieldName, selectedPricingClass, index) => {
    setPizzaItem((prev) => {
      const updatedVariants = [...(prev.variants || [])];
      const updatedFieldPricing = [...(updatedVariants[0]?.[fieldName] || [])];

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



  const addNewBaseDetail = () => {
    setPizzaItem((prev) => {
      const newDetail: IBasePizzaDetail = {
        toppingsNumber: 1,
        pricingClass: null,
        numberOfPizza: 1
      };

      const updatedDetails = [...(prev?.variants?.[0].basePizzaDetails || []), newDetail];

      return {
        ...prev,
        variants: [
          {
            ...prev.variants?.[0],
            basePizzaDetails: updatedDetails,
          },
        ],
      };
    });
  };

  const handleBaseDetailChange = (index, fieldName, value) => {
    setPizzaItem((prev) => {
      const updatedVariants = [...prev.variants];
      const updatedDetails = [...updatedVariants[0].basePizzaDetails];

      updatedDetails[index] = {
        ...updatedDetails[index],
        [fieldName]: value,
      };

      return {
        ...prev,
        variants: [
          {
            ...updatedVariants[0],
            basePizzaDetails: updatedDetails,
          },
        ],
      };
    });
  };

  const handleRemoveBaseDetail = (index) => {
    setPizzaItem((prev) => {
      const updatedBaseDetails = prev?.variants?.[0]?.basePizzaDetails.filter((_, i) => i !== index);

      return {
        ...prev,
        variants: [
          {
            ...prev.variants[0],
            basePizzaDetails: updatedBaseDetails,
          },
        ],
      };
    });
  };

  const handleMultiplePizzaInputChange = (fieldName, value) => {
    setPizzaItem((prev) => {
      const updatedDetails = { ...prev.variants[0].multiplePizzaDetails };
      updatedDetails[fieldName] = value;
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

  // const handleRemoveMultiplePizzaInput = (index) => {
  //   setPizzaItem((prev) => {
  //     const updatedPizzaDetails = prev?.variants?.[0]?.multiplePizzaDetails.filter((_, i) => i !== index);

  //     return {
  //       ...prev,
  //       variants: [
  //         {
  //           ...prev.variants?.[0],
  //           multiplePizzaDetails: updatedPizzaDetails,
  //         },
  //       ],
  //     };
  //   });
  // };

  // const addNewMultiplePizzaDetail = () => {
  //   setPizzaItem((prev) => {
  //     const newDetail = {
  //       numberOfPizza: 2,
  //       freeToppingsNumber: null,
  //     };

  //     const updatedDetails = [...(prev?.variants?.[0].multiplePizzaDetails || []), newDetail];

  //     return {
  //       ...prev,
  //       variants: [
  //         {
  //           ...prev?.variants?.[0],
  //           multiplePizzaDetails: updatedDetails,
  //         },
  //       ],
  //     };
  //   });
  // };

  const handlePizzaVariantTypeClick = (type: PizzaVariantTypeEnum) => {
    setPizzaItem((prev) => {
      const updatedVariants = [
        {
          ...prev.variants[0],
          pizzaVariantType: type,
          multiple: type === PizzaVariantTypeEnum.FIXED_DEAL,
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
        const updatedVariants = { ...pizzaItem.variants }
        updatedVariants[0].multiplePizzaDetails = null;
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
    if (isNew) {
      dispatch(reset())
    } else {
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

    dispatch(getSizes({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getCrustThicknesses({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getDiscounts({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getMixAndMatchRules({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    return () => {
      dispatch(resetPredefined());
    }

  }, [id, isNew]);

  useEffect(() => {
    if (!isNew) {
      setPizzaItem(pizzaItemEntity);
    } else {
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
  }, [pizzaItemEntity, updateSuccess]);


  const saveEntity = (e, createNew = false, clone = false) => {
    e.preventDefault();
    let entity = {
      ...pizzaItem,
    };

    if (
      pizzaItem.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.BASE ||
      pizzaItem.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.MAKE_YOUR_OWN ||
      pizzaItem.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.FIXED_DEAL
    ) {
      if (entity.variants && entity.variants[0]) {
        const basePredefined = predefinedPizzaOptions.find(p => p?.base);

        // Create a new variant object by copying the existing one and adding the predefinedPizza property
        const updatedVariant = {
          ...entity.variants[0],
          predefinedPizza: basePredefined,
        };

        // Replace the old variant with the new one in a new variants array
        const updatedVariants = [
          updatedVariant,
          ...entity.variants.slice(1), // Include other variants if they exist
        ];

        // Update the entity with the new variants array
        entity = {
          ...entity,
          variants: updatedVariants,
        };
      }
    }


    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          reset()
          setPizzaItem({})
        } else {
          const payload = res?.payload as any;
          const newProductId = payload?.data?.id;

          const { id, ...entityWithoutId } = entity;
          entityWithoutId.variants = entityWithoutId?.variants.map(({ id, ...variantWithoutId }) => ({
            ...variantWithoutId,
          }));
          dispatch(createEntity(entityWithoutId)).then(res => {
            const payload = res?.payload as any;
            const newProductId = payload?.data?.id;

            // @ts-expect-error -- unknown type
            if (!res?.error) {
              navigate(`/restaurant/pizza/${newProductId}/edit`)
            }
          });

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            handleNavigate(newProductId)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (clone) {
          const { id, ...entityWithoutId } = entity;
          entityWithoutId.variants = entityWithoutId?.variants.map(({ id, ...variantWithoutId }) => ({
            ...variantWithoutId,
          }));
          dispatch(createEntity(entityWithoutId)).then(res => {
            const payload = res?.payload as any;
            const newProductId = payload?.data?.id;

            // @ts-expect-error -- unknown type
            if (!res?.error) {
              navigate(`/restaurant/pizza/${newProductId}/edit`)
            }
          });
        }
        if (createNew) {
          navigate(`/restaurant/pizza/new`)
        }
      })
    }
  };


  const filteredPredefinedPizzaOptions = useMemo(() => {
    let filteredOptions = predefinedPizzaOptions;
    if (pizzaItem?.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.PREDEFINED) {
      filteredOptions = filteredOptions.filter(p => p.base === false);
    }

    return filteredOptions;
  }, [predefinedPizzaOptions, pizzaItem]);

  if (loading) {
    return <Spinner />
  }

  return (
    <div>
      {isNew ?
        <div className="card">
          <Steps
            model={items}
            activeIndex={activeIndex}
            onSelect={e => activeIndex === 1 && setActiveIndex(e.index)}
            readOnly={activeIndex === 0}
          />
        </div> : null}
      {activeIndex === 0 && isNew ?
        <div className={"d-flex justify-content-center"}>
          <div className={"card d-flex flex-column w-7 h-40rem "}>
            <div className={"  p-6  d-flex flex-column justify-content-center align-items-center"}>
              <h4><Translate contentKey={'items.update.pizza.createNewPizzaSteps.pizzaItemType'}>Pizza Item Type</Translate></h4>
              <div className="p-selectbutton d-flex flex-column gap-2 p-component p-3" role="group" data-pc-name="selectbutton"
                data-pc-section="root">
                <div className='d-flex gap-8 justify-content-between'>
                  <div className={`p-button  h-8rem w-12rem  p-component d-flex flex-column gap-2`} role="button" aria-label="Base" aria-pressed="false"
                    tabIndex={0} data-pc-section="button" onClick={() => handlePizzaVariantTypeClick(PizzaVariantTypeEnum.BASE)}>
                    <span className="p-button-label p-c fw-bolder fs-5" data-pc-section="label">
                      <Translate contentKey={'items.update.pizza.createNewPizzaSteps.BASE'}>Base</Translate>
                    </span>
                    <span data-pc-section="label" className='fw-lighter'>
                      Only Dough and cheese without toppings configuration
                    </span>
                  </div>
                  <div className={`p-button h-8rem w-12rem p-component d-flex flex-column gap-2`} role="button" aria-label="Predefined" aria-pressed="false"
                    tabIndex={1} data-pc-section="button" onClick={() => handlePizzaVariantTypeClick(PizzaVariantTypeEnum.PREDEFINED)}>
                    <span className="p-button-label p-c fw-bolder fs-5" data-pc-section="label">
                      <Translate contentKey={'items.update.pizza.createNewPizzaSteps.PREDEFINED'}>Predefined</Translate>
                    </span>
                    <span data-pc-section="label" className='fw-lighter'>
                      Vegetarian, Peperoni, etc...
                    </span>
                  </div>
                </div>
                <div className='d-flex gap-8 justify-content-between'>
                  <div className={`p-button h-8rem w-12rem p-component d-flex flex-column gap-2`} role="button" aria-label="Make Your Own" aria-pressed="false"
                    tabIndex={2} data-pc-section="button" onClick={() => handlePizzaVariantTypeClick(PizzaVariantTypeEnum.MAKE_YOUR_OWN)}>
                    <span className="p-button-label p-c fw-bolder fs-5" data-pc-section="label">
                      <Translate contentKey={'items.update.pizza.createNewPizzaSteps.MAKE_YOUR_OWN'}>Make Your Own</Translate>
                    </span>
                    <span data-pc-section="label" className='fw-lighter'>
                      Choose Number Of PIzza with Topping Number and enter your item pricing class
                    </span>
                  </div>
                  <div className={`p-button  h-8rem w-12rem  p-component d-flex flex-column gap-2`} role="button" aria-label="Fixed Deal" aria-pressed="false"
                    tabIndex={3} data-pc-section="button" onClick={() => handlePizzaVariantTypeClick(PizzaVariantTypeEnum.FIXED_DEAL)}>
                    <span className="p-button-label p-c fw-bolder fs-5" data-pc-section="label">
                      <Translate contentKey={'items.update.pizza.createNewPizzaSteps.FIXED_DEAL'}>Fixed Deal</Translate>
                    </span>
                    <span data-pc-section="label" className='fw-lighter'>
                      Same as Make you own with selected options and fixed price
                    </span>
                  </div>
                </div>
              </div>
              {/* <SelectButton className={"p-3"}  value={pizzaItem?.variants?.[0]?.multiple ? 'Multiple' : 'Single'} onChange={handlePizzaVariantTypeClick} options={multipleOptions} /> */}
            </div>
            <div className={"ml-auto"}>
              <Button type={"button"} onClick={handleNextClick}><Translate contentKey={'items.update.pizza.createNewPizzaSteps.next'}>Next</Translate></Button>
            </div>
          </div>
        </div> : null}
      <Row>
        {activeIndex === 1 || !isNew ?
          <form onKeyDown={preventEnterSubmit}>
            <div className={"d-flex row"}>
              <Col md={9}>
                <Card className='p-0'>
                  <CardBody className='p-1'>
                    <TabView>
                      <TabPanel header={translate('items.update.tabs.details.label')}>
                        <div className='w-100'>
                          <div className='text-xl font-semibold'>
                            {isNew ? <Translate contentKey={'items.update.tabs.details.titles.create.pizza'}>Create New Pizza Item</Translate> : <span>Edit {pizzaItem.name}</span>}
                          </div>
                        </div>
                        <FormGroup className={`${isNew ? "d-flex justify-content-center bg-white" : ""}`}>

                          <div className={`d-flex flex-column p-3  bg-white gap-3`} >
                            {!pizzaItem?.variants?.[0]?.multiple ?
                              <Row>
                                <div className={"d-flex flex-column gap-2"}>
                                  <label className={"font-semibold"}>
                                    <Translate contentKey={'items.update.pizza.predefined'}>Predefined Pizza</Translate>
                                  </label>
                                  <Select
                                    value={
                                      (pizzaItem?.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.BASE || pizzaItem?.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.MAKE_YOUR_OWN) ?
                                        filteredPredefinedPizzaOptions.find(p => p.base) :
                                        pizzaItem?.variants?.[0]?.predefinedPizza || null
                                    }
                                    required
                                    isDisabled={pizzaItem?.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.BASE || pizzaItem?.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.MAKE_YOUR_OWN}
                                    options={filteredPredefinedPizzaOptions}
                                    getOptionLabel={option => option.name}
                                    getOptionValue={option => option.id}
                                    onChange={(predefinedPizza) => handleSinglePizzaValuesChange("predefinedPizza", predefinedPizza)}
                                  />
                                </div>
                              </Row> : null}

                            <SharedItemUpdate item={pizzaItem} onFieldChange={handleFieldChange} />

                            <Row className={""} >
                              <div className={'d-flex flex-column gap-1'}>
                                <label className={'font-semibold'}>
                                  <Translate contentKey={'items.update.description'}>Description</Translate>
                                </label>
                                <InputTextarea
                                  name="desc"
                                  id="desc"
                                  placeholder={translate('items.update.description')}
                                  value={pizzaItem?.variants?.[0]?.description || ''}
                                  onChange={e => setPizzaItem(prev => {
                                    return {
                                      ...prev, variants: prev.variants.map(variant => {
                                        return { ...variant, description: e.target.value }
                                      })
                                    }
                                  })}
                                />
                              </div>

                              {(!pizzaItem?.variants?.[0]?.multiple && pizzaItem?.variants?.[0]?.pizzaVariantType !== PizzaVariantTypeEnum.MAKE_YOUR_OWN) ?
                                <Col md="4">
                                  <div className={"d-flex flex-column gap-2"}>
                                    <label className={"font-semibold"}>
                                      <Translate contentKey={"items.update.pizza.itemPricing"}>Item Pricing</Translate>
                                    </label>
                                    <Select
                                      value={pizzaItem?.variants?.[0]?.itemPricingClass || null}
                                      options={filteredOptions?.itemPricingClass}
                                      isClearable
                                      getOptionLabel={option => option.name}
                                      getOptionValue={option => option.id}
                                      onChange={(itemPriceOption) => handleSinglePizzaValuesChange("itemPricingClass", itemPriceOption)}
                                      onMenuOpen={() => {
                                        dispatch(getPricingClasses({
                                          page: paginationState.activePage - 1,
                                          size: paginationState.itemsPerPage,
                                          sort: `${paginationState.sort},${paginationState.order}`,
                                        }));
                                      }}
                                    />
                                  </div>
                                </Col> : null}

                              <Col md="4">
                                <div className={"d-flex flex-column gap-2"}>
                                  <label className={"font-semibold"}>
                                    <Translate contentKey={'items.update.discounts'}>Discounts</Translate>
                                  </label>
                                  <Select
                                    value={pizzaItem?.variants?.[0]?.discounts || []}
                                    options={discountList}
                                    isMulti
                                    getOptionLabel={option => option.type === 'PERCENTAGE' ? `${option.value}%` : `${option.value} ${option.type}`}
                                    getOptionValue={option => option.id}
                                    onChange={(discounts) => handlePizzaVariantChange("discounts", discounts)}
                                    onMenuOpen={() => {
                                      dispatch(getDiscounts({
                                        page: paginationState.activePage - 1,
                                        size: paginationState.itemsPerPage,
                                        sort: `${paginationState.sort},${paginationState.order}`,
                                      }));
                                    }}
                                  />
                                </div>
                              </Col>

                              <Col md="4">
                                <div className={"d-flex flex-column gap-2"}>
                                  <label className={"font-semibold"}>
                                    <Translate contentKey={'items.update.mixAndMatchRule'}>Mix And Match Rule</Translate>
                                  </label>
                                  <Select
                                    value={pizzaItem?.variants?.[0]?.mixAndMatchRule || null}
                                    options={mixAndMatchRuleList}
                                    getOptionLabel={option => option.name}
                                    getOptionValue={option => option.id}
                                    onChange={(mixAndMatchRule) => handlePizzaVariantChange('mixAndMatchRule', mixAndMatchRule)}
                                    onMenuOpen={() => {
                                      dispatch(getMixAndMatchRules({
                                        page: paginationState.activePage - 1,
                                        size: paginationState.itemsPerPage,
                                        sort: `${paginationState.sort},${paginationState.order}`,
                                      }));
                                    }}
                                  />
                                </div>
                              </Col>
                            </Row>

                            {pizzaItem.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.MAKE_YOUR_OWN ?
                              <div className='d-flex flex-column gap-1'>
                                <label className="form-label">{translate('items.update.pizza.numberOfPizza')}</label>
                                <InputNumber
                                  value={pizzaItem?.variants?.[0]?.numberOfPizza || null}
                                  min={1}
                                  onChange={(e) =>
                                    handlePizzaVariantChange("numberOfPizza", e.value)
                                  }
                                />
                              </div>
                              : null}
                            {(
                              pizzaItem.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.MAKE_YOUR_OWN
                              || pizzaItem.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.BASE) ?
                              <>
                                <Accordion multiple activeIndex={[0]} className={"my-3"}>
                                  <AccordionTab header={
                                    pizzaItem?.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.MAKE_YOUR_OWN ? (
                                      translate('items.update.pizza.makeYourOwnPizzaSettings')
                                    ) : (
                                      'Base pizza settings'
                                    )
                                  }>
                                    <Row>
                                      <Col md="8">
                                        <Table>
                                          <thead>
                                            <tr>
                                              {/* <th><Translate contentKey={'items.update.pizza.numberOfPizza'}>Number of Pizza</Translate></th> */}
                                              <th><Translate contentKey={'items.update.pizza.numberOfToppings'}>Number of Toppings</Translate></th>
                                              {pizzaItem?.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.MAKE_YOUR_OWN ? (
                                                <th><Translate contentKey={'items.update.pizza.pricingClass'}>Pricing Class</Translate></th>
                                              ) : (
                                                <th>Topping Pricing Class</th>
                                              )}
                                              <th><Translate contentKey={'items.update.pizza.remove'}>Remove</Translate></th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {pizzaItem?.variants?.[0]?.basePizzaDetails?.map((baseDetail, index) => (
                                              <tr key={index}>
                                                {/* <td>
                                                  <InputNumber
                                                    value={baseDetail?.numberOfPizza || null}
                                                    min={1}
                                                    onChange={(e) =>
                                                      handleBaseDetailChange(index, "numberOfPizza", e.value)
                                                    }
                                                  />
                                                </td> */}
                                                <td>
                                                  <InputNumber
                                                    value={baseDetail?.toppingsNumber || 0}
                                                    min={0}
                                                    onChange={(e) =>
                                                      handleBaseDetailChange(index, "toppingsNumber", e.value)
                                                    }
                                                  />
                                                </td>
                                                <td>
                                                  <Select
                                                    // show only options of type PREDEFINED
                                                    options={
                                                      pizzaItem.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.BASE ?
                                                        filteredOptions?.toppings :
                                                        filteredOptions?.itemPricingClass
                                                    }
                                                    value={baseDetail?.pricingClass || null}
                                                    getOptionValue={(option: IPizzaPricingClass) => option.id}
                                                    getOptionLabel={(option: IPizzaPricingClass) => option.name}
                                                    onChange={(pricingClass) =>
                                                      handleBaseDetailChange(index, "pricingClass", pricingClass)
                                                    }
                                                    onMenuOpen={() => {
                                                      dispatch(getPricingClasses({
                                                        page: paginationState.activePage - 1,
                                                        size: paginationState.itemsPerPage,
                                                        sort: `${paginationState.sort},${paginationState.order}`,
                                                      }));
                                                    }}
                                                  />
                                                </td>
                                                <td>
                                                  <PrimeButton type={"button"} onClick={() => handleRemoveBaseDetail(index)} severity={"danger"}>
                                                    <Translate contentKey={'items.update.pizza.remove'}>Remove</Translate>
                                                  </PrimeButton>
                                                </td>
                                              </tr>
                                            ))}
                                            <tr>
                                              <td colSpan={2}>
                                                <Button type={"button"} color="primary" onClick={addNewBaseDetail}>
                                                  <Translate contentKey={'items.update.pizza.add'}>Add</Translate>
                                                </Button>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </Table>
                                      </Col>
                                    </Row>
                                  </AccordionTab>
                                </Accordion>
                              </>
                              : null}
                            <Row>
                              <Col md="4">
                                <Accordion multiple activeIndex={[0]} className={"my-3"}>
                                  <AccordionTab header={"Toppings"}>
                                    <div className={"d-flex flex-column p-0 w-100"}>
                                      <Select
                                        value={pizzaItem?.variants?.[0]?.toppingPricing?.map((toppingPrice) => toppingPrice.topping) || null}
                                        isMulti
                                        getOptionLabel={(option: ITopping) => option.name}
                                        getOptionValue={(option: ITopping) => option.id}
                                        onChange={(toppingPriceOption) => handlePricingClassChange("toppingPricing", toppingPriceOption)}
                                        options={pizzaToppingList}
                                        onMenuOpen={() => {
                                          dispatch(getToppings({
                                            page: paginationState.activePage - 1,
                                            size: paginationState.itemsPerPage,
                                            sort: `${paginationState.sort},${paginationState.order}`,
                                          }));
                                        }}
                                      />
                                      <Table>
                                        <thead>
                                          <tr>
                                            <th><Translate contentKey={'items.update.pizza.toppings'}>Topping</Translate></th>
                                            <th><Translate contentKey={'items.update.pizza.pricingClass'}>Pricing Class</Translate></th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {pizzaItem?.variants?.[0]?.toppingPricing?.map((toppingPrice, index) => (
                                            <tr key={index}>
                                              <td>{toppingPrice.topping.name}</td>
                                              <td>
                                                <Select
                                                  value={toppingPrice.pricingClass || null}
                                                  getOptionLabel={(option: IPizzaPricingClass) => option.name}
                                                  getOptionValue={(option: IPizzaPricingClass) => option.id}
                                                  onChange={(selectedPricingClass) =>
                                                    handlePricingClassChangeSecondSelect("toppingPricing", selectedPricingClass, index)
                                                  }
                                                  options={filteredOptions.toppings}
                                                  onMenuOpen={() => {
                                                    dispatch(getPricingClasses({
                                                      page: paginationState.activePage - 1,
                                                      size: paginationState.itemsPerPage,
                                                      sort: `${paginationState.sort},${paginationState.order}`,
                                                    }));
                                                  }}
                                                />
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </Table>
                                    </div>
                                  </AccordionTab>
                                </Accordion>
                              </Col>
                              <Col md="4">
                                <Accordion multiple activeIndex={[0]} className={"my-3"}>
                                  <AccordionTab header={translate('items.update.pizza.crustType')}>
                                    <div className={"d-flex flex-column p-0 w-100"}>
                                      <div>
                                        <Select
                                          value={pizzaItem?.variants?.[0]?.crustTypePricing?.map((crustTypePricing) => crustTypePricing?.crustType) || null}
                                          isMulti
                                          getOptionLabel={(option: ICrustType) => option.name}
                                          getOptionValue={(option: ICrustType) => option.id}
                                          onChange={(crustTypeOption) => handlePricingClassChange("crustTypePricing", crustTypeOption)}
                                          options={crustTypeList}
                                          onMenuOpen={() => {
                                            dispatch(getCrustTypes({
                                              page: paginationState.activePage - 1,
                                              size: paginationState.itemsPerPage,
                                              sort: `${paginationState.sort},${paginationState.order}`,
                                            }));
                                          }}
                                        />
                                        <Table>
                                          <thead>
                                            <tr>
                                              <th><Translate contentKey={'items.update.pizza.crustType'}>Crust Type</Translate></th>
                                              <th><Translate contentKey={'items.update.pizza.pricingClass'}>Pricing Class</Translate></th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {pizzaItem?.variants?.[0]?.crustTypePricing?.map((crustTypePricing, index) => {
                                              return (
                                                <tr key={index}>
                                                  <td>{crustTypePricing?.crustType?.name}</td>
                                                  <td>
                                                    <Select
                                                      value={crustTypePricing?.pricingClass || null}
                                                      getOptionLabel={(option: IPizzaPricingClass) => option.name}
                                                      getOptionValue={(option: IPizzaPricingClass) => option.id}
                                                      onChange={(selectedPricingClass) =>
                                                        handlePricingClassChangeSecondSelect("crustTypePricing", selectedPricingClass, index)
                                                      }
                                                      options={filteredOptions.crustTypes}
                                                      onMenuOpen={() => {
                                                        dispatch(getPricingClasses({
                                                          page: paginationState.activePage - 1,
                                                          size: paginationState.itemsPerPage,
                                                          sort: `${paginationState.sort},${paginationState.order}`,
                                                        }));
                                                      }}
                                                    />
                                                  </td>
                                                </tr>
                                              )
                                            })}
                                          </tbody>
                                        </Table>
                                      </div>
                                    </div>
                                  </AccordionTab>
                                </Accordion>
                              </Col>
                              <Col md="4">
                                <Accordion multiple activeIndex={[0]} className={"my-3 p-0"}>
                                  <AccordionTab header={translate('items.update.pizza.crustThickness')} className='p-0'>
                                    <div className={"d-flex flex-column p-0 w-100"}>
                                      <div>
                                        <Select
                                          value={pizzaItem?.variants?.[0]?.crustThicknessPricing?.map((crustThicknessPricing) => crustThicknessPricing.crustThickness) || null}
                                          isMulti
                                          getOptionLabel={(option: ICrustThickness) => option.name}
                                          getOptionValue={(option: ICrustThickness) => option.id}
                                          onChange={(crustThicknessOption) => handlePricingClassChange("crustThicknessPricing", crustThicknessOption)}
                                          options={crustThicknessList}
                                          onMenuOpen={() => {
                                            dispatch(getCrustThicknesses({
                                              page: paginationState.activePage - 1,
                                              size: paginationState.itemsPerPage,
                                              sort: `${paginationState.sort},${paginationState.order}`,
                                            }));
                                          }}
                                        />
                                        <Table>
                                          <thead>
                                            <tr>
                                              <th><Translate contentKey={'items.update.pizza.crustThickness'}>Crust Thickness</Translate></th>
                                              <th><Translate contentKey={'items.update.pizza.pricingClass'}>Pricing Class</Translate></th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {pizzaItem?.variants?.[0]?.crustThicknessPricing?.map((crustThicknessPricing, index) => (
                                              <tr key={index}>
                                                <td>{crustThicknessPricing?.crustThickness?.name}</td>
                                                <td>
                                                  <Select
                                                    value={crustThicknessPricing?.pricingClass || null}
                                                    getOptionLabel={(option: IPizzaPricingClass) => option.name}
                                                    getOptionValue={(option: IPizzaPricingClass) => option.id}
                                                    onChange={(selectedPricingClass) =>
                                                      handlePricingClassChangeSecondSelect("crustThicknessPricing", selectedPricingClass, index)
                                                    }
                                                    options={filteredOptions?.crustThicknesses}
                                                    onMenuOpen={() => {
                                                      dispatch(getPricingClasses({
                                                        page: paginationState.activePage - 1,
                                                        size: paginationState.itemsPerPage,
                                                        sort: `${paginationState.sort},${paginationState.order}`,
                                                      }));
                                                    }}
                                                  />
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </Table>
                                      </div>
                                    </div>
                                  </AccordionTab>
                                </Accordion>
                              </Col>
                            </Row>

                            {pizzaItem?.variants?.[0]?.multiple ? (
                              <Row>
                                <Col md="8">
                                  <Table>
                                    <thead>
                                      <tr>
                                        <th><Translate contentKey={'items.update.pizza.numberOfPizzas'}>Number of Pizzas</Translate></th>
                                        <th><Translate contentKey={'items.update.pizza.freeToppingsNumber'}>Free Toppings Number</Translate></th>
                                        <th><Translate contentKey={'items.update.pizza.fixedPrice'}>Fixed Price</Translate></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td>
                                          <InputNumber
                                            value={pizzaItem?.variants?.[0]?.multiplePizzaDetails?.numberOfPizza || null}
                                            min={1}
                                            onChange={(e) => {
                                              handleMultiplePizzaInputChange("numberOfPizza", e.value)
                                              resetDefaultPizza()
                                            }}
                                          />
                                        </td>
                                        <td>
                                          <InputNumber
                                            value={pizzaItem?.variants?.[0]?.multiplePizzaDetails?.freeToppingsNumber || null}
                                            required
                                            onChange={(e) =>
                                              handleMultiplePizzaInputChange("freeToppingsNumber", e.value)
                                            }
                                          />
                                        </td>
                                        <td>
                                          <InputNumber
                                            value={pizzaItem?.variants?.[0]?.multiplePizzaDetails?.fixedPrice || null}
                                            required
                                            onChange={(e) =>
                                              handleMultiplePizzaInputChange("fixedPrice", e.value)
                                            }
                                            mode="decimal"
                                            minFractionDigits={2}
                                            maxFractionDigits={2}
                                          />
                                        </td>
                                      </tr>
                                      {Array.from({ length: pizzaItem?.variants?.[0]?.multiplePizzaDetails?.numberOfPizza || 0 }).map((_, index) => (
                                        <tr key={index}>
                                          <td>
                                            <Select
                                              value={pizzaItem?.variants?.[0]?.multiplePizzaDetails?.pizzaDefaults?.[index]?.pizzaSize || null}
                                              getOptionLabel={(option: IPizzaSize) => option.name}
                                              getOptionValue={(option: IPizzaSize) => option.id}
                                              onChange={(sizeOption) => handleDefaultPizzasChange("pizzaSize", sizeOption, index)}
                                              options={sizeList}
                                              onMenuOpen={() => {
                                                dispatch(getSizes({
                                                  page: paginationState.activePage - 1,
                                                  size: paginationState.itemsPerPage,
                                                  sort: `${paginationState.sort},${paginationState.order}`,
                                                }));
                                              }}
                                            />
                                          </td>
                                          <td>
                                            <Select
                                              value={pizzaItem?.variants?.[0]?.multiplePizzaDetails?.pizzaDefaults?.[index]?.defaultCrustThickness || null}
                                              getOptionLabel={(option: ICrustThickness) => option.name}
                                              getOptionValue={(option: ICrustThickness) => option.id}
                                              onChange={(crustThicknessOption) => handleDefaultPizzasChange("defaultCrustThickness", crustThicknessOption, index)}
                                              options={crustThicknessList}
                                              onMenuOpen={() => {
                                                dispatch(getCrustThicknesses({
                                                  page: paginationState.activePage - 1,
                                                  size: paginationState.itemsPerPage,
                                                  sort: `${paginationState.sort},${paginationState.order}`,
                                                }));
                                              }}
                                            />
                                          </td>
                                          <td>
                                            <Select
                                              value={pizzaItem?.variants?.[0]?.multiplePizzaDetails?.pizzaDefaults?.[index]?.defaultCrustType || null}
                                              getOptionLabel={(option: ICrustType) => option.name}
                                              getOptionValue={(option: ICrustType) => option.id}
                                              onChange={(crustTypeOption) => handleDefaultPizzasChange("defaultCrustType", crustTypeOption, index)}
                                              options={crustTypeList}
                                              onMenuOpen={() => {
                                                dispatch(getCrustTypes({
                                                  page: paginationState.activePage - 1,
                                                  size: paginationState.itemsPerPage,
                                                  sort: `${paginationState.sort},${paginationState.order}`,
                                                }));
                                              }}
                                            />
                                          </td>
                                        </tr>
                                      ))}
                                      {/* {pizzaItem?.variants?.[0]?.multiplePizzaDetails?.map((detail, index) => (
                                        <tr key={index}>
                                          <td>
                                            <InputNumber
                                              value={detail?.numberOfPizza || null}
                                              min={2}
                                              onChange={(e) =>
                                                handleMultiplePizzaInputChange(index, "numberOfPizza", e.value)
                                              }
                                            />
                                          </td>
                                          <td>
                                            <InputNumber
                                              value={detail?.freeToppingsNumber || null}
                                              required
                                              onChange={(e) =>
                                                handleMultiplePizzaInputChange(index, "freeToppingsNumber", e.value)
                                              }
                                            />
                                          </td>
                                          <td>
                                            <PrimeButton type={"button"} onClick={() => handleRemoveMultiplePizzaInput(index)} severity={"danger"} >
                                              <Translate contentKey={'items.update.pizza.remove'}>Remove</Translate>
                                            </PrimeButton>
                                          </td>
                                        </tr>
                                      ))} */}
                                      <tr>
                                        {/* <td colSpan={2}>
                                          <Button type={"button"} color="primary" onClick={addNewMultiplePizzaDetail}>
                                            <Translate contentKey={'items.update.pizza.add'}>Add</Translate>
                                          </Button>
                                        </td> */}
                                      </tr>
                                    </tbody>
                                  </Table>
                                </Col>
                              </Row>
                            ) : null}


                          </div>
                          <Row>
                            <Col>
                              <CustomDefinitionValuesWrapper
                                entityId={pizzaItem.id}
                                entityType={CustomDefinitionEntityType.ITEM}
                              />
                            </Col>
                          </Row>
                        </FormGroup>
                      </TabPanel>
                      <TabPanel header={translate('items.update.tabs.addons.label')}>
                        {pizzaItem ? <SharedAddon onFieldChange={handleFieldChange} addons={pizzaItem.addons} addonGroups={pizzaItem.addonGroups || []} addonPriceOverrides={pizzaItem.addonPriceOverrides} /> : null}
                      </TabPanel>
                      <TabPanel header={translate('items.update.tabs.visibility.label')}>
                        <Visibility
                          initialState={pizzaItem.visibility}
                          title={translate('items.update.tabs.visibility.titles.pizza')}
                          onStateChanged={(visibility) => setPizzaItem((prev => {
                            return { ...prev, visibility }
                          }))} />
                      </TabPanel>

                      <TabPanel header={translate('items.update.tabs.excludedFromLoyaltyPoints.label')}>
                        <ItemLoyaltyTab excludedFromLoyaltyPoints={pizzaItem?.excludedFromLoyaltyPoints} onFieldChange={handleFieldChange} />
                      </TabPanel>
                    </TabView>
                  </CardBody>
                </Card>
              </Col>
              <Col md={3} style={{
                position: 'sticky',
                top: '0',
                height: '90vh',
              }}>
                <Card>
                  <CardHeader>Actions</CardHeader>
                  <Row>
                    <Row>
                      <Col>
                        <PrimeButton
                          className='p-1 fs-6 w-100'
                          onClick={handleBackClick}
                          type={'button'}
                          id="cancel-save"
                          data-cy="entityCreateCancelButton"
                          severity="secondary"
                        >
                          <span className="d-none d-md-inline">
                            <Translate contentKey="entity.action.back">Back</Translate>
                          </span>
                        </PrimeButton>
                      </Col>
                      <Col>
                        <PrimeButton className='p-1 fs-6 w-100' onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                          <Translate contentKey="entity.action.save">Save</Translate>
                        </PrimeButton>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <PrimeButton className='p-1 fs-6 w-100' onClick={(e) => saveEntity(e, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                          <Translate contentKey="entity.action.saveandnew">Save and create new</Translate>
                        </PrimeButton>
                      </Col>
                      <Col>
                        <PrimeButton className='p-1 fs-6 w-100' onClick={(e) => saveEntity(e, false, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                          <Translate contentKey="entity.action.saveandclone">Save and create clone</Translate>
                        </PrimeButton>
                      </Col>
                    </Row>
                  </Row>
                </Card>
                {pizzaItemEntity?.id && <AuditLogs entityId={pizzaItemEntity?.id} />}
              </Col>
            </div>
          </form> : null}

      </Row>
    </div >
  );
};

export default PizzaItemUpdate;
