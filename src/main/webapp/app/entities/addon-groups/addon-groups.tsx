import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { RefreshCw, Plus, Pencil, Trash2, RotateCcw, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { FilterMatchMode } from 'primereact/api';
import ImportButton from 'app/shared/components/data-import/data-import';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { searchEntities, archiveEntities, unArchiveEntities, purgeEntities } from 'app/entities/addon-groups/addon-groups.reducer';
import _ from 'lodash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import Select from 'app/shared/components/select/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { IAddonGroup } from 'app/shared/model/ADDON/addon-groups.model';

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
    isArchived: { value: false, matchMode: FilterMatchMode.EQUALS },
  },
};

export const AddonGroups = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [localNameFilter, setLocalNameFilter] = useState("");
  const [selectedItems, setSelectedItems] = useState<IAddonGroup[]>([]);
  const [itemsToAction, setItemsToAction] = useState<IAddonGroup[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

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

  const handleIsArchivedChange = (value: boolean) => {
    const queryParams = JSON.stringify({
      ...query,
      page: 0,
      first: 0,
      filters: {
        ...query.filters,
        isArchived: { value, matchMode: FilterMatchMode.EQUALS }
      }
    });
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const handleItemsDelete = async () => {
    const updatedQuery = applyMatchModeMap(query);
    await dispatch(archiveEntities({
      ids: itemsToAction.map(p => p.id),
      query: updatedQuery,
    }));
    setSelectedItems([]);
    setShowDeleteDialog(false);
  };

  const handlePurgeItems = async () => {
    const updatedQuery = applyMatchModeMap(query);
    await dispatch(purgeEntities({
      ids: itemsToAction.map(item => item.id),
      query: updatedQuery
    }));
    setSelectedItems([]);
    setShowPurgeDialog(false);
  };

  const handleUnArchiveItems = async () => {
    const updatedQuery = applyMatchModeMap(query);
    await dispatch(unArchiveEntities({
      ids: itemsToAction.map(item => item.id),
      query: updatedQuery
    }));
    setSelectedItems([]);
    setShowRestoreDialog(false);
  };

  const handleSort = (field: string) => {
    let newSortOrder = 1;
    if (query.sortField === field) {
      newSortOrder = query.sortOrder === 1 ? -1 : query.sortOrder === -1 ? null : 1;
    }

    const newQuery = {
      ...query,
      sortField: newSortOrder === null ? null : field,
      sortOrder: newSortOrder
    };
    const queryParams = JSON.stringify(newQuery);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const getSortIcon = (field: string) => {
    if (query.sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline" />;
    }
    if (query.sortOrder === 1) {
      return <ArrowUp className="h-3 w-3 ml-1 inline" />;
    }
    if (query.sortOrder === -1) {
      return <ArrowDown className="h-3 w-3 ml-1 inline" />;
    }
    return <ArrowUpDown className="h-3 w-3 ml-1 inline" />;
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
              {!query?.filters?.isArchived?.value ? (
                <>
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
                </>
              ) : (
                <h4 className="text-center text-destructive text-sm font-semibold">
                  Now viewing Recycle Bin
                </h4>
              )}
              <Button
                size="sm"
                variant={query?.filters?.isArchived?.value ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={() => handleIsArchivedChange(!query?.filters?.isArchived?.value)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 p-2">
                  <Checkbox
                    checked={selectedItems.length === filteredList.length && filteredList.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedItems(filteredList);
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead 
                  className="text-xs h-8 font-semibold p-2 cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  {translate('common.name')}
                  {getSortIcon('name')}
                </TableHead>
                <TableHead 
                  className="text-xs h-8 font-semibold p-2 cursor-pointer"
                  onClick={() => handleSort('addons.name')}
                >
                  {translate('tempApp.addon.addons')}
                  {getSortIcon('addons.name')}
                </TableHead>
                <TableHead 
                  className="text-xs h-8 font-semibold p-2 cursor-pointer"
                >
                  {translate('common.actions')}
                </TableHead>
              </TableRow>
              <TableRow className="h-8">
                <TableHead className="p-1 w-12">
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
                  const isSelected = selectedItems.some(item => item.id === addonGroup.id);

                  return (
                    <TableRow key={idx}>
                      <TableCell className="p-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedItems([...selectedItems, addonGroup]);
                            } else {
                              setSelectedItems(selectedItems.filter(item => item.id !== addonGroup.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        <Link to={editUrl} className="text-primary hover:underline">
                          {addonGroup.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        {addonGroup.addons?.map(addon => addon?.name).join(" | ")}
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        <div className="flex gap-1">
                          {!query?.filters?.isArchived?.value ? (
                            <>
                              <Link to={editUrl}>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setItemsToAction([addonGroup]);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setItemsToAction([addonGroup]);
                                  setShowRestoreDialog(true);
                                }}
                              >
                                <RotateCcw className="h-3 w-3 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setItemsToAction([addonGroup]);
                                  setShowPurgeDialog(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
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

          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2 p-2 border-t bg-muted/50">
              <span className="text-xs text-muted-foreground">
                {selectedItems.length} item(s) selected
              </span>
              {!query?.filters?.isArchived?.value ? (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={() => {
                    setItemsToAction(selectedItems);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Archive Selected
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      setItemsToAction(selectedItems);
                      setShowRestoreDialog(true);
                    }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restore Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs"
                    onClick={() => {
                      setItemsToAction(selectedItems);
                      setShowPurgeDialog(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Purge Selected
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Addon Groups</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive {itemsToAction.length} addon group(s)?
              You can restore them from the recycle bin later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleItemsDelete}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Addon Groups</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore {itemsToAction.length} addon group(s)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnArchiveItems}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPurgeDialog} onOpenChange={setShowPurgeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Addon Groups</AlertDialogTitle>
            <AlertDialogDescription className="text-destructive font-semibold">
              Warning: This will permanently delete {itemsToAction.length} addon group(s).
              This action cannot be undone!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePurgeItems} className="bg-destructive">
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
};

export default AddonGroups;
