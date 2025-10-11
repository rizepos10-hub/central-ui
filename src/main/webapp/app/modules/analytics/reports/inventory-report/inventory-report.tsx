import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntities, getEntities } from 'app/entities/inventory/stock-config/inventory-items.reducer';
import { FilterMatchMode } from "primereact/api";
import { IQueryParams } from "app/shared/reducers/reducer.utils";
import _ from "lodash";
import { formatVariant } from 'app/shared/util/variant-utils';
import { exportEntities } from "app/entities/item/retail/product/product.reducer";
import { PageWrapper } from "app/shared/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RefreshCw, FileDown, ChevronDown, ChevronRight, Settings, Loader2 } from "lucide-react";

export const InventoryReport = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [selectedStockQuantities, setSelectedStockQuantities] = useState([]);
  const [stockDialogVisible, setStockDialogVisible] = useState(false);
  const [queryParams, setQueryParams] = useState({
    size: 10,
    page: 0,
    sort: 'asc',
    first: 0,
    query: null
  })
  const [selectedActionOption, setSelectedActionOption] = useState(null)
  const inventoryItemList = useAppSelector(state => state.inventoryItem.entities);
  const loading = useAppSelector(state => state.inventoryItem.loading);
  const totalItems = useAppSelector(state => state.inventoryItem.totalItems);

  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    desc: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const handleOpenStockDialog = (variant) => {
    setSelectedStockQuantities(variant.stockQuantities || []);
    setStockDialogVisible(true);
  };

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
    const _expandedRows = {};
    inventoryItemList.forEach((p) => (_expandedRows[`${p.id}`] = true));
    setExpandedRows(_expandedRows);
  };

  const collapseAll = () => {
    setExpandedRows({});
  };

  const onFilter = _.debounce((field, value) => {
    const newQuery = `${field}=${value}`;
    setQueryParams((prevState) => ({
      ...prevState,
      query: newQuery
    }));
  }, 200);

  const handleSyncList = () => {
    getAllEntities();
  };

  const handleExportItems = async () => {
    setIsLoadingAction(true);
    await dispatch(exportEntities([])).finally(() => setIsLoadingAction(false));
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-semibold">Inventory Report</h1>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={handleSyncList}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={handleExportItems}
            disabled={isLoadingAction}
          >
            {isLoadingAction ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <FileDown className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={expandAll}
        >
          Expand All
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={collapseAll}
        >
          Collapse All
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs w-12"></TableHead>
              <TableHead className="text-xs">
                <div className="flex flex-col gap-1">
                  <span>Item Name</span>
                  <Input
                    type="text"
                    placeholder="Search"
                    className="h-6 text-xs"
                    onChange={(e) => onFilter('name', e.target.value)}
                  />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : inventoryItemList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-xs py-8 text-muted-foreground">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              inventoryItemList.map((item) => (
                <React.Fragment key={item.id}>
                  <TableRow>
                    <TableCell className="text-xs">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleRow(item.id)}
                      >
                        {expandedRows[item.id] ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-xs">{item.name}</TableCell>
                  </TableRow>
                  {expandedRows[item.id] && (
                    <TableRow>
                      <TableCell colSpan={2} className="bg-muted/30 p-3">
                        <div className="mb-2 font-semibold text-xs">{item.name} Variants</div>
                        <div className="rounded-lg border bg-background">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Variant Name</TableHead>
                                <TableHead className="text-xs text-right">Price</TableHead>
                                <TableHead className="text-xs w-32">Stock Config</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {item.variants?.map((variant) => (
                                <TableRow key={variant.id}>
                                  <TableCell className="text-xs">
                                    {formatVariant(variant?.name, variant?.attributeValues)}
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    {variant.price}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-xs"
                                      onClick={() => handleOpenStockDialog(variant)}
                                    >
                                      View Stocks
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-2 text-xs">
        <div className="text-muted-foreground">
          Showing {Math.min((queryParams.page * queryParams.size) + 1, totalItems)} to {Math.min((queryParams.page + 1) * queryParams.size, totalItems)} of {totalItems} items
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setQueryParams(prev => ({ ...prev, page: prev.page - 1, first: (prev.page - 1) * prev.size }))}
            disabled={queryParams.page === 0}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setQueryParams(prev => ({ ...prev, page: prev.page + 1, first: (prev.page + 1) * prev.size }))}
            disabled={(queryParams.page + 1) * queryParams.size >= totalItems}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Stock Dialog */}
      <Dialog open={stockDialogVisible} onOpenChange={setStockDialogVisible}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm">Stock Quantities</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs text-right">Quantity</TableHead>
                  <TableHead className="text-xs text-right">Unit Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedStockQuantities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs py-4 text-muted-foreground">
                      No stock quantities available
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedStockQuantities.map((stock, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs">{stock.location?.name}</TableCell>
                      <TableCell className="text-xs">{stock.location?.type}</TableCell>
                      <TableCell className="text-xs text-right">{stock.quantity}</TableCell>
                      <TableCell className="text-xs text-right">{stock.unitCost}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default InventoryReport;
