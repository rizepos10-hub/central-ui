import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {Button, Row, Col, FormText, Table, DropdownToggle, Dropdown, DropdownItem, DropdownMenu} from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import {getEntity, updateEntity, createEntity, reset, updatePrices, getPricesForCustomer} from './customer.reducer';
import ItemSelectionModal from "app/entities/customer/item-selection-modal";
import Select from "react-select";

export const CustomerUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();



  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const customerEntity = useAppSelector(state => state.customer.entity);
  const loading = useAppSelector(state => state.customer.loading);
  const updating = useAppSelector(state => state.customer.updating);
  const updateSuccess = useAppSelector(state => state.customer.updateSuccess);

  const [isItemSelectionModalOpen, setIsItemSelectionModalOpen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [selectedRetailPrice, setSelectedRetailPrice] = useState({});
  const [selectedWholeSalesPrice, setSelectedWholeSalesPrice] = useState({});

  const toggleItemSelectionModal = () => {
    setIsItemSelectionModalOpen(!isItemSelectionModalOpen);
  };

  const handleToggleSelectVariant = (item, variant) => {
    const isSelected = selectedVariants.some((selected) => selected.itemId === item.id && selected.variantId === variant.id);

    if (!isSelected) {
      setSelectedVariants([...selectedVariants, { itemId: item.id, itemName: item.name, variantId: variant.id, variantName: variant.name, specialPricesOptions: variant.specialPrices }]);
    } else {
      const updatedSelectedVariants = selectedVariants.filter((selected) => !(selected.itemId === item.id && selected.variantId === variant.id));
      setSelectedVariants(updatedSelectedVariants);
    }
  };
  const handleClose = () => {
    navigate('/customer' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
      // dispatch(getPricesForCustomer(id)).then((response:any) => {
      //   const fetchedPrices = response.payload.data;
      //   console.log(fetchedPrices, 'fetchedd')
      //   const formattedVariants = fetchedPrices.map((priceData) => {
      //     const variantDetails = priceData.item.variants.find((variant) => variant.id === priceData.variantId)
      //     console.log(variantDetails, 'loll')
      //     console.log(priceData.priceNumberByCustomerType, 'loll')
      //     return {
      //       itemId: priceData.item.id,
      //       variantId: priceData.variantId,
      //       itemName: priceData.item.name,
      //       variantName: priceData.variantName,
      //       specialPrices: priceData.priceNumberByCustomerType,
      //       specialPricesOptions: variantDetails.specialPrices,
      //     };
      //   });
      //
      //   setSelectedVariants(formattedVariants);
      // });
    }
  }, []);

  const defaultSelectValueOptions:any = [  'PRICE_1' , 'PRICE_2', 'PRICE_3' , 'PRICE_4' ,  'PRICE_5']


  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  const saveEntity = async (values) => {
    const entity = {
      ...customerEntity,
      ...values,
    };
    const customerId = customerEntity.id;

    console.log(selectedVariants, 'selectedVariants')

    const pricesData = selectedVariants.map(({ itemId, variantId, specialPrices }) => ({
      customer: { id: customerId },
      item: { id: itemId },
      variantId,
      priceNumberByCustomerType: {
        ...specialPrices,
        ...(selectedWholeSalesPrice[itemId]?.[variantId] && {
          WHOLE_SALE: selectedWholeSalesPrice[itemId][variantId],
        }),
        ...(selectedRetailPrice[itemId]?.[variantId] && {
          RETAIL: selectedRetailPrice[itemId][variantId],
        }),
      },
    }));





    if (isNew) {
       await  dispatch(createEntity(entity))
    } else {
      await dispatch(updatePrices({ pricesData, customerId }));


      dispatch(updateEntity(entity));

    }
  };

  console.log(selectedRetailPrice, '5555selectedRetailPrice')
  console.log(selectedWholeSalesPrice, '5555selectedWholeSalesPrice')

  console.log(selectedVariants, 'sle')
  console.log(customerEntity, 'customerEntity')

  const defaultValues = () =>
    isNew
      ? {}
      : {
          ...customerEntity,
        };
  const handlePriceSelect = (itemId, variantId, priceType, selectedPrice) => {
    if (priceType === 'RETAIL') {
      setSelectedRetailPrice({
        ...selectedRetailPrice,
        [itemId]: {
          ...selectedRetailPrice[itemId],
          [variantId]: selectedPrice,
        },
      });
    } else if (priceType === 'WholeSales') {
      setSelectedWholeSalesPrice({
        ...selectedWholeSalesPrice,
        [itemId]: {
          ...selectedWholeSalesPrice[itemId],
          [variantId]: selectedPrice,
        },
      });
    }
  };

  const handleRemoveItem = (indexToRemove) => {
    const updatedSelectedVariants = [...selectedVariants];
    updatedSelectedVariants.splice(indexToRemove, 1);
    setSelectedVariants(updatedSelectedVariants);
  };


  return (
    <div>
      <Row >
        <Col md="8">
          <h2 id="tempApp.customer.home.createOrEditLabel" data-cy="CustomerCreateUpdateHeading">
            {isNew? <Translate contentKey="customers.update.create.title">Create New Customer</Translate> : <Translate contentKey="customers.update.edit.title">Edit Customer</Translate>}
          </h2>
        </Col>
      </Row>
      <Row >
        <Col md="8"  className="d-flex flex-column p-3  bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>

              <ValidatedField
                label={translate('customers.update.firstName')}
                id="customer-firstName"
                name="firstName"
                data-cy="firstName"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField
                label={translate('customers.update.lastName')}
                id="customer-lastName"
                name="lastName"
                data-cy="lastName"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField
                label={translate('customers.update.phone')}
                id="customer-phone"
                name="phone"
                data-cy="phone"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField
                label={translate('customers.update.email')}
                id="customer-email"
                name="email"
                data-cy="email"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
                {/* <div className="d-flex justify-content-end"> */}
                {/*   <Button onClick={toggleItemSelectionModal}>Add Items</Button> */}
                {/* </div> */}

                {/* <ItemSelectionModal */}
                {/*   isOpen={isItemSelectionModalOpen} */}
                {/*   toggle={toggleItemSelectionModal} */}
                {/*   selectedVariant={selectedVariants} */}
                {/*   handleToggleSelect={handleToggleSelectVariant} */}
                {/* /> */}

              {selectedVariants.length > 0 && (
                <div>
                  <h2>Selected Variants:</h2>
                  <Table  bordered >
                    <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Variant Name</th>
                      <th>Price (Wholesale)</th>
                      <th>Price (Retail)</th>
                      <th>Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {selectedVariants.map((selected, index) => {
                      console.log(selected.specialPricesOptions.WHOLE_SALE[selected.specialPrices?.WHOLE_SALE], 'see11')
                      console.log(selected.specialPricesOptions.WHOLE_SALE, 'see111')
                      console.log(  selected.specialPrices?.WHOLE_SALE, 'see1111')
                      console.log(selected.specialPricesOptions.RETAIL[selected.specialPrices?.RETAIL], 'see22')
                      console.log(selected.specialPricesOptions.RETAIL, 'see222')
                      console.log(  selected.specialPrices?.RETAIL, 'see2222')

                      console.log(selected, 'see')
                   return   (
                        <tr key={index}>
                          <td>{selected.itemName}</td>
                          <td>{selected.variantName}</td>
                          <td>
                            <Select
                              options={Object.entries(selected?.specialPricesOptions?.WHOLE_SALE || {})
                                .filter(([item, value]) => value !== null && value !== undefined)
                                .map(([item, value]) => ({
                                  label: `${item}: ${value}`,
                                  value: item,
                                }))
                              }
                              placeholder={"Select WHOLESALE Price"}
                              defaultValue={ selected?.specialPrices?.WHOLE_SALE &&{label: selected.specialPrices?.WHOLE_SALE &&
                            `${selected.specialPrices?.WHOLE_SALE} ${selected.specialPricesOptions.WHOLE_SALE[selected.specialPrices?.WHOLE_SALE]}`, value: selected.specialPrices?.WHOLE_SALE}}
                              onChange={(selectedOption) =>
                                handlePriceSelect(selected.itemId, selected.variantId, 'WholeSales', selectedOption.value)
                              }
                            />
                          </td>
                          <td>
                            <Select
                              options={Object.entries(selected?.specialPricesOptions?.RETAIL || {})
                                .filter(([item, value]) => value !== null && value !== undefined)
                                .map(([item, value]) => ({
                                  label: `${item}: ${value}`,
                                  value: item,
                                }))
                              }
                              placeholder={"Select RETAIL Price"}

                              defaultValue={ selected?.specialPrices?.RETAIL &&  {label: selected?.specialPrices?.RETAIL && `${selected.specialPrices?.RETAIL} ${selected.specialPricesOptions.RETAIL[selected.specialPrices?.RETAIL]}`, value: selected.specialPrices?.RETAIL}}
                              onChange={(selectedOption) =>
                                handlePriceSelect(selected.itemId, selected.variantId, 'RETAIL', selectedOption.value)
                              }
                            />
                          </td>

                          <td>
                            <Button
                              color="danger"
                              onClick={() => handleRemoveItem(index)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                    </tbody>
                  </Table>
                </div>
              )}





              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/customer" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
            </ValidatedForm>
          )}
        </Col>
      </Row>

    </div>
  );
};

export default CustomerUpdate;
