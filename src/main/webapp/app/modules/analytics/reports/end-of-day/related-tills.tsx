import React, { useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from 'app/entities/settings/branch-registry/branch-registry.reducer';
import { IBranchRegistry } from 'app/shared/model/branch-registry.model';
import { FilterMatchMode } from 'primereact/api';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { searchEntities } from 'app/entities/settings/branch-registry/till/till.reducer';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { convertDateTimeFromServer } from 'app/shared/util/date-utils';
import { DataTable } from 'primereact/datatable';
import { ITill } from 'app/shared/model/till.model';
import { useNavigate } from 'react-router-dom';

type RelatedTillsProps = {
  fromDate: string;
  toDate: string;
};

const RelatedTills = ({ fromDate, toDate }: RelatedTillsProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const branchRegistries: IBranchRegistry[] = useAppSelector(state => state.branchRegistry.entities);
  const tillsList: ITill[] = useAppSelector(state => state.till.entities);
  const totalTills = useAppSelector(state => state.till.totalItems);
  const loadingTills = useAppSelector(state => state.till.loading);

  const loadingRegistry = useAppSelector(state => state.branchRegistry.loading);
  const [selectedRegistry, setSelectedRegistry] = useState<IBranchRegistry | null>(null);

  const tillsState = {
    first: 0,
    rows: 20,
    page: 0,
    sortField: 'endDate',
    sortOrder: -1,
    filters: {
      'registry.id': { value: selectedRegistry?.id, matchMode: FilterMatchMode.EQUALS },
      startDate: { value: fromDate, matchMode: FilterMatchMode.STARTS_WITH },
      endDate: { value: toDate, matchMode: FilterMatchMode.ENDS_WITH },
    },
  };

  const getRelatedTills = () => {
    const modifiedFilters = applyMatchModeMap(tillsState);
    dispatch(searchEntities(modifiedFilters));
  };

  const handleSelectRegistry = e => {
    setSelectedRegistry(e.value);
  };

  useEffect(() => {
    dispatch(
      getEntities({
        page: 0,
        size: 300,
        sort: 'asc',
      })
    );
  }, []);

  useEffect(() => {
    getRelatedTills();
  }, [fromDate, toDate, selectedRegistry?.id]);
  return (
    <div>
      <div>
        <div className="d-flex flex-column gap-1 col-4">
          <label>Choose Register</label>
          <Dropdown
            options={branchRegistries}
            loading={loadingRegistry}
            onChange={handleSelectRegistry}
            value={selectedRegistry}
            placeholder={'Choose register'}
            optionLabel={'name'}
          />
        </div>
      </div>

      <DataTable
        value={tillsList}
        header={'Related Tills'}
        loading={loadingTills}
        removableSort
        emptyMessage={"No Related Tills Found."}
        paginator
        tableStyle={{marginBottom: "4rem"}}
        selectionMode={'single'}
        onSelectionChange={e => navigate(`/analytics/register-closure/${selectedRegistry?.id}/edit/${e.value.id}`)}
        totalRecords={totalTills}
        rows={20}
        lazy
        showGridlines
      >
        <Column field="status" header="Status" />
        <Column field="openAmount" header="Open Amount" />
        <Column field="closeAmount" header="Close Amount" />
        <Column field="startDate" body={rowData => convertDateTimeFromServer(rowData?.startDate)} header="Start Date" />
        <Column field="endDate" body={rowData => convertDateTimeFromServer(rowData?.endDate)} header="End Date" />
      </DataTable>
    </div>
  );
};

export default RelatedTills;
