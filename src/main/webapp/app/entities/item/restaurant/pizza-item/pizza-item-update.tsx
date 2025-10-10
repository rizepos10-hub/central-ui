import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getSortState, translate, Translate } from 'react-jhipster';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button } from '@/components/ui/button';

import { getEntity, updateEntity, createEntity, reset } from './pizza-item.reducer';
import SharedItemUpdate from "app/shared/components/item/shared-item-update";
import { IBasePizzaDetail, IPizzaItem, IPizzaItemVariant, PizzaVariantTypeEnum } from "app/shared/model/ITEM/restaurant/pizza-item.model";
import Select from "react-select";
import { getEntitiesForPizzaItem as getPredefinedPizzas, reset as resetPredefined } from "app/entities/pizza-settings/pizza-predefined/pizza-predefined.reducer";
import { getEntities as getPricingClasses } from "app/entities/pizza-settings/pizza-pricing-class/pizza-pricing-class.reducer"
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { IPizzaPricingClass } from "app/shared/model/PIZZA/pizza-pricing-class.model";
import { getEntities as getToppings } from "app/entities/pizza-settings/pizza-topping/pizza-topping.reducer";
import { ITopping } from "app/shared/model/PIZZA/topping.model";
import { ICrustType } from "app/shared/model/PIZZA/crust-type.model";
import { getEntities as getCrustTypes } from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-type.reducer";
import { getEntities as getSizes } from "app/entities/pizza-settings/pizza-size/pizza-size.reducer";
import { getEntities as getCrustThicknesses } from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-thickness.reducer";
import { ICrustThickness } from "app/shared/model/PIZZA/crust-thickness.model";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Visibility from "app/shared/Visibility/Visibility";
import ItemLoyaltyTab from "app/shared/components/item/item-loyalty-tab";
import { getEntities as getDiscounts } from "app/entities/discount/discount.reducer";
import { getEntities as getMixAndMatchRules } from "app/entities/mix-and-match-rule/mix-and-match-rule.reducer";
import AuditLogs from "app/shared/components/logs/audit-logs";
import { preventEnterSubmit } from "app/shared/util/form-utils";
import { IPizzaSize } from 'app/shared/model/PIZZA/pizza-size.model';
import CustomDefinitionValuesWrapper from 'app/shared/components/custom-definition-values/custom-definition-values-wrapper';
import { CustomDefinitionEntityType } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition-value.model';
import { Textarea } from '@/components/ui/textarea';
import SharedAddon from 'app/shared/components/item/addon';
import { IPredefinedPizza } from 'app/shared/model/PIZZA/predefined-pizza.model';
import SeoTags from 'app/shared/components/item/seo-tags';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import EBTEligibleBranches from 'app/shared/components/item/ebt-eligible-branches';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

