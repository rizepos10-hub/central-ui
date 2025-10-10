import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './inventory-items.reducer';
import { IQueryParams } from "app/shared/reducers/reducer.utils";
import _ from "lodash";
import { formatVariant } from 'app/shared/util/variant-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Ban, Settings, Plus, RefreshCw, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const StockConfig = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const [queryParams, setQueryParams] = useState({
    size: 10,
    page: 0,
    sort: 'asc',
    first: 0,
    query: null
  })

  const inventoryItemList = useAppSelector(state => state.inventoryItem.entities);
  const loading = useAppSelector(state => state.inventoryItem.loading);
  const totalItems = useAppSelector(state => state.inventoryItem.totalItems);

  const [filters, setFilters] = useState({
    name: '',
  });

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());


  const getAllEntities = () => {
    if (queryParams?.query) {
      dispatch(searchEntities(queryParams));
    } else {
      dispatch(getEntities(queryParams));
    }
  };

  useEffect(() => {
    getAllEntities();
  }, [queryParams.page, queryParams.sort, queryParams.size, queryParams.query]);

  const expandAll = () => {
    const _expandedRows = new Set<string>();
    inventoryItemList.forEach((p) => _expandedRows.add(p.id));
    setExpandedRows(_expandedRows);
  };

  const collapseAll = () => {
    setExpandedRows(new Set());
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };


  const onPage = (page: number) => {
    setQueryParams(prevState => ({
      ...prevState,
      first: page * queryParams.size,
      page
    }));
  };

  const onFilterChange = _.debounce((name: string, value: string) => {
    const newQuery = value ? `name=${value}` : null;

    setQueryParams((prevState) => ({
      ...prevState,
      query: newQuery
    }));
  }, 200);


  const handleSyncList = () => {
    getAllEntities();
  };


  const quantityConfigBodyTemplate = (rowData) => {
    const { stockQuantities: quantity } = rowData;
    const editUrl = `/inventory/stock/stock-quantity/${rowData?.id}/edit?variantId=${rowData.id}&itemId=${rowData.itemId}&variantName=${rowData?.name}&page=${queryParams.page}&sort=${queryParams.sort}&first=${queryParams.first},${queryParams.size}`;

    const icon = quantity?.length > 0 ? <Wallet className="h-4 w-4" /> : <Ban className="h-4 w-4 text-muted-foreground" />;
    const handleClick = () => {
      navigate(editUrl)
    }
    return quantity?.length > 0 ?
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleClick}>{icon}</Button> :
      <span className="inline-flex items-center justify-center">{icon}</span>;
  };

  const purchaseConfigBodyTemplate = (rowData) => {
    const { itemPurchasingConfig: config } = rowData;

    const createUrl = `/inventory/stock/purchase-config/new?variantId=${rowData.id}&itemId=${rowData.itemId}`
    const editUrl = `/inventory/stock/purchase-config/${config?.id}/edit?page=${queryParams.page}&sort=${queryParams.sort}&first=${queryParams.first},${queryParams.size}`;

    const icon = config ? <Settings className="h-4 w-4" /> : <Plus className="h-4 w-4" />;

    const handleClick = () => {
      if (!config) {
        navigate(createUrl);
      } else {
        navigate(editUrl)
      }
    }

    return <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleClick}>{icon}</Button>;
  };

  const renderVariantRow = (data) => {
    const variantsWithItemId = data.variants.map(variant => ({
      ...variant,
      itemId: data.id
    }));

    return (
      <TableRow>
        <TableCell colSpan={2} className="bg-muted/50">
          <div className="p-3">
            <h4 className="text-sm font-semibold mb-2">{data.name} Variants</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs bg-muted/30">{translate("common.variantName")}</TableHead>
                  <TableHead className="text-xs bg-muted/30">{translate("common.price")}</TableHead>
                  <TableHead className="text-xs bg-muted/30">{translate("common.sku")}</TableHead>
                  <TableHead className="text-xs bg-muted/30 w-24">{translate("common.details")}</TableHead>
                  <TableHead className="text-xs bg-muted/30 w-24">{translate("tempApp.stockConfig.purchaseConfig")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variantsWithItemId.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="text-xs bg-muted/30">{formatVariant(variant?.name, variant?.attributeValues)}</TableCell>
                    <TableCell className="text-xs bg-muted/30">{variant.price}</TableCell>
                    <TableCell className="text-xs bg-muted/30">{variant.sku}</TableCell>
                    <TableCell className="text-xs bg-muted/30 text-center">{quantityConfigBodyTemplate(variant)}</TableCell>
                    <TableCell className="text-xs bg-muted/30 text-center">{purchaseConfigBodyTemplate(variant)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span className="text-xl font-bold"><Translate contentKey={'tempApp.stockConfig.title'}>StockConfigs</Translate></span>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleSyncList} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {translate("common.refreshList")}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={expandAll}>
            <ChevronDown className="h-4 w-4 mr-2" />
            {translate("common.expandAll")}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={collapseAll}>
            <ChevronRight className="h-4 w-4 mr-2" />
            {translate("common.collapseAll")}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs w-12"></TableHead>
            <TableHead className="text-xs">
              <div className="space-y-1">
                <div>Item Name</div>
                <Input
                  type="text"
                  className="h-7 text-xs"
                  placeholder="Search"
                  value={filters.name}
                  onChange={(e) => {
                    setFilters({ ...filters, name: e.target.value });
                    onFilterChange('name', e.target.value);
                  }}
                />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventoryItemList?.map((item) => (
            <React.Fragment key={item.id}>
              <TableRow>
                <TableCell className="text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleRow(item.id)}
                  >
                    {expandedRows.has(item.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Button>
                </TableCell>
                <TableCell className="text-xs">{item.name}</TableCell>
              </TableRow>
              {expandedRows.has(item.id) && renderVariantRow(item)}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

      {totalItems > queryParams.size && (
        <div className="flex items-center justify-between px-2 py-3 border-t mt-4">
          <div className="text-xs text-muted-foreground">
            Showing {queryParams.first + 1} - {Math.min(queryParams.first + queryParams.size, totalItems)} of {totalItems}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (queryParams.page > 0) onPage(queryParams.page - 1);
                  }}
                  className={queryParams.page === 0 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {(() => {
                const totalPages = Math.ceil(totalItems / queryParams.size);
                const currentPage = queryParams.page;
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
                        isActive={queryParams.page === pageNum}
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
                    if (queryParams.page < Math.ceil(totalItems / queryParams.size) - 1) {
                      onPage(queryParams.page + 1);
                    }
                  }}
                  className={queryParams.page >= Math.ceil(totalItems / queryParams.size) - 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default StockConfig;
