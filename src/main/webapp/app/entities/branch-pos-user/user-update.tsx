import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {getEntities as getBranches} from "app/entities/branch/branch.reducer";


import { IUser } from 'app/shared/model/user.model';
import {
  getEntity,
  updateEntity,
  createEntity,
  reset,
  assignRole
} from './user.reducer';
import {InputText} from "primereact/inputtext";
import {Checkbox} from "primereact/checkbox";
import {Button} from "primereact/button";
import Select from "react-select";
import {Alert} from "reactstrap";

export const UserUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const userEntity = useAppSelector(state => state.PosBranchUser.entity);
  const loading = useAppSelector(state => state.PosBranchUser.loading);
  const updating = useAppSelector(state => state.PosBranchUser.updating);
  const updateSuccess = useAppSelector(state => state.PosBranchUser.updateSuccess);

  const branchList = useAppSelector(state => state.branch.entities)

  const [selectedBranch, setSelectedBranch] :any = useState();

  const [selectedAuthorities, setSelectedAuthorities] :any = useState()

  const [password, setPassword] = useState('')

  console.log(branchList, 'branchList')
  const getBranchName = (branchId) => {
    console.log(branchId, 'branchID1')
    console.log(branchList, 'branchId12')
     const branch = branchList.find(branch => branch.id === branchId);
    console.log(branch, 'branch')

    return branch ? branch.name : 'Unknown Branch';
  };


  const initialBranches = isNew
    ? null
    : userEntity?.branchId
      ? { label: getBranchName(userEntity?.branchId), value: userEntity?.branchId }
      : null;

  const initialAuthorities = isNew
    ? null
    : userEntity?.authorities
      ? { label:  userEntity?.authorities, value: userEntity?.authorities }
      : null;
  console.log(userEntity,'userEntity')

  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    id: null,
    branchId: '',
    email: '',
    permissions: [],
    activated: false,
    authorities: [],
    pinCode: '',

  });


  const authoritiesOptions = [
    {value: "ADMIN" , label: 'ADMIN'},
    {value: "USER" , label: 'USER'},
  ]


  const handleClose = () => {
    navigate('/branch-pos-user' + location.search);
  };


  const handleInputChange = (event) => {
    const { name, value  } = event.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleBranchChange = (selectedBranches) => {
    console.log(selectedBranches, 'seee1')
    setUser((prev) => ({
      ...prev,
        branchId : selectedBranches.value
    }))
    setSelectedBranch(selectedBranches)
  }

  const handleAuthoritiesChange = (authorities) => {
    setUser((prev) => ({
      ...prev,
      authorities: [authorities?.value],
    }));
    setSelectedAuthorities(authorities);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value)

    console.log(password, 'passwod')
    setUser((prev) => ({
      ...prev,
      password
    }))
  }

  const handleActivatedChange = (event) => {
    const { value, checked } = event.target;
    setUser((prevUser) => {
      if (checked) {
        return {
          ...prevUser,
        activated:  checked,
        };
      } else {
        return {
          ...prevUser,
          activated: checked,
        };
      }
    });
  };


  const isPinCodeValid = (pinCode) => {
    return /^\d{4}$/.test(pinCode);
  };


  const handleSubmit = async (event) => {
    event.preventDefault();


    if (!isPinCodeValid(user.pinCode)) {
      console.error('Invalid pinCode. Please enter 4 digits.');
      return;
    }

    try {
      if (isNew) {
        await dispatch(createEntity(user));
      } else {
        await dispatch(updateEntity(user));
      }

    } catch (error) {
      console.error('Error occurred while submitting:', error);
    }
  };


  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getBranches({}))

    console.log(user)
    return () => {
      setUser({
        firstName: '',
        lastName: '',
        id: '',
        branchId: '',
        email: '',
        permissions: [],
        activated: false,
        authorities: [],
        pinCode: '',


      });
      reset()
    }

  }, [userEntity?.branchId]);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if(!isNew){
      setUser(userEntity)
    }else{
      setUser({
        firstName: '',
        lastName: '',
        id: null,
        branchId: '',
        email: '',
        permissions: [],
        activated: false,
        authorities: [],
        pinCode: '',
      });
      setSelectedBranch({})
      setPassword('')
      setSelectedAuthorities('')
    }

    if (userEntity?.branchId) {
      setSelectedBranch({ label: getBranchName(userEntity.branchId), value: userEntity.branchId });
    }

    if (userEntity?.authorities) {
      setSelectedAuthorities({ label: userEntity.authorities, value: userEntity.authorities });
    }
    return () => {

      reset()
    }


  }, [updateSuccess, userEntity?.branchId, userEntity?.authorities]);



  // const saveEntity = values => {
  //   // const entity = {
  //   //   ...userEntity,
  //   //   ...values,
  //   // };
  //   //
  //   // if (isNew) {
  //   //   dispatch(createEntity(entity));
  //   // } else {
  //   //   dispatch(updateEntity(entity));
  //   // }
  //   console.log('Saving back-office-user:', values);
  //   handleClose();
  //
  // };


  return (
    <div className="container" >
      <div className="p-grid">
        <div className="p-col-12">
          <h2>
            {isNew ? "Create New User" : `Edit User`}
          </h2>
        </div>
      </div>
      <div className="p-grid">
        <div className="p-col-12">
          <form onSubmit={handleSubmit}>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="firstName">
                <Translate contentKey="tempApp.user.firstName">First Name</Translate>
              </label>
              <InputText
                id="firstName"
                name="firstName"
                value={user.firstName || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter first name"
              />
            </div>
            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="lastName">
                <Translate contentKey="tempApp.user.lastName">Last Name</Translate>
              </label>
              <InputText
                id="lastName"
                name="lastName"
                value={user.lastName || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter last name"
              />
            </div>


            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="email">
                <Translate contentKey="tempApp.user.email">Email</Translate>
              </label>
              <InputText
                id="email"
                name="email"
                value={user.email}
                onChange={handleInputChange}
                required
                placeholder="Enter email"
              />
            </div>

            <div className="p-field d-flex flex-column mb-3">
              <Alert color="warning">Pin code must be at least 4 digits</Alert>
              <label htmlFor="pinCode">
                <Translate contentKey="tempApp.user.pinCode">pinCode</Translate>
              </label>
              <InputText
                id="pinCode"
                name="pinCode"
                value={user.pinCode}
                onChange={handleInputChange}
                required
                minLength={4}
                placeholder="Enter pin code"


              />
            </div>
            {isNew && <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="password">
                <Translate contentKey="tempApp.user.password">Password</Translate>
              </label>
              <InputText
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                required
                placeholder="Enter password"

              />
            </div>}

            <div className="mb-3">
              Authorities
              <Select  defaultValue={initialAuthorities}
                       value={selectedAuthorities}
                       onChange={handleAuthoritiesChange}
                       options={authoritiesOptions} />
            </div>

            <div className="mb-3">
              Branches
              <Select  defaultValue={initialBranches}
                       value={selectedBranch}
                       onChange={handleBranchChange}
                       options={branchList.map(branch => ({ value: branch.id, label: branch.name }))} />
            </div>
            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="activated">
                <Translate contentKey="tempApp.user.activated">Activated</Translate>
              </label>
              <Checkbox
                inputId={`activated-${user.activated}`}
                name="Activated"
                value={user.activated}
                onChange={handleActivatedChange}

                checked={user.activated}
              />
            </div>

            <div className="p-field d-flex gap-2 align-items-center mb-3">
              <Button
                id="cancel-save"
                icon="pi pi-arrow-left"
                className="p-button-secondary"
                onClick={() => navigate('/branch-pos-user')}
              >
                Back
              </Button>
              <Button
                id="save-entity"
                type="submit"
                disabled={updating}
                icon="pi pi-save"
              >
                Save
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserUpdate;
