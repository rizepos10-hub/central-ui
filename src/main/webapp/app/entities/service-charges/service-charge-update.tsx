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
import Select from 'react-select'
import _ from 'lodash';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";

export const ServiceChargeUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const serviceChargeEntity = useAppSelector(state => state.serviceCharge.entity);
  const loading = useAppSelector(state => state.serviceCharge.loading);
  const updating = useAppSelector(state => state.serviceCharge.updating);
  const updateSuccess = useAppSelector(state => state.serviceCharge.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);

  useEffect(() => {
    if (!isNew) {
      dispatch(getEntity(id));
    }
    dispatch(getBranches({}));
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
    navigate(-1);
  };

  const saveEntity = (e) => {
    e.preventDefault();
    const entity = {
      branchId: serviceChargeEntity.branch?.id,
      ...serviceChargeEntity,
      value: {
        ...serviceChargeEntity.value,
        key: serviceChargeEntity.key,
        // minCharge : serviceChargeEntity.value?.setting?.type === ServiceChargeSettingType.PERCENTAGE ? serviceChargeEntity.value?.minCharge : null,
        // maxCharge : serviceChargeEntity.value?.setting?.type === ServiceChargeSettingType.PERCENTAGE ? serviceChargeEntity.value?.maxCharge : null,
        minCharge: null,
        maxCharge: null,
      }
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const serviceChargeKeys = Object.keys(ServiceChargeKey).map(key => ({ label: key, value: ServiceChargeKey[key] }));
  const whenToApplyOptions = Object.keys(ServiceChargeWhenToApply).map(key => ({ label: key, value: ServiceChargeWhenToApply[key] }));
  const typeOptions = Object.keys(ServiceChargeSettingType).map(key => ({ label: key, value: ServiceChargeSettingType[key] }));
  const applicableOnOptions = Object.keys(ServiceChargeApplicableOn).map(key => ({ label: key, value: ServiceChargeApplicableOn[key] }));


  const handleApplicableOnChange = (selectedOptions) => {
    const newValue = selectedOptions.map(option => option.value);
    const updatedEntity = _.cloneDeep(serviceChargeEntity?.value || {});
    _.set(updatedEntity, 'setting.applicableOn', newValue);

    dispatch(changeEntityField({ name: 'value', value: updatedEntity }));
  }

  const handleTypeChange = (selectedOption) => {
    const newValue = selectedOption.value;
    const updatedEntity = _.cloneDeep(serviceChargeEntity?.value || {});
    _.set(updatedEntity, 'setting.type', newValue);
    dispatch(changeEntityField({ name: 'value', value: updatedEntity }));
  }

  const handleBranchChange = (selectedOption) => {
    const newValue = selectedOption.value;
    const updatedEntity = _.cloneDeep(serviceChargeEntity?.branch || {});
    _.set(updatedEntity, 'id', newValue);
    dispatch(changeEntityField({ name: 'branch', value: updatedEntity }));
  }

  const handleValueChange = (field, value) => {
    const updatedEntity = _.cloneDeep(serviceChargeEntity?.value || {});
    _.set(updatedEntity, field, value);
    dispatch(changeEntityField({ name: 'value', value: updatedEntity }));
  }


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
                      onChange={e => dispatch(changeEntityField({ name: 'key', value: e.value }))}
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
                      onChange={e => handleValueChange('name', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={"d-flex gap-2 w-100"}>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="service-charge-type">{translate('service-charge.settings.type')}</Label>
                    <Dropdown
                      value={serviceChargeEntity.value?.setting?.type}
                      onChange={e => handleTypeChange(e)}
                      options={typeOptions}
                      placeholder="Select a Setting"
                      showClear
                      style={{ minWidth: '12rem' }}
                    />
                  </div>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="service-charge-applicableOn">{translate('service-charge.applicableOn')}</Label>
                    <Select
                      options={applicableOnOptions}
                      value={applicableOnOptions.filter(option => serviceChargeEntity.value?.setting?.applicableOn?.includes(option.value))}
                      onChange={handleApplicableOnChange}
                      isMulti
                    />
                  </div>
                </div>

                <div className={"d-flex gap-2 w-100"}>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="service-charge-whenToApply">{translate('service-charge.whenToApply')}</Label>
                    <Dropdown
                      value={serviceChargeEntity.value?.whenToApply}
                      options={whenToApplyOptions}
                      onChange={e => handleValueChange('whenToApply', e.value)}
                      placeholder="Select a When To Apply"
                      showClear
                      style={{ minWidth: '12rem' }}
                    />
                  </div>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="service-charge-branch">{translate('service-charge.branch')}</Label>
                    <Dropdown
                      value={serviceChargeEntity.branch?.id}
                      onChange={e => handleBranchChange(e)}
                      options={branchList.map(branch => ({ label: branch.name, value: branch.id }))}
                      placeholder="Select a Branch"
                      showClear
                      style={{ minWidth: '12rem' }}
                    />
                  </div>
                </div>

                <div className={"d-flex gap-2 w-100"}>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="service-charge-charge">{translate('service-charge.charge')}</Label>
                    <InputNumber
                      id="service-charge-charge"
                      value={serviceChargeEntity.value?.charge || 0}
                      onChange={(e) => handleValueChange('charge', e.value)}
                      required
                      maxFractionDigits={2}
                    />
                  </div>
                  {/* {serviceChargeEntity.value?.setting?.type === ServiceChargeSettingType.PERCENTAGE && (
                    <>
                      <div className={"d-flex flex-column mb-3 w-100"}>
                        <Label htmlFor="service-charge-minCharge">{translate('service-charge.minCharge')}</Label>
                        <InputNumber
                          id="service-charge-minCharge"
                          value={serviceChargeEntity.value?.minCharge || 0}
                          onChange={(e) => handleValueChange('minCharge', e.value)}
                          required
                          maxFractionDigits={2}
                        />
                      </div>
                      <div className={"d-flex flex-column mb-3 w-100"}>
                        <Label htmlFor="service-charge-maxCharge">{translate('service-charge.maxCharge')}</Label>
                        <InputNumber
                          id="service-charge-maxCharge"
                          value={serviceChargeEntity.value?.maxCharge || 0}
                          onChange={(e) => handleValueChange('maxCharge', e.value)}
                          required
                          maxFractionDigits={2}
                        />
                      </div>
                    </>
                  )} */}
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