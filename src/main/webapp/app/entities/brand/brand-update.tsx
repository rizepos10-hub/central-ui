import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label } from 'reactstrap';
import { getSortState, Translate,} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getTags } from 'app/entities/brand/brand.reducer';
import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './brand.reducer';
import Select from 'react-select';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { Card as PrimeCard } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { IBrand } from "app/shared/model/brand.model";
import MediaLibrary from "app/shared/components/media-library/media-library";
import { transformAttachmentStructure } from "app/shared/util/attachment-utils";

export const BrandUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;


  const brandEntity :IBrand = useAppSelector(state => state.brand.entity);
  const loading = useAppSelector(state => state.brand.loading);
  const updating = useAppSelector(state => state.brand.updating);
  const updateSuccess = useAppSelector(state => state.brand.updateSuccess);

  const handleClose = () => {
    navigate(`/brand` + location.search);
  };



  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
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

  const saveEntity = (e) => {
    e.preventDefault();
    const entity = {
      ...brandEntity,
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
          <h2> {isNew ? (
            <Translate contentKey={'tempApp.brand.createTitle'}>Create New Brand</Translate>
          ) : (
            <Translate contentKey={'tempApp.brand.editTitle'}>Edit Brand</Translate>
          )}</h2>
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
                  <div className={"d-flex flex-column"}>
                    <Label for="name">
                      <Translate contentKey={'tempApp.brand.name'}/>
                    </Label>

                    <InputText type="text" name="name" required={true} id="name" value={brandEntity?.name}
                               onChange={handleChange} />
                  </div>

                  <div className="my-3">
                      <MediaLibrary
                        handleFilesSelectCallback={(files) => dispatch(changeEntityField({name: 'logo',value: transformAttachmentStructure(files, 'toIAttachment')[0]}))}
                        defaultValues={transformAttachmentStructure(brandEntity.logo ? [brandEntity.logo] : [], 'toFileLibraryListItem')}
                      />
                    </div>

                  <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/brand" replace color="info">
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

export default BrandUpdate;
