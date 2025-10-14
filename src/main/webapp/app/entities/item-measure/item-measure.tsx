import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { Pencil, Trash2, RefreshCw } from 'lucide-react';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './item-measure.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const ItemMeasure = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const itemMeasureList = useAppSelector(state => state.itemMeasure.entities);
  const loading = useAppSelector(state => state.itemMeasure.loading);
  const totalItems = useAppSelector(state => state.itemMeasure.totalItems);
  const [filters, setFilters] = useState({
    name: '',
    code: '',
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
    navigate('/item-measure/new')
  }

  const filteredItemMeasureList = itemMeasureList.filter(item => {
    const matchesName = !filters.name || item.name?.toLowerCase().includes(filters.name.toLowerCase());
    const matchesCode = !filters.code || item.code?.toLowerCase().includes(filters.code.toLowerCase());
    return matchesName && matchesCode;
  });

  return (
    <PageWrapper>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xl font-bold"><Translate contentKey={'tempApp.itemMeasure.view.table.title'}>Measurements</Translate></span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleSyncList} disabled={loading} className="h-8 text-xs">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            {translate("tempApp.itemMeasure.view.table.buttons.refreshList")}
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={loading} className="h-8 text-xs">
            {translate("tempApp.itemMeasure.view.table.buttons.createNewItemMeasure")}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="space-y-1">
                  <div>{translate('tempApp.itemMeasure.view.table.fields.name')}</div>
                  <Input
                    placeholder={translate('tempApp.itemMeasure.view.table.search.name')}
                    value={filters.name}
                    onChange={(e) => setFilters({...filters, name: e.target.value})}
                    className="h-8 text-xs"
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="space-y-1">
                  <div>{translate('tempApp.itemMeasure.view.table.fields.code')}</div>
                  <Input
                    placeholder={translate('tempApp.itemMeasure.view.table.search.code')}
                    value={filters.code}
                    onChange={(e) => setFilters({...filters, code: e.target.value})}
                    className="h-8 text-xs"
                  />
                </div>
              </TableHead>
              <TableHead className="w-[50px]">{translate('tempApp.itemMeasure.view.table.fields.edit')}</TableHead>
              <TableHead className="w-[50px]">{translate('tempApp.itemMeasure.view.table.fields.delete')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItemMeasureList.map(measure => (
              <TableRow key={measure.id}>
                <TableCell className="text-xs">
                  <Link
                    to={`/item-measure/${measure.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                    className="hover:underline"
                  >
                    {measure.name}
                  </Link>
                </TableCell>
                <TableCell className="text-xs">{measure.code}</TableCell>
                <TableCell>
                  <Link to={`/item-measure/${measure.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                      <Pencil className="h-3 w-3 text-gray-400" />
                    </Button>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link to={`/item-measure/${measure.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageWrapper>
  );
};

export default ItemMeasure;
