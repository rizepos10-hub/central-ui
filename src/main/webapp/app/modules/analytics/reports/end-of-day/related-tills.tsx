import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from 'app/entities/settings/branch-registry/branch-registry.reducer';
import { IBranchRegistry } from 'app/shared/model/branch-registry.model';
import { FilterMatchMode } from 'primereact/api';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { searchEntities } from 'app/entities/settings/branch-registry/till/till.reducer';
import { convertDateTimeFromServer } from 'app/shared/util/date-utils';
import { ITill } from 'app/shared/model/till.model';
import { useNavigate } from 'react-router-dom';
import ReportSection, {
  reportCellClassName,
  reportHeadClassName,
  reportHeaderRowClassName,
  reportNumericCellClassName,
  reportTableBodyClassName,
  reportTableClassName,
} from 'app/shared/components/report/report-ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';

type RelatedTillsProps = {
  fromDate: string;
  toDate: string;
};

const RelatedTills = ({ fromDate, toDate }: RelatedTillsProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const branchRegistries: IBranchRegistry[] = useAppSelector(state => state.branchRegistry.entities);
  const tillsList: ITill[] = useAppSelector(state => state.till.entities);
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

  const handleRowClick = (till: ITill) => {
    if (selectedRegistry?.id) {
      navigate(`/analytics/register-closure/${selectedRegistry.id}/edit/${till.id}`);
    }
  };

  return (
    <ReportSection title="Related Tills" contentClassName="space-y-3 p-3">
      <div className="flex max-w-xs flex-col gap-2">
        <Label htmlFor="registry-select" className="text-xs">
          Choose Register
        </Label>
        <Select
          value={selectedRegistry?.id || ''}
          onValueChange={value => {
            const registry = branchRegistries.find(r => r.id === value);
            setSelectedRegistry(registry || null);
          }}
          disabled={loadingRegistry}
        >
          <SelectTrigger id="registry-select" className="h-7 text-xs">
            <SelectValue placeholder="Choose register" />
          </SelectTrigger>
          <SelectContent>
            {branchRegistries.map(registry => (
              <SelectItem key={registry.id} value={registry.id} className="text-xs">
                {registry.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table className={reportTableClassName}>
          <TableHeader>
            <TableRow className={reportHeaderRowClassName}>
              <TableHead className={reportHeadClassName}>Status</TableHead>
              <TableHead className={`${reportHeadClassName} text-right`}>Open Amount</TableHead>
              <TableHead className={`${reportHeadClassName} text-right`}>Close Amount</TableHead>
              <TableHead className={reportHeadClassName}>Start Date</TableHead>
              <TableHead className={reportHeadClassName}>End Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={reportTableBodyClassName}>
            {loadingTills ? (
              <TableRow>
                <TableCell colSpan={5} className="py-4 text-center text-xs">
                  Loading...
                </TableCell>
              </TableRow>
            ) : tillsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-4 text-center text-xs">
                  No Related Tills Found.
                </TableCell>
              </TableRow>
            ) : (
              tillsList.map(till => (
                <TableRow
                  key={till.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(till)}
                >
                  <TableCell className={reportCellClassName}>{till.status}</TableCell>
                  <TableCell className={reportNumericCellClassName}>{till.openAmount}</TableCell>
                  <TableCell className={reportNumericCellClassName}>{till.closeAmount}</TableCell>
                  <TableCell className={reportCellClassName}>{convertDateTimeFromServer(till?.startDate)}</TableCell>
                  <TableCell className={reportCellClassName}>{convertDateTimeFromServer(till?.endDate)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
    </ReportSection>
  );
};

export default RelatedTills;
