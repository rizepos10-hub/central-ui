import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Row,
  Col,
  Table,
  Label, FormGroup
} from 'reactstrap';
import { Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './loyalty-card.reducer';
import { Card as PrimeCard } from 'primereact/card'
import { filterOrders } from "app/entities/order/order.reducer";
import Order from "app/entities/order/order";
import { getEntities } from "app/entities/loyalty/loyalty-records.reducer";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { getEntities as getWallets } from "app/entities/wallet/wallet.reducer";
import { getEntities as getLoyalyPointsRecords } from 'app/entities/loyalty/loyalty-records.reducer';
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { ILoyaltyCard } from 'app/shared/model/loyalty-card.model';
import { Checkbox } from 'primereact/checkbox';
import { Calendar } from 'primereact/calendar';

export const LoyaltyCardUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();


  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const { search } = useLocation();


  const loyaltyCardEntity: ILoyaltyCard = useAppSelector(state => state.loyaltycard.entity);
  const loyaltyRecord = useAppSelector(state => state.loyalty.entities?.[0]);
  const branchList = useAppSelector(state => state.branch.entities);
  const walletList = useAppSelector(state => state.wallet.entities);
  const loyaltyPointsRecordsList = useAppSelector(state => state.loyalty.entities);
  const loading = useAppSelector(state => state.loyaltycard.loading);
  const updating = useAppSelector(state => state.loyaltycard.updating);
  const updateSuccess = useAppSelector(state => state.loyaltycard.updateSuccess);

  const handleClose = () => {
    navigate('/loyalty-cards');
  };

  useEffect(() => {

    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getBranches({
      page: 0,
      size: 100,
      sort: 'id,desc',
    }))

    dispatch(getWallets({
      page: 0,
      size: 1000,
      sort: 'id,desc',
    }))

    dispatch(getLoyalyPointsRecords({
      page: 0,
      size: 1000,
      sort: 'id,desc',
    }))
  }, []);

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity = {
      ...loyaltyCardEntity,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/loyalty-cards/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/loyalty-cards/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md="12">
          <h2 id="common.loyalty-card.home.createOrEditLabel" data-cy="LoyaltyCardCreateUpdateHeading">
            {isNew ? (
              <Translate contentKey="common.createNewLoyaltyCard">Create New Customer</Translate>
            ) : (
              <Translate contentKey="common.editLoyaltyCard">Edit Customer</Translate>
            )}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="12" className="d-flex flex-column p-3">
          <PrimeCard>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <form>
                <FormGroup>
                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="loyalty-card-cardHolderName">{translate('common.cardHolderName')}</Label>
                    <InputText
                      id="loyalty-card-cardHolderName"
                      value={loyaltyCardEntity?.cardHolderName || ''}
                      onChange={e => dispatch(changeEntityField({ name: 'cardHolderName', value: e.target.value }))}
                    />
                  </div>

                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="loyalty-card-referenceNumber">{translate('common.referenceNumber')}</Label>
                    <InputText
                      id="loyalty-card-referenceNumber"
                      // value={loyaltyCardEntity?.referenceNumber || ''}
                      // onChange={e => dispatch(changeEntityField({ name: 'referenceNumber', value: e.target.value }))}
                      disabled
                      placeholder='Auto Generated'
                    />
                  </div>

                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="loyalty-card-code">{translate('common.code')}</Label>
                    <InputText
                      id="loyalty-card-code"
                      value={loyaltyCardEntity?.code || ''}
                      onChange={e => dispatch(changeEntityField({ name: 'code', value: e.target.value }))}
                    />
                  </div>

                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="loyalty-card-code">{translate('common.expiryDate')}</Label>
                    <Calendar
                      id="loyalty-card-code"
                      value={loyaltyCardEntity?.expiryDate ? new Date(loyaltyCardEntity?.expiryDate) : null}
                      onChange={(e) => dispatch(changeEntityField({ name: 'expiryDate', value: e.value }))}
                    />
                  </div>


                  {/* <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="loyalty-card-walletId">{translate('common.wallet')}</Label>
                    <Dropdown
                      placeholder={'Wallet Id'}
                      value={loyaltyCardEntity?.walletId || ''}
                      options={walletList}
                      optionLabel="id"
                      optionValue="id"
                      style={{ minWidth: '15rem' }}
                      onChange={e => dispatch(changeEntityField({ name: 'walletId', value: e.target.value }))}
                    />
                  </div>

                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="loyalty-card-loyaltyPointId">{translate('common.loyaltyPointId')}</Label>
                    <Dropdown
                      placeholder={'Loyalty Point Id'}
                      value={loyaltyCardEntity?.loyaltyPointId || ''}
                      options={loyaltyPointsRecordsList}
                      optionLabel="id"
                      optionValue="id"
                      style={{ minWidth: '15rem' }}
                      onChange={e => dispatch(changeEntityField({ name: 'walletId', value: e.target.value }))}
                    />
                  </div> */}

                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="loyalty-card-createdByBranchId">{translate('common.branch')}</Label>
                    <Dropdown
                      placeholder={'Branch Id'}
                      value={loyaltyCardEntity?.createdByBranchId || ''}
                      options={branchList}
                      optionLabel="name"
                      optionValue="id"
                      style={{ minWidth: '15rem' }}
                      onChange={e => dispatch(changeEntityField({ name: 'createdByBranchId', value: e.target.value }))}
                    />
                  </div>

                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="loyalty-card-active">{translate('common.active')}</Label>
                    <Checkbox
                      checked={loyaltyCardEntity?.active || false}
                      onChange={e => dispatch(changeEntityField({ name: 'active', value: e.checked }))}
                    />
                  </div>

                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="loyalty-card-printed">{translate('common.printed')}</Label>
                    <Checkbox
                      checked={loyaltyCardEntity?.printed || false}
                      onChange={e => dispatch(changeEntityField({ name: 'printed', value: e.checked }))}
                    />
                  </div>

                </FormGroup>
                <>
                  <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={handleClose} color="info">
                    <FontAwesomeIcon icon="arrow-left" />
                    &nbsp;
                    <span className="d-none d-md-inline">
                      <Translate contentKey="entity.action.back">Back</Translate>
                    </span>
                  </Button>
                  &nbsp;
                  <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                    <FontAwesomeIcon icon="save" />
                    &nbsp;
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                  &nbsp;
                  <Button onClick={(e) => saveEntity(e, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                    <FontAwesomeIcon icon="save" />
                    &nbsp;
                    <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                  </Button>
                </>
              </form>
            )}
          </PrimeCard>
        </Col>
      </Row>
    </div>
  );
};

export default LoyaltyCardUpdate;
