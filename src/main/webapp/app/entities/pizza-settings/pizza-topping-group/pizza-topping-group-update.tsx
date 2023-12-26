import React, { useState, useEffect } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import {getSortState, isNumber, Translate, translate, ValidatedField, ValidatedForm} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {mapIdList, overridePaginationStateWithQueryParams} from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset }   from "app/entities/pizza-settings/pizza-topping-group/pizza-topping-group.reducer";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";

export const ToppingGroupUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();



  const { id } = useParams<'id'>();
  console.log(id, 'identity1')

  const isNew = id === undefined;

  const termEntity = useAppSelector(state => state.toppingGroup.entity);
  const loading = useAppSelector(state => state.toppingGroup.loading);
  const updating = useAppSelector(state => state.toppingGroup.updating);
  const updateSuccess = useAppSelector(state => state.toppingGroup.updateSuccess);


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );






  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }



    return () => {
      dispatch(reset());
    };

  }, []);


  useEffect(() => {



    const {id: newTermId} = termEntity
    if (updateSuccess && newTermId) {
      navigate(`/pizza-topping-group/${newTermId}/edit`)
    }



  }, [updateSuccess, termEntity ]);



  const saveEntity = values => {
    const entity = {
      ...termEntity,
      ...values,
    };
    console.log("saved entity" ,entity)
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };


  const defaultValues = () =>
    isNew
      ? {
      }
      : {
        ...termEntity,
      };
  console.log(termEntity?.parents, 'ddd')
  return (
    <div>
      <Row>
        <Col md="8">
          <h2  data-cy="TermCreateUpdateHeading">
            {isNew ? "Create a Menu Category" : "Edit Menu Category"}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="8"  className="d-flex flex-column p-3  bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>

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
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/pizza-topping-group" replace color="info">
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

export default ToppingGroupUpdate;

