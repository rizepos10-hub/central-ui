import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FilterMatchMode } from 'primereact/api';
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { getEntities, searchEntities } from './tv-display.reducer';
import { ITvDisplay } from 'app/shared/model/TV/tv-display.model';
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

export const FloorPlanTvDisplay = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tvDisplaysList: ITvDisplay[] = useAppSelector(state => state.tvDisplay.entities);
  const loading = useAppSelector(state => state.tvDisplay.loading);
  const totalItems = useAppSelector(state => state.tvDisplay.totalItems);

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
    navigate('/tv-display/new');
  };

  const handleFilterChange = (value: string | null) => {
    setQueryState({
      ...query,
      first: 0,
      page: 0,
      filters: {
        ...query.filters,
        name: {
          ...query.filters.name,
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold">Tv Displays</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="h-8 text-xs" onClick={handleSyncList} disabled={loading}>
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh List
            </Button>
            <Button className="h-8 text-xs" onClick={handleCreate} disabled={loading}>
              <Plus className="h-3 w-3 mr-1" />
              Add New Tv Display
            </Button>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-xs cursor-pointer" onClick={() => handleSort('name')}>
                  Name
                </TableHead>
                <TableHead className="h-8 text-xs text-center w-12">Edit</TableHead>
                <TableHead className="h-8 text-xs text-center w-12">Delete</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="h-8 p-1">
                  <Input
                    placeholder="Search by name"
                    value={currentSearch}
                    onChange={event => handleFilterChange(event.target.value || null)}
                    className="h-7 text-xs"
                  />
                </TableHead>
                <TableHead className="h-8" />
                <TableHead className="h-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-xs p-4">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Loading...
                  </TableCell>
                </TableRow>
              ) : tvDisplaysList.length > 0 ? (
                tvDisplaysList.map(tvDisplay => {
                  const editUrl = `/tv-display/${tvDisplay.id}/edit${location.search}`;
                  const deleteUrl = `/tv-display/${tvDisplay.id}/delete${location.search}`;

                  return (
                    <TableRow key={tvDisplay.id}>
                      <TableCell className="text-xs">
                        <Link to={editUrl} className="text-primary hover:underline">
                          {tvDisplay.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0" asChild>
                          <Link to={editUrl}>
                            <Pencil className="h-3 w-3" />
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-destructive hover:text-destructive" asChild>
                          <Link to={deleteUrl}>
                            <Trash2 className="h-3 w-3" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-xs p-4 text-muted-foreground">
                    No records found
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

export default FloorPlanTvDisplay;
