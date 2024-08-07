import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button as PrimeButton } from "primereact/button"
import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from './service-charge.reducer';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { IServiceCharge, ServiceChargeKey, ServiceChargeSettingType, ServiceChargeWhenToApply } from 'app/shared/model/service-charge.model';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Dropdown } from 'primereact/dropdown';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";

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


  const editColumnTemplate = (rowData) => {
    const editUrl = `/service-charge/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/service-charge/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };

  const handleCreate = () => {
    navigate('/service-charge/new')
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Service Charges</span>
      <div className="ms-auto">
        <PrimeButton label="Refresh List" severity="secondary" raised className="me-5" color="info" disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </PrimeButton>
        <PrimeButton label="Create new Service Charge" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </PrimeButton>
      </div>
    </div>
  );

  const formatServiceChargeKey = (key) => {
    switch (key) {
      case ServiceChargeKey.SHIPPING_FEE:
        return "Shipping Fee";
      case ServiceChargeKey.WRAPPING_FEE:
        return "Wrapping Fee";
      case ServiceChargeKey.GRATUITY:
        return "Gratuity";
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
      case ServiceChargeSettingType.PERCENTAGE:
        return "Percentage";
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
    <>
      <Accordion activeIndex={0}>
        <AccordionTab header='Filters'>
          <div className="d-flex flex-column gap-3">
            <div className="d-flex gap-3">
              <Dropdown
                value={searchParams.get('key')}
                options={Object.keys(ServiceChargeKey).map(key => ({ label: key, value: key }))}
                onChange={(e) => navigate(createQueryString('key', e.value))}
                placeholder="Select a Key"
                showClear
                style={{ minWidth: '12rem' }}
              />

              <Dropdown
                value={searchParams.get('whenToApply')}
                options={Object.keys(ServiceChargeWhenToApply).map(key => ({ label: key, value: key }))}
                onChange={(e) => navigate(createQueryString('whenToApply', e.value))}
                placeholder="Select a When To Apply"
                showClear
                style={{ minWidth: '12rem' }}
              />

              <Dropdown
                value={searchParams.get('branch')}
                options={branchList.map(branch => ({ label: branch.name, value: branch.id }))}
                onChange={(e) => navigate(createQueryString('branch', e.value))}
                placeholder="Select a Branch"
                showClear
                style={{ minWidth: '12rem' }}
              />
            </div>
          </div>
        </AccordionTab>
      </Accordion>

      <div className="table-responsive">
        <DataTable
          value={serviceCharges}
          editMode="row"
          showGridlines
          header={header}
          paginator
          totalRecords={totalItems}
          rows={20}
        >
          <Column
            field="key"
            header="Key"
            body={(rowData) => formatServiceChargeKey(rowData.key)}
          />

          <Column
            field="name"
            header="Name"
            body={(rowData) => rowData.value.name}
          />

          <Column
            field="branch"
            header="Branch"
            body={(rowData) => rowData.branch.name}
          />

          <Column
            field="whenToApply"
            header="When To Apply"
            body={(rowData) => formatServiceChargeWhenToApply(rowData.value.whenToApply)}
          />

          <Column
            field="minCharge"
            header="Min Charge"
            body={(rowData) => rowData.value.setting.type === ServiceChargeSettingType.PERCENTAGE ? rowData.value.minCharge : "-"}
          />

          <Column
            field="maxCharge"
            header="Max Charge"
            body={(rowData) => rowData.value.setting.type === ServiceChargeSettingType.PERCENTAGE ? rowData.value.maxCharge : "-"}
          />

          <Column
            field="charge"
            header="Charge"
            body={(rowData) => rowData.value.charge}
          />

          <Column
            field="type"
            header="Type"
            body={(rowData) => formatServiceChargeType(rowData.value.setting.type)}
          />

          <Column
            header="Edit"
            body={editColumnTemplate}
            headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
            bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
          />

          <Column
            header="Delete"
            body={deleteColumnTemplate}
            headerStyle={{ width: '1%', }}
            bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
          />
        </DataTable>
      </div>
    </>
  );
};

export default ServiceCharge;
