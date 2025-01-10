import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label } from 'reactstrap';
import { Translate, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './pricing-point.reducer';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import _ from 'lodash';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { ApplicationTypes, AutomaticType, IPricingPoint, PricingPointType } from 'app/shared/model/PRICING-POINT/pricing-point';
import { OrderMethod } from 'app/shared/model/ENUMS/order-method.model';
import Select from 'react-select'
import { IBranch } from 'app/shared/model/branch.model';

export const PricingPointUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const pricingPoint: IPricingPoint = useAppSelector(state => state.pricingPoint.entity);
  const loading = useAppSelector(state => state.pricingPoint.loading);
  const updating = useAppSelector(state => state.pricingPoint.updating);
  const branchList: IBranch[] = useAppSelector(state => state.branch.entities);

  useEffect(() => {
    if (!isNew) {
      dispatch(getEntity(id));
    }
    dispatch(getBranches({
      page: 0,
      size: 500,
      sort: 'asc',
    }));
  }, []);

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();

    const entity: IPricingPoint = {
      ...pricingPoint,
      automaticType: pricingPoint.type === PricingPointType.AUTOMATIC ? pricingPoint.automaticType : null,
      orderTypes: (pricingPoint.type === PricingPointType.AUTOMATIC && pricingPoint.automaticType === AutomaticType.ORDER_TYPE) ? pricingPoint.orderTypes : [],
      applicationTypes: (pricingPoint.type === PricingPointType.AUTOMATIC && pricingPoint.automaticType === AutomaticType.APP) ? pricingPoint.applicationTypes : [],
    }

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/pricing-point/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/pricing-point/new`)
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
      case AutomaticType.CUSTOMER:
        return "Customer";
      case AutomaticType.APP:
        return "App";
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

  const formatPricingPointAppType = (applicationType: ApplicationTypes) => {
    switch (applicationType) {
      case ApplicationTypes.ONLINE_ORDERING:
        return "Online Ordering";
      default:
        return applicationType;
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2 id="pricing-point.home.createOrEditLabel">
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
                      value={pricingPoint.name ?? ''}
                      onChange={e => dispatch(changeEntityField({ name: 'name', value: e.target.value }))}
                    />
                  </div>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="pricing-point-automatic-type">Applicable branches</Label>
                    <Select
                      value={pricingPoint.applicableBranches ?? []}
                      isMulti
                      getOptionLabel={option => option.name}
                      getOptionValue={option => option.id}
                      onChange={selected => dispatch(
                        changeEntityField({
                          name: "applicableBranches",
                          value: selected.map((option) => option)
                        })
                      )}
                      options={branchList}
                    />
                  </div>
                </div>
                <div className={"d-flex gap-2 w-100"}>
                  <div className={"d-flex flex-column mb-3 w-100"}>
                    <Label htmlFor="pricing-point-type">Type</Label>
                    <Dropdown
                      id='pricing-point-type'
                      options={Object.values(PricingPointType).map(type => ({ label: formatPricingPointType(type), value: type }))}
                      value={pricingPoint.type ?? ''}
                      onChange={e => dispatch(changeEntityField({ name: 'type', value: e.target.value }))}
                    />
                  </div>
                  {pricingPoint.type === PricingPointType.AUTOMATIC && (
                    <div className={"d-flex flex-column mb-3 w-100"}>
                      <Label htmlFor="pricing-point-automatic-type">Automatic Type</Label>
                      <Dropdown
                        id='pricing-point-type'
                        options={Object.values(AutomaticType).map(type => ({ label: formatPricingPointAutomaticType(type), value: type }))}
                        value={pricingPoint.automaticType ?? ''}
                        onChange={e => dispatch(changeEntityField({ name: 'automaticType', value: e.target.value }))}
                      />
                    </div>
                  )}
                  {pricingPoint.automaticType === AutomaticType.ORDER_TYPE && pricingPoint.type === PricingPointType.AUTOMATIC && (
                    <div className={"d-flex flex-column mb-3 w-100"}>
                      <Label htmlFor="pricing-point-automatic-type">Order Types</Label>
                      <Select
                        inputId="pricing-point-type"
                        options={Object.values(OrderMethod).map(type => ({
                          label: formatPricingPointOrderType(type),
                          value: type
                        }))}
                        value={(pricingPoint.orderTypes ?? []).map(val => ({
                          label: formatPricingPointOrderType(val),
                          value: val
                        }))}
                        onChange={(selected) => {
                          dispatch(
                            changeEntityField({
                              name: "orderTypes",
                              value: selected.map((option) => option.value)
                            })
                          )
                        }}
                        isMulti
                      />
                    </div>
                  )}
                  {pricingPoint.automaticType === AutomaticType.APP && pricingPoint.type === PricingPointType.AUTOMATIC && (
                    <div className={"d-flex flex-column mb-3 w-100"}>
                      <Label htmlFor="pricing-point-automatic-type">App Types</Label>
                      <Select
                        inputId="pricing-point-type"
                        options={Object.values(ApplicationTypes).map(type => ({
                          label: formatPricingPointAppType(type),
                          value: type
                        }))}
                        value={(pricingPoint.applicationTypes ?? []).map(val => ({
                          label: formatPricingPointAppType(val),
                          value: val
                        }))}
                        onChange={(selected) => {
                          dispatch(
                            changeEntityField({
                              name: "applicationTypes",
                              value: selected.map((option) => option.value)
                            })
                          )
                        }}
                        isMulti
                      />
                    </div>
                  )}
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