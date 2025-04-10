import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label } from 'reactstrap';
import { Translate, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IDiscount } from 'app/shared/model/discount.model';
import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './discount.reducer';
import Select from "react-select";
import { InputNumber } from "primereact/inputnumber";
import { DiscountType } from "app/shared/model/ENUMS/discount-type.model";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";

export const DiscountUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const discountEntity = useAppSelector(state => state.discount.entity);
  const loading = useAppSelector(state => state.discount.loading);
  const updating = useAppSelector(state => state.discount.updating);
  const discountTypeValuesOptions = Object.keys(DiscountType).map(opt => ({ label: opt, value: opt }));

  useEffect(() => {
    if (!isNew) {
      dispatch(getEntity(id));
    } else {
      dispatch(reset());
    }
  }, []);

  const handleClose = () => {
    navigate(-1);
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    if (isNew) {
      dispatch(createEntity(discountEntity)).then((res) => {
         if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;
          navigate(`/discount/${newId}/edit`)
        }
      })
    } else {
      dispatch(updateEntity(discountEntity)).then(() => {
        if (createNew) {
          navigate(`/discount/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2 id="tempApp.discount.home.createOrEditLabel" data-cy="DiscountCreateUpdateHeading">
            {isNew ? `${translate("tempApp.createNewDiscount")}` : `${translate("tempApp.editDiscount")}`}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3  bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form>
              <FormGroup>
                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="discount-value">{translate('tempApp.value')}</Label>
                  <InputNumber
                    id="discount-value"
                    value={discountEntity.value || null}
                    onChange={e => dispatch(changeEntityField({ name: 'value', value: e.value }))}
                    required
                  />
                </div>

                <div className="d-flex flex-column">
                  <Label htmlFor="discount-type">{translate('tempApp.type')}</Label>
                  <Select
                    id="discount-type"
                    name={"type"}
                    required
                    options={discountTypeValuesOptions}
                    value={discountEntity?.type ? { label: discountEntity?.type, value: discountEntity?.type } : null}
                    onChange={(selectedType: { label: string, value: string }) => dispatch(changeEntityField({ name: 'type', value: selectedType?.value }))}
                  />
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

export default DiscountUpdate;
