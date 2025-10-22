import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import { RefreshCw, Plus, Pencil } from 'lucide-react';

import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from './printing-profile.reducer';
import { getEntities as getBranches } from '../../../branch/branch.reducer';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PrintingProfiles = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const printingProfilesList = useAppSelector(state => state.printingProfiles.entities);
  const loading = useAppSelector(state => state.printingProfiles.loading);
  const totalItems = useAppSelector(state => state.printingProfiles.totalItems);
  const branchList = useAppSelector(state => state.branch.entities);

  const [nameFilter, setNameFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  const handleCreate = () => {
    navigate('/printing-profiles/new');
  };

  const filteredBranchOptions = branchList.map(branch => ({
    label: branch.name,
    value: branch.id,
  }));

  const getPrintingProfiles = () => {
    dispatch(getEntities({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
  };

  useEffect(() => {
    getPrintingProfiles();
  }, []);

  const filteredData = useMemo(() => {
    return printingProfilesList?.filter(profile => {
      const matchesName = !nameFilter || profile.name?.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesBranch = !branchFilter || profile.branch?.id === branchFilter;
      return matchesName && matchesBranch;
    });
  }, [printingProfilesList, nameFilter, branchFilter]);

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Printing Profiles</h2>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="h-8 text-xs"
              onClick={getPrintingProfiles}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh List
            </Button>
            <Button
              className="h-8 text-xs"
              onClick={handleCreate}
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              Create New Printing Profile
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">
                  <div className="space-y-2">
                    <div>Name</div>
                    <Input
                      placeholder="Search by Name"
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="text-xs">
                  <div className="space-y-2">
                    <div>Branch</div>
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                      <SelectTrigger className="h-7 text-xs min-w-[200px]">
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>All Branches</SelectItem>
                        {filteredBranchOptions.map(branch => (
                          <SelectItem key={branch.value} value={branch.value}>
                            {branch.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableHead>
                <TableHead className="text-xs">Printers</TableHead>
                <TableHead className="text-xs w-[50px]">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs">
                    No printing profiles found
                  </TableCell>
                </TableRow>
              ) : (
                filteredData?.map(profile => (
                  <TableRow key={profile.id}>
                    <TableCell className="text-xs">
                      <Link
                        to={`/printing-profiles/${profile.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                        className="text-primary hover:underline"
                      >
                        {profile.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">{profile?.branch?.name}</TableCell>
                    <TableCell className="text-xs">
                      {profile?.printers?.map(printer => printer.name).join(' | ')}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Link to={`/printing-profiles/${profile.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                        <Pencil className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageWrapper>
  );
};

export default PrintingProfiles;
