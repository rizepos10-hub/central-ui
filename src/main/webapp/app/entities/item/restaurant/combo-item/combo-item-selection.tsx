import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { filterEntities } from "app/entities/item/restaurant/combo-item/items-for-combo.reducer";
import { IItem } from "app/shared/model/ITEM/item.model";
import { IComboPackage } from "app/shared/model/ITEM/restaurant/combo-item.model";
import Select from "react-select";
import { ICrustThicknessPricingItem, ICrustTypePricingItem, IPizzaItem, PizzaVariantTypeEnum } from "app/shared/model/ITEM/restaurant/pizza-item.model";
import { ICrustThickness } from "app/shared/model/PIZZA/crust-thickness.model";
import { ICrustType } from "app/shared/model/PIZZA/crust-type.model";
import { getEntities as getCrustTypes } from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-type.reducer";
import { getEntities as getCrustThicknesses } from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-thickness.reducer";
import { getEntities as getSizes } from "app/entities/pizza-settings/pizza-size/pizza-size.reducer";
import { getEntities as getCategories } from "app/entities/term/Item-category/item-category.reducer";
import { IPizzaSize } from "app/shared/model/PIZZA/pizza-size.model";
import { translate, Translate } from "react-jhipster";
import { FilterMatchMode } from "primereact/api";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import PaginationFilter from "app/shared/components/pagination/pagination-filter";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const ComboItemSelection = ({ isOpen, onAddItems, toggleModal, comboPackages }) => {

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const itemList = useAppSelector(state => state.itemsForCombo.entities);
  const loading = useAppSelector(state => state.itemsForCombo.loading);
  const totalItems = useAppSelector(state => state.itemsForCombo.totalItems);

  const categoriesList = useAppSelector(state => state.category.entities);
  const crustTypeList = useAppSelector(state => state.pizzaCrustType.entities);
  const crustThicknessList = useAppSelector(state => state.pizzaCrustThickness.entities);
  const sizesList = useAppSelector(state => state.pizzaSize.entities);

  const searchParams = new URLSearchParams(location.search);

  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    categoryId: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const [selectedVariants, setSelectedVariants] = useState({})

  const handleVariantSelection = (checked, item, variant) => {
    const isPizzaItem = item?.itemVariantType === "RESTAURANT_PIZZA";

    if (checked) {
      const pizzaPackage = {
        pizzaSize: sizesList?.[0],
        crustThickness: crustThicknessList?.[0],
        crustType: crustTypeList?.[0],
      };

      setSelectedVariants((prevVariants) => ({
        ...prevVariants,
        [`${item.id}~${variant.id}`]: isPizzaItem ? { variant, pizzaPackage, item } : { variant, item },
      }));
    } else {
      setSelectedVariants((prevVariants) => {
        const newVariants = { ...prevVariants };
        delete newVariants[`${item.id}~${variant.id}`];
        return newVariants;
      });
    }
  };

  console.log(selectedVariants, 'selectedVariants')

  const handlePizzaPackageSelection = (item, field, selectedOption, variant) => {
    console.log(selectedOption, 'selectedOption')
    setSelectedVariants((prevVariants) => {
      const pizzaPackage = {
        ...prevVariants[`${item.id}~${variant.id}`]?.pizzaPackage,
        [field]: selectedOption
      };

      return {
        ...prevVariants,
        [`${item.id}~${variant.id}`]: {
          ...(prevVariants[`${item.id}~${variant.id}`] || {}),
          pizzaPackage,
        },
      };
    });
  };

  const handleAddItems = () => {
    const comboPackagesToSave = Object.entries(selectedVariants)?.map(([itemVariantId, comboPackage]: [string, any]) => {
      const item : IPizzaItem = comboPackage?.item;
      const isPizzaItem = item?.itemVariantType === "RESTAURANT_PIZZA";
      return {
        item,
        variant: comboPackage.variant,
        amount: 1,
        addons: [],
        ...(isPizzaItem &&  { pizzaPackage: item?.variants?.[0]?.pizzaVariantType === PizzaVariantTypeEnum.FIXED_DEAL ? null : comboPackage.pizzaPackage })
      }
    })
    onAddItems(comboPackagesToSave)
  }


  const getItemsForCombo = () => {

    const query = {
      first: (parseInt(searchParams.get("page"), 10) - 1) * 12,
      rows: 12,
      page: parseInt(searchParams.get("page"), 10) - 1,
      sortField: "id",
      sortOrder: 1,
      query: '',
      filters: {
        name: { value: filters.name?.value, matchMode: FilterMatchMode.CONTAINS },
        "categories.id": { value: filters.categoryId?.value, matchMode: FilterMatchMode.EQUALS },
      },
    };

    const updatedQuery = applyMatchModeMap(query);

    dispatch(
      filterEntities({
        query: updatedQuery,
      })
    );
  }

  useEffect(() => {
    const timeOut = setTimeout(() => {
      getItemsForCombo();
    }, 500);
    return () => clearTimeout(timeOut);

  }, [filters?.name?.value, filters?.categoryId?.value, searchParams.get("page")]);

  useEffect(() => {
    dispatch(getCrustTypes({
      size: 1500,
      page: 0,
      sort: "asc"
    }));

    dispatch(getCrustThicknesses({
      size: 1500,
      page: 0,
      sort: "asc"
    }));

    dispatch(getSizes({
      size: 1500,
      page: 0,
      sort: "asc"
    }));

    dispatch(getCategories({
      size: 1500,
      page: 0,
      sort: "asc"
    }));

    return () => {
      setSelectedVariants({})
    }
  }, []);

  const createQueryString = useCallback((name, value) => {
    const params = new URLSearchParams(searchParams);
    params.set(name, value);
    return `?${params.toString()}`;
  }, [searchParams]);


  return (
    <Dialog open={isOpen} onOpenChange={toggleModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            <Translate contentKey={'items.update.combo.addItemModal.title'}>Add New Item</Translate>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={filters.name.value || ''}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, name: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS } }))
                navigate(createQueryString('page', '1'))
              }}
              placeholder="Search by Name"
              className="h-8 text-xs flex-1"
            />
            <Select
              options={categoriesList}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={categoriesList.find(category => category.id === filters.categoryId.value)}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, categoryId: { value: e?.id, matchMode: FilterMatchMode.EQUALS } }))
                navigate(createQueryString('page', '1'))
              }}
              placeholder="Select Category"
              className="flex-1"
              isClearable
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '32px',
                  fontSize: '0.75rem',
                }),
                input: (base) => ({
                  ...base,
                  fontSize: '0.75rem',
                }),
                menu: (base) => ({
                  ...base,
                  fontSize: '0.75rem',
                }),
              }}
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {itemList?.map((item: IItem) => (
                  <div key={item.id} className="space-y-2">
                    <Card
                      style={{
                        backgroundImage: `url(${item.attachments[0]?.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                      className="border-4 shadow-sm h-32 relative overflow-hidden"
                    >
                      <CardContent className="p-2 h-full">
                        <div
                          className="absolute inset-0 flex justify-center items-center"
                          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                        >
                          <h5 className="text-white text-sm font-semibold">{item.name}</h5>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-1">
                      {item?.itemVariantType === "RESTAURANT_PIZZA" ?
                        (
                          <>
                            {item?.variants?.map((variant: any) => {
                              return (
                                <div key={variant.id} className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={`variant-${variant?.id}`}
                                      checked={selectedVariants?.[`${item.id}~${variant.id}`]?.variant?.id === variant?.id}
                                      onCheckedChange={(checked) => handleVariantSelection(checked, item, variant)}
                                    />
                                    <Label htmlFor={`variant-${variant.id}`} className="text-xs cursor-pointer">
                                      {variant.name}
                                    </Label>
                                  </div>

                                  {selectedVariants?.[`${item.id}~${variant.id}`]?.variant?.id === variant?.id ?
                                    variant?.multiplePizzaDetails ? (
                                      <div className="flex flex-col gap-1 pl-6 text-xs">
                                        <div>Number of Pizzas: {variant?.multiplePizzaDetails?.numberOfPizza}</div>
                                        <div>Free Toppings Number: {variant?.multiplePizzaDetails?.freeToppingsNumber}</div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-2 pl-6">
                                        <div className="space-y-1">
                                          <Label className="text-xs">Select Size</Label>
                                          <Select
                                            options={sizesList}
                                            getOptionLabel={(option: IPizzaSize) => option.name}
                                            getOptionValue={(option: IPizzaSize) => option.id}
                                            defaultValue={sizesList?.[0]}
                                            onChange={(selectedOption) =>
                                              handlePizzaPackageSelection(item, 'pizzaSize', selectedOption, variant)
                                            }
                                            styles={{
                                              control: (base) => ({
                                                ...base,
                                                minHeight: '32px',
                                                fontSize: '0.75rem',
                                              }),
                                              input: (base) => ({
                                                ...base,
                                                fontSize: '0.75rem',
                                              }),
                                              menu: (base) => ({
                                                ...base,
                                                fontSize: '0.75rem',
                                              }),
                                            }}
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <Label className="text-xs">Select Crust Type</Label>
                                          <Select
                                            options={crustTypeList}
                                            getOptionLabel={(option: ICrustType) => option.name}
                                            getOptionValue={(option: ICrustType) => option.id}
                                            defaultValue={crustTypeList?.[0]}
                                            onChange={(selectedOption) =>
                                              handlePizzaPackageSelection(item, 'crustType', selectedOption, variant)
                                            }
                                            styles={{
                                              control: (base) => ({
                                                ...base,
                                                minHeight: '32px',
                                                fontSize: '0.75rem',
                                              }),
                                              input: (base) => ({
                                                ...base,
                                                fontSize: '0.75rem',
                                              }),
                                              menu: (base) => ({
                                                ...base,
                                                fontSize: '0.75rem',
                                              }),
                                            }}
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <Label className="text-xs">Select Crust Thickness</Label>
                                          <Select
                                            options={crustThicknessList}
                                            getOptionLabel={(option: ICrustThickness) => option.name}
                                            getOptionValue={(option: ICrustThickness) => option.id}
                                            defaultValue={crustThicknessList?.[0]}
                                            onChange={(selectedOption) =>
                                              handlePizzaPackageSelection(item, 'crustThickness', selectedOption, variant)
                                            }
                                            styles={{
                                              control: (base) => ({
                                                ...base,
                                                minHeight: '32px',
                                                fontSize: '0.75rem',
                                              }),
                                              input: (base) => ({
                                                ...base,
                                                fontSize: '0.75rem',
                                              }),
                                              menu: (base) => ({
                                                ...base,
                                                fontSize: '0.75rem',
                                              }),
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )
                                    : null}
                                </div>
                              )
                            })}
                          </>
                        )
                        :
                        (
                          <>
                            <h6 className="text-xs font-semibold">{translate('items.update.regular.variants')}:</h6>
                            {item?.variants?.map(variant => {
                              return (
                                <div key={variant?.id} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`variant-${variant?.id}`}
                                    checked={selectedVariants?.[`${item.id}~${variant.id}`]?.variant?.id === variant?.id}
                                    onCheckedChange={(checked) => handleVariantSelection(checked, item, variant)}
                                  />
                                  <Label htmlFor={`variant-${variant?.id}`} className="text-xs font-bold cursor-pointer">
                                    {variant.name}
                                  </Label>
                                </div>
                              )
                            })}
                          </>
                        )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <PaginationFilter totalPages={Math.ceil(totalItems / 12)} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={toggleModal} className="h-7 text-xs">
            <Translate contentKey={'entity.action.cancel'}>Cancel</Translate>
          </Button>
          <Button onClick={handleAddItems} className="h-7 text-xs">
            <Translate contentKey={'items.update.combo.addItemModal.addItems'}>Add Items</Translate>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ComboItemSelection
