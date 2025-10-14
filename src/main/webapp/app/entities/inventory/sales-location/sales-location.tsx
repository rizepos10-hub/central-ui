import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { Pencil, Trash2, RefreshCw, Plus } from 'lucide-react';
import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './sales-location.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const SalesLocation = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const salesLocationList = useAppSelector(state => state.salesLocation.entities);
  const loading = useAppSelector(state => state.salesLocation.loading);
  const totalItems = useAppSelector(state => state.salesLocation.totalItems);
  const [nameFilter, setNameFilter] = useState('');

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
    navigate('/inventory/sales-location/new');
  };

  // Client-side filtering
  const filteredList = useMemo(() => {
    if (!nameFilter) return salesLocationList;
    return salesLocationList.filter(item =>
      item.name?.toLowerCase().includes(nameFilter.toLowerCase())
    );
  }, [salesLocationList, nameFilter]);
  return (
    <PageWrapper>
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">
              <Translate contentKey={'tempApp.salesLocation.title'}>Sales Locations</Translate>
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleSyncList} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                <Translate contentKey="common.refreshList">Refresh</Translate>
              </Button>
              <Button size="sm" className="h-8 text-xs" onClick={handleCreate} disabled={loading}>
                <Plus className="h-4 w-4 mr-1" />
                <Translate contentKey="tempApp.salesLocation.createNew">Create New</Translate>
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>
                      <Translate contentKey="common.name">Name</Translate>
                    </div>
                    <Input
                      className="h-7 text-xs"
                      placeholder={translate('common.search.name')}
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-xs w-24">
                  <Translate contentKey="common.actions">Actions</Translate>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList && filteredList.length > 0 ? (
                filteredList.map((item) => {
                  const editUrl = `/inventory/sales-location/${item.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                  const deleteUrl = `/inventory/sales-location/${item.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">
                        <Link to={editUrl} className="text-primary hover:underline">
                          {item.name}
                        </Link>
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
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center text-xs">
                    <Translate contentKey="entity.noResults">No results found</Translate>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default SalesLocation;
