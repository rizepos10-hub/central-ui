import React, { useState, useEffect } from 'react';
import { Row, Col, Modal, ModalHeader, ModalBody, ModalFooter, Button, FormGroup, Label } from 'reactstrap';
import { getSortState, Translate } from 'react-jhipster';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { createEntity, reset } from '../addon/addon.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import Select from 'react-select';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { Card as PrimeCard } from 'primereact/card';
import { IAddon } from 'app/shared/model/ADDON/addon.model';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { getEntities as getAddons } from 'app/entities/addon/addon.reducer';
import { getEntity, updateAddons, updateEntity } from './addon-groups.reducer';

export const CreateAddonModal = ({ isOpen, toggle, addonGroup }) => {
  const dispatch = useAppDispatch();
  const [inputMode, setInputMode] = useState<'normal' | 'string'>('normal');
  const [stringAddons, setStringAddons] = useState<string>('');
  const [stringValidationError, setStringValidationError] = useState<string>('');

  const discounts = useAppSelector(state => state.discount.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [addon, setAddon] = useState<IAddon>();

  // Regex to validate the string format: name1,name2@price2,name3@price3...
  const stringAddonsRegex = /^[a-zA-Z0-9\s]+(@\d+(\.\d{1,2})?)?(\s*,\s*[a-zA-Z0-9\s]+(@\d+(\.\d{1,2})?)?)*$/;

  const validateStringAddons = (value: string): boolean => {
    if (!value.trim()) {
      setStringValidationError('Please enter addons');
      return false;
    }
    if (!stringAddonsRegex.test(value.trim())) {
      setStringValidationError('Invalid format. Use: name1,name2@price2,name3@price3 (e.g., lettuce,tomato@2,cheese@5.10)');
      return false;
    }
    setStringValidationError('');
    return true;
  };

  const parseStringAddons = (addonString: string): any[] => {
    return addonString
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map((item, index) => {
        const parts = item.split('@');
        const name = parts[0].trim();
        const price = parts.length > 1 ? parseFloat(parts[1]) : 0;
        
        return {
          name,
          price,
          desc: '',
          discounts: [],
          archived: false
        };
      });
  };

  const handleDiscountsChange = selectedOptions => {
    setAddon(prevState => ({
      ...prevState,
      discounts: selectedOptions,
    }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setAddon(prevState => ({ ...prevState, [name]: value }));
  };

  useEffect(() => {
    dispatch(
      getDiscounts({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );

    return () => {
      reset();
      setAddon({});
    };
  }, []);

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();

    if (inputMode === 'normal') {
      const entity = {
        ...addon,
      };
      dispatch(createEntity(entity));
      setAddon({
        name: '',
        desc: '',
      });
    } else {
      if (!validateStringAddons(stringAddons)) {
        return;
      }
      
      const parsedAddons = parseStringAddons(stringAddons);
      
      dispatch(updateAddons({
        id: addonGroup?.id,
        addonGroupId: addonGroup?.id,
        addons: parsedAddons
      }));
      
      setStringAddons('');
      setStringValidationError('');
    }
    if (!createNew) {
      toggle();
    }
  };

  const discountsOptions = discounts.map(discount => ({
    label: `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}`,
    id: discount.id,
    type: discount.type,
    value: discount.value,
  }));

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="l">
      <form onSubmit={saveEntity}>
        <FormGroup>
          <ModalHeader>
            <h2 id="tempApp.addon.home.createOrEditLabel" data-cy="AddonCreateUpdateHeading">
              <Translate contentKey={'tempApp.addon.createNewAddon'}>Create New Addon</Translate>
            </h2>
          </ModalHeader>
          <PrimeCard>
            <Button icon="pi pi-times" onClick={() => (inputMode === 'normal' ? setInputMode('string') : setInputMode('normal'))}>
              {inputMode === 'normal' ? (
                <Translate contentKey={'tempApp.addon.string'}>String</Translate>
              ) : (
                <Translate contentKey={'tempApp.addon.normal'}>Normal</Translate>
              )}
            </Button>
            {inputMode === 'normal' ? (
              <>
                <div className={'d-flex flex-column'}>
                  <Label for="addon-name">
                    <Translate contentKey={'tempApp.addon.name'}>Addon Name</Translate>
                  </Label>
                  <InputText type="text" name="name" required={true} id="addon-name" value={addon?.name} onChange={handleChange} />
                </div>
                <div className={'d-flex flex-column mt-2'}>
                  <Label for="addon-name-name">
                    <Translate contentKey={'tempApp.addon.description'}>Addon Description</Translate>
                  </Label>
                  <InputText type="text" name="desc" id="addon-desc" value={addon?.desc} onChange={handleChange} />
                </div>
                <div className={'d-flex flex-column mt-2'}>
                  <Label for="addon-name-name">
                    <Translate contentKey={'tempApp.addon.price'}>Addon Price</Translate>
                  </Label>
                  <InputNumber
                    name="price"
                    id="addon-price"
                    value={addon?.price}
                    onChange={e => setAddon(prevState => ({ ...prevState, price: e.value }))}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <Translate contentKey="tempApp.addon.discount">Discount</Translate>
                  <Select isMulti={true} value={addon?.discounts} options={discountsOptions} onChange={handleDiscountsChange} />
                </div>
              </>
            ) : (
              <div className={'d-flex flex-column'}>
                <small className="text-muted mb-2">
                  Format: name1,name2@price2,name3@price3 (e.g., lettuce,tomato@2,cheese@5.10)
                </small>
                <InputText 
                  type="text" 
                  name="stringAddons" 
                  id="addon-string" 
                  value={stringAddons} 
                  onChange={e => {
                    setStringAddons(e.target.value);
                    if (stringValidationError) {
                      validateStringAddons(e.target.value);
                    }
                  }}
                  className={stringValidationError ? 'p-invalid' : ''}
                  placeholder="lettuce,tomato@2,cheese@5.10,mustard,honey@3.99"
                />
                {stringValidationError && (
                  <small className="text-danger mt-1">{stringValidationError}</small>
                )}
              </div>
            )}
          </PrimeCard>
          <ModalFooter>
            <Button color="secondary" onClick={toggle}>
              <Translate contentKey="common.buttons.cancel">Cancel</Translate>
            </Button>
            <Button color="primary" onClick={e => saveEntity(e, false)}>
              <Translate contentKey="tempApp.addon.createAddon">Create Addon</Translate>
            </Button>
            <Button color="primary" onClick={e => saveEntity(e, true)}>
              <Translate contentKey="tempApp.addon.createAndContinue">Create & Continue</Translate>
            </Button>
          </ModalFooter>
        </FormGroup>
      </form>
    </Modal>
  );
};

export default CreateAddonModal;
