import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './inventory-items.reducer';
import _ from "lodash";
import { formatVariant } from 'app/shared/util/variant-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Plus, RefreshCw, ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import DropDownFilter from 'app/shared/components/filter/drop-down-filter';
import { IStockQuantity } from 'app/shared/model/STOCK/stock-quantity.model';
import StockQuantityModal from './stock-quantity-modal';

export const StockConfig = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const [queryParams, setQueryParams] = useState({
    size: 10,
    page: 0,
    sort: 'asc',
    first: 0,
    query: null as string | null,
    branchId: null as string | null,
  });

  const inventoryItemList = useAppSelector(state => state.inventoryItem.entities);
  const loading = useAppSelector(state => state.inventoryItem.loading);
  const totalItems = useAppSelector(state => state.inventoryItem.totalItems);

  const [filters, setFilters] = useState({
    name: '',
  });

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editedStockQuantity, setEditedStockQuantity] = useState<IStockQuantity | null>(null);
  const [isStockQuantityModalOpen, setIsStockQuantityModalOpen] = useState(false);

  const selectedBranchId = queryParams.branchId;

  const getAllEntities = () => {
    if (queryParams?.query) {
      dispatch(searchEntities(queryParams));
    } else {
      dispatch(getEntities(queryParams));
    }
  };

  useEffect(() => {
    getAllEntities();
  }, [queryParams.page, queryParams.sort, queryParams.size, queryParams.query, queryParams.branchId]);

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
      first: page * prevState.size,
      page
    }));
  };

  const onNameFilterChange = _.debounce((value: string) => {
    setQueryParams((prevState) => ({
      ...prevState,
      first: 0,
      page: 0,
      query: value ? `name=${value}` : null,
    }));
  }, 200);

  const handleSyncList = () => {
    getAllEntities();
  };

  const getBranchStockQuantities = (stockQuantities: IStockQuantity[] = []) => {
    if (!selectedBranchId) {
      return [];
    }

    return stockQuantities.filter(stock => (stock.location as any)?.branch?.id === selectedBranchId);
  };

  const getBranchQuantity = (stockQuantities: IStockQuantity[] = []) => {
    const filteredStock = getBranchStockQuantities(stockQuantities);
    if (filteredStock.length === 0) {
      return '-';
    }

    const totalQuantity = filteredStock.reduce((sum, stock) => sum + (Number(stock.quantity) || 0), 0);
    return totalQuantity;
  };

  const getBranchUnitCost = (stockQuantities: IStockQuantity[] = []) => {
    const costs = getBranchStockQuantities(stockQuantities)
      .map(stock => Number(stock.unitCost))
      .filter(cost => !Number.isNaN(cost));

    if (costs.length === 0) {
      return '-';
    }

    const averageCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    return averageCost;
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

  const toggleStockQuantityModal = () => {
    setIsStockQuantityModalOpen(prevState => {
      const nextState = !prevState;
      if (!nextState) {
        setEditedStockQuantity(null);
      }
      return nextState;
    });
  };

  const getEditableBranchStockQuantity = (stockQuantities: IStockQuantity[] = []) => {
    const branchStockQuantities = getBranchStockQuantities(stockQuantities);
    return branchStockQuantities[0] ?? null;
  };

  const stockEditBodyTemplate = (rowData) => {
    const editableStockQuantity = getEditableBranchStockQuantity(rowData.stockQuantities);

    if (!editableStockQuantity) {
      return '-';
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => {
          setEditedStockQuantity(editableStockQuantity);
          setIsStockQuantityModalOpen(true);
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    );
  };

  const renderVariantRow = (data) => {
    const variantsWithItemId = data.variants.map(variant => ({
      ...variant,
      itemId: data.id
    }));

    return (
      <TableRow>
        <TableCell colSpan={3} className="bg-muted/50">
          <div className="p-3">
            <h4 className="text-sm font-semibold mb-2">{data.name} Variants</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs bg-muted/30">{translate("common.variantName")}</TableHead>
                  <TableHead className="text-xs bg-muted/30">{translate("common.price")}</TableHead>
                  <TableHead className="text-xs bg-muted/30">{translate("common.sku")}</TableHead>
                  {selectedBranchId && (
                    <TableHead className="text-xs bg-muted/30">{translate("items.update.stockQuantity.quantity")}</TableHead>
                  )}
                  {selectedBranchId && (
                    <TableHead className="text-xs bg-muted/30">{translate("items.update.stockQuantity.unitCost")}</TableHead>
                  )}
                  {selectedBranchId && (
                    <TableHead className="text-xs bg-muted/30 w-20 text-center">Edit Stock</TableHead>
                  )}
                  <TableHead className="text-xs bg-muted/30 w-24">{translate("tempApp.stockConfig.purchaseConfig")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variantsWithItemId.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="text-xs bg-muted/30">{formatVariant(variant?.name, variant?.attributeValues)}</TableCell>
                    <TableCell className="text-xs bg-muted/30">{variant.price}</TableCell>
                    <TableCell className="text-xs bg-muted/30">{variant.sku}</TableCell>
                    {selectedBranchId && (
                      <TableCell className="text-xs bg-muted/30">{getBranchQuantity(variant.stockQuantities)}</TableCell>
                    )}
                    {selectedBranchId && (
                      <TableCell className="text-xs bg-muted/30">{getBranchUnitCost(variant.stockQuantities)}</TableCell>
                    )}
                    {selectedBranchId && (
                      <TableCell className="text-xs bg-muted/30 text-center">{stockEditBodyTemplate(variant)}</TableCell>
                    )}
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
    <PageWrapper>
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
              <div className="space-y-2">
                <div>Item Name</div>
                <Input
                  type="text"
                  className="h-7 text-xs"
                  placeholder="Search"
                  value={filters.name}
                  onChange={(e) => {
                    setFilters({ ...filters, name: e.target.value });
                    onNameFilterChange(e.target.value);
                  }}
                />
              </div>
            </TableHead>
            <TableHead className="text-xs min-w-[220px]">
              <div className="space-y-2">
                <div>Branch</div>
                <DropDownFilter
                  classname={'w-full'}
                  placeholder={'Select Branch'}
                  dropDownOptionType={'BRANCH'}
                  selectedOption={selectedBranchId}
                  fieldName={'branchId'}
                  handleDropdownChange={(fieldName, value) => {
                    setQueryParams(prevState => ({
                      ...prevState,
                      first: 0,
                      page: 0,
                      branchId: value?.value || null,
                    }));
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
                <TableCell className="text-xs"></TableCell>
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

      {editedStockQuantity ? (
        <StockQuantityModal
          isOpen={isStockQuantityModalOpen}
          stockQuantity={editedStockQuantity}
          toggle={toggleStockQuantityModal}
          onSaved={() => {
            getAllEntities();
          }}
        />
      ) : null}
    </PageWrapper>
  );
};

export default StockConfig;
