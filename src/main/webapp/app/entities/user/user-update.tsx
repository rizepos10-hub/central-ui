import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IUser } from 'app/shared/model/user.model';
import { getEntity, updateEntity, createEntity, reset } from './user.reducer';
import {InputText} from "primereact/inputtext";
import {Checkbox} from "primereact/checkbox";
import {Button} from "primereact/button";

export const UserUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  // const userEntity = useAppSelector(state => state.user.entity);
  // const loading = useAppSelector(state => state.user.loading);
  // const updating = useAppSelector(state => state.user.updating);
  // const updateSuccess = useAppSelector(state => state.user.updateSuccess);


  const updateSuccess = false
  const newUser:IUser = {
    id: 3,
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
    phone: '555-123-4567',
    isActive: true,
    permissions: [],

  };
  const [user, setUser] = useState(newUser);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const handleClose = () => {
    navigate('/user' + location.search);
  };


  const handleInputChange = (event) => {
    const { name, value  } = event.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };
  const permissions = [
    '[BO-Write] User has write access to the Back Office',
    '[BO-REPORT] User has write access to the Back Office reports',
    '[BO-CONFIG] User can edit the configuration',
    '[BO-USERS] User has manage users and their access rights ',
    '[BO-PMG] User can access the receipt quick-view page',
    ' User can manage taxes',

  ];

  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;
    setUser((prevUser: IUser) => {
      if (checked) {
        return {
          ...prevUser,
          permissions: [...prevUser.permissions, value],
        };
      } else {
        return {
          ...prevUser,
          permissions: prevUser.permissions.filter((permission) => permission !== value),
        };
      }
    });
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission logic here
  };

  // useEffect(() => {
  //   if (isNew) {
  //     dispatch(reset());
  //   } else {
  //     dispatch(getEntity(id));
  //   }
  // }, []);
  //
  // useEffect(() => {
  //   if (updateSuccess) {
  //     handleClose();
  //   }
  // }, [updateSuccess]);



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
  //   console.log('Saving user:', values);
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
              <label htmlFor="firstName">
                <Translate contentKey="tempApp.user.firstName">First Name</Translate>
              </label>
              <InputText
                id="firstName"
                name="firstName"
                value={user.firstName}
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
                value={user.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="phone">
                <Translate contentKey="tempApp.user.phone">Phone</Translate>
              </label>
              <InputText
                id="phone"
                name="phone"
                value={user.phone}
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
            <div className="p-field d-flex flex-column gap-3 mb-3">
              <label className="font-bold">
                Permissions
              </label>
              <ul className="p-field d-flex flex-column gap-1 mb-0">
                {permissions.map(permission => (
                  <li key={permission} className="d-flex align-items-center gap-1">
                    <Checkbox
                      inputId={`permission-${permission}`}
                      name={permission}
                      value={permission}
                      onChange={handleCheckboxChange}
                      checked={user.permissions.includes(permission)}
                    />
                   <strong>{permission}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-field d-flex gap-2 align-items-center mb-3">
              <Button
                id="cancel-save"
                icon="pi pi-arrow-left"
                className="p-button-secondary"
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
