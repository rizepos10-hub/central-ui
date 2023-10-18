import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities as getPrintingProfiles } from 'app/entities/settings/printing/printing-profiles/printing-profile.reducer';
import { getEntity, updateEntity, createEntity, reset } from './production-center.reducer';
import Select from "react-select";
import {OrderMethod} from "app/shared/model/enumerations/order-method.model";

export const ProductionCenterUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const productionCenterEntity = useAppSelector(state => state.productionCenter.entity);
  const loading = useAppSelector(state => state.productionCenter.loading);
  const updating = useAppSelector(state => state.productionCenter.updating);
  const updateSuccess = useAppSelector(state => state.productionCenter.updateSuccess);

  const printingProfilesList = useAppSelector(state => state.printingProfiles.entities).map(branch => ({ value: branch.id, label: branch.name }));

  const initialPrintingProfile = {label : productionCenterEntity?.printingProfile?.name , value: productionCenterEntity?.printingProfile?.id}

  const initialOrderMethod = {label : productionCenterEntity?.orderMethod , value: productionCenterEntity?.orderMethod}

  const [selectedPrintingProfile, setSelectedPrintingProfile] = useState<{ value: string; label: string; id: string; } | undefined>();

  const [selectedOrderMethod, setSelectedOrderMethod] = useState<{ value: string; label: string; id: string; } | undefined>();


  const orderMethodOptions = Object.keys(OrderMethod).map(method => ({label: method, value: method, id: method}))

  console.log(orderMethodOptions, 'orderMethodOptions')

  const handleClose = () => {
    navigate('/production-center' + location.search);
  };



  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));

    }
    dispatch(getPrintingProfiles({}))
  }, []);

  useEffect(() => {

    if(productionCenterEntity.printingProfile){
      setSelectedPrintingProfile(productionCenterEntity.printingProfile)
    }
    if(productionCenterEntity.orderMethod){
      setSelectedOrderMethod(productionCenterEntity.orderMethod)
    }

    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess,productionCenterEntity]);

  console.log(productionCenterEntity, 'productionCenterEntity')

  const handlePrinterChange = (selectedPrintingProfile) => {
    setSelectedPrintingProfile(selectedPrintingProfile);
  }

  const handleOrderMethodChange = (selectedOrderMethod) => {
    setSelectedOrderMethod(selectedOrderMethod);
  }

  const saveEntity = values => {
    const entity = {
      ...productionCenterEntity,
      ...values,
      printingProfile:  {id : selectedPrintingProfile.value ? selectedPrintingProfile.value : selectedPrintingProfile.id},
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const defaultValues = () =>
    isNew
      ? {}
      : {
          ...productionCenterEntity,
        branch: productionCenterEntity.branch,
        };


  return (
    <div>
      <Row>
        <Col md="8">
          <h2 id="tempApp.productionCenter.home.createOrEditLabel" data-cy="PrinterCreateUpdateHeading">
            <Translate contentKey="tempApp.productionCenter.home.createOrEditLabel">Create or edit a Printer</Translate>
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="8"  className="d-flex flex-column p-3  bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              {!isNew ? (
                <ValidatedField
                  name="id"
                  required
                  readOnly
                  id="productionCenter-id"
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
            <ValidatedField
                label={translate('tempApp.productionCenter.name')}
                id="productionCenter-name"
                name="name"
                data-cy="name"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <div className="mb-3">
               {translate('tempApp.productionCenter.orderMethod')}
              <Select defaultValue={initialOrderMethod}
              onChange={handleOrderMethodChange} options={orderMethodOptions} />
              </div>

              <div className="mb-3">
               {translate('tempApp.productionCenter.printingProfile')}
                <Select defaultValue={initialPrintingProfile}
                        onChange={handlePrinterChange} options={printingProfilesList} />
              </div>

              <ValidatedField label={translate('tempApp.productionCenter.virtual')} id="productionCenter-virtual"
                             className="d-flex gap-2 my-2" name="virtual" data-cy="virtual" type="checkbox" />

              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/productionCenter" replace color="info">
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

export default ProductionCenterUpdate;
