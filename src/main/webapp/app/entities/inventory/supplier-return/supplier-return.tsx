import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import Select from 'app/shared/components/select/select';

import { searchEntities, getEntities } from './supplier-return.reducer';
import { ISupplierReturn } from 'app/shared/model/STOCK/supplier-return.model';

export const SupplierReturn = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const supplierReturnList = useAppSelector(state => state.supplierReturn.entities);
  const loading = useAppSelector(state => state.supplierReturn.loading);
  const totalItems = useAppSelector(state => state.supplierReturn.totalItems);

  const [filters, setFilters] = useState({
    id: '',
    purchaseOrderId: '',
    supplierName: '',
    status: null as string | null,
  });

  const getAllEntities = () => {
    if (search) {
      dispatch(
        searchEntities({
          query: search,
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
        })
      );
    }
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
  }, [paginationState.activePage, paginationState.order, paginationState.sort, search]);





  const handleSyncList = () => {
    sortEntities();
  };

  const handleCreate = () => {
    navigate('/inventory/purchase-order?poAction=true');
  };

  const getSeverity = (status: string) => {
    switch (status) {
      case 'PARKED':
        return 'warning';
      case 'COMPLETED':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const statusOptions = [
    { label: 'All', value: null },
    { label: 'Parked', value: 'PARKED' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  const filteredItems = useMemo(() => {
    return supplierReturnList.filter((item: ISupplierReturn) => {
      const matchesId = !filters.id || item.id?.toLowerCase().includes(filters.id.toLowerCase());
      const matchesPO = !filters.purchaseOrderId || item.purchaseOrder?.id?.toLowerCase().includes(filters.purchaseOrderId.toLowerCase());
      const matchesSupplier = !filters.supplierName || item.purchaseOrder?.supplier?.name?.toLowerCase().includes(filters.supplierName.toLowerCase());
      const matchesStatus = !filters.status || item.status === filters.status;
      return matchesId && matchesPO && matchesSupplier && matchesStatus;
    });
  }, [supplierReturnList, filters]);

  const currentPage = paginationState.activePage - 1;
  const pageSize = ITEMS_PER_PAGE;
  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (page: number) => {
    setPaginationState({
      ...paginationState,
      activePage: page + 1,
    });
  };
  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">
            <Translate contentKey="tempApp.supplierReturn.title">Supplier Returns</Translate>
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleSyncList} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {translate('common.refreshList')}
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={handleCreate} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              {translate('tempApp.supplierReturn.createNew')}
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">
                <div className="space-y-1">
                  <div>{translate('common.id')}</div>
                  <Input
                    className="h-7 text-xs"
                    placeholder={translate('common.search.id')}
                    value={filters.id}
                    onChange={(e) => setFilters({ ...filters, id: e.target.value })}
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs">
                <div className="space-y-1">
                  <div>{translate('tempApp.supplierReturn.purchaseOrder')}</div>
                  <Input
                    className="h-7 text-xs"
                    placeholder={translate('tempApp.supplierReturn.search.purchaseOrder')}
                    value={filters.purchaseOrderId}
                    onChange={(e) => setFilters({ ...filters, purchaseOrderId: e.target.value })}
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs">
                <div className="space-y-1">
                  <div>{translate('tempApp.supplierReturn.supplier')}</div>
                  <Input
                    className="h-7 text-xs"
                    placeholder={translate('tempApp.supplierReturn.search.supplier')}
                    value={filters.supplierName}
                    onChange={(e) => setFilters({ ...filters, supplierName: e.target.value })}
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs">
                <div className="space-y-1">
                  <div>{translate('common.status')}</div>
                  <Select
                    options={statusOptions}
                    value={statusOptions.find(opt => opt.value === filters.status)}
                    onChange={(option) => setFilters({ ...filters, status: option?.value })}
                    placeholder={translate('common.search.points')}
                    isClearable
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs w-24">
                {translate('common.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item: ISupplierReturn) => {
              const editUrl = `/inventory/supplier-return/${item.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
              const deleteUrl = `/inventory/supplier-return/${item.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

              return (
                <TableRow key={item.id}>
                  <TableCell className="text-xs">
                    <Link to={editUrl} className="hover:underline">
                      {item.id}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.purchaseOrder?.id}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.purchaseOrder?.supplier?.name}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={getSeverity(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                        <Link to={editUrl}>
                          <Pencil className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                        <Link to={deleteUrl}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {totalItems > pageSize && (
          <div className="flex items-center justify-between px-2 py-3 border-t">
            <div className="text-xs text-muted-foreground">
              Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 0) handlePageChange(currentPage - 1);
                    }}
                    className={currentPage === 0 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {(() => {
                  const pages = [];

                  if (totalPages <= 7) {
                    for (let i = 0; i < totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    if (currentPage < 3) {
                      pages.push(0, 1, 2, 3, -1, totalPages - 1);
                    } else if (currentPage > totalPages - 4) {
                      pages.push(0, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
                    } else {
                      pages.push(0, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages - 1);
                    }
                  }

                  return pages.map((pageNum, idx) => {
                    if (pageNum === -1) {
                      return (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  });
                })()}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages - 1) handlePageChange(currentPage + 1);
                    }}
                    className={currentPage >= totalPages - 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default SupplierReturn;
