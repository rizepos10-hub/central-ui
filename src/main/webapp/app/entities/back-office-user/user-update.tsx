import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IUser } from 'app/shared/model/user.model';
import {
  getEntity,
  updateEntity,
  createEntity,
  reset,
  getAvailableRoles,
  getAssignedRoles,
  getAllRoles, assignRole
} from './user.reducer';
import {InputText} from "primereact/inputtext";
import {Checkbox} from "primereact/checkbox";
import {Button} from "primereact/button";

export const UserUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const userEntity = useAppSelector(state => state.user.entity);
  const loading = useAppSelector(state => state.user.loading);
  const updating = useAppSelector(state => state.user.updating);
  const updateSuccess = useAppSelector(state => state.user.updateSuccess);
  const availableRoles = useAppSelector(state => state.user.availableRoles);
  const assignedRoles = useAppSelector(state => state.user.assignedRoles);
  const allRoles = useAppSelector(state => state.user.allRoles);


  console.log(userEntity, 'userEntity')
  console.log(availableRoles, 'availableRoles')
  console.log(assignedRoles, 'assignedRoles')
  console.log(allRoles, 'allRoles')
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [user, setUser] = useState({
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    email: '',
    permissions: [],
    enabled: false,
  });

  const permissions = [
    '[BO-Write] User has write access to the Back Office',
    '[BO-REPORT] User has write access to the Back Office reports',
    '[BO-CONFIG] User can edit the configuration',
    '[BO-USERS] User has manage users and their access rights ',
    '[BO-PMG] User can access the receipt quick-view page',
    ' User can manage taxes',
  ];

  const handleClose = () => {
    navigate('/back-office-user' + location.search);
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

  const handleCheckboxChange = (event, role) => {
    const { checked } = event.target;

    if (checked) {
      setSelectedRoles((prevSelectedRoles) => [...prevSelectedRoles, role]);
    } else {
      setSelectedRoles((prevSelectedRoles) =>
        prevSelectedRoles.filter((selectedRole) => selectedRole.id !== role.id)
      );
    }
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

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


        const createdUserResponse :any = await dispatch(createEntity(newUser));

        const createdUserId  = createdUserResponse.payload.data.id;

        await dispatch(assignRole({ id: createdUserId, selectedRoles }));
      } else {
        console.log("put")
     console.log(selectedRoles, 'selectedRoles')
        await dispatch(assignRole({id, selectedRoles}))
        await dispatch(updateEntity(user));
      }

      if (isNew) {
        console.log('User created successfully');
      } else {
        console.log('User updated successfully');
      }

      // handleClose();
    } catch (error) {
      console.error('Error occurred while submitting:', error);
    }
  };


  useEffect(() => {
    if (isNew) {
      dispatch(reset());
      setSelectedRoles([])
    } else {
      dispatch(getEntity(id));
      dispatch(getAvailableRoles(id))
      dispatch(getAssignedRoles(id))
    }
    dispatch(getAllRoles())

    console.log(selectedRoles, 'selectedRole2')

  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if(userEntity){
      setUser(userEntity)
    }

    if (assignedRoles && assignedRoles.length > 0) {
      const initialSelectedRoles = assignedRoles.map(role => ({id: role.id, name: role.name, description: role.description}));
      setSelectedRoles(initialSelectedRoles);
    }
    return () => {
      setSelectedRoles([])
    }
  }, [updateSuccess,userEntity,assignedRoles]);



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
            <Translate contentKey="tempApp.user.home.createOrEditLabel">Create or edit a User</Translate>
          </h2>
        </div>
      </div>
      <div className="p-grid">
        <div className="p-col-12">
          <form onSubmit={handleSubmit}>
            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="username">
                <Translate contentKey="tempApp.user.username">Username</Translate>
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
                <Translate contentKey="tempApp.user.firstName">First Name</Translate>
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
                <Translate contentKey="tempApp.user.lastName">Last Name</Translate>
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
                <Translate contentKey="tempApp.user.email">Email</Translate>
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
                <Translate contentKey="tempApp.user.password">Password</Translate>
              </label>
              <InputText
                id="password"
                name="password"
                value={user.password || ''}
                onChange={handleInputChange}
                required
              />
            </div>}
            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="enabled">
                <Translate contentKey="tempApp.user.enabled">Enabled</Translate>
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
                Permissions
              </label>
              <ul className="p-field d-flex flex-column gap-1 mb-0">
                {allRoles?.map(role => (
                  <li key={role.id} className="d-flex align-items-center gap-1">
                    <Checkbox
                      inputId={`permission-${role.id}`}
                      name={role.name}
                      value={role.id}
                      onChange={(event) => handleCheckboxChange(event, role)}
                      checked={selectedRoles.some(selectedRole => selectedRole.id === role.id)}
                    />
                    <p><strong>{role.name} - {role.description}</strong></p>
                  </li>
                ))}
              </ul>

            </div>
            <div className="p-field d-flex gap-2 align-items-center mb-3">
              <Button
                id="cancel-save"
                icon="pi pi-arrow-left"
                className="p-button-secondary"
                onClick={() => navigate('/back-office-user')}
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
