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
import React, {useEffect, useMemo, useState} from "react";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {getEntities} from "app/entities/item/restaurant/combo-item/items-for-combo.reducer";
import {IItem} from "app/shared/model/ITEM/item.model";
import {IComboPackage} from "app/shared/model/ITEM/restaurant/combo-item.model";
import Select from "react-select";
import {ICrustThicknessPricingItem, ICrustTypePricingItem} from "app/shared/model/ITEM/restaurant/pizza-item.model";
import {ICrustThickness} from "app/shared/model/PIZZA/crust-thickness.model";
import {ICrustType} from "app/shared/model/PIZZA/crust-type.model";
import {getEntities as getCrustTypes} from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-type.reducer";
import {getEntities as getCrustThicknesses} from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-thickness.reducer";
import {getEntities as getSizes} from "app/entities/pizza-settings/pizza-size/pizza-size.reducer";
import {IPizzaSize} from "app/shared/model/PIZZA/pizza-size.model";
import {translate, Translate} from "react-jhipster";
const ComboItemSelection = ({isOpen,onAddItems,toggleModal, comboPackages}) => {

  const dispatch = useAppDispatch();

  const itemList = useAppSelector(state => state.itemsForCombo.entities);
  const loading = useAppSelector(state => state.itemsForCombo.loading);

  const crustTypeList = useAppSelector(state => state.pizzaCrustType.entities);
  const crustThicknessList = useAppSelector(state => state.pizzaCrustThickness.entities);
  const sizesList = useAppSelector(state => state.pizzaSize.entities);



  const [selectedVariants, setSelectedVariants] = useState({})
  const [activeCategory, setActiveCategory] = useState('');

  const { groupedMenuItems, itemMap } = useMemo(() => {
    const itemsInComboPackages = comboPackages?.map((comboPackage: IComboPackage) => comboPackage?.item?.id);
    const filteredItemsList = itemList.filter(item => !itemsInComboPackages?.includes(item.id))
    const groupedItems = filteredItemsList.reduce((groups, item) => {
      const categoryName = item.categories[0]?.name || 'Uncategorized';
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(item);
      return groups;
    }, {});

    const itemMap = filteredItemsList.reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {});

    return { groupedMenuItems: groupedItems, itemMap: itemMap };
  }, [itemList]);

  const handleVariantSelection = (item, variant) => {
    const isPizzaItem = item?.itemVariantType === "RESTAURANT_PIZZA";
    const pizzaPackage = {
      pizzaSize: sizesList?.[0],
      crustThickness: crustThicknessList?.[0],
      crustType: crustTypeList?.[0],
    };

    setSelectedVariants((prevVariants) => ({
      ...prevVariants,
      [item.id]: isPizzaItem ? { variant, pizzaPackage } : variant,
    }));
  };

  const handlePizzaPackageSelection = (item, field, selectedOption) => {
    setSelectedVariants((prevVariants) => {
      const pizzaPackage = {
        ...prevVariants[item.id]?.pizzaPackage,
        [field]: selectedOption,
      };

      return {
        ...prevVariants,
        [item.id]: {
          ...(prevVariants[item.id] || {}),
          pizzaPackage,
        },
      };
    });
  };

  const handleAddItems = () => {
    const comboPackagesToSave = Object.entries(selectedVariants)?.map(([itemId, comboPackage] :[string, any]) => {
      const item = itemMap[itemId];
      const isPizzaItem = item?.itemVariantType === "RESTAURANT_PIZZA";
      return {
        item,
        variant: isPizzaItem ? comboPackage.variant : comboPackage,
        amount: 1,
        addons: [],
        ...(isPizzaItem && { pizzaPackage : comboPackage.pizzaPackage })
      }
    })
    onAddItems(comboPackagesToSave)
  }

  useEffect(() => {
    dispatch(getEntities({
      size: 1500,
      page:0,
      sort: "asc"
    }))
    dispatch(getCrustTypes({
      size: 1500,
      page:0,
      sort: "asc"
    }));

    dispatch(getCrustThicknesses({
      size: 1500,
      page:0,
      sort: "asc"
    }));

    dispatch(getSizes({
      size: 1500,
      page:0,
      sort: "asc"
    }));

    return () => {
      setSelectedVariants({})
    }
  },[]);

  console.log(selectedVariants, 'selectedVariantsselectedVariants')

  return (
          <Modal isOpen={isOpen} toggle={toggleModal} className=" modal-lg">
            <ModalHeader toggle={toggleModal}><Translate contentKey={'items.update.combo.addItemModal.title'}>Add New Item</Translate></ModalHeader>
            <ModalBody>
              {loading ? (
                <Spinner />
              ): (

              <Row>
                <Col md="3">
                  <ListGroup>
                    {Object.keys(groupedMenuItems)?.map(categoryName => (
                      <ListGroupItem
                        key={categoryName}
                        tag="button"
                        action
                        onClick={() => setActiveCategory(categoryName)}
                        active={categoryName === activeCategory}
                      >
                        {categoryName}
                      </ListGroupItem>
                    ))}
                  </ListGroup>
                </Col>
                <Col md="9">
                  {activeCategory ? (
                    <>
                      <h3>{activeCategory}</h3>
                      <Row className="justify-content-center mt-4">
                        {groupedMenuItems[activeCategory]?.map((item: IItem) => (
                          <Col key={item.id} sm="6" md="4" lg="4" className="mb-4">
                            <div>
                              <Card
                                style={{background: `url(${item.attachments[0]?.url})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
                                className={`border-4 shadow-sm h-100`}
                              >
                                <CardBody>
                                  <div
                                    className="overlay d-flex justify-content-center align-items-center top-0 left-0 right-0 bottom-0 absolute"
                                    style={{backgroundColor: 'rgba(0, 0, 0, 0.4)',}}
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
                                              type="radio"
                                              className="form-check-input"
                                              id={`variant-${variant?.id}`}
                                              name={`variant-${item?.id}`}
                                              checked={selectedVariants?.[item.id]?.variant?.id === variant.id}
                                              onChange={e => handleVariantSelection(item, variant)}
                                            />
                                            <label className="form-check-label" htmlFor={`variant-${variant.id}`}>
                                              {variant.name}
                                            </label>
                                          {selectedVariants?.[item.id]?.variant?.id === variant.id ?
                                            <div className={"d-flex flex-column gap-2 mt-2"}>
                                            <div>
                                            <label>Select Size</label>
                                              <Select
                                                options={sizesList}
                                                getOptionLabel={(option: IPizzaSize) => option.name}
                                                getOptionValue={(option: IPizzaSize) => option.id}
                                                defaultValue={sizesList?.[0]}
                                                onChange={(selectedOption) =>
                                                  handlePizzaPackageSelection(item, 'pizzaSize', selectedOption)
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
                                                handlePizzaPackageSelection(item, 'crustType', selectedOption)
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
                                                handlePizzaPackageSelection(item, 'crustThickness', selectedOption)
                                              }
                                            />
                                          </div>
                                            </div> : null}
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
                                        <div key={variant.id} className="form-check">
                                          <input
                                            type="radio"
                                            className="form-check-input"
                                            id={`variant-${variant?.id}`}
                                            name={`variant-${item?.id}`}
                                            checked={selectedVariants?.[item.id]?.id === variant.id}
                                            onChange={e => handleVariantSelection(item, variant)}
                                          />
                                          <label className="form-check-label text-opacity-100 font-bold" htmlFor={`variant-${variant.id}`}>
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
                    </>
                  ) : (
                    <p><Translate contentKey={'items.update.combo.addItemModal.message'}>Please select a Category to view its items.</Translate></p>
                  )}
                </Col>
              </Row>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={toggleModal}>
                <Translate contentKey={'entity.action.cancel'}>Cancel</Translate>
              </Button>
              <Button color="primary" onClick={handleAddItems}>
                <Translate contentKey={'items.update.combo.addItemModal.addItems'}>Add Items</Translate>
              </Button>
            </ModalFooter>
          </Modal>
  )
}

export default ComboItemSelection
