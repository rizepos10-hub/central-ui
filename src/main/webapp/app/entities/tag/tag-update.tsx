import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label } from 'reactstrap';
import { getSortState, Translate,} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getTags } from 'app/entities/tag/tag.reducer';
import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './tag.reducer';
import Select from 'react-select';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { Card as PrimeCard } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { ITag } from "app/shared/model/TAG/tag.model";

export const TagUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;


  const tagEntity :ITag = useAppSelector(state => state.tag.entity);
  const loading = useAppSelector(state => state.tag.loading);
  const updating = useAppSelector(state => state.tag.updating);
  const updateSuccess = useAppSelector(state => state.tag.updateSuccess);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const handleClose = () => {
    navigate(`/tag` + location.search);
  };



  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(
      getTags({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    dispatch(changeEntityField({name, value}))
  };

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    return () => {
      reset();
    };
  }, [updateSuccess]);

  const saveEntity = (e?) => {
    e?.preventDefault();
    const entity = {
      ...tagEntity,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2 id="tempApp.tag.home.createOrEditLabel" data-cy="TagCreateUpdateHeading">
            {isNew ? (
              <Translate contentKey={'tag.update.create.title'}>Create New tag</Translate>
            ) : (
              <Translate contentKey={'tag.update.edit.title'}>Edit tag Group</Translate>
            )}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3">
          <PrimeCard>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                <form onSubmit={saveEntity}>
                  <FormGroup className={"d-flex flex-column gap-3"}>
                    <div className={'d-flex flex-column'}>
                      <Label for="tag-group-name">
                        <Translate contentKey={'tag.update.name'}>tag Name</Translate>
                      </Label>
                      <InputText
                        type="text"
                        name="name"
                        required={true}
                        id="tag-group-name"
                        value={tagEntity?.name}
                        onChange={handleChange}
                      />
                    </div>

                  </FormGroup>

                  <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/tag" replace color="info">
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
              </>
            )}
          </PrimeCard>
        </Col>
      </Row>
    </div>
  );
};

export default TagUpdate;
