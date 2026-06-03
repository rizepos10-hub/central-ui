import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { Pencil, Trash2, RefreshCw, FileDown, Upload, Search as SearchIcon, RotateCcw, ArrowDown, ArrowUpDown, ArrowUp } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { FilterMatchMode } from 'primereact/api';
import ImportButton from 'app/shared/components/data-import/data-import';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { filterEntities, exportEntities, archiveEntities, unArchiveEntities, purgeEntities } from 'app/entities/addon/addon.reducer';
import { searchEntities as searchAddonGroups } from 'app/entities/addon-groups/addon-groups.reducer';
import { IAddonGroup } from 'app/shared/model/ADDON/addon-groups.model';
import { IProfileGroup } from 'app/shared/model/TAX/profile-group.model';
import { IAddon } from 'app/shared/model/ADDON/addon.model';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Select from 'app/shared/components/select/select';

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

// Define action options with edit and move to trash disabled as requested
const actionOptions = [
  { label: 'Edit', value: 'EDIT', disabled: true },
  { label: 'Move To Trash', value: 'MOVE_TO_TRASH', disabled: true },
  { label: 'Export', value: 'EXPORT', disabled: false },
];

const ADDON_GROUP_PAGE_SIZE = 20;

export const Addon = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const addonList = useAppSelector(state => state.addon.entities);
  const loading = useAppSelector(state => state.addon.loading);
  const totalItems = useAppSelector(state => state.addon.totalItems);
  const loadingGroups = useAppSelector(state => state.addonGroups.loading);
  const [searchParam, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParam.get('query')) || initialState;

  // Bulk actions state
  const [selectedActionOption, setSelectedActionOption] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState<IAddon[]>([]);
  const [itemsToAction, setItemsToAction] = useState<IAddon[]>([]);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  // Search state
  const [nameSearch, setNameSearch] = useState(query?.filters?.name?.value || '');
  const [groupFilter, setGroupFilter] = useState(query?.filters?.groupId?.value || null);
  const [groupOptions, setGroupOptions] = useState<{ id: string; label: string }[]>([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupPage, setGroupPage] = useState(0);
  const [groupHasMore, setGroupHasMore] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(query.page || 0);
  const [itemsPerPage, setItemsPerPage] = useState(query.rows || 20);

  // Dialog states
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showExportAllDialog, setShowExportAllDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

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
    getAllEntities();
  }, [searchParam, query?.rows]);

  useEffect(() => {
    let ignore = false;

    const loadInitialAddonGroups = async () => {
      try {
        const response = await dispatch(
          searchAddonGroups({
            query: applyMatchModeMap({
              page: 0,
              size: ADDON_GROUP_PAGE_SIZE,
              sortField: 'name',
              sortOrder: 1,
              filters: {
                name: {
                  value: groupSearch.trim() || null,
                  matchMode: FilterMatchMode.CONTAINS,
                },
              },
            }),
          })
        ).unwrap();

        if (ignore) {
          return;
        }

        const nextOptions = (Array.isArray(response.data) ? response.data : []).map(group => ({
          id: group.id || '',
          label: group.name || '',
        }));
        const totalCount = Number(response.headers?.['x-total-count']);

        setGroupOptions(nextOptions.filter(option => option.id));
        setGroupPage(0);
        setGroupHasMore(
          Number.isFinite(totalCount)
            ? nextOptions.length < totalCount
            : nextOptions.length === ADDON_GROUP_PAGE_SIZE
        );
      } catch (_error) {
        if (!ignore) {
          setGroupOptions([]);
          setGroupPage(0);
          setGroupHasMore(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      loadInitialAddonGroups();
    }, 300);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [dispatch, groupSearch]);

  const loadMoreAddonGroups = async () => {
    if (loadingGroups || !groupHasMore) {
      return;
    }

    const nextPage = groupPage + 1;

    try {
      const previousCount = groupOptions.length;
      const response = await dispatch(
        searchAddonGroups({
          query: applyMatchModeMap({
            page: nextPage,
            size: ADDON_GROUP_PAGE_SIZE,
            sortField: 'name',
            sortOrder: 1,
            filters: {
              name: {
                value: groupSearch.trim() || null,
                matchMode: FilterMatchMode.CONTAINS,
              },
            },
          }),
        })
      ).unwrap();

      const nextOptions = (Array.isArray(response.data) ? response.data : []).map(group => ({
        id: group.id || '',
        label: group.name || '',
      }));
      const totalCount = Number(response.headers?.['x-total-count']);

      setGroupOptions(prevOptions => {
        const optionMap = new Map(prevOptions.map(option => [option.id, option]));
        nextOptions.forEach(option => {
          if (option.id) {
            optionMap.set(option.id, option);
          }
        });
        return Array.from(optionMap.values());
      });
      setGroupPage(nextPage);
      setGroupHasMore(
        Number.isFinite(totalCount)
          ? previousCount + nextOptions.length < totalCount
          : nextOptions.length === ADDON_GROUP_PAGE_SIZE
      );
    } catch (_error) {
      setGroupHasMore(false);
    }
  };

  // Export functionality
  useEffect(() => {
    if (selectedActionOption?.value === "EXPORT") {
      setShowExportDialog(true);
    }
  }, [selectedActionOption]);

  const handleExportAddons = async () => {
    setIsLoadingAction(true);
    await dispatch(exportEntities(selectedAddons.map(addon => addon.id))).finally(() => setIsLoadingAction(false));
    setSelectedAddons([]);
    setSelectedActionOption(null);
    setShowExportDialog(false);
  };

  const handleExportAllAddons = async () => {
    setIsLoadingAction(true);
    await dispatch(exportEntities([])).finally(() => setIsLoadingAction(false));
    setShowExportAllDialog(false);
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
    setSelectedAddons([]);
    setShowDeleteDialog(false);
  };

  const handlePurgeItems = async () => {
    const updatedQuery = applyMatchModeMap(query);
    await dispatch(purgeEntities({
      ids: itemsToAction.map(item => item.id),
      query: updatedQuery
    }));
    setSelectedAddons([]);
    setShowPurgeDialog(false);
  };

  const handleUnArchiveItems = async () => {
    const updatedQuery = applyMatchModeMap(query);
    await dispatch(unArchiveEntities({
      ids: itemsToAction.map(item => item.id),
      query: updatedQuery
    }));
    setSelectedAddons([]);
    setShowRestoreDialog(false);
  };

  const onSort = event => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const onFilter = event => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const handleNameSearch = (value: string) => {
    setNameSearch(value);
    const queryParams = {
      ...query,
      first: 0,
      page: 0,
      filters: {
        ...query.filters,
        name: { value: value || null, matchMode: FilterMatchMode.CONTAINS }
      }
    };
    setSearchParams({ query: JSON.stringify(queryParams) }, { replace: true });
  };

  const handleGroupFilter = (selectedOption) => {
    setGroupFilter(selectedOption?.id || null);
    const queryParams = {
      ...query,
      first: 0,
      page: 0,
      filters: {
        ...query.filters,
        groupId: { value: selectedOption?.id || null, matchMode: FilterMatchMode.EQUALS }
      }
    };
    setSearchParams({ query: JSON.stringify(queryParams) }, { replace: true });
  };

  const onPage = (newPage: number) => {
    const first = newPage * itemsPerPage;
    const queryParams = { ...query, first, page: newPage };
    setCurrentPage(newPage);
    setSearchParams({ query: JSON.stringify(queryParams) }, { replace: true });
  };

  const handleCreate = () => {
    navigate('/addon/new');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAddons(addonList);
    } else {
      setSelectedAddons([]);
    }
  };

  const handleSelectOne = (addon: IAddon, checked: boolean) => {
    if (checked) {
      setSelectedAddons([...selectedAddons, addon]);
    } else {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    }
  };

  const handleRowsPerPageChange = (newRows: number) => {
    const newQuery = {
      ...query,
      rows: newRows,
      first: 0,
      page: 0
    };
    const queryParams = JSON.stringify(newQuery);
    setSearchParams({ query: queryParams }, { replace: true });
    setItemsPerPage(newRows);
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

  const isSelected = (addon: IAddon) => selectedAddons.some(a => a.id === addon.id);

  const selectedGroupOption = groupOptions.find(opt => opt.id === groupFilter) || null;

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <PageWrapper>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {!query?.filters?.isArchived?.value ? (
                <Select
                  value={selectedActionOption}
                  onChange={(option) => setSelectedActionOption(option)}
                  options={actionOptions}
                  placeholder="Bulk Actions"
                  className="w-48"
                  isDisabled={selectedAddons.length < 1}
                  isOptionDisabled={(option) => option.disabled}
                />
              ) : (
                <h4 className="text-center text-destructive text-sm font-semibold">
                  Now viewing Recycle Bin
                </h4>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!query?.filters?.isArchived?.value ? (
                <>
                  <ImportButton type={'ADDON'} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportAllDialog(true)}
                    className="h-8 text-xs"
                  >
                    <FileDown className="h-4 w-4 mr-1" />
                    Export All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncList}
                    disabled={loading}
                    className="h-8 text-xs"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    {translate('common.refreshList')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={loading}
                    className="h-8 text-xs"
                  >
                    {translate('tempApp.addon.createNewAddon')}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncList}
                  disabled={loading}
                  className="h-8 text-xs"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  {translate('common.refreshList')}
                </Button>
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
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder={translate('common.search.name')}
                value={nameSearch}
                onChange={(e) => handleNameSearch(e.target.value)}
                className="pl-7 h-8 text-xs"
              />
            </div>
            <Select
              value={selectedGroupOption}
              onChange={handleGroupFilter}
              options={groupOptions}
              placeholder={translate("tempApp.addon.searchAddonGroups")}
              isClearable
              isLoading={loadingGroups}
              className="w-64"
              onInputChange={(inputValue, actionMeta) => {
                if (actionMeta.action === 'input-change') {
                  setGroupSearch(inputValue);
                }
              }}
              onMenuScrollToBottom={loadMoreAddonGroups}
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="w-12 px-2">
                    <Checkbox
                      onCheckedChange={(checked) => handleSelectAll(checked === true)}
                      checked={selectedAddons.length === addonList.length && addonList.length > 0}
                    />
                  </TableHead>
                  <TableHead
                   className="px-2 text-xs cursor-pointer"
                   onClick={() => handleSort('name')}
                  >
                    {translate('common.name')}
                    {getSortIcon('name')}
                  </TableHead>
                  <TableHead className="px-2 text-xs cursor-pointer"
                    onClick={() => handleSort('addonGroups.name')}
                  >
                    {translate('tempApp.addon.addonGroups')}
                    {getSortIcon('addonGroups.name')}
                  </TableHead>
                  <TableHead className="px-2 text-xs cursor-pointer"
                    onClick={() => handleSort('price')}
                  >
                    {translate('common.price')}
                    {getSortIcon('price')}
                  </TableHead>
                  <TableHead className="px-2 text-xs cursor-pointer"
                    onClick={() => handleSort('discounts.value')}
                  >
                    {translate('common.discounts')}
                    {getSortIcon('discounts.value')}
                  </TableHead>
                  <TableHead className="px-2 text-xs cursor-pointer"
                    onClick={() => handleSort('accountingGroups.name')}
                  >
                    {translate('common.taxProfiles')}
                   {getSortIcon('accountingGroups.name')}
                  </TableHead>
                  <TableHead className="px-2 text-xs w-24">{translate('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || isLoadingAction ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-16 text-center text-xs">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : addonList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-16 text-center text-xs">
                      <Translate contentKey="entity.noResults" />
                    </TableCell>
                  </TableRow>
                ) : (
                  addonList.map((addon) => {
                    const editUrl = `/addon/${addon.id}/edit`;
                    const isSelectedItem = isSelected(addon);

                    return (
                      <TableRow key={addon.id} className="h-10">
                        <TableCell className="px-2">
                          <Checkbox
                            onCheckedChange={(checked) => handleSelectOne(addon, checked === true)}
                            checked={isSelectedItem}
                          />
                        </TableCell>
                        <TableCell className="px-2 text-xs">
                          <Link to={editUrl} className="text-primary hover:underline">
                            {addon.name}
                          </Link>
                        </TableCell>
                        <TableCell className="px-2 text-xs">
                          {addon?.addonGroups?.map((grp: IAddonGroup) => grp.name).join(" | ")}
                        </TableCell>
                        <TableCell className="px-2 text-xs">{addon.price}</TableCell>
                        <TableCell className="px-2 text-xs">
                          {addon.discounts?.map((discount, index) => (
                            <span key={index} className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary mr-1">
                              {discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}
                            </span>
                          ))}
                        </TableCell>
                        <TableCell className="px-2 text-xs">
                          {addon?.accountingGroups?.map((grp: IProfileGroup) =>
                            grp.profiles
                              ?.map((profile) => (
                                <Link key={profile.id} to={`/tax-profiles/${profile.id}/edit`} className="text-primary hover:underline">
                                  {profile.name}
                                </Link>
                              ))
                              .reduce((prev, curr) => (
                                <>
                                  {prev} | {curr}
                                </>
                              ))
                          )}
                        </TableCell>
                        <TableCell className="px-2">
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
                                    setItemsToAction([addon]);
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
                                    setItemsToAction([addon]);
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
                                    setItemsToAction([addon]);
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
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-1 py-2">
            <div className="text-xs text-muted-foreground">
              Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, totalItems)} of {totalItems} results
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows per page:</span>
                <Select
                  value={{ value: query.rows, label: query.rows.toString() }}
                  onChange={(option) => handleRowsPerPageChange(option.value)}
                  options={[10, 20, 30, 40, 50, 100, 200].map(val => ({ value: val, label: val.toString() }))}
                  className="w-20"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <span className="text-xs px-2">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPage(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {selectedAddons.length > 0 && (
            <div className="flex items-center gap-2 p-2 border-t bg-muted/50">
              <span className="text-xs text-muted-foreground">
                {selectedAddons.length} item(s) selected
              </span>
              {!query?.filters?.isArchived?.value ? (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={() => {
                    setItemsToAction(selectedAddons);
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
                      setItemsToAction(selectedAddons);
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
                      setItemsToAction(selectedAddons);
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
            <AlertDialogTitle>Archive Addons</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive {itemsToAction.length} addon(s)?
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
            <AlertDialogTitle>Restore Addons</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore {itemsToAction.length} addon(s)?
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
            <AlertDialogTitle>Permanently Delete Addons</AlertDialogTitle>
            <AlertDialogDescription className="text-destructive font-semibold">
              Warning: This will permanently delete {itemsToAction.length} addon(s).
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

      {/* Export Selected Dialog */}
      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to export selected addons?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowExportDialog(false); setSelectedActionOption(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleExportAddons}>
              Export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export All Dialog */}
      <AlertDialog open={showExportAllDialog} onOpenChange={setShowExportAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export All Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to export all addons?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowExportAllDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleExportAllAddons}>
              Export All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
};

export default Addon;
