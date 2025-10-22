import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {  getSortState } from 'react-jhipster';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {  filterFloorPlans } from './floor-plan.reducer';
import {IFloorPlan} from "app/shared/model/FLOOR-PLAN/floor-plan.model";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {DataTableLazyModel} from "app/shared/model/ENUMS/data-table-lazy.model";
import {isBoolean} from "lodash";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';


interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: 0 | 1 | -1 | null;
  filters: any;
}

export const FloorPlan = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [lazyState, setLazyState] = useState<any>({
    first: 0,
    rows: 10,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      name:{value: '', matchMode: 'startsWith'},
      branch: { value: '', matchMode: 'equals' },
      active: { value: null, matchMode: 'equals' },
    }});

  const floorPlanList :IFloorPlan[] = useAppSelector(state => state.floorPlan.entities);
  const loading = useAppSelector(state => state.floorPlan.loading);
  const totalItems = useAppSelector(state => state.floorPlan.totalItems);
  const branchList = useAppSelector(state => state.branch.entities);





  const filteredBranchOptions = branchList
    .map((branch) => ({
      label: branch.name,
      value: branch.id,
    }));



  useEffect(() => {
    handleSyncList()

  },[lazyState])







  const handleSyncList = () => {
    const queryParams = {
      first: lazyState.first,
      page: lazyState.page ,
      size: lazyState.rows ,
      filters: {}
    };
    if (lazyState.filters.branch?.value) {
      queryParams.filters['branch.id'] = {
        value: lazyState.filters.branch.value,
        matchMode: DataTableLazyModel[lazyState.filters.branch.matchMode],
      };
    }

    if (lazyState.filters.name?.value) {
      queryParams.filters['name'] = {
        value: lazyState.filters.name.value,
        matchMode: DataTableLazyModel[lazyState.filters.name.matchMode],
      };
    }
    if (isBoolean(lazyState.filters.active?.value)) {
      queryParams.filters['active'] = {
        value: lazyState.filters.active.value,
        matchMode: DataTableLazyModel[lazyState.filters.active.matchMode],
      };
    }
    dispatch(filterFloorPlans(queryParams));
    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`
    }))
  };

  const handleCreate = () => {
    navigate('/floor-plan/new')
  }

  const handleNameFilter = (value: string) => {
    setLazyState((prevState) => ({
      ...prevState,
      filters: {
        ...prevState.filters,
        name: { value, matchMode: 'startsWith' },
      },
    }));
  };

  const handleBranchFilter = (value: string) => {
    setLazyState((prevState) => ({
      ...prevState,
      filters: {
        ...prevState.filters,
        branch: { value, matchMode: 'equals' },
      },
    }));
  };

  const handleActiveFilter = (value: string) => {
    let activeValue: boolean | null = null;
    if (value === 'true') activeValue = true;
    if (value === 'false') activeValue = false;

    setLazyState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        active: { value: activeValue, matchMode: 'equals' },
      },
    }));
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Floor Plans</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSyncList} size="sm" className="h-7 text-xs">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh List
            </Button>
            <Button onClick={handleCreate} disabled={loading} size="sm" className="h-7 text-xs">
              <Plus className="h-4 w-4 mr-2" />
              Add New Floor Plan
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Branch</TableHead>
              <TableHead className="text-xs text-center">Active</TableHead>
              <TableHead className="text-xs text-center">Manage</TableHead>
              <TableHead className="text-xs text-center">Edit</TableHead>
              <TableHead className="text-xs text-center">Delete</TableHead>
            </TableRow>
            <TableRow>
              <TableHead>
                <Input
                  placeholder="Search by name"
                  value={lazyState.filters.name?.value || ''}
                  onChange={(e) => handleNameFilter(e.target.value)}
                  className="h-7 text-xs"
                />
              </TableHead>
              <TableHead>
                <Select
                  value={lazyState.filters.branch?.value || ''}
                  onValueChange={handleBranchFilter}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All</SelectItem>
                    {filteredBranchOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead>
                <Select
                  value={
                    lazyState.filters.active?.value === null ? 'all' :
                    lazyState.filters.active?.value === true ? 'true' :
                    lazyState.filters.active?.value === false ? 'false' : 'all'
                  }
                  onValueChange={handleActiveFilter}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Filter by active" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Not Active</SelectItem>
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {floorPlanList.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-xs">
                  <Link to={`/floor-plan/${row.id}/manage?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell className="text-xs">{row.branch?.name}</TableCell>
                <TableCell className="text-center">
                  {row.active ? (
                    <Check className="h-4 w-4 text-green-500 inline-block" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 inline-block" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Link to={`/floor-plan/${row.id}/manage?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    <span className="text-xs text-blue-600 hover:text-blue-800">Manage</span>
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link to={`/floor-plan/${row.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground inline-block cursor-pointer" />
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link to={`/floor-plan/${row.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700 inline-block cursor-pointer" />
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

export default FloorPlan;
