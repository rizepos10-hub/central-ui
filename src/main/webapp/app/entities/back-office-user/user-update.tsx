import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {  Translate, translate, } from 'react-jhipster';

import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {
  getEntity,
  updateEntity,
  createEntityAndAssignRole,
  reset,
  assignRole
} from './user.reducer';
import {InputText} from "primereact/inputtext";
import {Checkbox} from "primereact/checkbox";
import {Button} from "primereact/button";
import Authorities from "app/entities/back-office-user/Authority";

export const UserUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const userEntity = useAppSelector(state => state.user.entity);
  const roles = useAppSelector(state => state.user.roles?.['groups']);
  const loading = useAppSelector(state => state.user.loading);
  const updating = useAppSelector(state => state.user.updating);
  const updateSuccess = useAppSelector(state => state.user.updateSuccess);



  const [user, setUser] = useState({
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    email: '',
    permissions: [],
    enabled: false,
  });



  const handleClose = () => {
    navigate(-1);
  };


  const handleInputChange = (event) => {
    const { name, value  } = event.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleEnabledChange = (event) => {
    const { value, checked } = event.target;
    setUser((prevUser) => {
      if (checked) {
        return {
          ...prevUser,
        enabled:  checked,
        };
      } else {
        return {
          ...prevUser,
          enabled: checked,
        };
      }
    });
  };



  const handleSubmit = async (event) => {
    event.preventDefault();
    const authoritiesWithAssignedTrue = roles.reduce((acc, role) => {
      if (role.assigned) {
        acc.groups.push(role.groupName);
      }

      const trueAuthorities = role.authorities.filter(authority => authority.assigned);
      acc.authorities = acc.authorities.concat(trueAuthorities.map(authority => authority.authorityName));

      return acc;
    }, { authorities: [], groups: [] });

    try {
      if (isNew) {
        const newUser = {
          user: {
            id: null,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            emailVerified: true,
            enabled: user.enabled,
            username: user.username,
          },
          credential: {
            type: 'password',
            temporary: false,
            value: user.password,
          },
        };

        dispatch(createEntityAndAssignRole({
          entity: newUser,
          roles: authoritiesWithAssignedTrue
        }));

        dispatch(assignRole({ id: userEntity.id, selectedRoles: authoritiesWithAssignedTrue }));
      } else {
         dispatch(assignRole({id, selectedRoles: authoritiesWithAssignedTrue}))
         dispatch(updateEntity(user));
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

  }, []);

  useEffect(() => {
    // if (updateSuccess) {
    //   handleClose();
    // }

    if(userEntity){
      setUser(userEntity)
    }

  }, [updateSuccess,userEntity]);




  return (
    <div className="" >
        <div className="col-8">
          <h2>
            {isNew ? translate("tempApp.createNewUser") : translate("tempApp.editUser")}
          </h2>
      </div>
      <div className="col-8">

      <div className=" d-flex flex-column p-3  bg-white">
          <form onSubmit={handleSubmit}>
            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="username">
                <Translate contentKey="tempApp.username" />
              </label>
              <InputText
                id="username"
                name="username"
                readOnly={!isNew}
                value={user.username || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="firstName">
                <Translate contentKey="tempApp.firstName" />
              </label>
              <InputText
                id="firstName"
                name="firstName"
                value={user.firstName || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="lastName">
                <Translate contentKey="tempApp.lastName" />
              </label>
              <InputText
                id="lastName"
                name="lastName"
                value={user.lastName || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="email">
                <Translate contentKey="tempApp.email" />
              </label>
              <InputText
                id="email"
                name="email"
                value={user.email}
                onChange={handleInputChange}
                required
              />
            </div>
            {isNew && <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="password">
                <Translate contentKey="tempApp.password" />
              </label>
              <InputText
                id="password"
                name="password"
                type="password"
                value={user.password || ''}
                onChange={handleInputChange}
                required
              />
            </div>}
            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="enabled">
                <Translate contentKey="tempApp.enabled" />
              </label>
              <Checkbox
                inputId={`enabled-${user.enabled}`}
                name="Enabled"
                value={user.enabled}
                onChange={handleEnabledChange}
                checked={user.enabled}
              />
            </div>
            <div className="p-field d-flex flex-column gap-3 mb-3">
              <label className="font-bold">
                <Translate contentKey="tempApp.permissions" />
              </label>
              <Authorities id={userEntity.id} />
            </div>
            <div className="p-field d-flex gap-2 align-items-center mb-3">
              <Button
                id="cancel-save"
                icon="pi pi-arrow-left"
                className="p-button-secondary"
                onClick={() => navigate('/back-office-user')}
              >
                <Translate contentKey="common.buttons.back" />
              </Button>
              <Button
                id="save-entity"
                type="submit"
                disabled={updating}
                icon="pi pi-save"
              >
                <Translate contentKey="common.buttons.save" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserUpdate;
