import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IMenu } from 'app/shared/model/menu.model';
import { getEntities as getMenus } from 'app/entities/menu/menu.reducer';
import { IBranch } from 'app/shared/model/branch.model';
import { getEntity, updateEntity, createEntity, reset } from './branch.reducer';

export const BranchUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const menus = useAppSelector(state => state.menu.entities);
  const branchEntity = useAppSelector(state => state.branch.entity);
  const loading = useAppSelector(state => state.branch.loading);
  const updating = useAppSelector(state => state.branch.updating);
  const updateSuccess = useAppSelector(state => state.branch.updateSuccess);

  const handleClose = () => {
    navigate('/branch' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getMenus({}));
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  const saveEntity = values => {
    console.log('clicked')
    const entity = {
      ...branchEntity,
      ...values,
      // menu: menus.find(it => it.id.toString() === values.menu.toString()),
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
          ...branchEntity,
          menu: branchEntity?.menu?.id,
        };

  return (
    <div >
      <Row >
        <Col md="8">
          <h2 id="tempApp.branch.home.createOrEditLabel" data-cy="BranchCreateUpdateHeading">
            {isNew ? `Create New Branch` : `Edit ${branchEntity.name}`}
          </h2>
        </Col>
      </Row>
      <Row >
        <Col md="8" className="bg-white p-3">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              {/* {!isNew ? ( */}
              {/*   <ValidatedField */}
              {/*     name="id" */}
              {/*     required */}
              {/*     readOnly */}
              {/*     id="branch-id" */}
              {/*     label={translate('global.field.id')} */}
              {/*     validate={{ required: true }} */}
              {/*   /> */}
              {/* ) : null} */}
              <ValidatedField
                label={translate('tempApp.branch.name')}
                id="branch-name"
                name="name"
                data-cy="name"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                  maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                }}
              />
              {/* <ValidatedField label={translate('tempApp.branch.appId')} id="branch-appId" name="appId" data-cy="appId" type="text" /> */}
              <ValidatedField
                label={translate('tempApp.branch.numberOfEmployees')}
                id="branch-numberOfEmployees"
                name="numberOfEmployees"
                data-cy="numberOfEmployees"
                type="text"
              />
              {/* <ValidatedField id="branch-menu" name="menu" data-cy="menu" label={translate('tempApp.branch.menu')} type="select"> */}
              {/*   <option value="" key="0" /> */}
              {/*   {menus */}
              {/*     ? menus.map(otherEntity => ( */}
              {/*         <option value={otherEntity.id} key={otherEntity.id}> */}
              {/*           {otherEntity.name} */}
              {/*         </option> */}
              {/*       )) */}
              {/*     : null} */}
              {/* </ValidatedField> */}
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/branch" replace color="info">
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

export default BranchUpdate;
