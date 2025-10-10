import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { RefreshCw, Plus } from 'lucide-react';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getToBeStockedEntities } from '../stock-config/stock-quantity.reducer';
import { IStockQuantity } from 'app/shared/model/STOCK/stock-quantity.model';
import { getEntities as getSuppliers, searchEntities as searchSuppliers } from '../supplier/supplier.reducer';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import Select from 'react-select';

export const ToBeStocked = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<IStockQuantity[]>([]);
  const [searchSupplier, setSearchSupplier] = useState('');
  const [supplierId, setSupplierId] = useState(null);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const toBeStockedList = useAppSelector(state => state.stockQuantity.entities);

  const supplierList = useAppSelector(state => state.supplier.entities);
  const loading = useAppSelector(state => state.stockQuantity.loading);
  const totalItems = useAppSelector(state => state.stockQuantity.totalItems);
  const [filters, setFilters] = useState({
    itemName: '',
    locationName: '',
    supplierName: '',
  });

  const getAllEntities = () => {
    dispatch(
      getToBeStockedEntities({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
        supplierId: supplierId || null
      })
    );
  };

  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (location.search !== endURL) {
      navigate(`${location.pathname}${endURL}`);
    }
  };

  const getAllSuppliers = () => {
    if (searchSupplier) {
      dispatch(
        searchSuppliers({
          query: searchSupplier,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    } else {
      dispatch(
        getSuppliers({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`
        })
      );
    }
  };

  useEffect(() => {
    sortEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort, supplierId]);

  useEffect(() => {
    getAllSuppliers()
  }, [searchSupplier]);

  const handleSyncList = () => {
    sortEntities();
  };

  const handleCreatePurchaseOrder = () => {
    const serializedItems = encodeURIComponent(JSON.stringify(selectedItems));
    const navigateUrl = `/inventory/purchase-order/new?items=${serializedItems}`;
    navigate(navigateUrl)
  }

  // Client-side filtering
  const filteredList = toBeStockedList.filter(item => {
    const matchesItemName = !filters.itemName || item.itemName?.toLowerCase().includes(filters.itemName.toLowerCase());
    const matchesLocation = !filters.locationName || item.location?.name?.toLowerCase().includes(filters.locationName.toLowerCase());
    const matchesSupplier = !filters.supplierName || item.supplierConfigurations?.some(config =>
      config.supplier?.name?.toLowerCase().includes(filters.supplierName.toLowerCase())
    );
    return matchesItemName && matchesLocation && matchesSupplier;
  });

  const statusBodyTemplate = (item) => {
    return (
      item?.supplierConfigurations
        ?.map((config) => config.supplier?.name)
        .join(' | ') || 'No Suppliers'
    );
  };

  const dropdownItems = [
    { label: 'All Suppliers', value: null },
    ...supplierList.map(supplier => ({
      label: supplier.name,
      value: supplier.id,
    })),
  ];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredList);
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (item: IStockQuantity, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, item]);
    } else {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    }
  };

  const isAllSelected = filteredList.length > 0 && selectedItems.length === filteredList.length;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < filteredList.length;

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">
            <Translate contentKey={'tempApp.stockConfig.toBeStocked'}>To Be Stocked</Translate>
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleSyncList} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {translate("common.refreshList")}
            </Button>
            {selectedItems.length > 0 && (
              <Button size="sm" className="h-8 text-xs" onClick={handleCreatePurchaseOrder} disabled={loading}>
                <Plus className="h-4 w-4 mr-1" />
                {translate("tempApp.purchaseOrder.addNew")}
              </Button>
            )}
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-12 text-center">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className="h-4 w-4"
                  />
                </TableHead>
                <TableHead className="text-xs">{translate('common.search.name')}</TableHead>
                <TableHead className="text-xs">{translate('tempApp.stockConfig.view.table.search.location')}</TableHead>
                <TableHead className="text-xs">{translate('tempApp.supplierReturn.supplier')}</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="text-xs"></TableHead>
                <TableHead className="text-xs">
                  <Input
                    type="text"
                    placeholder={translate('common.search.name')}
                    value={filters.itemName}
                    onChange={(e) => setFilters(prev => ({ ...prev, itemName: e.target.value }))}
                    className="h-7 text-xs"
                  />
                </TableHead>
                <TableHead className="text-xs">
                  <Input
                    type="text"
                    placeholder={translate('tempApp.stockConfig.view.table.search.location')}
                    value={filters.locationName}
                    onChange={(e) => setFilters(prev => ({ ...prev, locationName: e.target.value }))}
                    className="h-7 text-xs"
                  />
                </TableHead>
                <TableHead className="text-xs">
                  <Select
                    options={dropdownItems}
                    value={dropdownItems.find(opt => opt.value === supplierId)}
                    onChange={(selected) => setSupplierId(selected?.value)}
                    onInputChange={(inputValue) => setSearchSupplier(inputValue)}
                    placeholder="Select Supplier"
                    isClearable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '28px',
                        fontSize: '0.75rem',
                        borderColor: 'hsl(var(--input))',
                      }),
                      menu: (base) => ({
                        ...base,
                        fontSize: '0.75rem',
                      }),
                      input: (base) => ({
                        ...base,
                        margin: 0,
                        padding: 0,
                      }),
                      valueContainer: (base) => ({
                        ...base,
                        padding: '0 8px',
                      }),
                      indicatorsContainer: (base) => ({
                        ...base,
                        height: '28px',
                      }),
                    }}
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-xs text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredList.length > 0 ? (
                filteredList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs text-center">
                      <Checkbox
                        checked={selectedItems.some(i => i.id === item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item, checked === true)}
                        className="h-4 w-4"
                      />
                    </TableCell>
                    <TableCell className="text-xs">
                      <Link
                        to={`/product/${item.itemId}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                        className="text-blue-600 hover:underline"
                      >
                        {item?.itemName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">{item.location?.name}</TableCell>
                    <TableCell className="text-xs">{statusBodyTemplate(item)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-xs text-center text-muted-foreground">
                    <Translate contentKey="tempApp.stockConfig.noData">No items to be stocked</Translate>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ToBeStocked;
