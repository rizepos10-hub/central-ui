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
import Select from 'react-select';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { IPosAuthorityGroup } from 'app/shared/model/pos-authority-group';
import { IUser } from 'app/shared/model/user.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

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

  const [showPassword, setShowPassword] = useState(false);
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
      dispatch(reset());
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
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {isNew ? <Translate contentKey={'tempApp.createNewUser'} /> : <Translate contentKey={'tempApp.editUser'} />}
        </h2>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs">
                    <Translate contentKey={'tempApp.firstName'} />
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={userEntity.firstName || ''}
                    onChange={e => updateUserFieldvalue('firstName', e.target.value)}
                    required
                    placeholder={translate('tempApp.firstName')}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs">
                    <Translate contentKey={'tempApp.lastName'} />
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={userEntity.lastName || ''}
                    onChange={e => updateUserFieldvalue('lastName', e.target.value)}
                    required
                    placeholder={translate('tempApp.lastName')}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userName" className="text-xs">
                  <Translate contentKey={'tempApp.username'} />
                </Label>
                <Input
                  id="userName"
                  name="userName"
                  value={userEntity.userName || ''}
                  readOnly={!isNew}
                  onChange={e => updateUserFieldvalue('userName', e.target.value)}
                  required
                  placeholder={translate('posUsers.update.placeholders.username')}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs">
                  <Translate contentKey={'tempApp.email'} />
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={userEntity.email}
                  onChange={e => updateUserFieldvalue('email', e.target.value)}
                  required
                  placeholder={translate('tempApp.email')}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pinCode" className="text-xs">
                  <Translate contentKey={'tempApp.pinCode'} />
                  <span className="text-xs text-muted-foreground ml-1">(6 digits)</span>
                </Label>
                <Input
                  id="pinCode"
                  name="pinCode"
                  value={userEntity.pinCode}
                  onChange={e => updateUserFieldvalue('pinCode', e.target.value)}
                  required
                  minLength={1}
                  maxLength={6}
                  placeholder={translate('tempApp.pinCode')}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs">
                  <Translate contentKey={'tempApp.password'} />
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={userEntity.password}
                    onChange={e => updateUserFieldvalue('password', e.target.value)}
                    required={isNew}
                    placeholder={translate('tempApp.password')}
                    className="h-8 text-xs pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
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
                  id="activated"
                  checked={userEntity?.activated}
                  onCheckedChange={(checked) => updateUserFieldvalue('activated', checked)}
                />
                <Label htmlFor="activated" className="text-xs font-normal cursor-pointer">
                  <Translate contentKey={'tempApp.activated'} />
                </Label>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-xs font-bold">
                  <Translate contentKey={'tempApp.permissions'} />
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {posAuthorityGroupList.map((group, idx) => {
                    const isGroupSelected = userEntity.authoritiesGroups?.some(g => g?.id === group?.id);

                    return (
                      <Card key={`group-${idx}`} className="overflow-hidden">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center space-x-2 p-2 bg-muted/20 rounded">
                            <Checkbox
                              id={`group-${idx}`}
                              checked={isGroupSelected}
                              onCheckedChange={(checked) => {
                                let updatedAuthorityGroups = userEntity.authoritiesGroups ? [...userEntity.authoritiesGroups] : [];
                                let updatedAuthorities = userEntity.authorities ? [...userEntity.authorities] : [];

                                if (checked) {
                                  updatedAuthorityGroups.push(group);
                                  updatedAuthorities = Array.from(new Set([...updatedAuthorities, ...group.authorities]));
                                } else {
                                  updatedAuthorityGroups = updatedAuthorityGroups.filter(g => g.id !== group.id);
                                  updatedAuthorities = updatedAuthorities.filter(authority => !group.authorities.includes(authority));
                                }

                                dispatch(changeEntityField({ name: 'authoritiesGroups', value: updatedAuthorityGroups }));
                                dispatch(changeEntityField({ name: 'authorities', value: updatedAuthorities }));
                              }}
                            />
                            <Label htmlFor={`group-${idx}`} className="text-xs font-semibold cursor-pointer">
                              {group.name}
                            </Label>
                          </div>

                          <div className="space-y-2 ml-4">
                            {group.authorities.map((authority, i) => {
                              const isAuthoritySelected = userEntity.authorities?.includes(authority);
                              return (
                                <div key={`authority-${i}`} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`authority-${idx}-${i}`}
                                    checked={isAuthoritySelected}
                                    onCheckedChange={(checked) => {
                                      let updatedAuthorities = userEntity.authorities ? [...userEntity.authorities] : [];
                                      if (checked) {
                                        if (!updatedAuthorities.includes(authority)) {
                                          updatedAuthorities.push(authority);
                                        }
                                      } else {
                                        updatedAuthorities = updatedAuthorities.filter(a => a !== authority);
                                      }
                                      dispatch(changeEntityField({ name: 'authorities', value: updatedAuthorities }));
                                    }}
                                  />
                                  <Label htmlFor={`authority-${idx}-${i}`} className="text-xs cursor-pointer">
                                    {authority}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => navigate('/branch-pos-user')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <Translate contentKey={'common.buttons.back'} />
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={updating}
                >
                  <Save className="h-4 w-4 mr-2" />
                  <Translate contentKey={'common.buttons.save'} />
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
