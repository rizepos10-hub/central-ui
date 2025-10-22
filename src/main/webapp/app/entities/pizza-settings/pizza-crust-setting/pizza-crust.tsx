import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {  getEntities as getPizzaCrustThicknesses} from './pizza-crust-thickness.reducer';
import {  getEntities as getPizzaCrustTypes} from './pizza-crust-type.reducer';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PizzaCrust = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const crustThicknessList = useAppSelector(state => state.pizzaCrustThickness.entities);
  const crustThicknessLoading = useAppSelector(state => state.pizzaCrustThickness.loading);
  const crustThicknessTotalItems = useAppSelector(state => state.pizzaCrustThickness.totalItems);
  const crustTypeList = useAppSelector(state => state.pizzaCrustType.entities);
  const crustTypeLoading = useAppSelector(state => state.pizzaCrustType.loading);
  const crustTypeTotalItems = useAppSelector(state => state.pizzaCrustType.totalItems);

  const [thicknessFilter, setThicknessFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const getAllEntities = () => {
    dispatch(
      getPizzaCrustThicknesses({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
    dispatch(
      getPizzaCrustTypes({
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

  const handleCrustTypeCreate = () => {
    navigate('/pizza-crust-type/new')
  }

  const handleThicknessCreate = () => {
    navigate('/pizza-crust-thickness/new')
  }

  const filteredThicknessList = crustThicknessList.filter(thickness =>
    thickness.name?.toLowerCase().includes(thicknessFilter.toLowerCase())
  );

  const filteredTypeList = crustTypeList.filter(type =>
    type.name?.toLowerCase().includes(typeFilter.toLowerCase())
  );

  return (
    <PageWrapper>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Crust Thickness</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleSyncList}
                disabled={crustThicknessLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${crustThicknessLoading ? 'animate-spin' : ''}`} />
                Refresh List
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleThicknessCreate}
                disabled={crustThicknessLoading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add New Crust Thickness
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-4">
            <Input
              placeholder="Search by name..."
              value={thicknessFilter}
              onChange={(e) => setThicknessFilter(e.target.value)}
              className="max-w-sm h-8 text-xs"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Hidden On Sizes</TableHead>
                <TableHead className="text-xs w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredThicknessList.map((thickness) => {
                const editUrl = `/pizza-crust-thickness/${thickness.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                const deleteUrl = `/pizza-crust-thickness/${thickness.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

                return (
                  <TableRow key={thickness.id}>
                    <TableCell className="text-xs">
                      <Link to={editUrl} className="hover:underline">
                        {thickness.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">
                      {thickness?.hiddenOnSizes?.map(size => size.name).join(" | ")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link to={editUrl}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </Link>
                        <Link to={deleteUrl}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Crust Types</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleSyncList}
                disabled={crustTypeLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${crustTypeLoading ? 'animate-spin' : ''}`} />
                Refresh List
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleCrustTypeCreate}
                disabled={crustTypeLoading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add New Crust Type
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-4">
            <Input
              placeholder="Search by name..."
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="max-w-sm h-8 text-xs"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Hidden On Sizes</TableHead>
                <TableHead className="text-xs w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypeList.map((type) => {
                const editUrl = `/pizza-crust-type/${type.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                const deleteUrl = `/pizza-crust-type/${type.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

                return (
                  <TableRow key={type.id}>
                    <TableCell className="text-xs">
                      <Link to={editUrl} className="hover:underline">
                        {type.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">
                      {type?.hiddenOnSizes?.map(size => size.name).join(" | ")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link to={editUrl}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </Link>
                        <Link to={deleteUrl}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default PizzaCrust;
