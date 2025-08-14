import {
  Button,
  Card,
  CardBody,
  Col,
  ListGroup,
  ListGroupItem, Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row, Spinner
} from "reactstrap";
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
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { useNavigate } from "react-router-dom";
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

  const handleVariantSelection = (e, item, variant) => {
    const isChecked = e.target.checked;
    const isPizzaItem = item?.itemVariantType === "RESTAURANT_PIZZA";

    if (isChecked) {
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
    <Modal isOpen={isOpen} toggle={toggleModal} className=" modal-lg">
      <ModalHeader toggle={toggleModal}><Translate contentKey={'items.update.combo.addItemModal.title'}>Add New Item</Translate></ModalHeader>
      <ModalBody>
        <Row>
          <Col md="12" className="d-flex align-items-center justify-content-between">
            <InputText
              value={filters.name.value}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, name: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS } }))
                navigate(createQueryString('page', '1'))
              }}
              placeholder="Search by Name"
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
              className="w-full md:w-14rem"
              isClearable
            />
          </Col>
          {loading ? (
            <Spinner />
          ) : (
            <Col md="12">
              <Row className="justify-content-center mt-4">
                {itemList?.map((item: IItem) => (
                  <Col key={item.id} sm="6" md="4" lg="4" className="mb-4">
                    <div>
                      <Card
                        style={{ background: `url(${item.attachments[0]?.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                        className={`border-4 shadow-sm h-100`}
                      >
                        <CardBody>
                          <div
                            className="overlay d-flex justify-content-center align-items-center top-0 left-0 right-0 bottom-0 absolute"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', }}
                          >
                            <h5 style={{ color: '#fff' }}>{item.name}</h5>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                    <div className="mt-2">
                      {item?.itemVariantType === "RESTAURANT_PIZZA" ?
                        (
                          <>
                            {item?.variants?.map((variant: any) => {
                              return (

                                <div key={variant.id} className="form-check">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id={`variant-${variant?.id}`}
                                    name={`variant-${item?.id}`}
                                    checked={selectedVariants?.[`${item.id}~${variant.id}`]?.variant?.id === variant?.id}
                                    onChange={e => handleVariantSelection(e, item, variant)}
                                  />
                                  <label className="form-check-label" htmlFor={`variant-${variant.id}`}>
                                    {variant.name}
                                  </label>
                                  {selectedVariants?.[`${item.id}~${variant.id}`]?.variant?.id === variant?.id ?
                                    variant?.multiplePizzaDetails ? (
                                      <div className="d-flex flex-column gap-2">
                                        <div>Number of  Pizzas : {variant?.multiplePizzaDetails?.numberOfPizza}</div>
                                        <div>Free Toppings Number : {variant?.multiplePizzaDetails?.freeToppingsNumber}</div>
                                      </div>
                                    ) : (
                                      <div className={"d-flex flex-column gap-2 mt-2"}>
                                        <div>
                                          <label>Select Size</label>
                                          <Select
                                            options={sizesList}
                                            getOptionLabel={(option: IPizzaSize) => option.name}
                                            getOptionValue={(option: IPizzaSize) => option.id}
                                            defaultValue={sizesList?.[0]}
                                            onChange={(selectedOption) =>
                                              handlePizzaPackageSelection(item, 'pizzaSize', selectedOption, variant)
                                            }
                                          />
                                        </div>

                                        <div >
                                          <label>Select Crust Type</label>
                                          <Select
                                            options={crustTypeList}
                                            getOptionLabel={(option: ICrustType) => option.name}
                                            getOptionValue={(option: ICrustType) => option.id}
                                            defaultValue={crustTypeList?.[0]}
                                            onChange={(selectedOption) =>
                                              handlePizzaPackageSelection(item, 'crustType', selectedOption, variant)
                                            }
                                          />
                                        </div>

                                        <div>
                                          <label>Select Crust Thickness</label>
                                          <Select
                                            options={crustThicknessList}
                                            getOptionLabel={(option: ICrustThickness) => option.name}
                                            getOptionValue={(option: ICrustThickness) => option.id}
                                            defaultValue={crustThicknessList?.[0]}
                                            onChange={(selectedOption) =>
                                              handlePizzaPackageSelection(item, 'crustThickness', selectedOption, variant)
                                            }
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
                            <h6>{translate('items.update.regular.variants')}:</h6>
                            {item?.variants?.map(variant => {
                              return (
                                <div key={variant?.id} className="form-check">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id={`variant-${variant?.id}`}
                                    name={`variant-${item?.id}`}
                                    checked={selectedVariants?.[`${item.id}~${variant.id}`]?.variant?.id === variant?.id}
                                    onChange={e => handleVariantSelection(e, item, variant)}
                                  />
                                  <label className="form-check-label text-opacity-100 font-bold" htmlFor={`variant-${variant?.id}`}>
                                    {variant.name}
                                  </label>
                                </div>
                              )
                            })}
                          </>
                        )}
                    </div>
                  </Col>
                ))}
              </Row>
              <div className="d-flex justify-content-center mt-3">
                <PaginationFilter totalPages={Math.ceil(totalItems / 12)} />
              </div>
            </Col>
          )}
        </Row >
      </ModalBody >
      <ModalFooter>
        <Button color="secondary" onClick={toggleModal}>
          <Translate contentKey={'entity.action.cancel'}>Cancel</Translate>
        </Button>
        <Button color="primary" onClick={handleAddItems}>
          <Translate contentKey={'items.update.combo.addItemModal.addItems'}>Add Items</Translate>
        </Button>
      </ModalFooter>
    </Modal >
  )
}

export default ComboItemSelection
