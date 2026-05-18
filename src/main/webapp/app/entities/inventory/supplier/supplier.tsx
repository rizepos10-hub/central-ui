import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { RefreshCw, Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntities } from './supplier.reducer';
// import { exportEntities } from './supplier.reducer'; // TODO: Uncomment when backend is implemented
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { FilterMatchMode } from 'primereact/api';
import { ISupplier } from 'app/shared/model/STOCK/supplier.model';
import ImportButton from 'app/shared/components/data-import/data-import';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

const initialState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    email: { value: null, matchMode: FilterMatchMode.CONTAINS },
    address: { value: null, matchMode: FilterMatchMode.CONTAINS },
    phoneNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
  },
};

export const Supplier = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const supplierList = useAppSelector(state => state.supplier.entities);
  const loading = useAppSelector(state => state.supplier.loading);
  const totalItems = useAppSelector(state => state.supplier.totalItems);
  const [searchParam, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParam.get('query')) || initialState;
  const [filterValues, setFilterValues] = useState({
    name: query.filters.name.value || '',
    address: query.filters.address.value || '',
    email: query.filters.email.value || '',
    phoneNumber: query.filters.phoneNumber.value || '',
  });
  // const [selectedSuppliers, setSelectedSuppliers] = useState<ISupplier[]>([]);
  // const [isLoadingAction, setIsLoadingAction] = useState(false);

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      searchEntities({
        query: updatedQuery,
      })
    );
  };

  useEffect(() => {
    getAllEntities();
  }, [searchParam]);

  // Update local filter values when query changes
  useEffect(() => {
    setFilterValues({
      name: query.filters.name.value || '',
      address: query.filters.address.value || '',
      email: query.filters.email.value || '',
      phoneNumber: query.filters.phoneNumber.value || '',
    });
  }, [searchParam]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const handleCreate = () => {
    navigate('/inventory/supplier/new')
  }

  // TODO: Uncomment export functions when backend is implemented
  // const handleExportSelected = async () => {
  //   setIsLoadingAction(true);
  //   try {
  //     const result = await dispatch(exportEntities(selectedSuppliers.map(supplier => supplier.id)));
  //     const payload = result.payload as any;
  //
  //     if (payload?.data) {
  //       console.log('Export started:', payload.data);
  //     }
  //   } catch (error) {
  //     console.error('Export failed:', error);
  //   } finally {
  //     setIsLoadingAction(false);
  //     setSelectedSuppliers([]);
  //   }
  // };

  // const handleExportAll = async () => {
  //   setIsLoadingAction(true);
  //   try {
  //     const result = await dispatch(exportEntities([]));
  //     const payload = result.payload as any;
  //
  //     if (payload?.data) {
  //       console.log('Export all started:', payload.data);
  //     }
  //   } catch (error) {
  //     console.error('Export all failed:', error);
  //   } finally {
  //     setIsLoadingAction(false);
  //   }
  // };

  // const confirmBulkExport = () => {
  //   confirmDialog({
  //     message: `Are you sure you want to export ${selectedSuppliers.length} selected suppliers?`,
  //     header: 'Export Selected Suppliers',
  //     icon: 'pi pi-exclamation-triangle',
  //     defaultFocus: 'accept',
  //     accept: () => handleExportSelected(),
  //     reject: () => {}
  //   });
  // };

  // const confirmExportAll = () => {
  //   confirmDialog({
  //     message: 'Are you sure you want to export all suppliers?',
  //     header: 'Export All Confirmation',
  //     icon: 'pi pi-exclamation-triangle',
  //     defaultFocus: 'accept',
  //     accept: () => handleExportAll(),
  //     reject: () => {}
  //   });
  // };

  const handleSort = (field: string) => {
    let newSortOrder = 1;
    if (query.sortField === field) {
      if (query.sortOrder === 1) {
        newSortOrder = -1;
      } else if (query.sortOrder === -1) {
        newSortOrder = null;
        field = null;
      }
    }

    const newQuery = {
      ...query,
      sortField: field,
      sortOrder: newSortOrder,
    };

    const queryParams = JSON.stringify(newQuery);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const handleFilterChange = (field: string, value: string) => {
    // Update local state immediately for responsive UI
    setFilterValues(prev => ({ ...prev, [field]: value }));
  };

  // Debounce filter changes
  useEffect(() => {
    const currentFilterValues = {
      name: query.filters.name.value || '',
      address: query.filters.address.value || '',
      email: query.filters.email.value || '',
      phoneNumber: query.filters.phoneNumber.value || '',
    };

    const filtersChanged =
      filterValues.name !== currentFilterValues.name ||
      filterValues.address !== currentFilterValues.address ||
      filterValues.email !== currentFilterValues.email ||
      filterValues.phoneNumber !== currentFilterValues.phoneNumber;

    if (!filtersChanged) {
      return;
    }

    const timer = setTimeout(() => {
      const newFilters = {
        ...query.filters,
        name: { value: filterValues.name || null, matchMode: FilterMatchMode.CONTAINS },
        address: { value: filterValues.address || null, matchMode: FilterMatchMode.CONTAINS },
        email: { value: filterValues.email || null, matchMode: FilterMatchMode.CONTAINS },
        phoneNumber: { value: filterValues.phoneNumber || null, matchMode: FilterMatchMode.CONTAINS },
      };

      const newQuery = {
        ...query,
        first: 0,
        page: 0,
        filters: newFilters,
      };

      const queryParams = JSON.stringify(newQuery);
      setSearchParams({ query: queryParams }, { replace: true });
    }, 500);

    return () => clearTimeout(timer);
  }, [filterValues, query.filters]);

  const handlePageChange = (newPage: number) => {
    const newQuery = {
      ...query,
      page: newPage,
      first: newPage * query.rows,
    };

    const queryParams = JSON.stringify(newQuery);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const handleRowsPerPageChange = (newRows: number) => {
    const newQuery = {
      ...query,
      rows: newRows,
      page: 0,
      first: 0,
    };

    const queryParams = JSON.stringify(newQuery);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const currentPage = query.page || 0;
  const totalPages = Math.ceil(totalItems / query.rows);

  const SortIcon = ({ field }: { field: string }) => {
    if (query.sortField !== field) {
      return <ChevronUp className="h-3 w-3 opacity-30" />;
    }
    return query.sortOrder === 1 ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  return (
    <PageWrapper>
      <Card>
        <CardHeader className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">
              <Translate contentKey={'tempApp.supplier.title'}>Suppliers</Translate>
            </CardTitle>
            <div className="flex gap-2">
              <ImportButton type={'SUPPLIER'} />

              <Button
                variant="secondary"
                onClick={handleSyncList}
                disabled={loading}
                className="h-8 text-xs"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                {translate("common.refreshList")}
              </Button>

              {/* TODO: Uncomment export buttons when backend is implemented */}
              {/* <Button variant="outline" className="h-8 text-xs" onClick={confirmBulkExport} disabled={selectedSuppliers.length === 0 || isLoadingAction}>
                <Download className="h-4 w-4 mr-1" />
                Export Selected
              </Button>
              <Button variant="outline" className="h-8 text-xs" onClick={confirmExportAll} disabled={loading || isLoadingAction}>
                <FileDown className="h-4 w-4 mr-1" />
                Export All
              </Button> */}

              <Button
                onClick={handleCreate}
                disabled={loading}
                className="h-8 text-xs"
              >
                <Plus className="h-4 w-4 mr-1" />
                {translate("tempApp.supplier.createNew")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* TODO: Uncomment selection column when export is implemented */}
                  {/* <TableHead className="text-xs w-12">
                    <input type="checkbox" />
                  </TableHead> */}
                  <TableHead className="text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        {translate('common.name')}
                        <SortIcon field="name" />
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSort('address')}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        {translate('common.address')}
                        <SortIcon field="address" />
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        {translate('common.email')}
                        <SortIcon field="email" />
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSort('phoneNumber')}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        {translate('common.phone')}
                        <SortIcon field="phoneNumber" />
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="text-xs text-center w-16">{translate('common.edit')}</TableHead>
                  <TableHead className="text-xs text-center w-16">{translate('common.delete')}</TableHead>
                </TableRow>
                <TableRow>
                  {/* TODO: Uncomment when export is implemented */}
                  {/* <TableHead className="p-1"></TableHead> */}
                  <TableHead className="p-1">
                    <Input
                      placeholder={translate('common.search.name')}
                      className="h-7 text-xs"
                      value={filterValues.name}
                      onChange={(e) => handleFilterChange('name', e.target.value)}
                    />
                  </TableHead>
                  <TableHead className="p-1">
                    <Input
                      placeholder={translate('common.search.address')}
                      className="h-7 text-xs"
                      value={filterValues.address}
                      onChange={(e) => handleFilterChange('address', e.target.value)}
                    />
                  </TableHead>
                  <TableHead className="p-1">
                    <Input
                      placeholder={translate('common.search.email')}
                      className="h-7 text-xs"
                      value={filterValues.email}
                      onChange={(e) => handleFilterChange('email', e.target.value)}
                    />
                  </TableHead>
                  <TableHead className="p-1">
                    <Input
                      placeholder={translate('common.search.phone')}
                      className="h-7 text-xs"
                      value={filterValues.phoneNumber}
                      onChange={(e) => handleFilterChange('phoneNumber', e.target.value)}
                    />
                  </TableHead>
                  <TableHead className="p-1"></TableHead>
                  <TableHead className="p-1"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && supplierList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : supplierList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs py-4">
                      No suppliers found
                    </TableCell>
                  </TableRow>
                ) : (
                  supplierList.map((supplier) => (
                    <TableRow key={supplier.id}>
                      {/* TODO: Uncomment when export is implemented */}
                      {/* <TableCell className="text-xs">
                        <input type="checkbox" />
                      </TableCell> */}
                      <TableCell className="text-xs">
                        <Link to={`/inventory/supplier/${supplier.id}/edit`} className="text-primary hover:underline">
                          {supplier.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">{supplier.address}</TableCell>
                      <TableCell className="text-xs">{supplier.email}</TableCell>
                      <TableCell className="text-xs">{supplier.phoneNumber}</TableCell>
                      <TableCell className="text-xs text-center">
                        <Link to={`/inventory/supplier/${supplier.id}/edit`}>
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer inline" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <Link to={`/inventory/supplier/${supplier.id}/delete`}>
                          <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80 cursor-pointer inline" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows per page:</span>
              <select
                value={query.rows}
                onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                className="h-7 text-xs border rounded px-2"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {query.first + 1}-{Math.min(query.first + query.rows, totalItems)} of {totalItems}
              </span>

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handlePageChange(0)}
                  disabled={currentPage === 0}
                >
                  &#171;
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  &#8249;
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  &#8250;
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  &#187;
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default Supplier;
