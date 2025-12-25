import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, TextFormat } from 'react-jhipster';
import { RefreshCw } from 'lucide-react';

import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { APP_LOCAL_DATE_FORMAT } from 'app/config/constants';

import { getEntities } from './cash-payment.reducer';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const CashPayment = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const cashPaymentList = useAppSelector(state => state.cashPayment.entities);
  const loading = useAppSelector(state => state.cashPayment.loading);
  const totalItems = useAppSelector(state => state.cashPayment.totalItems);

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

  return (
    <PageWrapper>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xl font-bold">Cash Payments</span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleSyncList} disabled={loading} className="h-8 text-xs">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Payout Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Payment Type</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashPaymentList && cashPaymentList.length > 0 ? (
              cashPaymentList.map(cashPayment => (
                <TableRow key={cashPayment.id}>
                  <TableCell className="text-xs">{cashPayment.id}</TableCell>
                  <TableCell className="text-xs">{cashPayment.payoutType}</TableCell>
                  <TableCell className="text-xs">{cashPayment.amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">
                    {cashPayment.date ? <TextFormat type="date" value={cashPayment.date} format={APP_LOCAL_DATE_FORMAT} /> : null}
                  </TableCell>
                  <TableCell className="text-xs">{cashPayment.username}</TableCell>
                  <TableCell className="text-xs">{cashPayment.direction}</TableCell>
                  <TableCell className="text-xs">{cashPayment.paymentType || '-'}</TableCell>
                  <TableCell className="text-xs">{cashPayment.note}</TableCell>
                </TableRow>
              ))
            ) : (
              !loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-xs">
                    No cash payments found
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

export default CashPayment;
