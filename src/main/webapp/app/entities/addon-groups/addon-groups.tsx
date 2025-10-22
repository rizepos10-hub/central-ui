import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { FilterMatchMode } from 'primereact/api';
import ImportButton from 'app/shared/components/data-import/data-import';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { searchEntities } from 'app/entities/addon-groups/addon-groups.reducer';
import _ from 'lodash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import Select from 'react-select';

const initialState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    groupId: { value: null, matchMode: FilterMatchMode.CONTAINS },
  },
};

export const AddonGroups = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [localNameFilter, setLocalNameFilter] = useState("");

  const addonList = useAppSelector(state => state.addonGroups.entities);
  const loading = useAppSelector(state => state.addonGroups.loading);
  const totalItems = useAppSelector(state => state.addonGroups.totalItems);

  const [searchParams, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParams.get('query')) || initialState;

  const debouncedFilter = useRef(_.debounce((event) => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  }, 300)).current;

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      searchEntities({
        query: updatedQuery,
      })
    );
  };

  const handleSyncList = () => {
    getAllEntities();
  };

  useEffect(() => {
    getAllEntities();
  }, [searchParams]);

  const handleCreate = () => {
    navigate('/addon-groups/new');
  };

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

  const filteredList = addonList;

  return (
    <PageWrapper>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              <Translate contentKey={'common.addonGroups'}>Addon Groups</Translate>
            </h2>
            <div className="flex gap-2">
              <ImportButton type={'ADDON_GROUPS'} />
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleSyncList}
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                {translate('common.refreshList')}
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleCreate}
                disabled={loading}
              >
                <Plus className="h-3 w-3 mr-1" />
                {translate('tempApp.addonGroup.createNewAddonGroup')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs h-8 font-semibold p-2">
                  {translate('common.name')}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold p-2">
                  {translate('tempApp.addon.addons')}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold p-2">
                  {translate('common.edit')}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold p-2">
                  {translate('common.delete')}
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="p-1">
                  <Input
                    placeholder={translate('common.search.name')}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center p-4">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center p-4 text-xs text-muted-foreground">
                    No addon groups found
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((addonGroup, idx) => {
                  const editUrl = `/addon-groups/${addonGroup.id}/edit`;
                  const deleteUrl = `/addon-groups/${addonGroup.id}/delete`;

                  return (
                    <TableRow key={idx}>
                      <TableCell className="text-xs p-2">
                        <Link to={editUrl} className="text-primary hover:underline">
                          {addonGroup.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        {addonGroup.addons?.map(addon => addon.name).join(" | ")}
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

export default AddonGroups;
