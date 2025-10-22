import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import { RefreshCw, Plus, Pencil } from 'lucide-react';

import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntities, getEntities } from './tax-profile.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const Tax = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const taxProfileList = useAppSelector(state => state.taxProfiles.entities);
  const loading = useAppSelector(state => state.taxProfiles.loading);
  const totalItems = useAppSelector(state => state.taxProfiles.totalItems);





  const handleCreate = () => {
    navigate('/tax-profiles/new')
  };






  const [filters, setFilters] = useState({
    name: '',
  });



  const getTaxes = () => {
    dispatch(getEntities({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
  };


  useEffect(() => {
    getTaxes()
  }, []);





  const handleFilterChange = (value: string) => {
    setFilters({ name: value });
  };

  const filteredTaxProfileList = taxProfileList.filter((profile) => {
    const matchName = !filters.name || profile.name?.toLowerCase().includes(filters.name.toLowerCase());
    return matchName;
  });

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-xs">Tax Profiles</h1>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={getTaxes}
              disabled={loading}
              className="h-7 text-xs"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh List
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="h-7 text-xs"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Tax Profile
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold">Name</div>
                    <Input
                      placeholder="Search by Name"
                      value={filters.name || ''}
                      onChange={(e) => handleFilterChange(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="h-8 text-xs font-semibold">Description</TableHead>
                <TableHead className="h-8 text-xs font-semibold">Value</TableHead>
                <TableHead className="h-8 w-16 text-xs font-semibold">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTaxProfileList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">
                    No tax profiles found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTaxProfileList.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="text-xs">
                      <Link
                        to={`/tax-profiles/${profile.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                        className="text-primary hover:underline"
                      >
                        {profile.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">{profile?.taxRate?.description}</TableCell>
                    <TableCell className="text-xs">
                      {profile?.taxRate?.code && profile?.taxRate?.value
                        ? `${profile.taxRate.code}(${profile.taxRate.value})`
                        : ''}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/tax-profiles/${profile.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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

export default Tax;
