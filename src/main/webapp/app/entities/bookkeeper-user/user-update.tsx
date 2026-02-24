import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import Select from 'app/shared/components/select/select';
import {
  getEntity,
  updateEntity,
  reset,
  createEntity,
  changeEntityField
} from './user.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { IUser } from 'app/shared/model/user.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const UserUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const userEntity: IUser = useAppSelector(state => state.BookkeeperUser.entity);
  const loading = useAppSelector(state => state.BookkeeperUser.loading);
  const updating = useAppSelector(state => state.BookkeeperUser.updating);
  const updateSuccess = useAppSelector(state => state.BookkeeperUser.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);

  const handleClose = () => {
    navigate('/bookkeeper-user');
  };

  const updateUserFieldvalue = (fieldName, value) => {
    dispatch(changeEntityField({ name: fieldName, value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    try {
      const payload: IUser = {
        id: isNew ? undefined : userEntity.id,
        firstName: userEntity.firstName,
        lastName: userEntity.lastName,
        email: userEntity.email,
        username: userEntity.username || userEntity.email,
        ...(userEntity.password ? { password: userEntity.password } : {}),
        branches: userEntity.branches || [],
      };

      if (isNew) {
        dispatch(createEntity(payload));
      } else {
        dispatch(updateEntity(payload));
      }
    } catch (error) {
      // TODO: surface error to user if needed
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

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {isNew ? translate("tempApp.createNewUser") : translate("tempApp.editUser")}
        </h2>

        <Card>
          <CardContent className="pt-6">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs">
                  <Translate contentKey="tempApp.username" />
                </Label>
                <Input
                  id="username"
                  name="username"
                  value={userEntity?.username || ''}
                  onChange={e => updateUserFieldvalue('username', e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Defaults to email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs">
                  <Translate contentKey="tempApp.firstName" />
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={userEntity?.firstName || ''}
                  onChange={e => updateUserFieldvalue('firstName', e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs">
                  <Translate contentKey="tempApp.lastName" />
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={userEntity?.lastName || ''}
                  onChange={e => updateUserFieldvalue('lastName', e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs">
                  <Translate contentKey="tempApp.email" />
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={userEntity?.email}
                  onChange={e => updateUserFieldvalue('email', e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs">
                  <Translate contentKey="tempApp.password" />
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={userEntity?.password || ''}
                  onChange={e => updateUserFieldvalue('password', e.target.value)}
                  required={isNew}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">
                  <Translate contentKey={'common.branches'} />
                </Label>
                <Select
                  value={userEntity.branches}
                  isMulti
                  getOptionLabel={option => option.name}
                  getOptionValue={option => option.id}
                  onChange={e => updateUserFieldvalue('branches', e)}
                  options={branchList}
                  className="text-xs"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => navigate('/bookkeeper-user')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <Translate contentKey="common.buttons.back" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleSubmit}
                  disabled={updating}
                >
                  <Save className="h-4 w-4 mr-2" />
                  <Translate contentKey="common.buttons.save" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default UserUpdate;
