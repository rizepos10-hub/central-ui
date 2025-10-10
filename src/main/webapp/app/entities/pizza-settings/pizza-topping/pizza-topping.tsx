import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getToppingGroups } from "app/entities/pizza-settings/pizza-topping-group/pizza-topping-group.reducer";
import { filterEntities } from './pizza-topping.reducer';
import { FilterMatchMode } from "primereact/api";
import ImportButton from "app/shared/components/data-import/data-import";
import { ITopping } from 'app/shared/model/PIZZA/topping.model';
import { ITerm } from 'app/shared/model/term.model';
import _ from 'lodash';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Select from 'react-select';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PizzaTopping = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [localNameFilter, setLocalNameFilter] = useState("");

  const pizzaToppingList: ITopping[] = useAppSelector(state => state.pizzaTopping.entities);
  const pizzaToppingGroups: ITerm[] = useAppSelector(state => state.toppingGroup.entities);
  const loading = useAppSelector(state => state.pizzaTopping.loading);
  const totalItems = useAppSelector(state => state.pizzaTopping.totalItems);
  const importSuccess = useAppSelector(state => state.dataImport.importSuccess);

  const [searchParams, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParams.get("query")) || {
    first: 0,
    rows: 20,
    page: 0,
    sortField: null,
    sortOrder: null,
    query: '',
    filters: {
      "group.id": { value: null, matchMode: FilterMatchMode.EQUALS },
      name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    }
  };

  const debouncedFilter = useRef(_.debounce((event) => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  }, 300)).current

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(filterEntities({ query: updatedQuery }));
  };

  useEffect(() => {
    dispatch(getToppingGroups({}));
  }, [])

  useEffect(() => {
    getAllEntities();
  }, [searchParams]);

  useEffect(() => {
    if (importSuccess) {
      getAllEntities();
    }
  }, [importSuccess]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const handleCreate = () => {
    navigate('/pizza-topping/new')
  }

  const handlePageChange = (newPage: number) => {
    const queryParams = JSON.stringify({
      ...query,
      first: newPage * query.rows,
      page: newPage
    });
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const handleRowsPerPageChange = (newRows: number) => {
    const queryParams = JSON.stringify({
      ...query,
      rows: newRows,
      first: 0,
      page: 0
    });
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const filteredList = pizzaToppingList;

  return (
    <PageWrapper>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Pizza Toppings</h2>
            <div className="flex gap-2">
              <ImportButton type={"TOPPING"} />
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleSyncList}
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh List
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleCreate}
                disabled={loading}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add New Topping
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs h-8 font-semibold p-2">Name</TableHead>
                <TableHead className="text-xs h-8 font-semibold p-2">Image</TableHead>
                <TableHead className="text-xs h-8 font-semibold p-2">Icon</TableHead>
                <TableHead className="text-xs h-8 font-semibold p-2">Weight</TableHead>
                <TableHead className="text-xs h-8 font-semibold p-2">Group</TableHead>
                <TableHead className="text-xs h-8 font-semibold p-2">Edit</TableHead>
                <TableHead className="text-xs h-8 font-semibold p-2">Delete</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="p-1">
                  <Input
                    placeholder="Search by name..."
                    value={localNameFilter}
                    onChange={(e) => {
                      setLocalNameFilter(e.target.value);
                      const newQuery = {
                        ...query,
                        filters: {
                          ...query.filters,
                          name: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS }
                        }
                      };
                      debouncedFilter(newQuery);
                    }}
                    className="h-8 text-xs"
                  />
                </TableHead>
                <TableHead className="p-1"></TableHead>
                <TableHead className="p-1"></TableHead>
                <TableHead className="p-1"></TableHead>
                <TableHead className="p-1">
                  <Select
                    value={query?.filters?.["group.id"]?.value ?
                      pizzaToppingGroups.find(g => g.id === query.filters["group.id"].value) : null}
                    onChange={(option) => {
                      const newQuery = {
                        ...query,
                        filters: {
                          ...query.filters,
                          "group.id": { value: option?.id || null, matchMode: FilterMatchMode.EQUALS }
                        }
                      };
                      setSearchParams({ query: JSON.stringify(newQuery) }, { replace: true });
                    }}
                    options={pizzaToppingGroups}
                    getOptionLabel={(option) => option.name}
                    getOptionValue={(option) => option.id}
                    isClearable
                    placeholder="Filter by group"
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '32px',
                        fontSize: '0.75rem',
                      }),
                      option: (base) => ({
                        ...base,
                        fontSize: '0.75rem',
                      }),
                    }}
                  />
                </TableHead>
                <TableHead className="p-1"></TableHead>
                <TableHead className="p-1"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-4">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-4 text-xs text-muted-foreground">
                    No toppings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((topping, idx) => {
                  const editUrl = `/pizza-topping/${topping.id}/edit`;
                  const deleteUrl = `/pizza-topping/${topping.id}/delete`;

                  return (
                    <TableRow key={idx}>
                      <TableCell className="text-xs p-2">
                        <Link to={editUrl} className="text-primary hover:underline">
                          {topping.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        {topping.image?.url ? (
                          <img
                            src={topping.image.url}
                            alt={topping.name + " image"}
                            className="h-12 w-12 object-cover rounded"
                          />
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        {topping.icon?.url ? (
                          <img
                            src={topping.icon.url}
                            alt={topping.name + " icon"}
                            className="h-12 w-12 object-cover rounded"
                          />
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        {topping.weight}
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        {topping.group?.name}
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        <Link to={editUrl}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        <Link to={deleteUrl}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between p-2 border-t mt-4">
            <div className="text-xs text-muted-foreground">
              Showing {query.first + 1} to {Math.min(query.first + query.rows, totalItems)} of {totalItems} entries
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={{ label: query.rows.toString(), value: query.rows }}
                onChange={(option) => handleRowsPerPageChange(option.value)}
                options={[10, 20, 30, 40, 50, 100, 200].map(num => ({ label: num.toString(), value: num }))}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '32px',
                    fontSize: '0.75rem',
                    minWidth: '70px',
                  }),
                  menu: (base) => ({
                    ...base,
                    fontSize: '0.75rem',
                  }),
                }}
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => handlePageChange(query.page - 1)}
                  disabled={query.page === 0}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => handlePageChange(query.page + 1)}
                  disabled={query.first + query.rows >= totalItems}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default PizzaTopping;
