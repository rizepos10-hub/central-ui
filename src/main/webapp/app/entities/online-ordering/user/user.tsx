import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSortState, Translate, translate } from 'react-jhipster';
import { RefreshCw, Check, X } from 'lucide-react';

import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IUser } from 'app/shared/model/user.model';
import { getEntities } from './user.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const User = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const userList: IUser[] = useAppSelector(state => state.onlineOrderingUser.entities);
  const loading = useAppSelector(state => state.onlineOrderingUser.loading);
  const totalItems = useAppSelector(state => state.onlineOrderingUser.totalItems);

  const [filters, setFilters] = useState({
    name: '',
    login: '',
    email: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const modifiedUserList = useMemo(() =>
    userList.map(user => ({
      ...user,
      name: `${user.firstName} ${user.lastName !== null ? user.lastName : ''}`
    })),
    [userList]
  );

  const getUsers = () => {
    dispatch(getEntities({
      page: 0,
      size: 1000,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
  };

  useEffect(() => {
    getUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return modifiedUserList.filter(user => {
      const nameMatch = !filters.name || user.name?.toLowerCase().includes(filters.name.toLowerCase());
      const loginMatch = !filters.login || user.login?.toLowerCase().includes(filters.login.toLowerCase());
      const emailMatch = !filters.email || user.email?.toLowerCase().includes(filters.email.toLowerCase());
      return nameMatch && loginMatch && emailMatch;
    });
  }, [modifiedUserList, filters]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  return (
    <PageWrapper>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            <Translate contentKey={'onlineOrderingUser.user.table.title'} />
          </h2>
          <Button
            variant="outline"
            className="h-8 text-xs"
            onClick={getUsers}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {translate("onlineOrderingUser.user.buttons.refreshList")}
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="h-8">
                  {translate("onlineOrderingUser.user.table.fields.name")}
                </TableHead>
                <TableHead className="h-8">
                  {translate("onlineOrderingUser.user.table.fields.username")}
                </TableHead>
                <TableHead className="h-8">
                  {translate("onlineOrderingUser.user.table.fields.email")}
                </TableHead>
                <TableHead className="h-8 w-24">
                  {translate("onlineOrderingUser.user.table.fields.enabled")}
                </TableHead>
              </TableRow>
              <TableRow className="text-xs bg-muted/50">
                <TableHead className="h-8 py-1">
                  <Input
                    placeholder={translate("onlineOrderingUser.user.table.search.name")}
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    className="h-7 text-xs"
                  />
                </TableHead>
                <TableHead className="h-8 py-1">
                  <Input
                    placeholder="Filter username"
                    value={filters.login}
                    onChange={(e) => handleFilterChange('login', e.target.value)}
                    className="h-7 text-xs"
                  />
                </TableHead>
                <TableHead className="h-8 py-1">
                  <Input
                    placeholder="Filter email"
                    value={filters.email}
                    onChange={(e) => handleFilterChange('email', e.target.value)}
                    className="h-7 text-xs"
                  />
                </TableHead>
                <TableHead className="h-8 py-1"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-xs">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-xs">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="text-xs">
                    <TableCell className="py-2">{user.name}</TableCell>
                    <TableCell className="py-2">{user.login}</TableCell>
                    <TableCell className="py-2">{user.email}</TableCell>
                    <TableCell className="py-2">
                      {user.verified ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        <div className="text-xs text-muted-foreground">
          Showing {paginatedUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
        </div>
      </div>
    </PageWrapper>
  );
};

export default User;