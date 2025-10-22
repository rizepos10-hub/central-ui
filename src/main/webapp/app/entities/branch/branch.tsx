import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { Pencil, Trash2, RefreshCw, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IBranch } from 'app/shared/model/branch.model';
import { searchEntities, getEntities } from './branch.reducer';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const Branch = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const branchList = useAppSelector(state => state.branch.entities);
  const loading = useAppSelector(state => state.branch.loading);
  const totalItems = useAppSelector(state => state.branch.totalItems);

  const getAllEntities = () => {
    dispatch(
      getEntities({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  };

  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (location.search !== endURL) {
      navigate(`${location.pathname}${endURL}`);
    }
  };

  useEffect(() => {
    sortEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort, search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = params.get('page');
    const sort = params.get(SORT);
    if (page && sort) {
      const sortSplit = sort.split(',');
      setPaginationState({
        ...paginationState,
        activePage: +page,
        sort: sortSplit[0],
        order: sortSplit[1],
      });
    }
  }, [location.search]);

  const handleSyncList = () => {
    sortEntities();
  };

  const handleCreate = () => {
    navigate('/branch/new');
  };

  return (
    <PageWrapper>
      <Card>
        <CardContent>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Branches</h2>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncList}
                    disabled={loading}
                    className="h-7 w-7 p-0"
                  >
                    {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Refresh List</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={loading}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Create new Branch</p></TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 px-2 text-xs">Name</TableHead>
                    <TableHead className="h-8 px-2 text-xs">Employees</TableHead>
                    <TableHead className="h-8 px-2 text-xs w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchList?.length ? (
                    branchList.map((branch) => {
                      const editUrl = `/branch/${branch.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                      const deleteUrl = `/branch/${branch.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

                      return (
                        <TableRow key={branch.id} className="h-10">
                          <TableCell className="px-2 py-1">
                            <Link
                              to={editUrl}
                              className="text-primary hover:underline font-medium text-xs"
                            >
                              {branch.name}
                            </Link>
                          </TableCell>
                          <TableCell className="px-2 py-1 text-xs">
                            {branch.numberOfEmployees || '-'}
                          </TableCell>
                          <TableCell className="px-2 py-1">
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link to={editUrl}>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <Pencil className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent><p>Edit</p></TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link to={deleteUrl}>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent><p>Delete</p></TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-16 text-center text-xs">
                        <Translate contentKey="entity.noResults" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-1 py-2">
            <div className="text-xs text-muted-foreground">
              Showing {((paginationState.activePage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
              {Math.min(paginationState.activePage * ITEMS_PER_PAGE, totalItems)} of{' '}
              {totalItems} results
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginationState({ ...paginationState, activePage: paginationState.activePage - 1 })}
                disabled={paginationState.activePage === 1}
                className="h-7 text-xs"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginationState({ ...paginationState, activePage: paginationState.activePage + 1 })}
                disabled={paginationState.activePage >= Math.ceil(totalItems / ITEMS_PER_PAGE)}
                className="h-7 text-xs"
              >
                Next
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default Branch;
