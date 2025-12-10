import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { translate, Translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IServiceCharge, ServiceChargeKey, ServiceChargeWhenToApply } from 'app/shared/model/service-charge.model';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { applyMatchModeMap, updateTableFilters } from 'app/shared/util/filter-match-model-util';
import { filterEntities } from './service-charge.reducer';
import DropDownFilter from 'app/shared/components/filter/drop-down-filter';
import { FilterMatchMode } from 'primereact/api';
import { Pencil, Trash2, RefreshCw, Plus, Filter, Loader2 } from 'lucide-react';
import Select from 'app/shared/components/select/select';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

const initialServiceChargeFilterState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  filters: {
    key: { value: null, matchMode: FilterMatchMode.EQUALS },
    whenToApply: { value: null, matchMode: FilterMatchMode.EQUALS },
    'branches.id': { value: null, matchMode: FilterMatchMode.EQUALS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  }
};

export const ServiceCharge = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const serviceCharges: IServiceCharge[] = useAppSelector(state => state.serviceCharge.entities);
  const loading = useAppSelector(state => state.serviceCharge.loading);
  const totalItems = useAppSelector(state => state.serviceCharge.totalItems);
  const branchList = useAppSelector(state => state.branch.entities);

  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const storedQuery = searchParams.get('query');
  const query = storedQuery && storedQuery.trim() ? JSON.parse(storedQuery) : initialServiceChargeFilterState;
  const [localFilters, setLocalFilters] = useState(query?.filters);

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      filterEntities({
        query: updatedQuery,
      })
    );
  };

  useEffect(() => {
    dispatch(getBranches({}));
  }, []);

  useEffect(() => {
    getAllEntities();
    return () => {
      searchParams.set('query', '');
    }
  }, [query?.first, query?.page, query?.rows, query?.sortField, query?.sortOrder]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const onFilter = (newFilters) => {
    const cleanedFilters = updateTableFilters({ ...newFilters });
    query['first'] = 0;
    query['page'] = 0;
    query.filters = cleanedFilters;
    const queryParams = JSON.stringify(query);
    setSearchParams({ query: queryParams }, { replace: true });
    getAllEntities();
  };

  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const handleFilterValueChange = useCallback((field, value) => {
    const updatedFilters = {
      ...localFilters,
      [field]: value
    };
    setLocalFilters(updatedFilters);
  }, [localFilters]);

  const handleClear = () => {
    setLocalFilters({});
    const newQuery = JSON.stringify({ ...initialServiceChargeFilterState });
    setSearchParams({ query: newQuery }, { replace: true });
  };

  const handleCreate = () => {
    navigate('/service-charge/new');
  };

  const formatServiceChargeKey = (key) => {
    switch (key) {
      case ServiceChargeKey.SHIPPING_FEE:
        return "Shipping Fee";
      case ServiceChargeKey.WRAPPING_FEE:
        return "Wrapping Fee";
      case ServiceChargeKey.GRATUITY:
        return "Gratuity";
      case ServiceChargeKey.OTHER:
        return "Other";
      default:
        return key;
    }
  };

  const formatServiceChargeWhenToApply = (whenToApply) => {
    switch (whenToApply) {
      case ServiceChargeWhenToApply.AUTOMATIC:
        return "Automatic";
      case ServiceChargeWhenToApply.ON_DEMAND:
        return "On Demand";
      default:
        return whenToApply;
    }
  };

  const formatServiceChargeCalculationMethod = value => {
    switch (value) {
      case 'FIXED':
        return "Fixed";
      case 'PERCENTAGE':
        return "Percentage";
      default:
        return value;
    }
  };

  const formatServiceChargeOrderMethod = (orderMethod) => {
    switch (orderMethod) {
      case 'DELIVERY':
        return "Delivery";
      case 'PICKUP':
        return "Pickup";
      case 'DINE_IN':
        return "Dine In";
      case 'WALK_IN':
        return "Walk In";
      default:
        return orderMethod;
    }
  };

  const nameColumnTemplate = rowData => {
    const editUrl = `/service-charge/${rowData.id}/edit`;
    return (
      <Link className="font-normal text-xs hover:underline" to={editUrl}>
        {rowData.name}
      </Link>
    );
  };

  const editColumnTemplate = (rowData) => {
    const editUrl = `/service-charge/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/service-charge/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <Trash2 className="h-3 w-3 text-destructive" />
      </Link>
    );
  };

  const PaginationControls = () => {
    const totalPages = Math.ceil(totalItems / query.rows);
    const currentPage = Math.floor(query.first / query.rows) + 1;

    const handlePageChange = (newPage: number) => {
      const newFirst = (newPage - 1) * query.rows;
      onPage({ ...query, first: newFirst, page: newPage - 1 });
    };

    const handleRowsPerPageChange = (newRows: number) => {
      onPage({ ...query, rows: newRows, first: 0, page: 0 });
    };

    return (
      <div className="flex items-center justify-between px-2 py-2 border-t">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page:</span>
          <Select
            value={{ value: query.rows, label: query.rows.toString() }}
            onChange={(option) => handleRowsPerPageChange(option.value)}
            options={[10, 20, 30, 40, 50, 100, 200].map(val => ({ value: val, label: val.toString() }))}
            className="w-20"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {query.first + 1} - {Math.min(query.first + query.rows, totalItems)} of {totalItems}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ‹
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              ›
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="bg-muted/50 p-2 flex justify-between items-center">
        <h2 className="text-xl font-bold">
          <Translate contentKey="service-charge.title">Service Charges</Translate>
        </h2>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleSyncList}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            {translate('common.refreshList')}
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={handleCreate}
          >
            <Plus className="h-4 w-4 mr-1" />
            {translate('common.createNew')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setFiltersVisible(!filtersVisible)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
        </div>
      </div>

      {/* Inline Filters Section */}
      {filtersVisible && (
        <div className="bg-muted/30 p-3 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Name</label>
              <div className="flex gap-1">
                <select
                  className="h-8 text-xs border border-input rounded-md px-2 bg-background"
                  style={{ maxWidth: '120px' }}
                  value={localFilters?.name?.matchMode || FilterMatchMode.CONTAINS}
                  onChange={(e) => {
                    const currentValue = localFilters?.name?.value || '';
                    handleFilterValueChange('name', { value: currentValue, matchMode: e.target.value });
                  }}
                >
                  <option value={FilterMatchMode.CONTAINS}>Contains</option>
                  <option value={FilterMatchMode.STARTS_WITH}>Starts with</option>
                  <option value={FilterMatchMode.ENDS_WITH}>Ends with</option>
                  <option value={FilterMatchMode.EQUALS}>Equals</option>
                  <option value={FilterMatchMode.NOT_EQUALS}>Not equals</option>
                </select>
                <input
                  type="text"
                  className="h-8 text-xs flex-1 border border-input rounded-md px-2 bg-background"
                  placeholder="Filter by name"
                  value={localFilters?.name?.value || ''}
                  onChange={(e) => {
                    const currentMatchMode = localFilters?.name?.matchMode || FilterMatchMode.CONTAINS;
                    handleFilterValueChange('name', { value: e.target.value, matchMode: currentMatchMode });
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && onFilter(localFilters)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Type</label>
              <Select
                value={localFilters?.key?.value ? {
                  label: formatServiceChargeKey(localFilters.key.value),
                  value: localFilters.key.value
                } : null}
                options={Object.keys(ServiceChargeKey).map(key => ({
                  label: formatServiceChargeKey(ServiceChargeKey[key]),
                  value: ServiceChargeKey[key]
                }))}
                onChange={(option) => {
                  handleFilterValueChange('key', { value: option?.value || null, matchMode: FilterMatchMode.EQUALS });
                }}
                isClearable
                placeholder="Select Type"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">When To Apply</label>
              <Select
                value={localFilters?.whenToApply?.value ? {
                  label: formatServiceChargeWhenToApply(localFilters.whenToApply.value),
                  value: localFilters.whenToApply.value
                } : null}
                options={Object.keys(ServiceChargeWhenToApply).map(key => ({
                  label: formatServiceChargeWhenToApply(ServiceChargeWhenToApply[key]),
                  value: ServiceChargeWhenToApply[key]
                }))}
                onChange={(option) => {
                  handleFilterValueChange('whenToApply', { value: option?.value || null, matchMode: FilterMatchMode.EQUALS });
                }}
                isClearable
                placeholder="Select When To Apply"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Branch</label>
              <DropDownFilter
                classname={'w-full'}
                placeholder={'Select Branch'}
                dropDownOptionType={'BRANCH'}
                selectedOption={localFilters?.['branches.id']?.value}
                fieldName={'branches.id'}
                handleDropdownChange={(field, value) => handleFilterValueChange(field, value)}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-3">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleClear}
            >
              Clear Filters
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => onFilter(localFilters)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-md mt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Branches</TableHead>
              <TableHead className="text-xs">When To Apply</TableHead>
              <TableHead className="text-xs">Charge</TableHead>
              <TableHead className="text-xs">Min/Max Charge</TableHead>
              <TableHead className="text-xs">Calculation Method</TableHead>
              <TableHead className="text-xs">Applicable On</TableHead>
              <TableHead className="text-xs w-10">Edit</TableHead>
              <TableHead className="text-xs w-10">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : serviceCharges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-xs py-8">
                  No service charges found
                </TableCell>
              </TableRow>
            ) : (
              serviceCharges.map(charge => (
                <TableRow key={charge.id}>
                  <TableCell className="text-xs">{formatServiceChargeKey(charge.key)}</TableCell>
                  <TableCell className="text-xs">{nameColumnTemplate(charge)}</TableCell>
                  <TableCell className="text-xs">{charge.branches?.map(b => b?.name).join(', ') || '-'}</TableCell>
                  <TableCell className="text-xs">{formatServiceChargeWhenToApply(charge.whenToApply)}</TableCell>
                  <TableCell className="text-xs">{charge.charge || '-'}</TableCell>
                  {/* <TableCell className="text-xs">
                    {charge.minCharge !== undefined || charge.maxCharge !== undefined
                      ? `${charge.minCharge || 0} - ${charge.maxCharge || '∞'}`
                      : '-'}
                  </TableCell> */}
                  <TableCell className="text-xs">{formatServiceChargeCalculationMethod(charge.setting?.method)}</TableCell>
                  <TableCell className="text-xs">
                    {charge.setting?.applicableOn?.orderMethods?.map(om => formatServiceChargeOrderMethod(om)).join(', ') || '-'}
                  </TableCell>
                  <TableCell className="text-xs">{editColumnTemplate(charge)}</TableCell>
                  <TableCell className="text-xs">{deleteColumnTemplate(charge)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <PaginationControls />
      </div>
    </PageWrapper>
  );
};

export default ServiceCharge;
