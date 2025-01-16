import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate, } from 'react-jhipster';
import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import Select, { MultiValue } from 'react-select';
import {
  getEntity,
  updateEntity,
  createEntityAndAssignRole,
  reset,
  assignRole,
  changeEntityField
} from './user.reducer';
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import Authorities from "app/entities/back-office-user/Authority";
import { IBranch } from 'app/shared/model/branch.model';
import { IBackOfficeUser } from 'app/shared/model/back-offic-user.model';

export const UserUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const userEntity: IBackOfficeUser = useAppSelector(state => state.user.entity);
  const roles = useAppSelector(state => state.user.roles?.['groups']);
  const loading = useAppSelector(state => state.user.loading);
  const updating = useAppSelector(state => state.user.updating);
  const updateSuccess = useAppSelector(state => state.user.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);

  const handleClose = () => {
    navigate('/back-office-user');
  };


  const updateUserFieldvalue = (fieldName, value) => {
    if (fieldName.includes('.')) {
      const [parentField, childField] = fieldName.split('.');
      dispatch(changeEntityField({
        name: parentField, value: {
          ...userEntity[parentField],
          [childField]: value
        }
      }));
    } else {
      dispatch(changeEntityField({ name: fieldName, value }));
    }
  };

  // const handleEnabledChange = (event) => {
  //   const { value, checked } = event.target;
  //   setUser((prevUser) => {
  //     if (checked) {
  //       return {
  //         ...prevUser,
  //         enabled: checked,
  //       };
  //     } else {
  //       return {
  //         ...prevUser,
  //         enabled: checked,
  //       };
  //     }
  //   });
  // };

  const handleSubmit = (event) => {
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
            firstName: userEntity?.user?.firstName,
            lastName: userEntity?.user?.lastName,
            email: userEntity?.user?.email,
            emailVerified: true,
            enabled: userEntity?.user?.enabled,
            username: userEntity?.user?.username,
          },
          credential: {
            type: 'password',
            temporary: false,
            value: userEntity?.user?.password,
          },
          branches: userEntity.branches
        };

        dispatch(createEntityAndAssignRole({
          entity: newUser,
          roles: authoritiesWithAssignedTrue
        }));

        dispatch(assignRole({ id: userEntity?.user?.id, selectedRoles: authoritiesWithAssignedTrue }));
        handleClose()
      } else {
        const updatedUser: IBackOfficeUser = {
          ...userEntity,
          branches: userEntity.branches.map(branch => branch)
        }

        dispatch(assignRole({ id, selectedRoles: authoritiesWithAssignedTrue }))
        dispatch(updateEntity(updatedUser));
        // handleClose()
      }

    } catch (error) {
      console.error('Error occurred while submitting:', error);
    }
  };


  useEffect(() => {
    dispatch(
      getBranches({
        page: 0,
        size: 1000,
        sort: `id,asc`,
      })
    );

    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

  }, [updateSuccess]);


  console.log(userEntity, 'userEntity')

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
                value={userEntity?.user?.username || ''}
                onChange={e => updateUserFieldvalue('user.username', e.target.value)}
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
                value={userEntity?.user?.firstName || ''}
                onChange={e => updateUserFieldvalue('user.firstName', e.target.value)}
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
                value={userEntity?.user?.lastName || ''}
                onChange={e => updateUserFieldvalue('user.lastName', e.target.value)}
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
                value={userEntity?.user?.email}
                onChange={e => updateUserFieldvalue('user.email', e.target.value)}
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
                value={userEntity?.user?.password || ''}
                onChange={e => updateUserFieldvalue('user.password', e.target.value)}
                required
              />
            </div>}

            <div className="mb-3">
              <Translate contentKey={'common.branches'} />
              <Select
                value={userEntity.branches}
                isMulti
                getOptionLabel={option => option.name}
                getOptionValue={option => option.id}
                onChange={e => updateUserFieldvalue('branches', e)}
                options={branchList}
              />
            </div>
            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="enabled">
                <Translate contentKey="tempApp.enabled" />
              </label>
              <Checkbox
                inputId={`enabled-${userEntity?.user?.enabled}`}
                name="Enabled"
                value={userEntity?.user?.enabled}
                onChange={e => updateUserFieldvalue('user.enabled', e.target.checked)}
                checked={userEntity?.user?.enabled}
              />
            </div>
            <div className="p-field d-flex flex-column gap-3 mb-3">
              <label className="font-bold">
                <Translate contentKey="tempApp.permissions" />
              </label>
              <Authorities id={userEntity?.user?.id} />
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
