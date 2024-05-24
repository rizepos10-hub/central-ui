import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormText, Spinner, Label } from "reactstrap";
import {getSortState, Translate} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { overridePaginationStateWithQueryParams} from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './addon.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import Select from "react-select";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {Card as PrimeCard} from 'primereact/card'
import { InputText } from "primereact/inputtext";
import { IAddon } from "app/shared/model/ADDON/addon.model";
import { IDiscount } from "app/shared/model/discount.model";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { ITag } from "app/shared/model/TAG/tag.model";
import { getEntities as getTags } from "app/entities/tag/tag.reducer";
import { getEntities as getAccountingGroups } from "app/entities/settings/accounting-group/accounting-group.reducer";
import { IAccountingGroup } from "app/shared/model/TAX/accounting-group.model";


export const AddonUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const addonEntity :IAddon = useAppSelector(state => state.addon.entity);
  const loading = useAppSelector(state => state.addon.loading);
  const updating = useAppSelector(state => state.addon.updating);
  const updateSuccess = useAppSelector(state => state.addon.updateSuccess);
  const discounts = useAppSelector(state => state.discount.entities);
  const tags = useAppSelector(state => state.tag.entities);
  const accountingGroups = useAppSelector(state => state.accountingGroup.entities);


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const handleChange = e => {
    const { name, value } = e.target;
    dispatch(changeEntityField({name, value}))
  };


  const handleClose = () => {
    navigate('/addon' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getDiscounts({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getTags({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getAccountingGroups({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  const saveEntity = (e) => {
    e.preventDefault();

    const entity = {
      ...addonEntity,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };


  const discountsOptions = discounts.map(discount => ({
    label: `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}`,
    id: discount.id,
    type: discount.type,
    value: discount.value
  }));

  if(loading){
    return <Spinner />
  }


  return (
    <div>
      <Row>
        <Row>
          <Col md="8">
            <h2 id="tempApp.addon.home.createOrEditLabel" data-cy="AddonCreateUpdateHeading">
              {isNew ? (
                <Translate contentKey={'addons.update.create.title'}>Create New Addon</Translate>
              ) : (
                <Translate contentKey={'addons.update.edit.title'}>Edit Addon</Translate>
              )}
            </h2>
          </Col>
        </Row>
        <Col md="8">
          <PrimeCard>
            <form onSubmit={saveEntity}>
              <div className={'d-flex flex-column'}>
                <Label for="addon-name">
                  <Translate contentKey={'addons.update.name'}>Name</Translate>
                </Label>
                <InputText name="name" required={true} id="addon-name" value={addonEntity.name || ''}
                           onChange={handleChange} />
              </div>
              <div className={'d-flex flex-column mt-3'}>
                <Label for="addon-desc">
                  <Translate contentKey={'addons.update.description'}>Description</Translate>
                </Label>
                <InputTextarea name="desc" id="addon-desc" value={addonEntity.desc || ''} onChange={handleChange} />
              </div>
              <div className={'d-flex flex-column mt-3'}>
                <Label for="addon-price">
                  <Translate contentKey={'addons.update.price'}>Price</Translate>
                </Label>
                <InputNumber
                  id="addon-price"
                  value={addonEntity.price || null}
                  onChange={e => dispatch(changeEntityField({ name: 'price', value: e.value }))}
                />
              </div>

              <div className={'d-flex flex-column mt-3'}>
                <Label for="addon-accountingGroup">
                  <Translate contentKey={'addons.update.accountingGroup'}>Accounting Group</Translate>
                </Label>
                <Select
                  value={addonEntity?.accountingGroups}
                  options={accountingGroups}
                  id="addon-accountingGroup"

                  getOptionLabel={option => option.name}
                  getOptionValue={option => option.id}
                  onChange={selectedAccountingGroups => dispatch(changeEntityField({
                    name: 'accountingGroups',
                    value: [selectedAccountingGroups]
                  }))}
                />
              </div>

              <div className={'d-flex flex-column mt-3'}>
                <Label for="addon-tags">
                  <Translate contentKey={'addons.update.tags'}>Tags</Translate>
                </Label>
                <Select
                  value={addonEntity?.tags}
                  isMulti={true}
                  options={tags}
                  id="addon-tags"
                  getOptionLabel={option => option.name}
                  getOptionValue={option => option.id}
                  onChange={selectedTags => dispatch(changeEntityField({
                    name: 'tags',
                    value: selectedTags as ITag[]
                  }))}
                />
              </div>
              <div className={'d-flex flex-column my-3'}>
                <Label for="addon-discount">
                  <Translate contentKey={'addons.update.discount'}>Discounts</Translate>
                </Label>
                <Select
                  value={addonEntity.discounts}
                  id="addon-discount"
                  options={discountsOptions}
                  isClearable
                  getOptionLabel={option => (option.type === 'PERCENTAGE' ? `${option.value}%` : `${option.value} ${option.type}`)}
                  getOptionValue={option => option.id}
                  onChange={selectedDiscounts =>
                    dispatch(changeEntityField({
                      name: 'discounts',
                      value: selectedDiscounts ? [selectedDiscounts] : []
                    }))}
                />
              </div>
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/addon" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit"
                      disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
            </form>
          </PrimeCard>
        </Col>
      </Row>
    </div>
  );
};

export default AddonUpdate;
