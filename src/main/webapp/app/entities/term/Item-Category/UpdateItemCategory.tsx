import React, { useState, useEffect } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { ITaxonomy } from 'app/shared/model/taxonomy.model';
import { getEntities as getTaxonomies } from 'app/entities/taxonomy/taxonomy.reducer';
import { getEntities as getTerms } from 'app/entities/term/term.reducer';
import { IItem } from 'app/shared/model/item.model';
import { getEntities as getItems } from 'app/entities/item/item.reducer';
import { ITerm } from 'app/shared/model/term.model';
import { getEntity, updateEntity, createEntity, reset } from '../term.reducer';

export const UpdateItemCategory = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const location = useLocation();


  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const taxonomies = useAppSelector(state => state.taxonomy.entities);
  const terms = useAppSelector(state => state.term.entities);
  const items = useAppSelector(state => state.item.entities);
  const termEntity = useAppSelector(state => state.term.entity);
  const loading = useAppSelector(state => state.term.loading);
  const updating = useAppSelector(state => state.term.updating);
  const updateSuccess = useAppSelector(state => state.term.updateSuccess);


  console.log(termEntity, 'termEntity')
  const handleClose = () => {
    navigate('/term' + location.search);
  };



  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getTaxonomies({}));
    dispatch(getTerms({}));
    dispatch(getItems({}));
  }, []);



  const saveEntity = values => {
    const entity = {
      ...termEntity,
      ...values,
      taxonomy: taxonomies.find(it => it.id.toString() === values.taxonomy.toString()),
      parents: [terms.find(it => it.id.toString() === values.term.toString())],
      // item: items.find(it => it.id.toString() === values.item.toString()),
    };

    console.log(entity, 'entity saved')
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
        ...termEntity,
        taxonomy: termEntity?.taxonomy?.id,
        parents: termEntity?.parents && termEntity.parents.length > 0 ? termEntity.parents[0].id : '',
        // item: termEntity?.item?.id,
      };
  console.log(terms, 'terms')
  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h2 id="tempApp.term.home.createOrEditLabel" data-cy="TermCreateUpdateHeading">
            Create or edit an Item Category
          </h2>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md="8">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              {!isNew ? (
                <ValidatedField
                  name="id"
                  required
                  readOnly
                  id="term-id"
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedField
                label={translate('tempApp.term.name')}
                id="term-name"
                name="name"
                data-cy="name"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField
                id="term-taxonomy"
                name="taxonomy"
                data-cy="taxonomy"
                label={'Category'}
                type="select"
                readOnly={true}
                required
              >
                { taxonomies &&
                  taxonomies
                    .filter((otherEntity) => otherEntity.name === "Item Category")
                    .map((filteredEntity) => (
                      <option value={filteredEntity.id} key={filteredEntity.id}>
                        {filteredEntity.name}
                      </option>
                    )
                )}
              </ValidatedField>

              <ValidatedField
                id="term-term"
                name="term"
                data-cy="term"
                label={translate('tempApp.term.parents')}
                type="select"
              >
                <option value={''}></option>
                {terms
                   && terms
                      .filter((term) => term.taxonomy && term.taxonomy.name === "Item Category")
                      .map((otherEntity) => (
                        <option value={otherEntity.id} key={otherEntity.id}>
                          {otherEntity.name}
                        </option>
                              )
                      )}
              </ValidatedField>


              {/* <ValidatedField id="term-item" name="item" data-cy="item" label={translate('tempApp.term.item')} type="select"> */}
              {/*   <option value="" key="0" /> */}
              {/*   {items */}
              {/*     ? items.map(otherEntity => ( */}
              {/*         <option value={otherEntity.id} key={otherEntity.id}> */}
              {/*           {otherEntity.name} */}
              {/*         </option> */}
              {/*       )) */}
              {/*     : null} */}
              {/* </ValidatedField> */}
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/term/items" replace color="info">
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

export default UpdateItemCategory;
