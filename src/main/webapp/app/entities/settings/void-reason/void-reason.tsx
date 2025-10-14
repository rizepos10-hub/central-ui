import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { RefreshCw, Plus, Pencil } from 'lucide-react';

import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntities, getEntities } from './void-reason.reducer';

import { IVoidReason } from 'app/shared/model/void-reason.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const VoidReason = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const voidReasonsList = useAppSelector(state => state.voidReason.entities);
  const loading = useAppSelector(state => state.voidReason.loading);
  const totalItems = useAppSelector(state => state.voidReason.totalItems);

  const [codeFilter, setCodeFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');

  const handleCreate = () => {
    navigate('/void-reasons/new')
  };



  const getVoidReasons = () => {
    dispatch(getEntities({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
  };


  useEffect(() => {
    getVoidReasons()
  }, []);

  // Client-side filtering
  const filteredVoidReasons = voidReasonsList.filter(item => {
    const matchesCode = !codeFilter || item.code?.toLowerCase().includes(codeFilter.toLowerCase());
    const matchesReason = !reasonFilter || item.reason?.toLowerCase().includes(reasonFilter.toLowerCase());
    return matchesCode && matchesReason;
  });



  return (
    <PageWrapper>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            <Translate contentKey="tempApp.voidReason.home.title">Void Reasons</Translate>
          </h2>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={getVoidReasons}
              disabled={loading}
              className="h-8 text-xs"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <Translate contentKey="tempApp.voidReason.home.refreshListLabel">Refresh List</Translate>
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="h-8 text-xs"
            >
              <Plus className="h-4 w-4 mr-2" />
              <Translate contentKey="tempApp.voidReason.home.createLabel">Create new Void Reason</Translate>
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">
                  <Translate contentKey="tempApp.voidReason.code">Code</Translate>
                </TableHead>
                <TableHead className="text-xs">
                  <Translate contentKey="tempApp.voidReason.reason">Reason</Translate>
                </TableHead>
                <TableHead className="text-xs w-20">
                  <Translate contentKey="entity.action.edit">Edit</Translate>
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead>
                  <Input
                    placeholder={translate('tempApp.voidReason.home.search.code', 'Search by Code')}
                    value={codeFilter || ''}
                    onChange={(e) => setCodeFilter(e.target.value)}
                    className="h-7 text-xs"
                  />
                </TableHead>
                <TableHead>
                  <Input
                    placeholder={translate('tempApp.voidReason.home.search.reason', 'Search by Reason')}
                    value={reasonFilter || ''}
                    onChange={(e) => setReasonFilter(e.target.value)}
                    className="h-7 text-xs"
                  />
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-xs">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredVoidReasons.length > 0 ? (
                filteredVoidReasons.map((voidReason) => {
                  const editUrl = `/void-reasons/${voidReason.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                  return (
                    <TableRow key={voidReason.id}>
                      <TableCell className="text-xs">
                        <Link
                          to={editUrl}
                          className="text-primary hover:underline"
                        >
                          {voidReason.code}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">{voidReason.reason}</TableCell>
                      <TableCell className="text-xs">
                        <Link to={editUrl}>
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-xs">
                    <Translate contentKey="entity.noResults">No results found</Translate>
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

export default VoidReason;
