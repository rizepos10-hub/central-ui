import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label } from 'reactstrap';
import { Translate, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './service-charge.reducer';
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from 'primereact/dropdown';
import { ServiceChargeApplicableOn, ServiceChargeKey, ServiceChargeSettingType, ServiceChargeWhenToApply } from 'app/shared/model/service-charge.model';
import { InputText } from 'primereact/inputtext';

export const ServiceChargeUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const serviceChargeEntity = useAppSelector(state => state.serviceCharge.entity);
  const loading = useAppSelector(state => state.serviceCharge.loading);
  const updating = useAppSelector(state => state.serviceCharge.updating);
  const updateSuccess = useAppSelector(state => state.serviceCharge.updateSuccess);

  useEffect(() => {
    if (!isNew) {
      dispatch(getEntity(id));
    }
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    return () => {
      dispatch(reset());
    }
  }, [updateSuccess]);



  const handleClose = () => {
    navigate('/service-charge' + location.search);
  };

  const saveEntity = (e) => {
    e.preventDefault();
    if (isNew) {
      dispatch(createEntity(serviceChargeEntity));
    } else {
      dispatch(updateEntity(serviceChargeEntity));
    }
  };

  const serviceChargeKeys = Object.keys(ServiceChargeKey).map(key => ({ label: key, value: ServiceChargeKey[key] }));
  const whenToApplyOptions = Object.keys(ServiceChargeWhenToApply).map(key => ({ label: key, value: ServiceChargeWhenToApply[key] }));
  const typeOptions = Object.keys(ServiceChargeSettingType).map(key => ({ label: key, value: ServiceChargeSettingType[key] }));
  const applicableOnOptions = Object.keys(ServiceChargeApplicableOn).map(key => ({ label: key, value: ServiceChargeApplicableOn[key] }));

  return (
    <div>
      <Row>
        <Col md="8">
          <h2 id="service-charge.home.createOrEditLabel" data-cy="ServiceChargeCreateUpdateHeading">
            {isNew ? "Create New Service Charge" : "Edit Service Charge"}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="12" className="d-flex flex-column p-3 bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <FormGroup>
                <div className={"d-flex gap-2 w-100"}>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="service-charge-key">{translate('service-charge.key')}</Label>
                    <Dropdown
                      value={serviceChargeEntity.key}
                      options={serviceChargeKeys}
                      placeholder="Select a Key"
                      showClear
                      style={{ minWidth: '12rem' }}
                    />
                  </div>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="service-charge-name">{translate('service-charge.name')}</Label>
                    <InputText
                      id="service-charge-name"
                      value={serviceChargeEntity.value?.name || ''}
                      onChange={(e) => dispatch(changeEntityField({ name: 'value.name', value: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className={"d-flex gap-2 w-100"}>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="service-charge-type">{translate('service-charge.settings.type')}</Label>
                    <Dropdown
                      value={serviceChargeEntity.value?.setting?.type}
                      options={typeOptions}
                      placeholder="Select a Setting"
                      showClear
                      style={{ minWidth: '12rem' }}
                    />
                  </div>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="service-charge-applicableOn">{translate('service-charge.applicableOn')}</Label>
                    <Dropdown
                      value={serviceChargeEntity.value?.setting?.applicableOn}
                      options={applicableOnOptions}
                      placeholder="Select a Applicable On"
                      showClear
                      style={{ minWidth: '12rem' }}
                    />
                  </div>
                </div>

                <div className={"d-flex gap-2 w-100"}>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="service-charge-whenToApply">{translate('service-charge.whenToApply')}</Label>
                    <Dropdown
                      value={serviceChargeEntity.value?.whenToApply}
                      options={whenToApplyOptions}
                      placeholder="Select a When To Apply"
                      showClear
                      style={{ minWidth: '12rem' }}
                    />
                  </div>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="service-charge-minCharge">{translate('service-charge.minCharge')}</Label>
                    <InputNumber
                      id="service-charge-minCharge"
                      value={serviceChargeEntity.value?.minCharge || 0}
                      onChange={(e) => dispatch(changeEntityField({ name: 'value.minCharge', value: e.value }))}
                      required
                      maxFractionDigits={2}
                    />
                  </div>
                </div>

                <div className={"d-flex gap-2 w-100"}>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="service-charge-maxCharge">{translate('service-charge.maxCharge')}</Label>
                    <InputNumber
                      id="service-charge-maxCharge"
                      value={serviceChargeEntity.value?.maxCharge || 0}
                      onChange={(e) => dispatch(changeEntityField({ name: 'value.maxCharge', value: e.value }))}
                      required
                      maxFractionDigits={2}
                    />
                  </div>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="service-charge-charge">{translate('service-charge.charge')}</Label>
                    <InputNumber
                      id="service-charge-charge"
                      value={serviceChargeEntity.value?.charge || 0}
                      onChange={(e) => dispatch(changeEntityField({ name: 'value.charge', value: e.value }))}
                      required
                      maxFractionDigits={2}
                    />
                  </div>
                </div>
              </FormGroup>

              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/service-charge" replace color="info">
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
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ServiceChargeUpdate;