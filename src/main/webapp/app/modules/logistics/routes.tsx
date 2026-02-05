import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import Select from 'app/shared/components/select/select';

import { fetchRoutes, deleteRoute } from './logistics.reducer';
import { IWholesaleRoute, WholesaleRouteStatus } from './logistics.model';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface LazyTableState {
  first?: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: number;
}

const RoutesPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const routes = useAppSelector(state => state.logistics.entities);
  const loading = useAppSelector(state => state.logistics.loading);
  const totalItems = useAppSelector(state => state.logistics.totalItems || 0);
  const branches = useAppSelector(state => state.branch.entities);

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 20,
    page: 0,
    sortField: 'routeDate',
    sortOrder: 1,
  });

  useEffect(() => {
    dispatch(getBranches({}));
  }, [dispatch]);

  const branchOptions = useMemo(
    () => branches.map(branch => ({ label: branch.name, value: branch.id })),
    [branches]
  );

  const queryParams = useMemo(() => {
    const sort =
      lazyState.sortField ? `${lazyState.sortField},${lazyState.sortOrder === 1 ? 'asc' : 'desc'}` : undefined;
    return {
      page: lazyState.page,
      size: lazyState.rows,
      sort,
      warehouseBranchId: selectedBranchId || undefined,
      from: dateRange?.from ? dateRange.from.toISOString() : undefined,
      to: dateRange?.to ? dateRange.to.toISOString() : undefined,
    };
  }, [lazyState.page, lazyState.rows, lazyState.sortField, lazyState.sortOrder, selectedBranchId, dateRange]);

  useEffect(() => {
    dispatch(fetchRoutes(queryParams));
  }, [dispatch, queryParams]);

  const getBranchName = (branchId?: string) =>
    branches.find(branch => branch.id === branchId)?.name || '—';

  const getSortIcon = (field: string) => {
    if (lazyState.sortField !== field) return null;
    return lazyState.sortOrder === 1 ? '↑' : '↓';
  };

  const handleSort = (field: string) => {
    setLazyState(prev => ({
      ...prev,
      sortField: field,
      sortOrder: prev.sortField === field ? (prev.sortOrder === 1 ? -1 : 1) : 1,
    }));
  };

  const handleDeleteRoute = async (route: IWholesaleRoute) => {
    if (!route.id) return;
    await dispatch(deleteRoute(route.id));
    dispatch(fetchRoutes(queryParams));
  };

  const getStatusBadgeClass = (status?: WholesaleRouteStatus) => {
    switch (status) {
      case WholesaleRouteStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case WholesaleRouteStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case WholesaleRouteStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case WholesaleRouteStatus.PLANNED:
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <PageWrapper className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Routes</CardTitle>
            <CardDescription>Every route links back to its warehouse orders.</CardDescription>
          </div>
          <Button onClick={() => navigate('/logistics/routes/new')}>Create Route</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[220px]">
              <Label className="text-xs">Warehouse Branch</Label>
              <Select
                value={branchOptions.find(option => option.value === selectedBranchId) || null}
                options={branchOptions}
                isClearable
                onChange={(option) => setSelectedBranchId(option?.value || '')}
                placeholder="All branches"
              />
            </div>
            <div className="min-w-[240px]">
              <Label className="text-xs">Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 w-full justify-start text-xs">
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'PP')} - {format(dateRange.to, 'PP')}
                        </>
                      ) : (
                        format(dateRange.from, 'PP')
                      )
                    ) : (
                      <span>Select date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">
                    <button
                      type="button"
                      className="text-xs font-medium hover:text-primary"
                      onClick={() => handleSort('name')}
                    >
                      Route Name {getSortIcon('name')}
                    </button>
                  </TableHead>
                  <TableHead className="min-w-[140px]">
                    <button
                      type="button"
                      className="text-xs font-medium hover:text-primary"
                      onClick={() => handleSort('routeDate')}
                    >
                      Route Date {getSortIcon('routeDate')}
                    </button>
                  </TableHead>
                  <TableHead className="min-w-[140px]">Branch</TableHead>
                  <TableHead className="min-w-[120px]">
                    <button
                      type="button"
                      className="text-xs font-medium hover:text-primary"
                      onClick={() => handleSort('status')}
                    >
                      Status {getSortIcon('status')}
                    </button>
                  </TableHead>
                  <TableHead className="min-w-[90px]">Stops</TableHead>
                  <TableHead className="min-w-[160px]">Navigation</TableHead>
                  <TableHead className="min-w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      Loading routes...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && routes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      No routes found.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  routes.map(route => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.name || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {route.routeDate ? format(new Date(route.routeDate), 'PP p') : '—'}
                      </TableCell>
                      <TableCell>{getBranchName(route.warehouseBranchId)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(route.status)}>{route.status || '—'}</Badge>
                      </TableCell>
                      <TableCell>{route.stops?.length || 0}</TableCell>
                      <TableCell className="text-sm">
                        {route.navigationUrl ? (
                          <a
                            href={route.navigationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            Open map
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/logistics/routes/${route.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Route</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {route.name || 'this route'}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRoute(route)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center space-x-2">
              <Label className="text-xs">Rows per page:</Label>
              <Select
                value={{ label: String(lazyState.rows), value: lazyState.rows }}
                options={[10, 20, 30, 40, 50, 100].map(size => ({ label: String(size), value: size }))}
                onChange={(option) =>
                  setLazyState(prev => ({
                    ...prev,
                    rows: option?.value || 20,
                    first: 0,
                    page: 0,
                  }))
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                {lazyState.first + 1}-{Math.min(lazyState.first + lazyState.rows, totalItems)} of {totalItems}
              </span>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() =>
                    setLazyState(prev => ({
                      ...prev,
                      first: Math.max(0, prev.first - prev.rows),
                      page: Math.max(0, prev.page - 1),
                    }))
                  }
                  disabled={lazyState.first === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() =>
                    setLazyState(prev => ({
                      ...prev,
                      first: prev.first + prev.rows,
                      page: prev.page + 1,
                    }))
                  }
                  disabled={lazyState.first + lazyState.rows >= totalItems}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default RoutesPage;
