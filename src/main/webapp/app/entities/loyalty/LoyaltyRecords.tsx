import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from 'app/entities/loyalty/loyalty-records.reducer';
import { searchCustomers } from 'app/entities/customer/customer.reducer';
import { Link } from "react-router-dom";
import { translate, Translate } from "react-jhipster";
import { Eye, RefreshCw, Save } from 'lucide-react';

import { updateEntity as updateExchange, getEntity as getLoyaltyExchange } from "app/entities/loyalty/loyalty-exchange.reducer";
import { ILoyaltyExChange } from "app/shared/model/CUSTOMER/loyalty.model";
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: any;
  filters: any;
}

const incrementIntegerString = (value: string) => {
  let carry = 1;
  const digits = value.split('');

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    const nextDigit = Number(digits[index]) + carry;
    if (nextDigit >= 10) {
      digits[index] = '0';
      carry = 1;
    } else {
      digits[index] = String(nextDigit);
      carry = 0;
      break;
    }
  }

  return carry > 0 ? `1${digits.join('')}` : digits.join('');
};

const toPlainDecimalString = (value: number) => {
  const absoluteValue = Math.abs(value);
  const asString = absoluteValue.toString();

  if (!asString.includes('e') && !asString.includes('E')) {
    return asString;
  }

  return absoluteValue.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
};

const scaleValue = (value?: number | null) => {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue) || numericValue === 0) {
    return 0;
  }

  const sign = numericValue < 0 ? -1 : 1;
  const absoluteString = toPlainDecimalString(numericValue);
  const [wholePart = '0', decimalPart = ''] = absoluteString.split('.');
  let cents = decimalPart.slice(0, 2).padEnd(2, '0');
  const guardDigit = Number(decimalPart.charAt(2) || '0');

  if (guardDigit >= 5) {
    const incremented = incrementIntegerString(`${wholePart}${cents}`);
    cents = incremented.slice(-2).padStart(2, '0');
    const nextWholePart = incremented.slice(0, -2);
    return sign * Number(`${nextWholePart || '0'}.${cents}`);
  }

  return sign * Number(`${wholePart}.${cents}`);
};

const formatPoints = (value?: number | null) => scaleValue(value).toFixed(2);

