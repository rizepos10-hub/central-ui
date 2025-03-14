import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSortState, Translate, translate } from 'react-jhipster';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getEntities as getPosAuthorityGroups } from 'app/entities/pos-authority-groups/pos-authority-group.reducer';
import {
  getEntity,
  updateEntity,
  createEntity,
  reset,
  changeEntityField,
  getPassword,
} from './user.reducer';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import Select from 'react-select';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { IPosAuthorityGroup } from 'app/shared/model/pos-authority-group';
import { IUser } from 'app/shared/model/user.model';
import { Password } from 'primereact/password';

export const UserUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const userEntity: IUser = useAppSelector(state => state.PosBranchUser.entity);
  const loading = useAppSelector(state => state.PosBranchUser.loading);
  const updating = useAppSelector(state => state.PosBranchUser.updating);
  const updateSuccess = useAppSelector(state => state.PosBranchUser.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);
  const posAuthorityGroupList: IPosAuthorityGroup[] = useAppSelector(state => state.posAuthorityGroup.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  useEffect(() => {
    dispatch(
      getBranches({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );

    dispatch(getPosAuthorityGroups({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    if (!isNew) {
      dispatch(getEntity(id));
      dispatch(getPassword(id)).then(res => {
        const response = res.payload as any;
        updateUserFieldvalue('password', response.data);
      });
    } else {
      dispatch(reset())
    }
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      navigate('/branch-pos-user');
    }
  }, [updateSuccess]);

  const handleSubmit = async event => {
    event.preventDefault();

    try {
      if (isNew) {
        await dispatch(createEntity(userEntity));
      } else {
        await dispatch(updateEntity(userEntity));
      }
    } catch (error) {
      console.error('Error occurred while submitting:', error);
    }
  };

  const updateUserFieldvalue = (fieldName, value) => {
    dispatch(changeEntityField({ name: fieldName, value }));
  };

  return (
    <div>
      <div className="col-8">
        <h2>
          {isNew ? <Translate contentKey={'tempApp.createNewUser'} /> : <Translate contentKey={'tempApp.editUser'} />}
        </h2>
      </div>
      <div className="col-8">
        <div className="p-grid d-flex flex-column p-3  bg-white">
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form onSubmit={handleSubmit}>
            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="firstName">
                <Translate contentKey={'tempApp.firstName'} />
              </label>
              <InputText
                id="firstName"
                name="firstName"
                value={userEntity.firstName || ''}
                onChange={e => updateUserFieldvalue('firstName', e.target.value)}
                required
                placeholder={translate('tempApp.firstName')}
              />
            </div>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="lastName">
                <Translate contentKey={'tempApp.lastName'} />
              </label>
              <InputText
                id="lastName"
                name="lastName"
                value={userEntity.lastName || ''}
                onChange={e => updateUserFieldvalue('lastName', e.target.value)}
                required
                placeholder={translate('tempApp.lastName')}
              />
            </div>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="userName">
                <Translate contentKey={'tempApp.username'} />
              </label>
              <InputText
                id="userName"
                name="userName"
                value={userEntity.userName || ''}
                readOnly={!isNew}
                onChange={e => updateUserFieldvalue('userName', e.target.value)}
                required
                placeholder={translate('posUsers.update.placeholders.username')}
              />
            </div>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="email">
                <Translate contentKey={'tempApp.email'} />
              </label>
              <InputText
                id="email"
                name="email"
                value={userEntity.email}
                onChange={e => updateUserFieldvalue('email', e.target.value)}
                required
                placeholder={translate('tempApp.email')}
              />
            </div>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="pinCode">
                <Translate contentKey={'tempApp.pinCode'} />&nbsp;<label className="text-sm"> (6 digits)</label>
              </label>
              <InputText
                id="pinCode"
                name="pinCode"
                value={userEntity.pinCode}
                onChange={e => updateUserFieldvalue('pinCode', e.target.value)}
                required
                minLength={1}
                maxLength={6}
                placeholder={translate('tempApp.pinCode')}
              />
            </div>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="password">
                <Translate contentKey={'tempApp.password'} />
              </label>
              <Password
                id="password"
                name="password"
                className='w-100'
                inputStyle={{
                  width: '100%',
                }}
                value={userEntity.password}
                onChange={(e) => updateUserFieldvalue('password', e.target.value)}
                required={isNew}
                placeholder={translate('tempApp.password')}
                toggleMask
                feedback={false}
              />
            </div>

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
              <label htmlFor="activated">
                <Translate contentKey={'tempApp.activated'} />
              </label>
              <Checkbox
                inputId={`activated-${userEntity.activated}`}
                name="Activated"
                value={userEntity.activated}
                onChange={e => updateUserFieldvalue('activated', e.checked)}
                checked={userEntity?.activated}
              />
            </div>

            <div className="mb-3">
              <div>
                {posAuthorityGroupList.map((group, idx) => {
                  const isGroupSelected = userEntity.authoritiesGroups?.some(g => g?.id === group?.id);

                  return (
                    <div key={`group-${idx}`} className="d-flex flex-column gap-2 mb-3">
                      <div className="fw-bold">
                        <Checkbox
                          inputId={`group-${idx}`}
                          name="group"
                          value={group.id}
                          onChange={e => {
                            let updatedAuthorityGroups = userEntity.authoritiesGroups ? [...userEntity.authoritiesGroups] : [];
                            let updatedAuthorities = userEntity.authorities ? [...userEntity.authorities] : [];

                            if (e.checked) {
                              // Add group to authorityGroups
                              updatedAuthorityGroups.push(group);
                              // Add group's authorities to authorities
                              updatedAuthorities = Array.from(new Set([...updatedAuthorities, ...group.authorities]));
                            } else {
                              // Remove group from authorityGroups
                              updatedAuthorityGroups = updatedAuthorityGroups.filter(g => g.id !== group.id);
                              // Remove group's authorities from authorities
                              updatedAuthorities = updatedAuthorities.filter(authority => !group.authorities.includes(authority));
                            }

                            // Update userEntity in Redux state
                            dispatch(changeEntityField({ name: 'authoritiesGroups', value: updatedAuthorityGroups }));
                            dispatch(changeEntityField({ name: 'authorities', value: updatedAuthorities }));
                          }}
                          checked={isGroupSelected}
                        />
                        <label htmlFor={`group-${idx}`}>{group.name}</label>
                      </div>
                      <div>
                        {group.authorities.map((authority, i) => {
                          const isAuthoritySelected = userEntity.authorities?.includes(authority);
                          return (
                            <div key={`authority-${i}`} className="ms-2">
                              <Checkbox
                                inputId={`authority-${i}`}
                                name="authority"
                                value={authority}
                                onChange={e => {
                                  let updatedAuthorities = userEntity.authorities ? [...userEntity.authorities] : [];
                                  if (e.checked) {
                                    if (!updatedAuthorities.includes(authority)) {
                                      updatedAuthorities.push(authority);
                                    }
                                  } else {
                                    updatedAuthorities = updatedAuthorities.filter(a => a !== authority);
                                  }

                                  // Update userEntity.authorities in Redux state
                                  dispatch(changeEntityField({ name: 'authorities', value: updatedAuthorities }));
                                }}
                                checked={isAuthoritySelected}
                              />
                              <label htmlFor={`authority-${i}`}>{authority}</label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-field d-flex gap-2 align-items-center mb-3">
              <Button
                id="cancel-save"
                icon="pi pi-arrow-left"
                className="p-button-secondary"
                onClick={() => navigate('/branch-pos-user')}
              >
                <Translate contentKey={'common.buttons.back'} />
              </Button>
              <Button id="save-entity" type="submit" disabled={updating} icon="pi pi-save">
                <Translate contentKey={'common.buttons.save'} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserUpdate;
