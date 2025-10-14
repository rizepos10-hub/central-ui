import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from './pos-authority-group.reducer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PosAuthorityGroup = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams({ activePage: 1, itemsPerPage: ITEMS_PER_PAGE, sort: 'id', order: 'asc' }, location.search)
  );

  const PosAuthorityGroupList = useAppSelector(state => state.posAuthorityGroup.entities);
  const loading = useAppSelector(state => state.posAuthorityGroup.loading);
  const totalItems = useAppSelector(state => state.posAuthorityGroup.totalItems);

  const getPosAuthorityGroupList = () => {
    dispatch(getEntities({
      page: paginationState.activePage - 1,
      size: 1000,
    }))
  }

  useEffect(() => {
    getPosAuthorityGroupList()
  }, []);

  const handleCreate = () => {
    navigate('/pos-authority-group/new');
  }

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            <Translate contentKey={'tempApp.posUsers'} />
          </h2>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={getPosAuthorityGroupList}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{translate("common.refreshList")}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleCreate}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {translate("tempApp.pos-authority-group.create")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{translate("tempApp.pos-authority-group.create")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs h-8 font-semibold">
                  {translate("common.name")}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold">
                  {translate("common.description")}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold">
                  {translate("tempApp.authorities")}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold w-20 text-center">
                  {translate("common.edit")}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold w-20 text-center">
                  {translate("common.delete")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs p-4">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                    {translate("common.loading")}
                  </TableCell>
                </TableRow>
              ) : PosAuthorityGroupList && PosAuthorityGroupList.length > 0 ? (
                PosAuthorityGroupList.map((posAuthorityGroup, i) => {
                  const editUrl = `/pos-authority-group/${posAuthorityGroup.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                  const deleteUrl = `/pos-authority-group/${posAuthorityGroup.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

                  return (
                    <TableRow key={`entity-${i}`}>
                      <TableCell className="text-xs p-2">
                        <Link to={editUrl} className="text-primary hover:underline">
                          {posAuthorityGroup.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        {posAuthorityGroup.description}
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        {posAuthorityGroup.authorities?.join(' | ')}
                      </TableCell>
                      <TableCell className="text-xs p-2 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={editUrl}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{translate("common.edit")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-xs p-2 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={deleteUrl}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-destructive/10">
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{translate("common.delete")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs p-4 text-muted-foreground">
                    {translate("common.noRecordsFound")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageWrapper>
  );
};

export default PosAuthorityGroup;
