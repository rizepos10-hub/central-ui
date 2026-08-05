import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { FilterMatchMode } from 'primereact/api';
import { Pencil, RefreshCw, Trash2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { getEntities, searchEntities } from './tag.reducer';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Select from 'app/shared/components/select/select';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

const initialState = {
  first: 0,
  rows: DEFAULT_PAGE_SIZE,
  page: 0,
  sortField: 'name',
  sortOrder: 1,
  filters: {
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  },
};

const hasActiveFilters = (filters: Record<string, { value?: unknown }>) =>
  Object.values(filters).some(filter => filter?.value !== null && filter?.value !== '');

export const Tag = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tagList = useAppSelector(state => state.tag.entities);
  const loading = useAppSelector(state => state.tag.loading);
  const totalItems = useAppSelector(state => state.tag.totalItems);

  const rawQuery = JSON.parse(searchParams.get('query') || 'null') || {};
  const query = {
    ...initialState,
    ...rawQuery,
    filters: {
      ...initialState.filters,
      ...(rawQuery.filters || {}),
    },
  };

  useEffect(() => {
    const shouldSearch = hasActiveFilters(query.filters as Record<string, { value?: unknown }>);
    const action = shouldSearch ? searchEntities : getEntities;
    const payload = shouldSearch
      ? { query: applyMatchModeMap(query) }
      : {
          page: query.page,
          size: query.rows,
          sort: query.sortField ? `${query.sortField},${query.sortOrder === -1 ? 'desc' : 'asc'}` : undefined,
        };

    dispatch(action(payload as any));
  }, [dispatch, searchParams]);

  const setQueryState = (nextQuery: typeof query) => {
    setSearchParams({ query: JSON.stringify(nextQuery) }, { replace: true });
  };

  const handleSyncList = () => {
    const shouldSearch = hasActiveFilters(query.filters as Record<string, { value?: unknown }>);
    const action = shouldSearch ? searchEntities : getEntities;
    const payload = shouldSearch
      ? { query: applyMatchModeMap(query) }
      : {
          page: query.page,
          size: query.rows,
          sort: query.sortField ? `${query.sortField},${query.sortOrder === -1 ? 'desc' : 'asc'}` : undefined,
        };

    dispatch(action(payload as any));
  };

  const handleCreate = () => {
    navigate('/tag/new');
  };

  const handleFilterChange = (field: 'name', value: string | null) => {
    setQueryState({
      ...query,
      first: 0,
      page: 0,
      filters: {
        ...query.filters,
        [field]: {
          ...query.filters[field],
          value,
        },
      },
    });
  };

  const handleSort = (field: string) => {
    let nextSortOrder = 1;
    if (query.sortField === field) {
      nextSortOrder = query.sortOrder === 1 ? -1 : 1;
    }

    setQueryState({
      ...query,
      sortField: field,
      sortOrder: nextSortOrder,
    });
  };

  const handlePageSizeChange = (rows: number) => {
    setQueryState({
      ...query,
      rows,
      first: 0,
      page: 0,
    });
  };

  const goToPreviousPage = () => {
    const nextPage = Math.max(0, query.page - 1);
    setQueryState({
      ...query,
      page: nextPage,
      first: nextPage * query.rows,
    });
  };

  const goToNextPage = () => {
    const totalPages = Math.max(1, Math.ceil(totalItems / query.rows));
    const nextPage = Math.min(totalPages - 1, query.page + 1);
    setQueryState({
      ...query,
      page: nextPage,
      first: nextPage * query.rows,
    });
  };

  const pageSize = query.rows;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(query.page + 1, totalPages);
  const pageStartIndex = totalItems === 0 ? 0 : query.page * pageSize + 1;
  const pageEndIndex = Math.min(query.page * pageSize + pageSize, totalItems);
  const currentSearch = query.filters.name?.value || '';

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-bold">
            <Translate contentKey="tag.view.table.title">Tags</Translate>
          </h2>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={handleSyncList} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={handleCreate} disabled={loading}>
              {translate('tag.view.table.buttons.createNewTag')}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs h-8 font-semibold cursor-pointer" onClick={() => handleSort('name')}>
                  {translate('tag.view.table.fields.name')}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold w-20 text-center">
                  {translate('tag.view.table.fields.edit')}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold w-20 text-center">
                  {translate('tag.view.table.fields.delete')}
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="p-2">
                  <Input
                    placeholder={translate('tag.view.table.search.name')}
                    value={currentSearch}
                    onChange={event => handleFilterChange('name', event.target.value || null)}
                    className="h-7 text-xs"
                  />
                </TableHead>
                <TableHead className="p-2" />
                <TableHead className="p-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-xs p-4">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                    {translate('common.loading')}
                  </TableCell>
                </TableRow>
              ) : tagList.length > 0 ? (
                tagList.map(tag => {
                  const editUrl = `/tag/${tag.id}/edit${location.search}`;
                  const deleteUrl = `/tag/${tag.id}/delete${location.search}`;

                  return (
                    <TableRow key={tag.id}>
                      <TableCell className="text-xs p-2">
                        <Link to={editUrl} className="text-primary hover:underline">
                          {tag.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs p-2 text-center">
                        <Link to={editUrl}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs p-2 text-center">
                        <Link to={deleteUrl}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-destructive/10">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-xs p-4 text-muted-foreground">
                    {translate('common.noRecordsFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalItems > 0 && (
          <div className="flex items-center justify-between border-t px-2 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows per page:</span>
              <Select
                value={{ value: pageSize, label: pageSize.toString() }}
                onChange={(option: any) => handlePageSizeChange(option?.value ?? DEFAULT_PAGE_SIZE)}
                options={PAGE_SIZE_OPTIONS.map(value => ({ value, label: value.toString() }))}
                isSearchable={false}
                className="w-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {pageStartIndex} - {pageEndIndex} of {totalItems}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={goToPreviousPage} disabled={safeCurrentPage <= 1 || loading}>
                  ‹
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={goToNextPage} disabled={safeCurrentPage >= totalPages || loading}>
                  ›
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Tag;
