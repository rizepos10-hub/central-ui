import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { Pencil, Trash2, RefreshCw, FileDown, Upload, Search as SearchIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { FilterMatchMode } from 'primereact/api';
import ImportButton from 'app/shared/components/data-import/data-import';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { filterEntities, exportEntities } from 'app/entities/addon/addon.reducer';
import { getEntities } from 'app/entities/addon-groups/addon-groups.reducer';
import { IAddonGroup } from "app/shared/model/ADDON/addon-groups.model";
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
import Select from "react-select";

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

// Define action options with edit and move to trash disabled as requested
const actionOptions = [
  { label: 'Edit', value: 'EDIT', disabled: true },
  { label: 'Move To Trash', value: 'MOVE_TO_TRASH', disabled: true },
  { label: 'Export', value: 'EXPORT', disabled: false },
];

export const Addon = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const addonList = useAppSelector(state => state.addon.entities);
  const loading = useAppSelector(state => state.addon.loading);
  const totalItems = useAppSelector(state => state.addon.totalItems);
  const addonGroups = useAppSelector(state => state.addonGroups.entities);
  const loadingGroups = useAppSelector(state => state.addonGroups.loading);
  const [searchParam, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParam.get('query')) || initialState;

  // Bulk actions state
  const [selectedActionOption, setSelectedActionOption] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState<IAddon[]>([]);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  // Search state
  const [nameSearch, setNameSearch] = useState(query?.filters?.name?.value || '');
  const [groupFilter, setGroupFilter] = useState(query?.filters?.groupId?.value || null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(query.page || 0);
  const [itemsPerPage, setItemsPerPage] = useState(query.rows || 20);

  // Export confirmation dialog
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showExportAllDialog, setShowExportAllDialog] = useState(false);

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
    dispatch(
      getEntities({
        page: 0,
        size: 100,
      })
    );
  }, []);

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

  const isSelected = (addon: IAddon) => selectedAddons.some(a => a.id === addon.id);

  const addonGroupsOptions = addonGroups.map(grp => ({ id: grp.id, label: grp.name }));
  const selectedGroupOption = addonGroupsOptions.find(opt => opt.id === groupFilter);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <PageWrapper>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Select
                value={selectedActionOption}
                onChange={(option) => setSelectedActionOption(option)}
                options={actionOptions}
                placeholder="Bulk Actions"
                className="w-48"
                isDisabled={selectedAddons.length < 1}
                isOptionDisabled={(option) => option.disabled}
                styles={{
                  control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                  option: (base) => ({ ...base, fontSize: '0.75rem' })
                }}
              />
            </div>
            <div className="flex items-center gap-1">
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
              options={addonGroupsOptions}
              placeholder={translate("tempApp.addon.searchAddonGroups")}
              isClearable
              isLoading={loadingGroups}
              className="w-64"
              styles={{
                control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                option: (base) => ({ ...base, fontSize: '0.75rem' })
              }}
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
                  <TableHead className="px-2 text-xs">{translate('common.name')}</TableHead>
                  <TableHead className="px-2 text-xs">{translate('tempApp.addon.addonGroups')}</TableHead>
                  <TableHead className="px-2 text-xs">{translate('common.price')}</TableHead>
                  <TableHead className="px-2 text-xs">{translate('common.discounts')}</TableHead>
                  <TableHead className="px-2 text-xs">{translate('common.taxProfiles')}</TableHead>
                  <TableHead className="px-2 text-xs w-20">{translate('common.edit')}</TableHead>
                  <TableHead className="px-2 text-xs w-20">{translate('common.delete')}</TableHead>
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
                  addonList.map((addon) => (
                    <TableRow key={addon.id} className="h-10">
                      <TableCell className="px-2">
                        <Checkbox
                          onCheckedChange={(checked) => handleSelectOne(addon, checked === true)}
                          checked={isSelected(addon)}
                        />
                      </TableCell>
                      <TableCell className="px-2 text-xs">
                        <Link to={`/addon/${addon.id}/edit`} className="text-primary hover:underline">
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
                        <Link to={`/addon/${addon.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell className="px-2">
                        <Link to={`/addon/${addon.id}/delete`}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-1 py-2">
            <div className="text-xs text-muted-foreground">
              Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, totalItems)} of {totalItems} results
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
        </CardContent>
      </Card>

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
