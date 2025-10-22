import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {getEntities, reset as resetPredefined} from './pizza-predefined.reducer';
import {IPredefinedPizza} from "app/shared/model/PIZZA/predefined-pizza.model";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PredefinedPizza = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const predefinedPizzaList :IPredefinedPizza[] = useAppSelector(state => state.predefinedPizza.entities);
  const loading = useAppSelector(state => state.predefinedPizza.loading);
  const totalItems = useAppSelector(state => state.predefinedPizza.totalItems);
  const [nameFilter, setNameFilter] = useState('');

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
      return () => {
        dispatch(resetPredefined())
      }
  }, [paginationState.activePage, paginationState.order, paginationState.sort]);





  const handleSyncList = () => {
    getAllEntities();
  };

  const handleCreate = () => {
    navigate('/predefined-pizza/new')
  }

  const filteredList = predefinedPizzaList.filter(predefined =>
    predefined.name?.toLowerCase().includes(nameFilter.toLowerCase())
  );

  return (
    <PageWrapper>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Predefined Pizza</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleSyncList}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh List
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleCreate}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add New Predefined Pizza
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-4">
            <Input
              placeholder="Search by name..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="max-w-sm h-8 text-xs"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Toppings</TableHead>
                  <TableHead className="text-xs w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredList?.length > 0 ? (
                  filteredList.map((predefined) => {
                    const editUrl = `/predefined-pizza/${predefined.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                    const deleteUrl = `/predefined-pizza/${predefined.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

                    return (
                      <TableRow key={predefined.id}>
                        <TableCell className="text-xs">
                          <Link to={editUrl} className="hover:underline">
                            {predefined.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs">
                          {predefined?.toppings?.map(topping => topping?.name).join(" | ")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
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
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-xs text-muted-foreground">
                      No predefined pizzas found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default PredefinedPizza;
