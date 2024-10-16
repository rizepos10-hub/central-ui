import React, { useState, useEffect } from 'react';
import {Row, Col, Modal, ModalHeader, ModalBody, ModalFooter, Button, FormGroup, Label} from 'reactstrap';
import {getSortState,Translate, } from 'react-jhipster';
import { overridePaginationStateWithQueryParams} from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { createEntity, reset } from '../addon/addon.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import Select from "react-select";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {Card as PrimeCard} from 'primereact/card'
import {IAddon} from "app/shared/model/ADDON/addon.model";
import {InputText} from "primereact/inputtext";
import {InputNumber} from "primereact/inputnumber";


export const CreateAddonModal = ({isOpen, toggle}) => {
  const dispatch = useAppDispatch();

  const discounts = useAppSelector(state => state.discount.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [addon, setAddon]  = useState<IAddon>();

  const handleDiscountsChange = selectedOptions => {
    setAddon(prevState => ({
      ...prevState,
      discounts: selectedOptions
    }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setAddon(prevState => ({ ...prevState, [name]: value }));
  };


  useEffect(() => {

    dispatch(getDiscounts({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    return () => {
      reset()
      setAddon({})
    }
  }, []);

  const saveEntity = (e) => {
    e.preventDefault();

    const entity = {
      ...addon,
    };
    dispatch(createEntity(entity));
    toggle();
    setAddon({})
  };

  const discountsOptions = discounts.map(discount => ({
    label: `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}`,
    id: discount.id,
    type: discount.type,
    value: discount.value
  }));



  return (
    <Modal isOpen={isOpen} toggle={toggle}  size="l" >
      <form onSubmit={saveEntity}>
        <FormGroup>
        <ModalHeader>
            <h2 id="tempApp.addon.home.createOrEditLabel" data-cy="AddonCreateUpdateHeading">
              <Translate contentKey={'tempApp.addon.createNewAddon'}>Create New Addon</Translate>
            </h2>
        </ModalHeader>
          <PrimeCard>
              <div className={"d-flex flex-column"}>
                <Label for="addon-name">
                  <Translate contentKey={'tempApp.addon.name'}>Addon Name</Translate>
                </Label>
                <InputText
                  type="text"
                  name="name"
                  required={true}
                  id="addon-name"
                  value={addon?.name}
                  onChange={handleChange}
                />
              </div>
              <div className={"d-flex flex-column mt-2"}>
                <Label for="addon-name-name">
                  <Translate contentKey={'tempApp.addon.description'}>Addon Description</Translate>
                </Label>
                <InputText
                  type="text"
                  name="desc"
                  id="addon-desc"
                  value={addon?.desc}
                  onChange={handleChange}
                />
              </div>

              <div className={"d-flex flex-column mt-2"}>
                <Label for="addon-name-name">
                  <Translate contentKey={'tempApp.addon.price'}>Addon Price</Translate>
                </Label>
                <InputNumber
                  name="price"
                  id="addon-price"
                  value={addon?.price}
                  onChange={(e) => setAddon((prevState) => ({...prevState, price: e.value}))}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                />
              </div>

              <div className="mb-3 mt-2">
                <Translate contentKey="tempApp.addon.discount">Discount</Translate>
                <Select isMulti={true}
                        value={addon?.discounts}
                        options={discountsOptions}
                        onChange={handleDiscountsChange} />
              </div>
          </PrimeCard>
        <ModalFooter>
          <Button color="secondary" onClick={toggle}>
            <Translate contentKey="common.buttons.cancel">Cancel</Translate>
          </Button>
          <Button color="primary" type='submit'>
            <Translate contentKey="tempApp.addon.createAddon">Create Addon</Translate>
          </Button>
        </ModalFooter>
      </FormGroup>
      </form>
    </Modal>
  );
};

export default CreateAddonModal;
