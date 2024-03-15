import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label } from 'reactstrap';
import { getSortState, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getAddons } from 'app/entities/addon/addon.reducer';
import { getEntity, updateEntity, createEntity, reset } from './addon-groups.reducer';
import Select from 'react-select';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { Card as PrimeCard } from 'primereact/card';
import { Button as PrimeButton } from 'primereact/button';
import { CreateAddonModal } from 'app/entities/addon-groups/add-addon-modal';
import { InputText } from 'primereact/inputtext';
import { IAddonGroup } from 'app/shared/model/ADDON/addon-groups.model';

export const AddonGroupUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const addons = useAppSelector(state => state.addon.entities);
  const newAddon = useAppSelector(state => state.addon.entity);

  const addonGroupsEntity = useAppSelector(state => state.addonGroups.entity);
  const loading = useAppSelector(state => state.addonGroups.loading);
  const updating = useAppSelector(state => state.addonGroups.updating);
  const updateSuccess = useAppSelector(state => state.addonGroups.updateSuccess);
  const addonUpdateSuccess = useAppSelector(state => state.addon.updateSuccess);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [addonGroup, setAddonGroup] = useState<IAddonGroup>();
  const [showModal, setShowModal] = useState(false);

  const handleAddonChange = selectedAddons => {
    setAddonGroup(prev => ({
      ...prev,
      addons: selectedAddons,
    }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setAddonGroup(prevState => ({ ...prevState, [name]: value }));
  };

  const handleClose = () => {
    navigate(`/addon-groups/${addonGroupsEntity?.id}/edit` + location.search);
  };

  const handleShowModal = () => {
    setShowModal(prev => !prev);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

  useEffect(() => {
    dispatch(
      getAddons({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );

    if (addonUpdateSuccess && newAddon?.id) {
      const entity = {
        ...addonGroup,
        addons: [...(addonGroupsEntity?.addons || []), newAddon],
      };
      dispatch(updateEntity(entity));
    }
  }, [addonUpdateSuccess]);

  useEffect(() => {
    if (addonGroupsEntity.id) {
      setAddonGroup(addonGroupsEntity);
    }
    if (updateSuccess) {
      handleClose();
    }
    return () => {
      reset();
    };
  }, [updateSuccess, addonGroupsEntity.id]);

  const saveEntity = (e?) => {
    e?.preventDefault();
    const entity = {
      ...addonGroup,
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
          <h2 id="tempApp.addon.home.createOrEditLabel" data-cy="AddonCreateUpdateHeading">
            {isNew ? (
              <Translate contentKey={'addonGroups.update.create.title'}>Create New Addon Group</Translate>
            ) : (
              <Translate contentKey={'addonGroups.update.edit.title'}>Edit Addon Group</Translate>
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
                <div className={'d-flex justify-content-end'}>
                  <PrimeButton onClick={handleShowModal}>Create And Add Addon</PrimeButton>
                </div>

                <CreateAddonModal isOpen={showModal} toggle={handleShowModal} />

                <form onSubmit={saveEntity}>
                  <FormGroup className={"d-flex flex-column gap-3"}>
                    <div className={'d-flex flex-column'}>
                      <Label for="addon-group-name">
                        <Translate contentKey={'addons.update.name'}>Addon Name</Translate>
                      </Label>
                      <InputText
                        type="text"
                        name="name"
                        required={true}
                        id="addon-group-name"
                        value={addonGroup?.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="mb-3">
                      <Translate contentKey="addonGroups.update.addons">Addons</Translate>
                      <Select
                        isMulti={true}
                        value={addonGroup?.addons}
                        onChange={handleAddonChange}
                        options={addons}
                        getOptionLabel={option => option.name}
                        getOptionValue={option => option.id}
                      />
                    </div>
                  </FormGroup>

                    <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/addon-groups" replace color="info">
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

export default AddonGroupUpdate;
