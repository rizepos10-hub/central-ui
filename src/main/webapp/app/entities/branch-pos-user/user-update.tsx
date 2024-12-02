import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSortState, Translate, translate } from 'react-jhipster';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { getEntities as getPosAuthorityGroups } from "app/entities/pos-authority-groups/pos-authority-group.reducer";
import {
  getEntity,
  updateEntity,
  createEntity,
  reset,
} from './user.reducer';
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import Select from "react-select";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { IPosAuthorityGroup } from 'app/shared/model/pos-authority-group';

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
  const posAuthorityGroupList: IPosAuthorityGroup[] = useAppSelector(state => state.posAuthorityGroup.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [selectedBranches, setSelectedBranches]: any = useState([]);
  const [selectedAuthorities, setSelectedAuthorities]: any = useState([])
  const [selectedAuthoritiesGroups, setSelectedAuthoritiesGroups] = useState<IPosAuthorityGroup[]>([]);

  const getBranchName = (branchId) => {
    const branch = branchList.find(branch => branch.id === branchId);
    return branch ? branch.name : 'Unknown Branch';
  };

  const initialBranches = isNew
    ? null
    : userEntity?.branchId
      ? { label: getBranchName(userEntity?.branchId), value: userEntity?.branchId }
      : null;

  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    id: null,
    branches: [],
    authoritiesGroups: [],
    email: '',
    permissions: [],
    verified: false,
    authorities: [],
    pinCode: '',
    password: ''
  });

  const handleClose = () => {
    navigate(-1);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleBranchChange = (selectedBranches) => {
    setUser((prev) => ({
      ...prev,
      branches: selectedBranches.map((branch) => ({ id: branch.value, value: branch.value })),
    }));
    setSelectedBranches(selectedBranches);
  };

  const handleAuthoritiesChange = (authorities) => {
    setUser((prev) => ({
      ...prev,
      authorities: [authorities?.value],
    }));
    setSelectedAuthorities(authorities);
  };

  const handlePasswordChange = (event) => {
    const newPass = event.target.value

    setUser((prev) => ({
      ...prev,
      password: newPass
    }))
  }

  const handleActivatedChange = (event) => {
    const { value, checked } = event.target;
    setUser((prevUser) => {
      if (checked) {
        return {
          ...prevUser,
          activated: checked,
        };
      } else {
        return {
          ...prevUser,
          activated: checked,
        };
      }
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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
    console.log(selectedAuthoritiesGroups, 'selectedAuthoritiesGroups');
    setUser((prevUser) => ({
      ...prevUser,
      authoritiesGroups: [...selectedAuthoritiesGroups],
    }));
  }, [selectedAuthoritiesGroups]);
  console.log(user, 'user')

  // useEffect(() => {
  //   setUser({
  //     ...user,
  //     authorities: selectedAuthorities
  //   })
  // }, [selectedAuthorities])

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))

    dispatch(getPosAuthorityGroups({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))

    return () => {
      setUser({
        firstName: '',
        lastName: '',
        userName: '',
        id: '',
        branches: [],
        email: '',
        permissions: [],
        verified: false,
        authorities: [],
        authoritiesGroups: [],
        pinCode: '',
        password: ''
      });
      reset()
    }
  }, [userEntity?.branchId]);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if (!isNew) {
      setUser(userEntity)
    } else {
      setUser({
        firstName: '',
        lastName: '',
        userName: '',
        id: null,
        branches: [],
        email: '',
        permissions: [],
        authoritiesGroups: [],
        verified: false,
        authorities: [],
        pinCode: '',
        password: ''

      });
      setSelectedBranches([])
      setSelectedAuthorities([])
    }

    if (userEntity?.branches) {
      setSelectedBranches(userEntity.branches?.map((branch) => ({ label: getBranchName(userEntity.branchId), value: userEntity.branchId })))
    }

    if (userEntity?.branches) {
      setSelectedBranches(userEntity.branches?.map((branch) => ({ label: getBranchName(branch.id), value: branch.id, id: branch.id })))
    }

    if (userEntity?.authorities) {
      setSelectedAuthorities(userEntity.authorities);
    }

    if (userEntity?.authoritiesGroups) {
      console.log(userEntity.authoritiesGroups, 'authoritiesGroups')
      setSelectedAuthoritiesGroups(userEntity.authoritiesGroups);
    }

    return () => {
      reset()
    }
  }, [updateSuccess]);

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
                value={user.firstName || ''}
                onChange={handleInputChange}
                required
                placeholder={translate("tempApp.firstName")}
              />
            </div>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="lastName">
                <Translate contentKey={'tempApp.lastName'} />
              </label>
              <InputText
                id="lastName"
                name="lastName"
                value={user.lastName || ''}
                onChange={handleInputChange}
                required
                placeholder={translate("tempApp.lastName")}
              />
            </div>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="userName">
                <Translate contentKey={'tempApp.username'} />
              </label>
              <InputText
                id="userName"
                name="userName"
                value={user.userName || ''}
                readOnly={!isNew}
                onChange={handleInputChange}
                required
                placeholder={translate("posUsers.update.placeholders.username")}
              />
            </div>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="email">
                <Translate contentKey={'tempApp.email'} />
              </label>
              <InputText
                id="email"
                name="email"
                value={user.email}
                onChange={handleInputChange}
                required
                placeholder={translate("tempApp.email")}
              />
            </div>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="pinCode">
                <Translate contentKey={'tempApp.pinCode'} />&nbsp;<label className="text-sm"> (6 digits)</label>
              </label>
              <InputText
                id="pinCode"
                name="pinCode"
                value={user.pinCode}
                onChange={handleInputChange}
                required
                minLength={1}
                maxLength={6}
                placeholder={translate("tempApp.pinCode")}
              />
            </div>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="password">
                <Translate contentKey={'tempApp.password'} />
              </label>
              <InputText
                id="password"
                name="password"
                type="password"
                value={user.password}
                onChange={handlePasswordChange}
                required={isNew ? true : false}
                placeholder={translate("tempApp.password")}
              />
            </div>

            <div className="mb-3">
              <Translate contentKey={'common.branches'} />
              <Select defaultValue={initialBranches}
                value={selectedBranches}
                isMulti
                onChange={handleBranchChange}
                options={branchList.map(branch => ({ value: branch.id, label: branch.name }))} />
            </div>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="activated">
                <Translate contentKey={'tempApp.activated'} />
              </label>
              <Checkbox
                inputId={`activated-${user.verified}`}
                name="Activated"
                value={user.verified}
                onChange={handleActivatedChange}
                checked={user.verified}
              />
            </div>

            <div className="mb-3">
              <div>
                {posAuthorityGroupList.map((group, idx) => {
                  return (
                    <div key={`group-${idx}`} className="d-flex flex-column gap-2 mb-3">
                      <div className='fw-bold'>
                        <Checkbox
                          inputId={`group-${idx}`}
                          name="group"
                          value={group.id}
                          onChange={(e) => {
                            const updatedAuthorityGroups = [...selectedAuthoritiesGroups];
                            let updatedAuthorities = [];

                            if (e.checked) {
                              updatedAuthorityGroups.push(group);
                              updatedAuthorities = [...selectedAuthorities, ...group.authorities];
                            } else {
                              updatedAuthorityGroups.splice(updatedAuthorityGroups.indexOf(group), 1);
                              updatedAuthorities = selectedAuthorities.filter(authority => !group.authorities.includes(authority));
                            }
                            setSelectedAuthorities(updatedAuthorities);
                            setSelectedAuthoritiesGroups(updatedAuthorityGroups);
                          }}
                          checked={selectedAuthoritiesGroups.some(g => g.id === group.id)}
                        />
                        <label htmlFor={`group-${idx}`}>{group.name}</label>
                      </div>
                      <div>
                        {group.authorities.map((authority, i) => {
                          return (
                            <div key={`authority-${i}`} className="ms-2">
                              <Checkbox
                                inputId={`authority-${i}`}
                                name="authority"
                                value={authority}
                                onChange={(e) => {
                                  const updatedAuthorities = [...selectedAuthorities];
                                  if (e.checked) {
                                    updatedAuthorities.push(authority);
                                  } else {
                                    updatedAuthorities.splice(updatedAuthorities.indexOf(authority), 1);
                                  }
                                  setSelectedAuthorities(updatedAuthorities);
                                  setUser({
                                    ...user,
                                    authorities: updatedAuthorities
                                  })
                                }}
                                checked={selectedAuthorities?.includes(authority)}
                              />
                              <label htmlFor={`authority-${i}`}>{authority}</label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
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
              <Button
                id="save-entity"
                type="submit"
                disabled={updating}
                icon="pi pi-save"
              >
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
