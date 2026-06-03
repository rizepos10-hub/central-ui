import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from './flyer.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { IFlyer } from 'app/shared/model/flyer.model';
import { IBranch } from 'app/shared/model/branch.model';
import { convertDateTimeFromServer } from 'app/shared/util/date-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formatApplicationLabel = (application?: string | null) => application || 'All applications';

export const Flyer = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const flyers: IFlyer[] = useAppSelector(state => state.flyer.entities);
  const loading = useAppSelector(state => state.flyer.loading);
  const branchList: IBranch[] = useAppSelector(state => state.branch.entities);

  const [nameFilter, setNameFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');

  useEffect(() => {
    dispatch(getEntities({ page: 0, size: 500, sort: 'name,asc' }));
    dispatch(getBranches({ page: 0, size: 500, sort: 'name,asc' }));
  }, [dispatch]);

  const filteredFlyers = useMemo(() => {
    return flyers.filter(flyer => {
      const matchesName = !nameFilter.trim() || flyer.name?.toLowerCase().includes(nameFilter.trim().toLowerCase());
      const matchesBranch = branchFilter === 'all' || flyer.branch?.id === branchFilter;
      return matchesName && matchesBranch;
    });
  }, [branchFilter, flyers, nameFilter]);

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Flyers</h2>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => dispatch(getEntities({ page: 0, size: 500, sort: 'name,asc' }))}
              disabled={loading}
              className="h-8 text-xs"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh List
            </Button>
            <Button onClick={() => navigate('/flyers/new')} disabled={loading} className="h-8 text-xs">
              <Plus className="mr-2 h-4 w-4" />
              Create new Flyer
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">
                <div className="space-y-2">
                  <div>Name</div>
                  <Input
                    value={nameFilter}
                    onChange={e => setNameFilter(e.target.value)}
                    className="h-7 text-xs"
                    placeholder="Search by Name"
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs">
                <div className="space-y-2">
                  <div>Branch</div>
                  <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        All branches
                      </SelectItem>
                      {branchList.filter(branch => branch.id).map(branch => (
                        <SelectItem key={branch.id} value={branch.id} className="text-xs">
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TableHead>
              <TableHead className="text-xs">Start At</TableHead>
              <TableHead className="text-xs">End At</TableHead>
              <TableHead className="text-xs">Application</TableHead>
              <TableHead className="text-xs">Entries Count</TableHead>
              <TableHead className="w-20 text-xs">Edit</TableHead>
              <TableHead className="w-20 text-xs">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-xs">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredFlyers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-xs">
                  No flyers found
                </TableCell>
              </TableRow>
            ) : (
              filteredFlyers.map(flyer => (
                <TableRow key={flyer.id}>
                  <TableCell className="text-xs">
                    <Link to={`/flyers/${flyer.id}/edit`} className="text-primary hover:underline">
                      {flyer.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{flyer.branch?.name || '-'}</TableCell>
                  <TableCell className="text-xs">{flyer.schedule?.startAt ? convertDateTimeFromServer(flyer.schedule.startAt) : '-'}</TableCell>
                  <TableCell className="text-xs">{flyer.schedule?.endAt ? convertDateTimeFromServer(flyer.schedule.endAt) : '-'}</TableCell>
                  <TableCell className="text-xs">{formatApplicationLabel(flyer.schedule?.application)}</TableCell>
                  <TableCell className="text-xs">{flyer.entries?.length || 0}</TableCell>
                  <TableCell className="text-xs">
                    <Link to={`/flyers/${flyer.id}/edit`}>
                      <Pencil className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-primary" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Link to={`/flyers/${flyer.id}/delete`}>
                      <Trash2 className="h-4 w-4 cursor-pointer text-destructive hover:text-destructive/80" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageWrapper>
  );
};

export default Flyer;