export const LoyaltyRecords = () => {
  const ROWS_PER_PAGE = 5;
  const dispatch = useAppDispatch();

  const loyaltyExchangeEntity: ILoyaltyExChange = useAppSelector(state => state.loyaltyExchange.entity)
  const records = useAppSelector(state => state.loyalty.entities);
  const loading = useAppSelector(state => state.loyalty.loading);
  const totalItems = useAppSelector(state => state.loyalty.totalItems);
  const errorMessage = useAppSelector(state => state.loyalty.errorMessage);

  const [loyaltyPointExchange, setLoyaltyPointExchange] = useState<ILoyaltyExChange>();

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: ROWS_PER_PAGE,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      'customer.id': { value: '', matchMode: 'CONTAINS' },
      'customer.firstName': { value: '', matchMode: 'CONTAINS' },
      'customer.lastName': { value: '', matchMode: 'CONTAINS' },
      'customer.email': { value: '', matchMode: 'CONTAINS' },
      'customer.phone': { value: '', matchMode: 'CONTAINS' },
      points: { value: '', matchMode: 'EQUALS' }
    },
  });

  const handleLoyaltyExchangeChange = (field, value) => {
    setLoyaltyPointExchange((prevState) => ({
      ...prevState,
      [field]: value
    }))
  }

  const handleFilterChange = (field: string, value: string) => {
    setLazyState(prev => ({
      ...prev,
      first: 0,
      page: 0,
      filters: {
        ...prev.filters,
        [field]: { ...prev.filters[field], value }
      }
    }));
  };

  const mapMatchMode = (matchMode: string): string => {
    switch (matchMode) {
      case 'equals':
        return 'EQUALS';
      case 'notEquals':
        return 'NOT_EQUALS';
      case 'startsWith':
        return 'STARTS_WITH';
      case 'endsWith':
        return "END_WITH";
      case 'contains':
        return 'CONTAINS';
      case 'notContains':
        return 'NOT_CONTAINS';
      default:
        return "CONTAINS";
    }
  }

  const getCustomersIdsAsync = () => {
    const getCustomersFilters = (keys: string[]) => {
      const customersFilters: any = {};
      keys.forEach((key) => {
        if (lazyState.filters[`customer.${key}`].value)
          customersFilters[key] = {
            value: lazyState.filters[`customer.${key}`].value,
            matchMode: mapMatchMode(lazyState.filters[`customer.${key}`].matchMode)
          };
      })
      return customersFilters;
    }

    return dispatch(searchCustomers({
      first: 0,
      rows: 999999999,
      page: 0,
      sortField: null,
      sortOrder: null,
      filters: getCustomersFilters(['id', 'firstName', 'lastName', 'email', 'phone']),
    }))
  }

  const hasCustomerFilters =
    lazyState.filters['customer.id'].value ||
    lazyState.filters['customer.email'].value ||
    lazyState.filters['customer.firstName'].value ||
    lazyState.filters['customer.lastName'].value ||
    lazyState.filters['customer.phone'].value;

  useEffect(() => {
    const filters: any = {};

    if (lazyState.filters['points']?.value) {
      filters['points'] = { value: +(lazyState.filters.points.value), matchMode: 'EQUALS' };
    }

    // set filters by customer id
    if (hasCustomerFilters) {
      getCustomersIdsAsync().then((res: any) => {
        const ids = res?.payload.data.map(customer => customer.id);
        if (ids.length > 0)
          filters['customer.id'] = {
            operator: "OR",
            constraints: ids.map(id => { return { value: id, matchMode: 'EQUALS' } })
          };
        else filters['customer.id'] = { value: '', matchMode: "EQUALS" }

        const params = {
          first: lazyState.first || 0,
          rows: lazyState.rows || ROWS_PER_PAGE,
          page: lazyState.page || 0,
          sortField: lazyState.sortField || null,
          sortOrder: lazyState.sortOrder || null,
          filters,
        }
        dispatch(
          getEntities(params)
        );
        return;
      });
    }

    const params = {
      first: lazyState.first || 0,
      rows: lazyState.rows || ROWS_PER_PAGE,
      page: lazyState.page || 0,
      sortField: lazyState.sortField || null,
      sortOrder: lazyState.sortOrder || null,
      filters,
    }
    dispatch(
      getEntities(params)
    );

  }, [lazyState]);

  useEffect(() => {
    dispatch(getLoyaltyExchange());

    if (loyaltyExchangeEntity) {
      setLoyaltyPointExchange(loyaltyExchangeEntity)
    }
  }, [loyaltyExchangeEntity?.cashToPointExchange])

  const handleSyncList = () => {
    setLazyState(prev => ({ ...prev }));
  };

  const handleSave = () => {
    dispatch(updateExchange(loyaltyPointExchange));
  }

  const totalPages = Math.ceil(totalItems / ROWS_PER_PAGE);
  const currentPage = lazyState.page;

  const onPage = (pageNumber: number) => {
    setLazyState(prev => ({
      ...prev,
      first: pageNumber * ROWS_PER_PAGE,
      page: pageNumber
    }));
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage < 3) {
        pages.push(0, 1, 2, -1, totalPages - 1);
      } else if (currentPage > totalPages - 4) {
        pages.push(0, -1, totalPages - 3, totalPages - 2, totalPages - 1);
      } else {
        pages.push(0, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages - 1);
      }
    }
    return pages;
  };

  const filteredRecords = records.filter(record => Boolean(record.customerId || record.customer));

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Loyalty Points Exchange</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="cashToPointExchange" className="text-xs font-semibold">
                    Value to Point Ratio (Dollar Amount to Make One Point)
                  </Label>
                  <Input
                    type="number"
                    id="cashToPointExchange"
                    placeholder="Cash To Point"
                    value={loyaltyPointExchange?.cashToPointExchange ?? ''}
                    onChange={(e) => handleLoyaltyExchangeChange('cashToPointExchange', Number(e.target.value))}
                    className="h-7 text-xs"
                    step="0.00001"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <Label htmlFor="pointToCashExchange" className="text-xs font-semibold">
                    Point to Value Percentage (Number of Points to Redeem one Dollar)
                  </Label>
                  <Input
                    type="number"
                    id="pointToCashExchange"
                    placeholder="Point To Cash"
                    value={loyaltyPointExchange?.pointToCashExchange ?? ''}
                    onChange={(e) => handleLoyaltyExchangeChange('pointToCashExchange', Number(e.target.value))}
                    className="h-7 text-xs"
                    step="0.00001"
                  />
                </div>

                <div className="flex items-end">
                  <Button size="sm" className="h-8 text-xs" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">
              <Translate contentKey={'loyalty.view.table.title'}>Loyalty Records</Translate>
            </h2>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleSyncList} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{translate('loyalty.view.table.fields.email')}</TableHead>
                  <TableHead className="text-xs">{translate('loyalty.view.table.fields.firstName')}</TableHead>
                  <TableHead className="text-xs">{translate('loyalty.view.table.fields.lastName')}</TableHead>
                  <TableHead className="text-xs">{translate('loyalty.view.table.fields.phone')}</TableHead>
                  <TableHead className="text-xs text-right">{translate('loyalty.view.table.fields.points')}</TableHead>
                  <TableHead className="text-xs w-12 text-center">{translate('loyalty.view.table.fields.view')}</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-xs">
                    <Input
                      type="text"
                      placeholder={translate('loyalty.view.table.search.search')}
                      value={lazyState.filters['customer.email'].value}
                      onChange={(e) => handleFilterChange('customer.email', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </TableHead>
                  <TableHead className="text-xs">
                    <Input
                      type="text"
                      placeholder={translate('loyalty.view.table.search.search')}
                      value={lazyState.filters['customer.firstName'].value}
                      onChange={(e) => handleFilterChange('customer.firstName', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </TableHead>
                  <TableHead className="text-xs">
                    <Input
                      type="text"
                      placeholder={translate('loyalty.view.table.search.search')}
                      value={lazyState.filters['customer.lastName'].value}
                      onChange={(e) => handleFilterChange('customer.lastName', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </TableHead>
                  <TableHead className="text-xs">
                    <Input
                      type="text"
                      placeholder={translate('loyalty.view.table.search.search')}
                      value={lazyState.filters['customer.phone'].value}
                      onChange={(e) => handleFilterChange('customer.phone', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </TableHead>
                  <TableHead className="text-xs">
                    <Input
                      type="text"
                      placeholder={translate('loyalty.view.table.search.search')}
                      value={lazyState.filters['points'].value}
                      onChange={(e) => handleFilterChange('points', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </TableHead>
                  <TableHead className="text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-xs text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-xs">
                        {record.customerId || record.customer?.id ? (
                          <Link to={`/customer/${record.customerId || record.customer?.id}`} className="text-blue-600 hover:underline">
                            {record.customer?.email || '-'}
                          </Link>
                        ) : (
                          record.customer?.email || '-'
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {record.customerId || record.customer?.id ? (
                          <Link to={`/customer/${record.customerId || record.customer?.id}`} className="text-blue-600 hover:underline">
                            {record.customer?.firstName || '-'}
                          </Link>
                        ) : (
                          record.customer?.firstName || '-'
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {record.customerId || record.customer?.id ? (
                          <Link to={`/customer/${record.customerId || record.customer?.id}`} className="text-blue-600 hover:underline">
                            {record.customer?.lastName || '-'}
                          </Link>
                        ) : (
                          record.customer?.lastName || '-'
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {record.customerId || record.customer?.id ? (
                          <Link to={`/customer/${record.customerId || record.customer?.id}`} className="text-blue-600 hover:underline">
                            {record.customer?.phone || '-'}
                          </Link>
                        ) : (
                          record.customer?.phone || '-'
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-right">{formatPoints(record.points)}</TableCell>
                      <TableCell className="text-xs text-center">
                        <Link to={`/loyalty/${record.customerId || record.customer?.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title={translate('loyalty.view.table.fields.view')}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-xs text-center text-muted-foreground">
                      No Customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 0) onPage(currentPage - 1);
                      }}
                      className={currentPage === 0 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((pageNum, idx) =>
                    pageNum === -1 ? (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            onPage(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages - 1) onPage(currentPage + 1);
                      }}
                      className={currentPage >= totalPages - 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