const stepItems = [
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
  const branchList = useAppSelector(state => state.branch.entities);
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

  const updateSeoTags = (fieldName, value) => {
    setPizzaItem(prevItem => ({
      ...prevItem,
      seo: {
        ...prevItem.seo,
        [fieldName]: value
      }
    }));
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

    dispatch(getBranches({
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
          if (clone) {
            dispatch(createEntity(entityWithoutId)).then(res => {
              const payload = res?.payload as any;
              const newProductId = payload?.data?.id;

              // @ts-expect-error -- unknown type
              if (!res?.error) {
                navigate(`/restaurant/pizza/${newProductId}/edit`)
              }
            });
          }
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
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <PageWrapper>
      {isNew ?
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {stepItems.map((item, index) => (
                <React.Fragment key={index}>
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                      index === activeIndex ? 'bg-primary text-primary-foreground' :
                      index < activeIndex ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`text-xs ${index === activeIndex ? 'font-semibold' : ''}`}>{item.label}</span>
                  </div>
                  {index < stepItems.length - 1 && (
                    <div className="h-[2px] flex-1 mx-4 bg-muted" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card> : null}
      {activeIndex === 0 && isNew ?
        <div className="flex justify-center">
          <Card className="w-full max-w-4xl">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6">
                <h4 className="text-lg font-semibold text-center">
                  <Translate contentKey={'items.update.pizza.createNewPizzaSteps.pizzaItemType'}>Pizza Item Type</Translate>
                </h4>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto flex-col gap-2 p-4 text-left"
                      onClick={() => handlePizzaVariantTypeClick(PizzaVariantTypeEnum.BASE)}
                    >
                      <span className="text-sm font-bold">
                        <Translate contentKey={'items.update.pizza.createNewPizzaSteps.BASE'}>Base</Translate>
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        Only Dough and cheese without toppings configuration
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto flex-col gap-2 p-4 text-left"
                      onClick={() => handlePizzaVariantTypeClick(PizzaVariantTypeEnum.PREDEFINED)}
                    >
                      <span className="text-sm font-bold">
                        <Translate contentKey={'items.update.pizza.createNewPizzaSteps.PREDEFINED'}>Predefined</Translate>
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        Vegetarian, Peperoni, etc...
                      </span>
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto flex-col gap-2 p-4 text-left"
                      onClick={() => handlePizzaVariantTypeClick(PizzaVariantTypeEnum.MAKE_YOUR_OWN)}
                    >
                      <span className="text-sm font-bold">
                        <Translate contentKey={'items.update.pizza.createNewPizzaSteps.MAKE_YOUR_OWN'}>Make Your Own</Translate>
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        Choose Number Of Pizza with Topping Number and enter your item pricing class
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto flex-col gap-2 p-4 text-left"
                      onClick={() => handlePizzaVariantTypeClick(PizzaVariantTypeEnum.FIXED_DEAL)}
                    >
                      <span className="text-sm font-bold">
                        <Translate contentKey={'items.update.pizza.createNewPizzaSteps.FIXED_DEAL'}>Fixed Deal</Translate>
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        Same as Make you own with selected options and fixed price
                      </span>
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="button" onClick={handleNextClick} className="h-8 text-xs">
                    <Translate contentKey={'items.update.pizza.createNewPizzaSteps.next'}>Next</Translate>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> : null}
      <div className="flex gap-4">
        {activeIndex === 1 || !isNew ? (
          <>
            <div className="flex-1">
              <form onKeyDown={preventEnterSubmit}>
                <Card>
                  <CardContent className="p-2">
                    <Tabs defaultValue="details">
                      <TabsList className="w-full justify-start">
                        <TabsTrigger value="details" className="text-xs h-7">{translate('items.update.tabs.details.label')}</TabsTrigger>
                        <TabsTrigger value="addons" className="text-xs h-7">{translate('items.update.tabs.addons.label')}</TabsTrigger>
                        <TabsTrigger value="visibility" className="text-xs h-7">{translate('items.update.tabs.visibility.label')}</TabsTrigger>
                        <TabsTrigger value="loyalty" className="text-xs h-7">{translate('items.update.tabs.excludedFromLoyaltyPoints.label')}</TabsTrigger>
                        <TabsTrigger value="seo" className="text-xs h-7">{translate('items.update.tabs.seo.label')}</TabsTrigger>
                        <TabsTrigger value="ebt" className="text-xs h-7">{translate('items.update.tabs.ebtEligibleBranches.label')}</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details">
                        <div className="w-full">
                          <div className="text-base font-semibold mb-3">
                            {isNew ? <Translate contentKey={'items.update.tabs.details.titles.create.pizza'}>Create New Pizza Item</Translate> : <span>Edit {pizzaItem.name}</span>}
                          </div>
                        </div>
                        <div className={`${isNew ? "flex justify-center bg-white" : ""}`}>

                          <div className="flex flex-col p-3 bg-white gap-3">
                            {!pizzaItem?.variants?.[0]?.multiple ?
                              <div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-semibold">
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
                                    styles={{
                                      control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                                      option: (base) => ({ ...base, fontSize: '0.75rem' })
                                    }}
                                  />
                                </div>
                              </div> : null}

                            <SharedItemUpdate item={pizzaItem} onFieldChange={handleFieldChange} />

                            <div className="space-y-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold">
                                  <Translate contentKey={'items.update.description'}>Description</Translate>
                                </label>
                                <Textarea
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
                                  className="text-xs min-h-[60px]"
                                />
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                {(!pizzaItem?.variants?.[0]?.multiple && pizzaItem?.variants?.[0]?.pizzaVariantType !== PizzaVariantTypeEnum.MAKE_YOUR_OWN) ?
                                  <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold">
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
                                      styles={{
                                        control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                                        option: (base) => ({ ...base, fontSize: '0.75rem' })
                                      }}
                                    />
                                  </div> : null}

                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-semibold">
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
                                    styles={{
                                      control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                                      option: (base) => ({ ...base, fontSize: '0.75rem' })
                                    }}
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-semibold">
                                    <Translate contentKey={'items.update.mixAndMatchRule'}>Mix And Match Rule</Translate>
                                  </label>
                                  <Select
                                    isClearable
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
                                    styles={{
                                      control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                                      option: (base) => ({ ...base, fontSize: '0.75rem' })
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {pizzaItem.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.MAKE_YOUR_OWN ?
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold">{translate('items.update.pizza.numberOfPizza')}</label>
                                <Input
                                  type="number"
                                  value={pizzaItem?.variants?.[0]?.numberOfPizza || ''}
                                  min={1}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || null;
                                    handlePizzaVariantChange("numberOfPizza", value);
                                    if (value !== 1) {
                                      handlePizzaVariantChange("addPredefinedPizzasAsToppingsOnly", false);
                                    }
                                  }}
                                  className="h-8 text-xs"
                                />
                                <div className="flex items-center gap-2 mt-2">
                                  <Checkbox
                                    id="addPredefinedPizzasAsToppingsOnly"
                                    checked={pizzaItem?.variants?.[0]?.addPredefinedPizzasAsToppingsOnly || false}
                                    onCheckedChange={checked => handlePizzaVariantChange("addPredefinedPizzasAsToppingsOnly", checked)}
                                    disabled={pizzaItem?.variants?.[0]?.numberOfPizza !== 1}
                                  />
                                  <Label htmlFor="addPredefinedPizzasAsToppingsOnly" className="text-xs cursor-pointer">
                                    <Translate contentKey="items.update.pizza.addPredefinedPizzasAsToppingsOnly">Add Predefined Pizzas As Toppings Only</Translate>
                                  </Label>
                                </div>
                              </div>
                              : null}
                            {(
                              pizzaItem.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.MAKE_YOUR_OWN
                              || pizzaItem.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.BASE) ?
                              <>
                                <Accordion type="multiple" defaultValue={["item-1"]} className="my-3">
                                  <AccordionItem value="item-1">
                                    <AccordionTrigger className="text-xs font-semibold">
                                      {pizzaItem?.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.MAKE_YOUR_OWN ? (
                                        translate('items.update.pizza.makeYourOwnPizzaSettings')
                                      ) : (
                                        'Base pizza settings'
                                      )}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="w-full">
                                        <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead className="text-xs"><Translate contentKey={'items.update.pizza.numberOfToppings'}>Number of Toppings</Translate></TableHead>
                                                <TableHead className="text-xs">
                                                  {pizzaItem?.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.MAKE_YOUR_OWN ? (
                                                    <Translate contentKey={'items.update.pizza.pricingClass'}>Pricing Class</Translate>
                                                  ) : (
                                                    'Topping Pricing Class'
                                                  )}
                                                </TableHead>
                                                <TableHead className="text-xs"><Translate contentKey={'items.update.pizza.remove'}>Remove</Translate></TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {pizzaItem?.variants?.[0]?.basePizzaDetails?.map((baseDetail, index) => (
                                                <TableRow key={index}>
                                                  <TableCell>
                                                    <Input
                                                      type="number"
                                                      value={baseDetail?.toppingsNumber || 0}
                                                      min={0}
                                                      onChange={(e) =>
                                                        handleBaseDetailChange(index, "toppingsNumber", parseInt(e.target.value) || 0)
                                                      }
                                                      className="h-7 text-xs"
                                                    />
                                                  </TableCell>
                                                  <TableCell>
                                                    <Select
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
                                                      styles={{
                                                        control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                                                        option: (base) => ({ ...base, fontSize: '0.75rem' })
                                                      }}
                                                    />
                                                  </TableCell>
                                                  <TableCell>
                                                    <Button type="button" onClick={() => handleRemoveBaseDetail(index)} variant="destructive" size="sm" className="h-7 text-xs">
                                                      <Translate contentKey={'items.update.pizza.remove'}>Remove</Translate>
                                                    </Button>
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                              <TableRow>
                                                <TableCell colSpan={3}>
                                                  <Button type="button" onClick={addNewBaseDetail} className="h-7 text-xs">
                                                    <Translate contentKey={'items.update.pizza.add'}>Add</Translate>
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            </TableBody>
                                          </Table>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </>
                              : null}
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Accordion type="multiple" defaultValue={["toppings"]} className="my-3">
                                  <AccordionItem value="toppings">
                                    <AccordionTrigger className="text-xs font-semibold">Toppings</AccordionTrigger>
                                    <AccordionContent>
                                      <div className="flex flex-col gap-2">
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
                                          styles={{
                                            control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                                            option: (base) => ({ ...base, fontSize: '0.75rem' })
                                          }}
                                        />
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="text-xs"><Translate contentKey={'items.update.pizza.toppings'}>Topping</Translate></TableHead>
                                              <TableHead className="text-xs"><Translate contentKey={'items.update.pizza.pricingClass'}>Pricing Class</Translate></TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {pizzaItem?.variants?.[0]?.toppingPricing?.map((toppingPrice, index) => (
                                              <TableRow key={index}>
                                                <TableCell className="text-xs">{toppingPrice.topping.name}</TableCell>
                                                <TableCell>
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
                                                    styles={{
                                                      control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                                                      option: (base) => ({ ...base, fontSize: '0.75rem' })
                                                    }}
                                                  />
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                              <div>
                                <Accordion type="multiple" defaultValue={["crustType"]} className="my-3">
                                  <AccordionItem value="crustType">
                                    <AccordionTrigger className="text-xs font-semibold">{translate('items.update.pizza.crustType')}</AccordionTrigger>
                                    <AccordionContent>
                                      <div className="flex flex-col gap-2">
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
                                          styles={{
                                            control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                                            option: (base) => ({ ...base, fontSize: '0.75rem' })
                                          }}
                                        />
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="text-xs"><Translate contentKey={'items.update.pizza.crustType'}>Crust Type</Translate></TableHead>
                                              <TableHead className="text-xs"><Translate contentKey={'items.update.pizza.pricingClass'}>Pricing Class</Translate></TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {pizzaItem?.variants?.[0]?.crustTypePricing?.map((crustTypePricing, index) => (
                                              <TableRow key={index}>
                                                <TableCell className="text-xs">{crustTypePricing?.crustType?.name}</TableCell>
                                                <TableCell>
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
                                                    styles={{
                                                      control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                                                      option: (base) => ({ ...base, fontSize: '0.75rem' })
                                                    }}
                                                  />
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                              <div>
                                <Accordion type="multiple" defaultValue={["crustThickness"]} className="my-3">
                                  <AccordionItem value="crustThickness">
                                    <AccordionTrigger className="text-xs font-semibold">{translate('items.update.pizza.crustThickness')}</AccordionTrigger>
                                    <AccordionContent>
                                      <div className="flex flex-col gap-2">
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
                                          styles={{
                                            control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                                            option: (base) => ({ ...base, fontSize: '0.75rem' })
                                          }}
                                        />
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="text-xs"><Translate contentKey={'items.update.pizza.crustThickness'}>Crust Thickness</Translate></TableHead>
                                              <TableHead className="text-xs"><Translate contentKey={'items.update.pizza.pricingClass'}>Pricing Class</Translate></TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {pizzaItem?.variants?.[0]?.crustThicknessPricing?.map((crustThicknessPricing, index) => (
                                              <TableRow key={index}>
                                                <TableCell className="text-xs">{crustThicknessPricing?.crustThickness?.name}</TableCell>
                                                <TableCell>
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
                                                    styles={{
                                                      control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                                                      option: (base) => ({ ...base, fontSize: '0.75rem' })
                                                    }}
                                                  />
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            </div>

                            {pizzaItem?.variants?.[0]?.multiple && pizzaItem?.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.FIXED_DEAL ? (
                              <div className="w-full">
                                <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-xs"><Translate contentKey={'items.update.pizza.numberOfPizzas'}>Number of Pizzas</Translate></TableHead>
                                        <TableHead className="text-xs"><Translate contentKey={'items.update.pizza.freeToppingsNumber'}>Free Toppings Number</Translate></TableHead>
                                        <TableHead className="text-xs"><Translate contentKey={'items.update.pizza.fixedPrice'}>Fixed Price</Translate></TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      <TableRow>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            value={pizzaItem?.variants?.[0]?.multiplePizzaDetails?.numberOfPizza || ''}
                                            min={1}
                                            onChange={(e) => {
                                              handleMultiplePizzaInputChange("numberOfPizza", parseInt(e.target.value) || null)
                                              resetDefaultPizza()
                                            }}
                                            className="h-7 text-xs"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            value={pizzaItem?.variants?.[0]?.multiplePizzaDetails?.freeToppingsNumber || ''}
                                            onChange={(e) =>
                                              handleMultiplePizzaInputChange("freeToppingsNumber", parseInt(e.target.value) || null)
                                            }
                                            className="h-7 text-xs"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value={pizzaItem?.variants?.[0]?.multiplePizzaDetails?.fixedPrice || ''}
                                            onChange={(e) =>
                                              handleMultiplePizzaInputChange("fixedPrice", parseFloat(e.target.value) || null)
                                            }
                                            className="h-7 text-xs"
                                          />
                                        </TableCell>
                                      </TableRow>
                                      {Array.from({ length: pizzaItem?.variants?.[0]?.multiplePizzaDetails?.numberOfPizza || 0 }).map((_, index) => (
                                        <TableRow key={index}>
                                          <TableCell>
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
                                              styles={{
                                                control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                                                option: (base) => ({ ...base, fontSize: '0.75rem' })
                                              }}
                                            />
                                          </TableCell>
                                          <TableCell>
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
                                              styles={{
                                                control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                                                option: (base) => ({ ...base, fontSize: '0.75rem' })
                                              }}
                                            />
                                          </TableCell>
                                          <TableCell>
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
                                              styles={{
                                                control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                                                option: (base) => ({ ...base, fontSize: '0.75rem' })
                                              }}
                                            />
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                              </div>
                            ) : null}


                          </div>
                          {pizzaItem.id && (
                            <div className="w-full">
                              <CustomDefinitionValuesWrapper
                                entityId={pizzaItem.id}
                                entityType={CustomDefinitionEntityType.ITEM}
                              />
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="addons">
                        {pizzaItem ? <SharedAddon onFieldChange={handleFieldChange} addons={pizzaItem.addons} addonGroups={pizzaItem.addonGroups || []} item={pizzaItem} /> : null}
                      </TabsContent>

                      <TabsContent value="visibility">
                        <Visibility
                          initialState={pizzaItem.visibility}
                          title={translate('items.update.tabs.visibility.titles.pizza')}
                          onStateChanged={(visibility) => setPizzaItem((prev => {
                            return { ...prev, visibility }
                          }))} />
                      </TabsContent>

                      <TabsContent value="loyalty">
                        <ItemLoyaltyTab excludedFromLoyaltyPoints={pizzaItem?.excludedFromLoyaltyPoints} onFieldChange={handleFieldChange} />
                      </TabsContent>

                      <TabsContent value="seo">
                        <SeoTags
                          field={pizzaItem?.seo}
                          onFieldChange={updateSeoTags}
                        />
                      </TabsContent>

                      <TabsContent value="ebt">
                        <EBTEligibleBranches
                          item={pizzaItem}
                          setItem={setPizzaItem}
                          branchList={branchList}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </form>
            </div>
            <div className="w-80 sticky top-0" style={{ height: '90vh' }}>
              <Card>
                <CardHeader>
                  <div className="text-xs font-semibold">Actions</div>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      className="h-7 text-xs flex-1"
                      onClick={handleBackClick}
                      type="button"
                      id="cancel-save"
                      data-cy="entityCreateCancelButton"
                      variant="secondary"
                    >
                      <Translate contentKey="entity.action.back">Back</Translate>
                    </Button>
                    <Button
                      className="h-7 text-xs flex-1"
                      onClick={(e) => {
                        e.preventDefault();
                        saveEntity(e);
                      }}
                      id="save-entity"
                      data-cy="entityCreateSaveButton"
                      disabled={updating}
                    >
                      <Translate contentKey="entity.action.save">Save</Translate>
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="h-7 text-xs flex-1"
                      onClick={(e) => {
                        e.preventDefault();
                        saveEntity(e, true);
                      }}
                      id="save-and-new"
                      disabled={updating}
                    >
                      <Translate contentKey="entity.action.saveandnew">Save and create new</Translate>
                    </Button>
                    <Button
                      className="h-7 text-xs flex-1"
                      onClick={(e) => {
                        e.preventDefault();
                        saveEntity(e, false, true);
                      }}
                      id="save-and-clone"
                      disabled={updating}
                    >
                      <Translate contentKey="entity.action.saveandclone">Save and create clone</Translate>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {pizzaItemEntity?.id && <AuditLogs entityId={pizzaItemEntity?.id} />}
            </div>
          </>
        ) : null}
      </div>
    </PageWrapper >
  );
};

export default PizzaItemUpdate;
