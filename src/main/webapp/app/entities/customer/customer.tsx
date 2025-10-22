import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { Pencil, Trash2, RefreshCw } from 'lucide-react';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { searchEntities, getEntities } from './customer.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const Customer = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
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

  console.log(customerList,'customerList')
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

  const filteredCustomerList = modifiedCustomerList.filter(customer => {
    const matchesName = !filters.name || customer.name?.toLowerCase().includes(filters.name.toLowerCase());
    const matchesEmail = !filters.email || customer.email?.toLowerCase().includes(filters.email.toLowerCase());
    const matchesPhone = !filters.phone || customer.phone?.includes(filters.phone);
    return matchesName && matchesEmail && matchesPhone;
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
              <TableHead className="w-[50px]">{translate('common.edit')}</TableHead>
              <TableHead className="w-[50px]">{translate('common.delete')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomerList.map(customer => (
              <TableRow key={customer.id}>
                <TableCell className="text-xs">
                  <Link
                    to={`/customer/${customer.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                    className="hover:underline"
                  >
                    {customer.name}
                  </Link>
                </TableCell>
                <TableCell className="text-xs">{customer.email}</TableCell>
                <TableCell className="text-xs">{customer.phone}</TableCell>
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
    </PageWrapper>
  );
};

export default Customer;
