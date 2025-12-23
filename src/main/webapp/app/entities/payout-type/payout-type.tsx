import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { Pencil, Trash2, RefreshCw } from 'lucide-react';

import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities } from './payout-type.reducer';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PayoutType = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const payoutTypeList = useAppSelector(state => state.payoutType.entities);
  const loading = useAppSelector(state => state.payoutType.loading);
  const totalItems = useAppSelector(state => state.payoutType.totalItems);

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
  }, [paginationState.activePage, paginationState.order, paginationState.sort]);

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

  const sort = p => () => {
    setPaginationState({
      ...paginationState,
      order: paginationState.order === ASC ? DESC : ASC,
      sort: p,
    });
  };

  const handleSyncList = () => {
    sortEntities();
  };

  const handleCreate = () => {
    navigate('/payout-type/new');
  };

  return (
    <PageWrapper>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xl font-bold">Payout Types</span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleSyncList} disabled={loading} className="h-8 text-xs">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={loading} className="h-8 text-xs">
            Create New Payout Type
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[50px]">Edit</TableHead>
              <TableHead className="w-[50px]">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payoutTypeList && payoutTypeList.length > 0 ? (
              payoutTypeList.map(payoutType => (
                <TableRow key={payoutType.id}>
                  <TableCell className="text-xs">
                    <Link
                      to={`/payout-type/${payoutType.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                      className="hover:underline"
                    >
                      {payoutType.id}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{payoutType.name}</TableCell>
                  <TableCell>
                    <Link
                      to={`/payout-type/${payoutType.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                    >
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                        <Pencil className="h-3 w-3 text-gray-400" />
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/payout-type/${payoutType.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                    >
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs">
                    No payout types found
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>
    </PageWrapper>
  );
};

export default PayoutType;
