import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {  getSortState } from 'react-jhipster';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {  getEntities } from './table.reducer';
import {IFloorPlanTable} from "app/shared/model/FLOOR-PLAN/floor-plan-table.model";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const FloorPlanTable = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const floorPlanTablesList :IFloorPlanTable[] = useAppSelector(state => state.floorPlanTable.entities);
  const loading = useAppSelector(state => state.floorPlanTable.loading);
  const totalItems = useAppSelector(state => state.floorPlanTable.totalItems);

  const [nameFilter, setNameFilter] = useState('');

  const filteredList = useMemo(() => {
    return floorPlanTablesList.filter(item => {
      const matchesName = !nameFilter || (item.name || '').toLowerCase().includes(nameFilter.toLowerCase());
      return matchesName;
    });
  }, [floorPlanTablesList, nameFilter]);

  const getAllEntities = () => {
      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
  };

  useEffect(() => {
    getAllEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const handleCreate = () => {
    navigate('/floor-plan/table/new')
  }

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Tables</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSyncList} size="sm" className="h-7 text-xs">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh List
            </Button>
            <Button onClick={handleCreate} disabled={loading} size="sm" className="h-7 text-xs">
              <Plus className="h-4 w-4 mr-2" />
              Add New Table
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Branch</TableHead>
              <TableHead className="text-xs">Width</TableHead>
              <TableHead className="text-xs">Height</TableHead>
              <TableHead className="text-xs">Image</TableHead>
              <TableHead className="text-xs text-center">Edit</TableHead>
              <TableHead className="text-xs text-center">Delete</TableHead>
            </TableRow>
            <TableRow>
              <TableHead>
                <Input
                  placeholder="Search by name"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="h-7 text-xs"
                />
              </TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-xs">
                  <Link to={`/floor-plan/table/${row.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    {row?.name}
                  </Link>
                </TableCell>
                <TableCell className="text-xs">{row?.branch?.name}</TableCell>
                <TableCell className="text-xs">{row.dimensions?.width}</TableCell>
                <TableCell className="text-xs">{row.dimensions?.height}</TableCell>
                <TableCell className="text-xs">
                  {row.image?.url && <img height={40} width={40} src={row.image?.url} alt="Table" />}
                </TableCell>
                <TableCell className="text-center">
                  <Link to={`/floor-plan/table/${row.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground inline-block cursor-pointer" />
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link to={`/floor-plan/table/${row.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
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

export default FloorPlanTable;
