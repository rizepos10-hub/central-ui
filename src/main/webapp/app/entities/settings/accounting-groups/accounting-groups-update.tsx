import React, { useState, useEffect } from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, reset } from './accounting-groups.reducer';
import { getEntities as getTaxProfiles } from '../tax-profiles/tax-profile.reducer';
import Select from "react-select";
import { InputText } from "primereact/inputtext";
import {Col, FormGroup, Row,Button} from 'reactstrap';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Translate} from "react-jhipster"; // Import FormGroup from reactstrap

export const AccountingGroupsUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;



  const accountingGroupsEntity = useAppSelector(state => state.accountingGroups.entity);

  const [name, setName] = useState('');
  const [accountingId, setAccountingId] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);

  const taxProfilesList = useAppSelector(state => state.taxProfiles.entities).map((profile) => ({label: profile.name, value: profile.id}))

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleAccountingIdChange = (e) => {
    setAccountingId(e.target.value);
  };

  const handleProfileChange = (selectedOption) => {
    setSelectedProfile(selectedOption);
  };

 console.log(accountingGroupsEntity, 'lol')
  console.log(selectedProfile, 'l2ol')

  const handleSubmit = () => {
    const formData = {
      id: id ? id : null,
      name: name,
      accountingId: accountingId !== '' ? accountingId : null,
      profiles: selectedProfile.map((profile) => ({ id: profile.value })),
    };

    if (isNew) {
      dispatch(createEntity(formData));
    } else {
      dispatch(updateEntity(formData));
    }
  };


  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getTaxProfiles({}));
  }, []);

  useEffect(() => {
    if (accountingGroupsEntity) {
      setName(accountingGroupsEntity.name);
      setAccountingId(accountingGroupsEntity.accountingId);
      setSelectedProfile(
        accountingGroupsEntity.profiles?.map((profile) => ({ label: profile.name, value: profile.id})))}

  }, [accountingGroupsEntity]);

  return (
    <div className="bg-light">
      <h2>Edit Accounting Groups {accountingGroupsEntity.name}</h2>
      <Row>
        <Col md="6">
      <FormGroup>
          <div className="d-flex flex-column mb-3">
            <label htmlFor="name">Name</label>
            <InputText id="name" value={name} onChange={handleNameChange} />
          </div>
          <div className="d-flex flex-column mb-3">


          <label htmlFor="accountingId">Accounting ID</label>
            <InputText id="accountingId" value={accountingId} onChange={handleAccountingIdChange} />
          </div>
          <div className="d-flex flex-column mb-3">


          <label htmlFor="profiles">Profiles</label>
            <Select
              id="profiles"
              options={taxProfilesList}
              value={selectedProfile}
              isMulti={true}
              onChange={handleProfileChange}
              isClearable={true}
            />
          </div>

      </FormGroup>
        </Col>
        <div className="d-flex justify-content-start align-items-center  mt-7">
          <Button color="primary" onClick={handleSubmit}>
            Save
          </Button>
          &nbsp;

          <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/accounting-groups" replace color="info">
            <FontAwesomeIcon icon="arrow-left" />
            &nbsp;
            <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
          </Button>

        </div>
      </Row>
    </div>
  );
};

export default AccountingGroupsUpdate;
