import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { RefreshCw, Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './warehouse.reducer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { IWarehouse } from 'app/shared/model/STOCK/warehouse.model';
import Select from 'react-select';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const Warehouse = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const warehouseList = useAppSelector(state => state.warehouse.entities);
  const loading = useAppSelector(state => state.warehouse.loading);
  const totalItems = useAppSelector(state => state.warehouse.totalItems);
  const [filters, setFilters] = useState({
    name: '',
    main: null,
    location: '',
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
      dispatch(getEntities({
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
    navigate('/inventory/warehouse/new');
  };

  // Filter options for main warehouse dropdown
  const mainFilterOptions = [
    { label: 'All', value: null },
    { label: 'Main', value: true },
  ];

  // Custom styles for react-select
  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '28px',
      fontSize: '0.75rem',
    }),
    option: (base) => ({
      ...base,
      fontSize: '0.75rem',
    }),
    menu: (base) => ({
      ...base,
      fontSize: '0.75rem',
    }),
  };

  // Filter the warehouse list based on filter state
  const filteredWarehouseList = warehouseList.filter((warehouse) => {
    const nameMatch = !filters.name || warehouse.name?.toLowerCase().includes(filters.name.toLowerCase());
    const locationMatch = !filters.location || warehouse.location?.toLowerCase().includes(filters.location.toLowerCase());
    const mainMatch = filters.main === null || warehouse.main === filters.main;
    return nameMatch && locationMatch && mainMatch;
  });




  return (
    <PageWrapper>
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">
              <Translate contentKey={'tempApp.warehouse.title'}>Warehouses</Translate>
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleSyncList}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                {translate('common.refreshList')}
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleCreate}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                {translate('tempApp.warehouse.createNew')}
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>{translate('common.name')}</div>
                    <Input
                      className="h-7 text-xs"
                      placeholder={translate('common.search.name')}
                      value={filters.name}
                      onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>{translate('common.location')}</div>
                    <Input
                      className="h-7 text-xs"
                      placeholder={translate('common.search.location')}
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-xs w-32">
                  <div className="space-y-1">
                    <div>{translate('tempApp.warehouse.main')}</div>
                    <Select
                      options={mainFilterOptions}
                      value={mainFilterOptions.find(opt => opt.value === filters.main)}
                      onChange={(option) => setFilters({ ...filters, main: option?.value })}
                      styles={selectStyles}
                      placeholder={translate('tempApp.warehouse.search.main')}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-xs w-20 text-center">{translate('common.edit')}</TableHead>
                <TableHead className="text-xs w-20 text-center">{translate('common.delete')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && filteredWarehouseList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredWarehouseList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs py-4">
                    No warehouses found
                  </TableCell>
                </TableRow>
              ) : (
                filteredWarehouseList.map((warehouse) => {
                  const editUrl = `/inventory/warehouse/${warehouse.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                  const deleteUrl = `/inventory/warehouse/${warehouse.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

                  return (
                    <TableRow key={warehouse.id}>
                      <TableCell className="text-xs">
                        <Link to={editUrl} className="hover:underline">
                          {warehouse.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">{warehouse.location}</TableCell>
                      <TableCell className="text-xs text-center">
                        {warehouse.main ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <Link to={editUrl}>
                          <Pencil className="h-4 w-4 text-gray-400 hover:text-gray-600 mx-auto cursor-pointer" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <Link to={deleteUrl}>
                          <Trash2 className="h-4 w-4 text-red-600 hover:text-red-800 mx-auto cursor-pointer" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default Warehouse;
