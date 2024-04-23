import React, { useState, useEffect } from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, changeEntityField,reset } from './accounting-group.reducer';
import { getEntities as getTaxProfiles } from 'app/entities/settings/tax-profile/tax-profile.reducer';
import Select from "react-select";
import { InputText } from "primereact/inputtext";
import { Col, FormGroup, Row, Button, Label, Spinner } from "reactstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {getSortState, Translate} from "react-jhipster";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import { IAccountingGroup} from "app/shared/model/TAX/accounting-group.model";

export const AccountingGroupUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const accountingGroup :IAccountingGroup = useAppSelector(state => state.accountingGroup.entity);
  const loading = useAppSelector(state => state.accountingGroup.loading);
  const updating = useAppSelector(state => state.accountingGroup.updating);
  const updateSuccess = useAppSelector(state => state.accountingGroup.updateSuccess);
  const taxProfilesList = useAppSelector(state => state.taxProfiles.entities);

  const handleChange = <K extends keyof IAccountingGroup>(fieldName: K, value: IAccountingGroup[K]) => {
    dispatch(changeEntityField({ fieldName, value }));
  };


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const handleClose = () => {
    navigate('/accounting-groups')
  }


  const handleSubmit = () => {
    const entity = {
         ...accountingGroup
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };


  useEffect(() => {
    if(updateSuccess){
      handleClose();
    }
    return () => {
      dispatch(reset());
    }
  }, [updateSuccess])

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


  if(loading) return <Spinner />;


  return (
    <div>
      <h2>{isNew ? `Add New Accounting Groups` : `Edit Accounting Groups ${accountingGroup.name}` }</h2>
      <Row>
        <Col md="8"  className="d-flex flex-column p-3  bg-white">
      <FormGroup>
          <div className="d-flex flex-column mb-3">
            <Label htmlFor="name">Name</Label>
            <InputText
              id="name"
              value={accountingGroup.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          <div className="d-flex flex-column mb-3">

          <Label htmlFor="accountingId">Accounting ID</Label>
            <InputText
              id="accountingId"
              value={accountingGroup.accountingId}
              onChange={(e) => handleChange('accountingId', e.target.value)}
            />
          </div>
          <div className="d-flex flex-column mb-3">

          <Label htmlFor="profiles">Profiles</Label>
            <Select
              id="profiles"
              options={taxProfilesList}
              value={accountingGroup.profiles}
              getOptionValue={option => option.id}
              getOptionLabel={option => option.name}
              isMulti={true}
              onChange={(profiles)  => handleChange('profiles', profiles as IAccountingGroup["profiles"])}
              isClearable={true}
            />
          </div>

      </FormGroup>
        </Col>
        <div className="d-flex justify-content-start align-items-center  mt-7">
          <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/accounting-groups" replace color="info">
            <FontAwesomeIcon icon="arrow-left" />
            &nbsp;
            <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
          </Button>
          &nbsp;

          <Button color="primary" disabled={updating} onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </Row>
    </div>
  );
};

export default AccountingGroupUpdate;
