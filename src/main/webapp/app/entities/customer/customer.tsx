import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { Pencil, Trash2, RefreshCw } from 'lucide-react';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { ASC, DESC, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { searchEntities, getEntities } from './customer.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import Select from 'app/shared/components/select/select';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100, 200];
const DEFAULT_PAGE_SIZE = 20;

const formatAmount = (value?: number | null) => (value ?? 0).toFixed(2);

export const Customer = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, DEFAULT_PAGE_SIZE, 'id'), location.search)
  );

  const customerList = useAppSelector(state => state.customer.entities);
  const loading = useAppSelector(state => state.customer.loading);
  const totalItems = useAppSelector(state => state.customer.totalItems);

  const [filters, setFilters] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const modifiedCustomerList = customerList.map(customer => ({
    ...customer,
    name: `${customer.firstName} ${customer.lastName}`
  }));

  const getAllEntities = () => {
    if (search) {
      dispatch(
        searchEntities({
          query: search || '',
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    } else {
      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
          query: search || '',
        })
      );
    }
  };

  const startSearching = e => {
    if (search) {
      setPaginationState({
        ...paginationState,
        activePage: 1,
      });
      dispatch(
        searchEntities({
          query: search || '',
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }
    e.preventDefault();
  };

  const clear = () => {
    setSearch('');
    setPaginationState({
      ...paginationState,
      activePage: 1,
    });
    dispatch(getEntities({}));
  };

  const handleSearch = event => setSearch(event.target.value);

  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (location.search !== endURL) {
      navigate(`${location.pathname}${endURL}`);
    }
  };

  useEffect(() => {
    sortEntities();
  }, [paginationState.activePage, paginationState.itemsPerPage, paginationState.order, paginationState.sort, search]);

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

  const handlePagination = currentPage =>
    setPaginationState({
      ...paginationState,
      activePage: currentPage,
    });

  const handleSyncList = () => {
    sortEntities();
  };

  const handleCreate = () => {
    navigate('/customer/new')
  }

  const filteredCustomerList = useMemo(
    () =>
      modifiedCustomerList.filter(customer => {
        const matchesName = !filters.name || customer.name?.toLowerCase().includes(filters.name.toLowerCase());
        const matchesEmail = !filters.email || customer.email?.toLowerCase().includes(filters.email.toLowerCase());
        const matchesPhone = !filters.phone || customer.phone?.includes(filters.phone);
        return matchesName && matchesEmail && matchesPhone;
      }),
    [modifiedCustomerList, filters.name, filters.email, filters.phone]
  );

  const pageSize = paginationState.itemsPerPage;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(paginationState.activePage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * pageSize;
  const pageEndIndex = Math.min(pageStartIndex + pageSize, totalItems);

  const handlePageSizeChange = (newSize: number) =>
    setPaginationState({
      ...paginationState,
      itemsPerPage: newSize,
      activePage: 1,
    });

  const goToPreviousPage = () =>
    setPaginationState({
      ...paginationState,
      activePage: Math.max(1, paginationState.activePage - 1),
    });

  const goToNextPage = () =>
    setPaginationState({
      ...paginationState,
      activePage: Math.min(totalPages, paginationState.activePage + 1),
    });


  return (
    <PageWrapper>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xl font-bold"><Translate contentKey={'customers.view.table.title'}>Customers</Translate></span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleSyncList} disabled={loading} className="h-8 text-xs">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            {translate('customers.view.table.buttons.refreshList')}
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={loading} className="h-8 text-xs">
            {translate('customers.view.table.buttons.createNewCustomer')}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="space-y-1">
                  <div>{translate('common.name')}</div>
                  <Input
                    placeholder={translate('common.search.name')}
                    value={filters.name}
                    onChange={(e) => setFilters({...filters, name: e.target.value})}
                    className="h-8 text-xs"
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="space-y-1">
                  <div>{translate('common.email')}</div>
                  <Input
                    placeholder={translate('common.search.email')}
                    value={filters.email}
                    onChange={(e) => setFilters({...filters, email: e.target.value})}
                    className="h-8 text-xs"
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="space-y-1">
                  <div>{translate('common.phone')}</div>
                  <Input
                    placeholder={translate('common..search.phone')}
                    value={filters.phone}
                    onChange={(e) => setFilters({...filters, phone: e.target.value})}
                    className="h-8 text-xs"
                  />
                </div>
              </TableHead>
              <TableHead className="min-w-[110px]">On Account</TableHead>
              <TableHead className="min-w-[110px] text-right">Debit Limit</TableHead>
              <TableHead className="min-w-[110px] text-right">Debit Used</TableHead>
              <TableHead className="w-[50px]">{translate('common.edit')}</TableHead>
              <TableHead className="w-[50px]">{translate('common.delete')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomerList.map(customer => (
              <TableRow key={customer.id}>
                <TableCell className="text-xs">
                  <Link
                    to={`/customer/${customer.id}?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                    className="hover:underline"
                  >
                    {customer.name}
                  </Link>
                </TableCell>
                <TableCell className="text-xs">{customer.email}</TableCell>
                <TableCell className="text-xs">{customer.phone}</TableCell>
                <TableCell className="text-xs">
                  <span className={customer.onAccountEnabled ? 'font-medium text-emerald-600' : 'text-muted-foreground'}>
                    {customer.onAccountEnabled ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right text-xs whitespace-nowrap">{formatAmount(customer.onAccountDebitLimit)}</TableCell>
                <TableCell className="text-right text-xs whitespace-nowrap">{formatAmount(customer.onAccountDebitUsed)}</TableCell>
                <TableCell>
                  <Link to={`/customer/${customer.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                      <Pencil className="h-3 w-3 text-gray-400" />
                    </Button>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link to={`/customer/${customer.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalItems > 0 && (
        <div className="mt-2 flex items-center justify-between border-t px-2 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page:</span>
            <Select
              value={{ value: pageSize, label: pageSize.toString() }}
              onChange={(option: any) => handlePageSizeChange(option?.value ?? DEFAULT_PAGE_SIZE)}
              options={PAGE_SIZE_OPTIONS.map(val => ({ value: val, label: val.toString() }))}
              isSearchable={false}
              className="w-20"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {pageStartIndex + 1} - {pageEndIndex} of {totalItems}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={goToPreviousPage}
                disabled={safeCurrentPage <= 1 || loading}
              >
                ‹
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={goToNextPage}
                disabled={safeCurrentPage >= totalPages || loading}
              >
                ›
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Customer;
