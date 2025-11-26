import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { Pencil, Trash2, RefreshCw, Zap, Plus, Search as SearchIcon, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IMenu } from 'app/shared/model/menu.model';
import { searchEntities, getEntities, createEntity, sendEvents } from './menu.reducer';
import { format } from "date-fns";
import MenuUpdate from './menu-update';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { convertDateTimeToServer } from 'app/shared/util/date-utils';
import { IBranch } from 'app/shared/model/branch.model';
import { IAttachment } from 'app/shared/model/attachment.model';
import ImageDisplay from 'app/shared/components/image/image-display';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
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

export const Menu = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<'id'>();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [branchFilter, setBranchFilter] = useState<string>('');

  const menuList = useAppSelector(state => state.menu.entities);
  const loading = useAppSelector(state => state.menu.loading);
  const updating = useAppSelector(state => state.menu.updating);
  const updateSuccess = useAppSelector(state => state.menu.updateSuccess);
  const totalItems = useAppSelector(state => state.menu.totalItems);

  const params = new URLSearchParams(location.search);
  const menuType = params.get("type");

  const [selectedBranches, setSelectedBranches] = useState<IBranch[]>([]);
  const [selectedName, setSelectedName] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState<IAttachment>();
  const [isNewMenu, setIsNewMenu] = useState(false);

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
          type: menuType,
        })
      );
    }
  };

  const sortEntities = () => {
    getAllEntities();
  };

  useEffect(() => {
    sortEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort, search, menuType, updateSuccess]);

  useEffect(() => {
    const page = params.get('page');
    const sort = params.get(SORT);
    if (page && sort) {
      const sortSplit = sort.split(',');
      setPaginationState({
        ...paginationState,
        activePage: +page,
        sort: sortSplit[0],
        order: sortSplit[1],
      });
    }
  }, [location.search]);

  const handleSyncList = () => {
    sortEntities();
  };

  const handleTriggerAllMenus = () => {
    dispatch(sendEvents());
  };

  const branchNames = useMemo(() => {
    const names = new Set(
      menuList
        .filter(item => item.branch?.name)
        .map((menu) => menu.branch!.name)
    );
    return Array.from(names) as string[];
  }, [menuList]);

  const saveEntity = () => {
    const entity = {
      name: selectedName,
      branches: selectedBranches,
      type: menuType as "POS" | "ONLINE_ORDERING",
      image: selectedAttachment,
    };

    dispatch(createEntity(entity)).then((res) => {
      setIsModalOpen(false);
      const createdId = (res.payload as any)?.data?.id || (res.payload as any)?.id;
      if (createdId) {
        navigate(`/menu/${createdId}/${menuType}/edit?page=1&sort=sort=id,asc`);
      }
    });
  };

  const columns: ColumnDef<IMenu>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 px-2 text-xs"
          >
            {translate('menus.shared.view.table.fields.name')}
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-1 h-3 w-3" /> : <ArrowUpDown className="ml-1 h-3 w-3" />}
          </Button>
        );
      },
      cell: ({ row }) => (
        <Link
          to={`/menu/${row.original.id}/${menuType}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
           className="text-primary hover:underline font-medium"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorFn: (row) => row.branches?.[0]?.name,
      id: 'branch',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 px-2 text-xs"
          >
            {translate('menus.shared.view.table.fields.branch')}
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-1 h-3 w-3" /> : <ArrowUpDown className="ml-1 h-3 w-3" />}
          </Button>
        );
      },
      cell: ({ row }) => <span className="text-xs">{row.original.branches?.[0]?.name || '-'}</span>,
      filterFn: (row, id, value) => {
        return value === '' || row.original.branches?.[0]?.name === value;
      },
    },
    {
      id: 'image',
      header: translate('items.view.fields.image'),
      cell: ({ row }) => (
        <ImageDisplay
          imageType={"product"}
          imageUrl={row.original?.image?.url}
          height={40}
          width={40}
        />
      ),
    },
    {
      accessorKey: 'lastModifiedDate',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 px-2 text-xs"
          >
            {translate('menus.shared.view.table.fields.updatedAt')}
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-1 h-3 w-3" /> : <ArrowUpDown className="ml-1 h-3 w-3" />}
          </Button>
        );
      },
      cell: ({ row }) => <span className="text-xs">{row.original.lastModifiedDate ? formatDateForDisplay(row.original.lastModifiedDate) : '-'}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const editUrl = `/menu/${row.original.id}/${menuType}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
        const deleteUrl = `/menu/${row.original.id}/delete?type=${menuType}&page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
        return (
          <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to={editUrl}>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent><p>Edit</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to={deleteUrl}>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent><p>Delete</p></TooltipContent>
              </Tooltip>
          </div>
        );
      },
    },
  ], [menuType, paginationState]);

  const table = useReactTable({
    data: menuList,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalItems / ITEMS_PER_PAGE),
  });

  return (
    <PageWrapper>
      <MenuUpdate
        setIsModalOpen={setIsModalOpen}
        isModalOpen={isModalOpen}
        saveEntity={saveEntity}
        updating={updating}
        selectedName={selectedName}
        setSelectedName={setSelectedName}
        selectedBranches={selectedBranches}
        setSelectedBranches={setSelectedBranches}
        selectedAttachment={selectedAttachment}
        setSelectedAttachment={setSelectedAttachment}
        isNew={isNewMenu}
      />
      <Card>
        <CardContent>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">
              {menuType === "ONLINE_ORDERING" ?
                translate('menus.online.view.table.title') :
                translate('menus.pos.view.table.title')}
            </h2>
            <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTriggerAllMenus}
                      disabled={loading}
                      className="h-7 w-7 p-0"
                    >
                      {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{translate('items.view.actions.triggerAllMenus')}</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncList}
                      disabled={loading}
                      className="h-7 w-7 p-0"
                    >
                      {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{translate('items.view.actions.refreshList')}</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedName("");
                        setSelectedBranches([]);
                        setSelectedAttachment(undefined);
                        setIsNewMenu(true);
                        setIsModalOpen(true);
                      }}
                      disabled={loading}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{translate('menus.shared.view.table.buttons.createNewMenu')}</p></TooltipContent>
                </Tooltip>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder={translate('menus.shared.view.table.search.name')}
                value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                onChange={(e) => table.getColumn('name')?.setFilterValue(e.target.value)}
                className="pl-7 h-7 text-xs"
              />
            </div>
            <Select
              value={branchFilter}
              onValueChange={(value) => {
                setBranchFilter(value);
                table.getColumn('branch')?.setFilterValue(value);
              }}
            >
              <SelectTrigger className="w-48 h-7 text-xs">
                <SelectValue placeholder={translate('menus.shared.view.table.select.branch')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Branches</SelectItem>
                {branchNames.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id} className="h-8 px-2">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map(row => (
                      <TableRow key={row.id} className="h-10">
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id} className="px-2 py-1">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-16 text-center text-xs">
                        <Translate contentKey="entity.noResults" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-1 py-2">
            <div className="text-xs text-muted-foreground">
              Showing {((paginationState.activePage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
              {Math.min(paginationState.activePage * ITEMS_PER_PAGE, totalItems)} of{' '}
              {totalItems} results
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginationState({ ...paginationState, activePage: paginationState.activePage - 1 })}
                disabled={paginationState.activePage === 1}
                className="h-7 text-xs"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginationState({ ...paginationState, activePage: paginationState.activePage + 1 })}
                disabled={paginationState.activePage >= Math.ceil(totalItems / ITEMS_PER_PAGE)}
                className="h-7 text-xs"
              >
                Next
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default Menu;
