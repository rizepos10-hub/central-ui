import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label } from 'reactstrap';
import { Translate, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './pricing-point.reducer';
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from 'primereact/dropdown';
import { ServiceChargeApplicableOn, ServiceChargeKey, ServiceChargeSettingType, ServiceChargeWhenToApply } from 'app/shared/model/service-charge.model';
import { InputText } from 'primereact/inputtext';
import Select from 'react-select'
import _ from 'lodash';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { AutomaticType, PricingPointType } from 'app/shared/model/PRICING-POINT/pricing-point';
import { OrderMethod } from 'app/shared/model/ENUMS/order-method.model';
import { MultiSelect } from 'primereact/multiselect';

export const PricingPointUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const serviceChargeEntity = useAppSelector(state => state.serviceCharge.entity);
  const loading = useAppSelector(state => state.serviceCharge.loading);
  const updating = useAppSelector(state => state.serviceCharge.updating);

  useEffect(() => {
    if (!isNew) {
      dispatch(getEntity(id));
    }
    dispatch(getBranches({}));
  }, []);

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity = {
      branchId: serviceChargeEntity.branch?.id,
      ...serviceChargeEntity,
      value: {
        ...serviceChargeEntity.value,
        key: serviceChargeEntity.key,
        minCharge: null,
        maxCharge: null,
      }
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
            navigate(`/service-charge/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/service-charge/new`)
        }
      })
    }
  };

  const formatPricingPointType = (type: PricingPointType) => {
    switch (type) {
      case PricingPointType.AUTOMATIC:
        return "Automatic";
      case PricingPointType.USER_SELECTED:
        return "User Selected";
      default:
        return type;
    }
  };

  const formatPricingPointAutomaticType = (automaticType: AutomaticType) => {
    switch (automaticType) {
      case AutomaticType.ORDER_TYPE:
        return "Order Type";
      default:
        return automaticType;
    }
  };

  const formatPricingPointOrderType = (orderType: OrderMethod) => {
    switch (orderType) {
      case OrderMethod.DineIn:
        return "Dine In";
      case OrderMethod.PickUp:
        return "Pickup";
      case OrderMethod.WalkIn:
        return "Walk In";
      case OrderMethod.Delivery:
        return "Delivery";
      default:
        return orderType;
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2 id="service-charge.home.createOrEditLabel" data-cy="ServiceChargeCreateUpdateHeading">
            {isNew ? "Create New Pricing Point" : "Edit Pricing Point"}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="12" className="d-flex flex-column p-3 bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form>
              <FormGroup>
                <div className={"d-flex gap-2 w-100"}>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="pricing-point-name">Name</Label>
                    <InputText
                      id="pricing-point-name"
                      required
                    />
                  </div>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="pricing-point-type">Type</Label>
                    <Dropdown
                      id='pricing-point-type'
                      options={Object.values(PricingPointType).map(type => ({ label: formatPricingPointType(type), value: type }))}
                    />
                  </div>
                </div>
                <div className={"d-flex gap-2 w-100"}>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="pricing-point-automatic-type">Automatic Type</Label>
                    <Dropdown
                      id='pricing-point-type'
                      options={Object.values(AutomaticType).map(type => ({ label: formatPricingPointAutomaticType(type), value: type }))}
                    />
                  </div>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="pricing-point-automatic-type">Order Types</Label>
                    <MultiSelect
                      id='pricing-point-type'
                      options={Object.values(OrderMethod).map(type => ({ label: formatPricingPointOrderType(type), value: type }))}
                      multiple
                    />
                  </div>
                </div>
              </FormGroup>
              <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => navigate(-1)} color="info">
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
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default PricingPointUpdate;