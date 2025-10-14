import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { RefreshCw, Plus, Pencil, Trash2, Eye, Handshake, CalendarIcon } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, filterEntities } from './purchase-order.reducer';
import { searchEntities as searchSuppliers, getEntities as getSuppliers } from '../supplier/supplier.reducer';
import { searchEntities as searchWarehouses, getEntities as getWarehouses } from '../warehouse/warehouse.reducer';

import { IPurchaseOrder } from "app/shared/model/STOCK/purchase-order.model";
import { FilterMatchMode } from "primereact/api";
import _ from "lodash";
import Select from "react-select";
import { toLocalISOString } from "app/shared/util/date-utils";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { format } from 'date-fns';

const initialState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    "warehouse.id": { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    'supplier.id': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    status: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    id: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    dateDelivered: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    datePlaced: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  }
};

export const PurchaseOrder = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [searchTermSupplier, setSearchTermSupplier] = useState('');
  const [searchTermWarehouse, setSearchTermWarehouse] = useState('');
  const [searchParam, setSearchParams] = useSearchParams();

  const query = JSON.parse(searchParam.get("query")) || initialState;

  const purchaseOrderList: IPurchaseOrder[] = useAppSelector(state => state.purchaseOrder.entities);
  const supplierList = useAppSelector(state => state.supplier.entities);
  const warehouseList = useAppSelector(state => state.warehouse.entities);

  const loading = useAppSelector(state => state.purchaseOrder.loading);
  const totalItems = useAppSelector(state => state.purchaseOrder.totalItems);

  const searchParams = new URLSearchParams(location.search);
  const poAction = searchParams.get('poAction');

  // State for flashing effect
  const [flashReturn, setFlashReturn] = useState(false);
  const [flashHighlight, setFlashHighlight] = useState(false);

  useEffect(() => {
    if (poAction === 'true') {
      setFlashReturn(true);
      // Start with highlight on.
      setFlashHighlight(true);
      let count = 0;
      const interval = setInterval(() => {
        setFlashHighlight(prev => !prev);
        count++;
        if (count >= 6) {
          clearInterval(interval);
          setFlashReturn(false);
          setFlashHighlight(false);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [poAction]);

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      filterEntities({
        query: updatedQuery,
      })
    );
  };

  useEffect(() => {
    getAllEntities();
  }, [searchParam]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const onFilter = (field: string, value: any) => {
    const newQuery = {
      ...query,
      first: 0,
      page: 0,
      filters: {
        ...query.filters,
        [field]: { value, matchMode: 'equals' }
      }
    };
    const queryParams = JSON.stringify(newQuery);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const onPage = (newPage: number) => {
    const newQuery = {
      ...query,
      first: (newPage - 1) * query.rows,
      page: newPage - 1
    };
    const queryParams = JSON.stringify(newQuery);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const getSeverity = (status: string) => {
    switch (status) {
      case 'PLACED':
        return 'default';
      case 'RECEIVED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleFilterDateChange = (date: Date, field: string) => {
    const newQueryWithStatus = JSON.stringify({
      ...query,
      filters: {
        ...query.filters,
        [field]: { value: toLocalISOString(date), matchMode: 'startsWith' }
      }
    });
    setSearchParams({ query: newQueryWithStatus }, { replace: true });
  };

  const statusDropdownItems = [
    { name: 'All', id: null },
    { name: 'Placed', id: "PLACED" },
    { name: 'Received', id: "RECEIVED" },
  ];

  useEffect(() => {
    const searchAction = () => {
      if (searchTermSupplier) {
        dispatch(searchSuppliers({
          query: searchTermSupplier
        }));
      } else {
        dispatch(getSuppliers({}));
      }

      if (searchTermWarehouse) {
        dispatch(searchWarehouses({
          query: searchTermWarehouse
        }));
      } else {
        dispatch(getWarehouses({}));
      }
    };

    const debouncedSearchAction = _.debounce(searchAction, 500);
    debouncedSearchAction();

    return () => {
      debouncedSearchAction.cancel();
    };
  }, [searchTermSupplier, searchTermWarehouse]);

  const handleCreate = () => {
    navigate(`/inventory/purchase-order/new?query=${JSON.stringify(query)}`);
  };

  const currentPage = query.page + 1;
  const totalPages = Math.ceil(totalItems / query.rows);

  if (loading && !purchaseOrderList?.length) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">
            <Translate contentKey={'tempApp.purchaseOrder.title'}>Purchase Orders</Translate>
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleSyncList} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {translate("common.refreshList")}
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={handleCreate} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              {translate("tempApp.purchaseOrder.addNew")}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>{translate('tempApp.purchaseOrder.warehouse')}</div>
                    <Select
                      options={warehouseList}
                      value={warehouseList.find(w => w.id === query?.filters?.['warehouse.id']?.value) || null}
                      onChange={selectedWarehouse => onFilter('warehouse.id', selectedWarehouse?.id || null)}
                      getOptionLabel={(option) => option.name}
                      getOptionValue={(option) => option.id}
                      isClearable
                      placeholder={translate('tempApp.purchaseOrder.search.warehouse')}
                      onInputChange={(value) => setSearchTermWarehouse(value)}
                      styles={{
                        control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                        option: (base) => ({ ...base, fontSize: '0.75rem' }),
                        menu: (base) => ({ ...base, fontSize: '0.75rem' })
                      }}
                    />
                  </div>
                </TableHead>

                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>{translate('tempApp.purchaseOrder.supplier')}</div>
                    <Select
                      options={supplierList}
                      value={supplierList.find(s => s.id === query?.filters?.['supplier.id']?.value) || null}
                      onChange={selectedSupplier => onFilter('supplier.id', selectedSupplier?.id || null)}
                      getOptionLabel={(option) => option.name}
                      getOptionValue={(option) => option.id}
                      isClearable
                      placeholder={translate('tempApp.purchaseOrder.search.supplier')}
                      onInputChange={(value) => setSearchTermSupplier(value)}
                      styles={{
                        control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                        option: (base) => ({ ...base, fontSize: '0.75rem' }),
                        menu: (base) => ({ ...base, fontSize: '0.75rem' })
                      }}
                    />
                  </div>
                </TableHead>

                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>{translate('common.datePlaced')}</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs w-full justify-start">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {query?.filters?.datePlaced?.value ? format(new Date(query.filters.datePlaced.value), 'PP') : translate('common.search.datePlaced')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={query?.filters?.datePlaced?.value ? new Date(query.filters.datePlaced.value) : undefined}
                          onSelect={(date) => date && handleFilterDateChange(date, 'datePlaced')}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>

                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>{translate('common.dateDelivered')}</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs w-full justify-start">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {query?.filters?.dateDelivered?.value ? format(new Date(query.filters.dateDelivered.value), 'PP') : translate('common.search.dateDelivered')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={query?.filters?.dateDelivered?.value ? new Date(query.filters.dateDelivered.value) : undefined}
                          onSelect={(date) => date && handleFilterDateChange(date, 'dateDelivered')}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>

                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>{translate('common.status')}</div>
                    <Select
                      options={statusDropdownItems}
                      value={statusDropdownItems.find(s => s.id === query?.filters?.status?.value) || null}
                      onChange={selectedStatus => onFilter('status', selectedStatus?.id || null)}
                      getOptionLabel={(option) => option.name}
                      getOptionValue={(option) => option.id}
                      isClearable
                      placeholder={translate("common.search.points")}
                      styles={{
                        control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                        option: (base) => ({ ...base, fontSize: '0.75rem' }),
                        menu: (base) => ({ ...base, fontSize: '0.75rem' })
                      }}
                    />
                  </div>
                </TableHead>

                <TableHead className="text-xs">Order Lines Total</TableHead>
                <TableHead className="text-xs">Cost Lines Total</TableHead>
                <TableHead className="text-xs">Item Name</TableHead>
                <TableHead className="text-xs w-16 text-center">{translate('common.return')}</TableHead>
                <TableHead className="text-xs w-16 text-center">{translate('common.view')}</TableHead>
                <TableHead className="text-xs w-16 text-center">{translate('common.delete')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrderList && purchaseOrderList.length > 0 ? (
                purchaseOrderList.map((purchaseOrder) => {
                  const editUrl = `/inventory/purchase-order/${purchaseOrder.id}/edit?&query=${JSON.stringify(query)}`;
                  const deleteUrl = `/inventory/purchase-order/${purchaseOrder.id}/delete?&query=${JSON.stringify(query)}`;
                  const supplierReturnUrl = `/inventory/supplier-return/new?poId=${purchaseOrder.id}`;

                  const highlightStyle = flashReturn && flashHighlight
                    ? 'bg-yellow-200 transition-colors duration-500'
                    : '';

                  return (
                    <TableRow key={purchaseOrder.id}>
                      <TableCell className="text-xs">{purchaseOrder.warehouse?.name}</TableCell>
                      <TableCell className="text-xs">{purchaseOrder.supplier?.name}</TableCell>
                      <TableCell className="text-xs">
                        {purchaseOrder?.datePlaced ? (typeof purchaseOrder.datePlaced === 'string' ? purchaseOrder.datePlaced.split("T")?.[0] : purchaseOrder.datePlaced.toISOString().split("T")?.[0]) : ''}
                      </TableCell>
                      <TableCell className="text-xs">
                        {purchaseOrder?.dateDelivered ? (typeof purchaseOrder.dateDelivered === 'string' ? purchaseOrder.dateDelivered.split("T")?.[0] : purchaseOrder.dateDelivered.toISOString().split("T")?.[0]) : ''}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={getSeverity(purchaseOrder.status)}>{purchaseOrder.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {purchaseOrder?.orderLines?.reduce((acc, line) => acc + ((line.quantity || 0) * (line.price || 0)), 0).toFixed(2) || 0}
                      </TableCell>
                      <TableCell className="text-xs">
                        {purchaseOrder?.costLines?.reduce((acc, line) => acc + (line.cost || 0), 0).toFixed(2) || 0}
                      </TableCell>
                      <TableCell className="text-xs">
                        {(() => {
                          const names = purchaseOrder?.orderLines?.map(line => line.item?.name).filter(Boolean) || [];
                          const displayed = names.slice(0, 3).join(', ');
                          return names.length > 3 ? `${displayed}, ...` : displayed;
                        })()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Link to={supplierReturnUrl} className={`inline-block p-1 rounded ${highlightStyle}`}>
                          <Handshake className="h-5 w-5" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        {purchaseOrder?.status === "RECEIVED" ? (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigate(editUrl)}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                            <Link to={editUrl}>
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                          <Link to={deleteUrl}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center text-xs">
                    <Translate contentKey="entity.noResults" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) onPage(currentPage - 1);
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onPage(pageNum);
                      }}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) onPage(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </PageWrapper>
  );
};

export default PurchaseOrder;
