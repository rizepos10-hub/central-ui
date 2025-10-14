import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IUser } from 'app/shared/model/user.model';
import { getEntities } from './user.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Plus, Edit, Check, X } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const User = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const userList = useAppSelector(state => state.user.entities);
  const loading = useAppSelector(state => state.user.loading);
  const totalItems = useAppSelector(state => state.user.totalItems);

  const [nameFilter, setNameFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');

  const modifiedUserList = userList.map(user => ({
    ...user,
    name: `${user.firstName} ${user.lastName !== null ? user.lastName : ''}`
  }));

  const filteredUsers = modifiedUserList.filter(user => {
    const matchesName = !nameFilter || user.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesUsername = !usernameFilter || user.username?.toLowerCase().includes(usernameFilter.toLowerCase());
    const matchesEmail = !emailFilter || user.email?.toLowerCase().startsWith(emailFilter.toLowerCase());
    return matchesName && matchesUsername && matchesEmail;
  });

  const getUsers = () => {
    dispatch(getEntities({}));
  };

  useEffect(() => {
    getUsers();
  }, []);

  const handleCreate = () => {
    navigate('/back-office-user/new');
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold">
            <Translate contentKey={'tempApp.backOfficeUsers'} />
          </h1>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={getUsers}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {translate("common.refreshList")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Refresh user list</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleCreate}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {translate("tempApp.createNewUser")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Create new user</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs h-8 font-semibold">
                  {translate("common.name")}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold">
                  {translate("tempApp.username")}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold">
                  {translate("common.email")}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold w-[100px]">
                  {translate("common.enabled")}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold w-[80px]">
                  {translate("common.edit")}
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="p-2">
                  <Input
                    placeholder={translate("common.search.name")}
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="h-7 text-xs"
                  />
                </TableHead>
                <TableHead className="p-2">
                  <Input
                    placeholder={translate("tempApp.searchUsername")}
                    value={usernameFilter}
                    onChange={(e) => setUsernameFilter(e.target.value)}
                    className="h-7 text-xs"
                  />
                </TableHead>
                <TableHead className="p-2">
                  <Input
                    placeholder={translate("common.search.email")}
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    className="h-7 text-xs"
                  />
                </TableHead>
                <TableHead className="p-2"></TableHead>
                <TableHead className="p-2"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const editUrl = `/back-office-user/${user.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                  return (
                    <TableRow key={user.id} className="text-xs hover:bg-muted/50">
                      <TableCell className="text-xs">
                        <Link to={editUrl} className="text-primary hover:underline">
                          {user.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">{user.username}</TableCell>
                      <TableCell className="text-xs">{user.email}</TableCell>
                      <TableCell className="text-xs text-center">
                        {user.enabled ? (
                          <Check className="h-4 w-4 text-green-600 inline" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 inline" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={editUrl}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Edit className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Edit user</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing {filteredUsers.length} of {totalItems} users
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default User;
