import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Authorities from 'app/entities/back-office-user/Authority';
import { IBranch } from 'app/shared/model/branch.model';
import { IBackOfficeUser } from 'app/shared/model/back-offic-user.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

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

  const handleSubmit = (event) => {
    event.preventDefault();
    const authoritiesWithAssignedTrue = userEntity?.userRole?.groups.reduce((acc, role) => {
      if (role.assigned) {
        // @ts-expect-error -- ignore
        acc.groups.push(role.groupName);
      }

      const trueAuthorities = role.authorities.filter(authority => authority.assigned);
      // @ts-expect-error -- ignore
      acc.authorities = acc.authorities.concat(trueAuthorities.map(authority => authority.authorityName));

      return acc;
      // @ts-expect-error -- ignore
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
          branches: userEntity.branches,
          roles: authoritiesWithAssignedTrue
        };

        dispatch(createEntityAndAssignRole({
          entity: newUser,
          roles: authoritiesWithAssignedTrue
        }));
      } else {
        const { userRole, ...rest } = userEntity;

        const updatedUser: IBackOfficeUser = {
          ...rest,
          branches: userEntity.branches.map(branch => branch),
          // @ts-expect-error -- ignore
          roles: authoritiesWithAssignedTrue,
        };

        dispatch(updateEntity(updatedUser));
      }
    } catch (error) {
      console.error(error);
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
                  readOnly={!isNew}
                  value={userEntity?.user?.username || ''}
                  onChange={e => updateUserFieldvalue('user.username', e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs">
                  <Translate contentKey="tempApp.firstName" />
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={userEntity?.user?.firstName || ''}
                  onChange={e => updateUserFieldvalue('user.firstName', e.target.value)}
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
                  value={userEntity?.user?.lastName || ''}
                  onChange={e => updateUserFieldvalue('user.lastName', e.target.value)}
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
                  value={userEntity?.user?.email}
                  onChange={e => updateUserFieldvalue('user.email', e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              {isNew && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs">
                    <Translate contentKey="tempApp.password" />
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={userEntity?.user?.password || ''}
                    onChange={e => updateUserFieldvalue('user.password', e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>
              )}

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
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '32px',
                      fontSize: '0.75rem',
                    }),
                    menu: (base) => ({
                      ...base,
                      fontSize: '0.75rem',
                    })
                  }}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enabled"
                  checked={userEntity?.user?.enabled}
                  onCheckedChange={(checked) => updateUserFieldvalue('user.enabled', checked)}
                />
                <Label htmlFor="enabled" className="text-xs font-normal cursor-pointer">
                  <Translate contentKey="tempApp.enabled" />
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">
                  <Translate contentKey="tempApp.permissions" />
                </Label>
                <Authorities userEntity={userEntity} />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => navigate('/back-office-user')}
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
