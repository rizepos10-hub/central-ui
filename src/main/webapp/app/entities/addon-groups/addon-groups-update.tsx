import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {Button, Row, Col, FormText, Modal} from 'reactstrap';
import {getSortState, isNumber, Translate, translate, ValidatedField, ValidatedForm} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getAddons } from 'app/entities/addon/addon.reducer';
import { getEntity, updateEntity, createEntity, reset } from './addon-groups.reducer';
import Select from "react-select";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {Card as PrimeCard} from 'primereact/card'
import {Button as PrimeButton} from 'primereact/button'
import AddonUpdate from "app/entities/addon/addon-update";
import AddAddonModal, {CreateAddonModal} from "app/entities/addon-groups/add-addon-modal";

export const AddonGroupUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const addons = useAppSelector(state => state.addon.entities);
  const addonGroupsEntity = useAppSelector(state => state.addonGroups.entity);
  const loading = useAppSelector(state => state.addonGroups.loading);
  const updating = useAppSelector(state => state.addonGroups.updating);
  const updateSuccess = useAppSelector(state => state.addonGroups.updateSuccess);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [selectedAddons, setSelectedAddons] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const  handleAddonChange = selectedAddon => {
    setSelectedAddons(selectedAddon);
  };
  const handleClose = () => {
    navigate('/addon-groups' + location.search);
  };

  const handleShowModal = () => {
    setShowModal(prev => !prev)
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getAddons({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

  }, []);

  useEffect(() => {
    if(addonGroupsEntity.addons){
      setSelectedAddons(addonGroupsEntity?.addons?.map(addon => ({ id: addon.id, label: addon.name, value: addon.id })));
    }
    if (updateSuccess) {
      handleClose();
    }
    return () => {
      setSelectedAddons([])
      reset()
    }
  }, [updateSuccess,addonGroupsEntity]);

  const saveEntity = values => {
    console.log(values, 'values')
    console.log(addonGroupsEntity, 'addonGroupsEntity')
    const entity = {
      ...addonGroupsEntity,
      ...values,
      addons: selectedAddons,
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
          ...addonGroupsEntity,
        };


  const addonsOptions = addons?.map(addon => ({ value: addon.id, label: addon.name, id: addon.id }));


  return (
    <div>
      <Row>
        <Col md="8">
          <h2 id="tempApp.addon.home.createOrEditLabel" data-cy="AddonCreateUpdateHeading">
            {isNew? <Translate contentKey={'addonGroups.update.create.title'}>Create New Addon Group</Translate> : <Translate contentKey={'addonGroups.update.edit.title'}>Edit Addon Group</Translate>}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="8"  className="d-flex flex-column p-3">
          <PrimeCard>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <div className={'d-flex justify-content-end'}>
              <PrimeButton onClick={handleShowModal}>Create Addon</PrimeButton>
              </div>

                <CreateAddonModal  isOpen={showModal} toggle={handleShowModal}/>

            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              {!isNew ? (
                <ValidatedField
                  name="id"
                  required
                  readOnly
                  id="addon-groups-id"
                  label={translate('addonGroups.update.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedField
                label={translate('addonGroups.update.name')}
                id="addon-groups-name"
                name="name"
                data-cy="name"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />

              <div className="mb-3">
                <Translate contentKey="addonGroups.update.addons">Addons</Translate>
                <Select isMulti={true} value={selectedAddons} onChange={handleAddonChange} options={addonsOptions} />

              </div>

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
            </ValidatedForm>
            </>
          )}
          </PrimeCard>
        </Col>
      </Row>
    </div>
  );
};

export default AddonGroupUpdate;
