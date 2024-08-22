import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './profile-group.reducer';
import { getEntities as getTaxProfiles } from 'app/entities/settings/tax-profile/tax-profile.reducer';
import Select from "react-select";
import { InputText } from "primereact/inputtext";
import { Col, FormGroup, Row, Button, Label, Spinner } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getSortState, Translate } from "react-jhipster";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { IProfileGroup } from "app/shared/model/TAX/profile-group.model";

export const ProfileGroupUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const profileGroup: IProfileGroup = useAppSelector(state => state.profileGroup.entity);
  const loading = useAppSelector(state => state.profileGroup.loading);
  const updating = useAppSelector(state => state.profileGroup.updating);
  const taxProfilesList = useAppSelector(state => state.taxProfiles.entities);

  const handleChange = <K extends keyof IProfileGroup>(fieldName: K, value: IProfileGroup[K]) => {
    dispatch(changeEntityField({ fieldName, value }));
  };

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const saveEntity = (e, createNew = false) => {
    const entity = {
      ...profileGroup
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;
          navigate(`/profile-groups/${newId}/edit`)
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/profile-groups/new`)
        }
      })
    }
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getTaxProfiles({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <h2>{isNew ? `Add New Profile Groups` : `Edit Profile Groups ${profileGroup.name}`}</h2>
      <Row>
        <Col md="8" className="d-flex flex-column p-3  bg-white">
          <FormGroup>
            <div className="d-flex flex-column mb-3">
              <Label htmlFor="name">Name</Label>
              <InputText
                id="name"
                value={profileGroup.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="d-flex flex-column mb-3">

              <Label htmlFor="accountingId">Accounting ID</Label>
              <InputText
                id="accountingId"
                value={profileGroup.accountingId || ''}
                onChange={(e) => handleChange('accountingId', e.target.value)}
              />
            </div>
            <div className="d-flex flex-column mb-3">

              <Label htmlFor="profiles">Profiles</Label>
              <Select
                id="profiles"
                options={taxProfilesList}
                value={profileGroup.profiles || []}
                getOptionValue={option => option.id}
                getOptionLabel={option => option.name}
                isMulti={true}
                onChange={(profiles) => handleChange('profiles', profiles as IProfileGroup["profiles"])}
                isClearable={true}
              />
            </div>

          </FormGroup>
        </Col>
        <div className="d-flex justify-content-start align-items-center  mt-7">
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
        </div>
      </Row>
    </div>
  );
};

export default ProfileGroupUpdate;
