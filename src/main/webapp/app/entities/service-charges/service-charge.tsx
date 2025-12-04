import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import { Pencil, Trash2, RefreshCw } from 'lucide-react';
import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from './service-charge.reducer';
import { IServiceCharge, ServiceChargeKey, ServiceChargeSettingType, ServiceChargeWhenToApply } from 'app/shared/model/service-charge.model';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Select from 'app/shared/components/select/select';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const ServiceCharge = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const serviceCharges: IServiceCharge[] = useAppSelector(state => state.serviceCharge.entities);
  const loading = useAppSelector(state => state.serviceCharge.loading);
  const totalItems = useAppSelector(state => state.serviceCharge.totalItems);
  const branchList = useAppSelector(state => state.branch.entities);

  const searchParams = new URLSearchParams(location.search);

  const getAllEntities = () => {
    dispatch(
      getEntities({
        sort: 'key,asc',
        page: 0,
        size: 500,
        key: searchParams.get('key'),
        whenToApply: searchParams.get('whenToApply'),
        branchId: searchParams.get('branch'),
      })
    );
  };

  useEffect(() => {
    getAllEntities();
  }, [
    paginationState.activePage,
    paginationState.order,
    paginationState.sort,
    searchParams.get('key'),
    searchParams.get('whenToApply'),
    searchParams.get('branch'),
  ]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = params.get('page');
    const sort = params.get(SORT);
    if (page && sort) {
      const sortSplit = sort.split(',');
      setPaginationState({
        ...paginationState,
        activePage: +page,
        sort: sortSplit[0],
        order: sortSplit[1],
      });
    }
  }, [location.search]);

  useEffect(() => {
    dispatch(getBranches({}));
  }, [])


  const handleCreate = () => {
    navigate('/service-charge/new')
  }

  const getAllEntitiesHandler = () => {
    getAllEntities();
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

  const formatServiceChargeType = value => {
    switch (value) {
      case ServiceChargeSettingType.FIXED:
        return "Fixed";
      // case ServiceChargeSettingType.PERCENTAGE:
      //   return "Percentage";
      default:
        return value;
    }
  };

  const createQueryString = useCallback((name, value) => {
    if (!value) {
      const params = new URLSearchParams(searchParams);
      params.delete(name);
      return `?${params.toString()}`;
    }
    const params = new URLSearchParams(searchParams);
    params.set(name, value);
    return `?${params.toString()}`;
  }, [searchParams]);

  return (
    <PageWrapper>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xl font-bold">Service Charges</span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={getAllEntitiesHandler} disabled={loading} className="h-8 text-xs">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={loading} className="h-8 text-xs">
            Create new Service Charge
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-md border space-y-3">
        <h3 className="font-semibold text-sm">Filters</h3>
        <div className="flex gap-3">
          <Select
            value={searchParams.get('key') ? { label: searchParams.get('key'), value: searchParams.get('key') } : null}
            options={Object.keys(ServiceChargeKey).map(key => ({ label: key, value: key }))}
            onChange={(option) => navigate(createQueryString('key', option?.value))}
            placeholder="Select a Key"
            isClearable
            className="flex-1"
          />

          <Select
            value={searchParams.get('whenToApply') ? { label: searchParams.get('whenToApply'), value: searchParams.get('whenToApply') } : null}
            options={Object.keys(ServiceChargeWhenToApply).map(key => ({ label: key, value: key }))}
            onChange={(option) => navigate(createQueryString('whenToApply', option?.value))}
            placeholder="Select When To Apply"
            isClearable
            className="flex-1"
          />

          <Select
            value={searchParams.get('branch') ? branchList.find(b => b.id === searchParams.get('branch')) ? { label: branchList.find(b => b.id === searchParams.get('branch')).name, value: searchParams.get('branch') } : null : null}
            options={branchList.map(branch => ({ label: branch.name, value: branch.id }))}
            onChange={(option) => navigate(createQueryString('branch', option?.value))}
            placeholder="Select a Branch"
            isClearable
            className="flex-1"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>When To Apply</TableHead>
              <TableHead>Charge</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[50px]">Edit</TableHead>
              <TableHead className="w-[50px]">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {serviceCharges.map(charge => (
              <TableRow key={charge.id}>
                <TableCell className="text-xs">{formatServiceChargeKey(charge.key)}</TableCell>
                <TableCell className="text-xs">{charge.value.name}</TableCell>
                <TableCell className="text-xs">{charge.branch.name}</TableCell>
                <TableCell className="text-xs">{formatServiceChargeWhenToApply(charge.value.whenToApply)}</TableCell>
                <TableCell className="text-xs">{charge.value.charge}</TableCell>
                <TableCell className="text-xs">{formatServiceChargeType(charge.value.setting.type)}</TableCell>
                <TableCell>
                  <Link to={`/service-charge/${charge.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                      <Pencil className="h-3 w-3 text-gray-400" />
                    </Button>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link to={`/service-charge/${charge.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
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

export default ServiceCharge;
