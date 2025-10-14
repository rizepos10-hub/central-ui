import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import { Pencil, Trash2, RefreshCw, Plus } from 'lucide-react';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities, reset } from './mix-and-match-rule.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const MixAndMatchRule = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const mixAndMatchRulesList = useAppSelector(state => state.mixAndMatchRule.entities);
  const loading = useAppSelector(state => state.mixAndMatchRule.loading);
  const totalItems = useAppSelector(state => state.mixAndMatchRule.totalItems);
  const [nameFilter, setNameFilter] = useState('');

  const getAllEntities = () => {
    dispatch(
      getEntities({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  };

  useEffect(() => {
    getAllEntities();
    return () => {
      dispatch(reset());
    };
  }, [paginationState.activePage, paginationState.order, paginationState.sort]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const handleCreate = () => {
    navigate(`/mix-and-match-rule/new`);
  };

  const filteredRules = mixAndMatchRulesList.filter(rule =>
    rule.name?.toLowerCase().includes(nameFilter.toLowerCase())
  );

  return (
    <PageWrapper>
      <Card>
        <CardContent>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Mix & Match Rules</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncList}
                disabled={loading}
                className="h-8 text-xs"
              >
                {loading ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                Refresh List
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={loading}
                className="h-8 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add New Mix And Match Rule
              </Button>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-3">
            <Input
              placeholder="Search by name"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 text-xs">Name</TableHead>
                  <TableHead className="h-8 text-xs w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.length > 0 ? (
                  filteredRules.map(rule => {
                    const editUrl = `/mix-and-match-rule/${rule.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                    const deleteUrl = `/mix-and-match-rule/${rule.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

                    return (
                      <TableRow key={rule.id}>
                        <TableCell className="text-xs">
                          <Link to={editUrl} className="text-primary hover:underline">
                            {rule.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1">
                            <Link to={editUrl}>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Pencil className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </Link>
                            <Link to={deleteUrl}>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-16 text-center text-xs">
                      No results found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default MixAndMatchRule;
