import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { Pencil, Trash2, RefreshCw, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { FilterMatchMode } from 'primereact/api';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { searchCustomers } from './customer.reducer';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import Select from 'app/shared/components/select/select';
import ReportActionBar from 'app/shared/components/report/report-action-bar';
import ReportExportHeader from 'app/shared/components/report/report-export-header';
import {
  analyticsReportPrintStyles,
  buildCustomerWorkbook,
  createReportFileName,
  downloadElementAsPdf,
  fetchAllPaginatedRows,
  ReportFilterInfo,
  saveWorkbookAsExcel,
} from 'app/shared/util/report-export-utils';
import { getReportApiErrorMessage } from 'app/shared/util/report-api-error-utils';
import { buildCustomerSearchGroups, getCustomerSearchValueFromGroups } from 'app/shared/util/customer-search-filter-util';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100, 200];
const DEFAULT_PAGE_SIZE = 20;
const EXPORT_PAGE_SIZE = 250;
const TEXT_FILTER_DEBOUNCE_MS = 300;
const REPORT_TITLE = 'Customers';
const apiSearchUrl = 'api/_search/customers';

const initialState = {
  first: 0,
  rows: DEFAULT_PAGE_SIZE,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    firstName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    email: { value: null, matchMode: FilterMatchMode.CONTAINS },
    phone: { value: null, matchMode: FilterMatchMode.CONTAINS },
    accountNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'businessDetails.businessName': { value: null, matchMode: FilterMatchMode.CONTAINS },
    onAccountEnabled: { value: null, matchMode: FilterMatchMode.EQUALS },
  },
  groups: [],
};

const formatAmount = (value?: number | null) => (value ?? 0).toFixed(2);

const onAccountOptions = [
  { label: 'All', value: '' },
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
];

