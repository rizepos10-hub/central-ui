import React, { useState, useEffect } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import {getSortState, isNumber, Translate, translate, ValidatedField, ValidatedForm} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {mapIdList, overridePaginationStateWithQueryParams} from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities as getTaxonomies } from 'app/entities/taxonomy/taxonomy.reducer';
import { getEntity, updateEntity, createEntity, reset }   from "app/entities/term/term.reducer";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {getToppingGroups} from "app/entities/pizza-settings/pizza-topping/pizza-topping.reducer";

export const ToppingGroupUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();



  const { id } = useParams<'id'>();
  console.log(id, 'identity1')

  const isNew = id === undefined;

  const taxonomies = useAppSelector(state => state.taxonomy.entities);
  const terms = useAppSelector(state => state.term.entities);
  const termEntity = useAppSelector(state => state.term.entity);
  const loading = useAppSelector(state => state.term.loading);
  const updating = useAppSelector(state => state.term.updating);
  const updateSuccess = useAppSelector(state => state.term.updateSuccess);
  const newTerm = useAppSelector(state => state.term.entity)


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );




  console.log(terms, 'termss')


  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getTaxonomies({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));


    return () => {
      dispatch(reset());
    };

  }, []);


  useEffect(() => {



    const {id: newTermId} = newTerm
    if (updateSuccess && newTermId) {
      navigate(`/pizza-topping/${newTermId}/edit-group`)
    }



  }, [updateSuccess, termEntity ]);



  const saveEntity = values => {
    const entity = {
      ...termEntity,
      ...values,
      taxonomy: taxonomies.find(it => it.id.toString() === values.taxonomy.toString()),
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
        taxonomy: taxonomies.find(otherEntity => otherEntity?.name === 'Topping Groups')?.id,
      }
      : {
        ...termEntity,
        taxonomy: termEntity?.taxonomy?.id,
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
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/pizza-topping/groups" replace color="info">
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

