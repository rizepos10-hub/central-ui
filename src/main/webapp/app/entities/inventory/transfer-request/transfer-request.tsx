import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './transfer-request.reducer';
import { ITransferRequest } from "app/shared/model/STOCK/transfer-request.model";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Select from 'react-select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const TransferRequest = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const transferRequestList: ITransferRequest[] = useAppSelector(state => state.transferRequest.entities);
  const loading = useAppSelector(state => state.transferRequest.loading);
  const totalItems = useAppSelector(state => state.transferRequest.totalItems);

  const [filters, setFilters] = useState({
    sourceName: '',
    destinationName: '',
    status: null,
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
    navigate('/inventory/transfer-request/new');
  };

  const getSeverity = (status: string) => {
    switch (status) {
      case 'PLACED':
        return 'warning';
      case 'CONFIRMED':
        return 'default';
      case 'COMPLETED':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const statusOptions = [
    { label: 'All', value: null },
    { label: 'Placed', value: 'PLACED' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  const filteredData = transferRequestList.filter((item) => {
    const sourceMatch = !filters.sourceName || item?.source?.name?.toLowerCase().includes(filters.sourceName.toLowerCase());
    const destinationMatch = !filters.destinationName || item?.destination?.name?.toLowerCase().includes(filters.destinationName.toLowerCase());
    const statusMatch = !filters.status || item.status === filters.status;
    return sourceMatch && destinationMatch && statusMatch;
  });

  const onPage = (page: number) => {
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
            <Translate contentKey={'tempApp.transferRequest.title'}>Transfer Requests</Translate>
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleSyncList} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {translate("common.refreshList")}
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={handleCreate} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              {translate("tempApp.transferRequest.createNew")}
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">
                <div className="space-y-1">
                  <div>{translate('tempApp.transferRequest.source')}</div>
                  <Input
                    className="h-7 text-xs"
                    placeholder={translate('tempApp.transferRequest.search.source')}
                    value={filters.sourceName}
                    onChange={(e) => setFilters({ ...filters, sourceName: e.target.value })}
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs">
                <div className="space-y-1">
                  <div>{translate('tempApp.transferRequest.destination')}</div>
                  <Input
                    className="h-7 text-xs"
                    placeholder={translate('tempApp.transferRequest.search.destination')}
                    value={filters.destinationName}
                    onChange={(e) => setFilters({ ...filters, destinationName: e.target.value })}
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
                    placeholder={translate("common.search.status")}
                    styles={{
                      control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                      option: (base) => ({ ...base, fontSize: '0.75rem' }),
                      menu: (base) => ({ ...base, fontSize: '0.75rem' }),
                      singleValue: (base) => ({ ...base, fontSize: '0.75rem' }),
                    }}
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs w-16">{translate('common.edit')}</TableHead>
              <TableHead className="text-xs w-16">{translate('common.delete')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => {
              const editUrl = `/inventory/transfer-request/${item.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
              const deleteUrl = `/inventory/transfer-request/${item.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

              return (
                <TableRow key={item.id}>
                  <TableCell className="text-xs">
                    <Link to={editUrl} className="text-primary hover:underline">
                      {item?.source?.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{item?.destination?.name}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={getSeverity(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Link to={editUrl}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Link to={deleteUrl}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {totalItems > ITEMS_PER_PAGE && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (paginationState.activePage > 1) onPage(paginationState.activePage - 2);
                  }}
                  className={paginationState.activePage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {(() => {
                const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
                const currentPage = paginationState.activePage - 1;
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
                          onPage(pageNum);
                        }}
                        isActive={paginationState.activePage - 1 === pageNum}
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
                    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
                    if (paginationState.activePage < totalPages) onPage(paginationState.activePage);
                  }}
                  className={paginationState.activePage >= Math.ceil(totalItems / ITEMS_PER_PAGE) ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </PageWrapper>
  );
};

export default TransferRequest;
