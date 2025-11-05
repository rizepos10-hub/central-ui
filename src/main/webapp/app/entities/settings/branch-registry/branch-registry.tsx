import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from "react-router-dom";
import { translate } from "react-jhipster";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { filterEntities } from './branch-registry.reducer';
import { IBranchRegistry } from "app/shared/model/branch-registry.model";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/src/main/webapp/app/lib/utils';
import { FilterMatchMode } from "primereact/api";
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';


const initialState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "branch.id": { value: null, matchMode: FilterMatchMode.EQUALS },
  }
};



export const BranchRegistry = ({ isRegisterClosure }: { isRegisterClosure?: boolean }) => {
  const dispatch = useAppDispatch();
  const branchList = useAppSelector(state => state.branch.entities);
  const branchRegistryList: IBranchRegistry[] = useAppSelector(state => state.branchRegistry.entities);
  const loading = useAppSelector(state => state.branchRegistry.loading);
  const totalItems = useAppSelector(state => state.branchRegistry.totalItems);

  const [searchParam, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParam.get("query")) || initialState;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [nameFilter, setNameFilter] = useState(query.filters?.name?.value || '');
  const [branchFilter, setBranchFilter] = useState(query.filters?.["branch.id"]?.value || '');



  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      filterEntities({
        query: updatedQuery,
      })
    );
  };

  const handleSyncList = () => {
    getAllEntities();
  };

  useEffect(() => {
    dispatch(getBranches({
      page: 0,
      size: 300,
      sort: 'asc'
    }))
  }, []);


  useEffect(() => {
    getAllEntities();
  }, [searchParam]);





  const onSort = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  };


  const onFilter = (event) => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  }



  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  };

  const handleBranchChange = (value: string) => {
    setBranchFilter(value);
    const queryParams = JSON.stringify({
      ...query,
      page: 0,
      first: 0,
      filters: {
        ...query.filters,
        ["branch.id"]: { value: value || null, matchMode: FilterMatchMode.EQUALS }
      }
    })
    setSearchParams({ query: queryParams }, { replace: true })
  }

  const handleNameFilterChange = (value: string) => {
    setNameFilter(value);
    const queryParams = JSON.stringify({
      ...query,
      page: 0,
      first: 0,
      filters: {
        ...query.filters,
        name: { value: value || null, matchMode: FilterMatchMode.CONTAINS }
      }
    })
    setSearchParams({ query: queryParams }, { replace: true })
  }

  const columns: ColumnDef<IBranchRegistry>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Name
              {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const editUrl = isRegisterClosure ? `/analytics/register-closure/${row.original.id}/edit` : `/branch-register/${row.original.id}/edit`;
        return (
          <Link to={editUrl} className="text-primary hover:underline font-medium">
            {row.original.name}
          </Link>
        );
      },
    },
    {
      accessorFn: (row) => row.branch?.name,
      id: 'branch',
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Branch
              {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        );
      },
      cell: ({ row }) => row.original.branch?.name || '-',
    },
    {
      accessorKey: 'code',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Code
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />}
          </Button>
        );
      },
    },
    {
      accessorKey: 'lastOnline',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Last Online
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />}
          </Button>
        );
      },
      cell: ({ row }) => row.original.lastOnline ? formatDateForDisplay(row.original.lastOnline) : '-',
    },
    {
      id: 'actions',
      header: 'Edit',
      cell: ({ row }) => {
        const editUrl = isRegisterClosure ? `/analytics/register-closure/${row.original.id}/edit` : `/branch-register/${row.original.id}/edit`;
        return (
          <Link to={editUrl}>
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
        );
      },
    },
  ];

  const table = useReactTable({
    data: branchRegistryList,
    columns,
    state: {
      sorting,
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);

      if (newSorting.length > 0) {
        const sort = newSorting[0];
        const queryParams = JSON.stringify({
          ...query,
          sortField: sort.id,
          sortOrder: sort.desc ? -1 : 1
        });
        setSearchParams({ query: queryParams }, { replace: true });
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalItems / 20),
  });




  return (
    <PageWrapper>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Branch Register</CardTitle>
            <Button
              variant="outline"
              onClick={handleSyncList}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh List
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name..."
                value={nameFilter}
                onChange={(e) => handleNameFilterChange(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select
              value={branchFilter}
              onValueChange={handleBranchChange}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Branches</SelectItem>
                {branchList.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {query.first + 1} to {Math.min(query.first + 20, totalItems)} of {totalItems} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPage({ ...query, page: query.page - 1, first: query.first - 20 })}
                disabled={query.page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPage({ ...query, page: query.page + 1, first: query.first + 20 })}
                disabled={query.first + 20 >= totalItems}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default BranchRegistry;
