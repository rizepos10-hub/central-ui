import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getOpenTills } from 'app/entities/settings/branch-registry/branch-registry.reducer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Translate } from 'react-jhipster';

interface OpenTillsTabProps {
  branchId: string | null;
}

export const OpenTillsTab: React.FC<OpenTillsTabProps> = ({ branchId }) => {
  const dispatch = useAppDispatch();
  const openTills = useAppSelector(state => state.branchRegistry.openTills);
  const loading = useAppSelector(state => state.branchRegistry.loading);

  useEffect(() => {
    if (branchId) {
      dispatch(getOpenTills(branchId));
    }
  }, [branchId]);

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          <Translate contentKey="endOfDay.selectBranchFirst">Please select a branch first</Translate>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (!openTills || openTills.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          <Translate contentKey="endOfDay.noOpenTills">No open tills found</Translate>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Translate contentKey="endOfDay.tillName">Till Name</Translate>
            </TableHead>
            <TableHead>
              <Translate contentKey="endOfDay.status">Status</Translate>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {openTills.map((till) => (
            <TableRow key={till.tillId}>
              <TableCell>{till.name}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  till.status === 'OPENED' ? 'bg-green-50 text-green-700' :
                  till.status === 'CLOSE_REQUESTED' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  {till.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