const formatCustomerLabel = (customer?: Partial<ICustomer> | null) => {
  const fullName = [customer?.firstName, customer?.lastName]
    .filter(part => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .trim();
  const businessName = customer?.businessDetails?.businessName?.trim();

  if (fullName && businessName) {
    return `${fullName} (${businessName})`;
  }

  if (fullName) {
    return fullName;
  }

  if (businessName) {
    return businessName;
  }

  return 'Unnamed customer';
};

export const Customer = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const exportContentRef = useRef<HTMLDivElement>(null);

  const customerList = useAppSelector(state => state.customer.entities);
  const loading = useAppSelector(state => state.customer.loading);
  const totalItems = useAppSelector(state => state.customer.totalItems);
  const [exportRows, setExportRows] = useState<ICustomer[]>([]);
  const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rawQuery = JSON.parse(searchParams.get('query') || 'null') || {};
  const query = {
    ...initialState,
    ...rawQuery,
    filters: {
      ...initialState.filters,
      ...(rawQuery.filters || {}),
    },
    groups: Array.isArray(rawQuery.groups) ? rawQuery.groups : [],
  };
  const customerSearchValue =
    getCustomerSearchValueFromGroups(query.groups)
    || query.filters.firstName?.value
    || query.filters['businessDetails.businessName']?.value
    || '';
  const [customerSearchInput, setCustomerSearchInput] = useState(customerSearchValue);
  const [emailInput, setEmailInput] = useState(query.filters.email?.value || '');
  const [phoneInput, setPhoneInput] = useState(query.filters.phone?.value || '');
  const [accountNumberInput, setAccountNumberInput] = useState(query.filters.accountNumber?.value || '');

  const modifiedCustomerList = customerList.map(customer => ({
    ...customer,
    name: formatCustomerLabel(customer),
  }));

  useEffect(() => {
    setCustomerSearchInput(customerSearchValue);
  }, [customerSearchValue]);

  useEffect(() => {
    setEmailInput(query.filters.email?.value || '');
  }, [query.filters.email?.value]);

  useEffect(() => {
    setPhoneInput(query.filters.phone?.value || '');
  }, [query.filters.phone?.value]);

  useEffect(() => {
    setAccountNumberInput(query.filters.accountNumber?.value || '');
  }, [query.filters.accountNumber?.value]);

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      searchCustomers(updatedQuery)
    );
  };

  const exportFilters: ReportFilterInfo[] = [
    { label: 'Customer Search', value: customerSearchValue || 'All' },
    { label: 'Email', value: query.filters.email?.value || 'All' },
    { label: 'Phone', value: query.filters.phone?.value || 'All' },
    { label: 'Account Number', value: query.filters.accountNumber?.value || 'All' },
    {
      label: 'On Account',
      value:
        query.filters.onAccountEnabled?.value === true
          ? 'Active'
          : query.filters.onAccountEnabled?.value === false
            ? 'Inactive'
            : 'All',
    },
  ];

  const fileName = createReportFileName(REPORT_TITLE, [
    customerSearchValue,
    query.filters.accountNumber?.value,
    query.filters.onAccountEnabled?.value === true
      ? 'active'
      : query.filters.onAccountEnabled?.value === false
        ? 'inactive'
        : null,
  ]);

  useEffect(() => {
    getAllEntities();
  }, [searchParams]);

  const handleSyncList = () => {
    setError(null);
    getAllEntities();
  };

  const handleCreate = () => {
    navigate('/customer/new');
  };

  const handleFilterChange = (field: string, value: string | boolean | null) => {
    const queryParams = JSON.stringify({
      ...query,
      first: 0,
      page: 0,
      filters: {
        ...query.filters,
        [field]: {
          ...query.filters[field],
          value,
        },
      },
    });
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const stopSortPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  useEffect(() => {
    if (customerSearchInput === customerSearchValue) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const queryParams = JSON.stringify({
        ...query,
        first: 0,
        page: 0,
        filters: {
          ...query.filters,
          firstName: {
            ...query.filters.firstName,
            value: null,
          },
          'businessDetails.businessName': {
            ...query.filters['businessDetails.businessName'],
            value: null,
          },
        },
        groups: buildCustomerSearchGroups(customerSearchInput || null),
      });
      setSearchParams({ query: queryParams }, { replace: true });
    }, TEXT_FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [customerSearchInput, customerSearchValue, query, setSearchParams]);

  useEffect(() => {
    if (emailInput === (query.filters.email?.value || '')) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const queryParams = JSON.stringify({
        ...query,
        first: 0,
        page: 0,
        filters: {
          ...query.filters,
          email: {
            ...query.filters.email,
            value: emailInput || null,
          },
        },
      });
      setSearchParams({ query: queryParams }, { replace: true });
    }, TEXT_FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [emailInput, query, setSearchParams]);

  useEffect(() => {
    if (phoneInput === (query.filters.phone?.value || '')) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const queryParams = JSON.stringify({
        ...query,
        first: 0,
        page: 0,
        filters: {
          ...query.filters,
          phone: {
            ...query.filters.phone,
            value: phoneInput || null,
          },
        },
      });
      setSearchParams({ query: queryParams }, { replace: true });
    }, TEXT_FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [phoneInput, query, setSearchParams]);

  useEffect(() => {
    if (accountNumberInput === (query.filters.accountNumber?.value || '')) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const queryParams = JSON.stringify({
        ...query,
        first: 0,
        page: 0,
        filters: {
          ...query.filters,
          accountNumber: {
            ...query.filters.accountNumber,
            value: accountNumberInput || null,
          },
        },
      });
      setSearchParams({ query: queryParams }, { replace: true });
    }, TEXT_FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [accountNumberInput, query, setSearchParams]);

  const handleSort = (field: string) => {
    let newSortOrder = 1;
    if (query.sortField === field) {
      newSortOrder = query.sortOrder === 1 ? -1 : query.sortOrder === -1 ? null : 1;
    }

    const queryParams = JSON.stringify({
      ...query,
      sortField: newSortOrder === null ? null : field,
      sortOrder: newSortOrder,
    });
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const getSortIcon = (field: string) => {
    if (query.sortField !== field) {
      return <ArrowUpDown className="ml-1 inline h-3 w-3" />;
    }
    if (query.sortOrder === 1) {
      return <ArrowUp className="ml-1 inline h-3 w-3" />;
    }
    if (query.sortOrder === -1) {
      return <ArrowDown className="ml-1 inline h-3 w-3" />;
    }
    return <ArrowUpDown className="ml-1 inline h-3 w-3" />;
  };

  const handlePageSizeChange = (newSize: number) => {
    const queryParams = JSON.stringify({
      ...query,
      rows: newSize,
      first: 0,
      page: 0,
    });
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const goToPreviousPage = () => {
    const nextPage = Math.max(0, query.page - 1);
    const queryParams = JSON.stringify({
      ...query,
      page: nextPage,
      first: nextPage * query.rows,
    });
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const goToNextPage = () => {
    const totalPages = Math.max(1, Math.ceil(totalItems / query.rows));
    const nextPage = Math.min(totalPages - 1, query.page + 1);
    const queryParams = JSON.stringify({
      ...query,
      page: nextPage,
      first: nextPage * query.rows,
    });
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const pageSize = query.rows;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(query.page + 1, totalPages);
  const pageStartIndex = totalItems === 0 ? 0 : query.page * pageSize + 1;
  const pageEndIndex = Math.min(query.page * pageSize + pageSize, totalItems);
  const hasExportData = totalItems > 0 && modifiedCustomerList.length > 0;

  const ensureExportRows = async () => {
    const updatedQuery = applyMatchModeMap(query);
    const allRows = await fetchAllPaginatedRows<ICustomer, Record<string, unknown>>(
      async ({ page, size, ...requestArgs }) => {
        const response = await axios.post<ICustomer[]>(
          apiSearchUrl,
          {
            ...requestArgs,
            page,
            first: page * size,
            rows: size,
          }
        );

        return {
          rows: response.data,
          totalCount: parseInt(response.headers['x-total-count'] || `${response.data.length}`, 10),
        };
      },
      {
        requestArgs: {
          ...updatedQuery,
          page: 0,
          first: 0,
          rows: EXPORT_PAGE_SIZE,
        },
        size: EXPORT_PAGE_SIZE,
        getRowSignature: row => `${row.id || row.accountNumber || `${row.firstName}-${row.lastName}-${row.email}`}`,
      }
    );

    setExportRows(allRows);
    await new Promise(resolve => setTimeout(resolve, 0));
    return allRows;
  };

  const handleExcelExport = async () => {
    try {
      setBusyAction('excel');
      setError(null);
      const allRows = await ensureExportRows();
      await saveWorkbookAsExcel(
        buildCustomerWorkbook(allRows, {
          title: REPORT_TITLE,
          filters: [...exportFilters, { label: 'Total Records', value: allRows.length }],
        }),
        fileName
      );
    } catch (err) {
      setError(getReportApiErrorMessage(err, 'Unable to export customers.'));
    } finally {
      setBusyAction(null);
    }
  };

  const handlePdfExport = async () => {
    if (!exportContentRef.current) {
      return;
    }

    try {
      setBusyAction('pdf');
      setError(null);
      await ensureExportRows();

      if (exportContentRef.current) {
        await downloadElementAsPdf(exportContentRef.current, {
          fileName,
          orientation: 'landscape',
        });
      }
    } catch (err) {
      setError(getReportApiErrorMessage(err, 'Unable to export customers.'));
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => exportContentRef.current,
    documentTitle: fileName,
    pageStyle: analyticsReportPrintStyles('landscape'),
    onBeforeGetContent: async () => {
      setBusyAction('print');
      setError(null);

      try {
        await ensureExportRows();
      } catch (err) {
        setError(getReportApiErrorMessage(err, 'Unable to export customers.'));
        setBusyAction(null);
        throw err;
      }
    },
    onAfterPrint: () => {
      setBusyAction(null);
    },
  });

  return (
    <PageWrapper>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xl font-bold"><Translate contentKey={'customers.view.table.title'}>Customers</Translate></span>
        <div className="flex gap-2">
          <ReportActionBar
            onExcel={handleExcelExport}
            onPdf={handlePdfExport}
            onPrint={handlePrint}
            disabled={!hasExportData || loading || busyAction !== null}
            busyAction={busyAction}
          />
          <Button variant="secondary" size="sm" onClick={handleSyncList} disabled={loading} className="h-8 text-xs">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            {translate('customers.view.table.buttons.refreshList')}
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={loading} className="h-8 text-xs">
            {translate('customers.view.table.buttons.createNewCustomer')}
          </Button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          data-testid="customer-export-error"
        >
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('firstName')}>
                <div className="space-y-1">
                  <div>
                    {translate('common.name')}
                    {getSortIcon('firstName')}
                  </div>
                  <Input
                    placeholder="Search customer"
                    value={customerSearchInput}
                    onChange={e => setCustomerSearchInput(e.target.value)}
                    onClick={stopSortPropagation}
                    onFocus={stopSortPropagation}
                    onMouseDown={stopSortPropagation}
                    className="h-8 text-xs"
                  />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                <div className="space-y-1">
                  <div>
                    {translate('common.email')}
                    {getSortIcon('email')}
                  </div>
                  <Input
                    placeholder={translate('common.search.email')}
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onClick={stopSortPropagation}
                    onFocus={stopSortPropagation}
                    onMouseDown={stopSortPropagation}
                    className="h-8 text-xs"
                  />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('phone')}>
                <div className="space-y-1">
                  <div>
                    {translate('common.phone')}
                    {getSortIcon('phone')}
                  </div>
                  <Input
                    placeholder={translate('common.phone')}
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    onClick={stopSortPropagation}
                    onFocus={stopSortPropagation}
                    onMouseDown={stopSortPropagation}
                    className="h-8 text-xs"
                  />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('accountNumber')}>
                <div className="space-y-1">
                  <div>
                    Account Number
                    {getSortIcon('accountNumber')}
                  </div>
                  <Input
                    placeholder="Search account number"
                    value={accountNumberInput}
                    onChange={e => setAccountNumberInput(e.target.value)}
                    onClick={stopSortPropagation}
                    onFocus={stopSortPropagation}
                    onMouseDown={stopSortPropagation}
                    className="h-8 text-xs"
                  />
                </div>
              </TableHead>
              <TableHead className="min-w-[140px]">
                <div className="space-y-1">
                  <div>On Account</div>
                  <div onClick={stopSortPropagation} onMouseDown={stopSortPropagation}>
                    <Select
                      value={onAccountOptions.find(option => option.value === (query.filters.onAccountEnabled?.value ?? '')) || onAccountOptions[0]}
                      onChange={(option: any) => handleFilterChange('onAccountEnabled', option?.value === '' ? null : option?.value)}
                      options={onAccountOptions}
                      isSearchable={false}
                      className="text-xs"
                    />
                  </div>
                </div>
              </TableHead>
              <TableHead className="min-w-[110px] text-right">Debit Limit</TableHead>
              <TableHead className="min-w-[110px] text-right">Debit Used</TableHead>
              <TableHead className="w-[50px]">{translate('common.edit')}</TableHead>
              <TableHead className="w-[50px]">{translate('common.delete')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modifiedCustomerList.map(customer => (
              <TableRow key={customer.id}>
                <TableCell className="text-xs">
                  <Link
                    to={`/customer/${customer.id}`}
                    className="hover:underline"
                  >
                    {customer.name || '-'}
                  </Link>
                </TableCell>
                <TableCell className="text-xs">{customer.email || '-'}</TableCell>
                <TableCell className="text-xs">{customer.phone || '-'}</TableCell>
                <TableCell className="text-xs">{customer.accountNumber || '-'}</TableCell>
                <TableCell className="text-xs">
                  <span className={customer.onAccountEnabled ? 'font-medium text-emerald-600' : 'text-muted-foreground'}>
                    {customer.onAccountEnabled ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right text-xs whitespace-nowrap">{formatAmount(customer.onAccountDebitLimit)}</TableCell>
                <TableCell className="text-right text-xs whitespace-nowrap">{formatAmount(customer.onAccountDebitUsed)}</TableCell>
                <TableCell>
                  <Link to={`/customer/${customer.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                      <Pencil className="h-3 w-3 text-gray-400" />
                    </Button>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link to={`/customer/${customer.id}/delete`}>
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
              {pageStartIndex} - {pageEndIndex} of {totalItems}
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

      <div className="pointer-events-none fixed -left-[10000px] top-0 w-fit max-w-none bg-white p-6" aria-hidden="true">
        <div ref={exportContentRef} className="report-export-root space-y-4">
          <ReportExportHeader
            reportTitle={REPORT_TITLE}
            hiddenOnScreen
            forceVisible={busyAction === 'pdf'}
            meta={[{ label: 'Dataset', value: 'Full export dataset' }]}
            filters={[...exportFilters, { label: 'Total Records', value: exportRows.length }]}
          />

          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Phone</TableHead>
                  <TableHead className="text-xs">Account Number</TableHead>
                  <TableHead className="text-xs">Business Name</TableHead>
                  <TableHead className="text-xs">On Account</TableHead>
                  <TableHead className="text-xs text-right">Debit Limit</TableHead>
                  <TableHead className="text-xs text-right">Debit Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportRows.map(customer => {
                  const displayName = [customer.firstName, customer.lastName]
                    .filter(part => typeof part === 'string' && part.trim().length > 0)
                    .join(' ')
                    .trim();

                  return (
                    <TableRow key={`export-${customer.id || customer.accountNumber || displayName}`}>
                      <TableCell className="text-xs">{displayName || '-'}</TableCell>
                      <TableCell className="text-xs">{customer.email || '-'}</TableCell>
                      <TableCell className="text-xs">{customer.phone || '-'}</TableCell>
                      <TableCell className="text-xs">{customer.accountNumber || '-'}</TableCell>
                      <TableCell className="text-xs">{customer.businessDetails?.businessName || '-'}</TableCell>
                      <TableCell className="text-xs">{customer.onAccountEnabled ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell className="text-right text-xs whitespace-nowrap">{formatAmount(customer.onAccountDebitLimit)}</TableCell>
                      <TableCell className="text-right text-xs whitespace-nowrap">{formatAmount(customer.onAccountDebitUsed)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Customer;
