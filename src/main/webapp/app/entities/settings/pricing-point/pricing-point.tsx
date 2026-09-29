import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from './pricing-point.reducer';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { FilterMatchMode } from 'primereact/api';
import _ from 'lodash';
import { IPricingPoint, pricingPointDiscountLabel } from 'app/shared/model/PRICING-POINT/pricing-point';

export const PricingPoint = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [searchParams, setSearchParams] = useSearchParams();

  const pricingPoints: IPricingPoint[] = useAppSelector(state => state.pricingPoint.entities);
  const loading = useAppSelector(state => state.pricingPoint.loading);
  const totalItems = useAppSelector(state => state.pricingPoint.totalItems);

  const [localNameFilter, setLocalNameFilter] = useState("");

  const query = JSON.parse(searchParams.get("query")) || {
    first: 0,
    rows: 20,
    page: 0,
    sortField: null,
    sortOrder: null,
    query: '',
    filters: {
      "categories.id": { value: null, matchMode: FilterMatchMode.EQUALS },
      "attributes": { value: null, matchMode: FilterMatchMode.EQUALS },
      name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    }
  };


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

  const debouncedFilter = useRef(_.debounce((event) => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  }, 300)).current

  const handleNameFilterChange = (value: string) => {
    setLocalNameFilter(value);
    const newQuery = {
      ...query,
      filters: {
        ...query.filters,
        name: { value, matchMode: FilterMatchMode.CONTAINS }
      }
    };
    debouncedFilter(newQuery);
  };

  const handleCreate = () => {
    navigate('/pricing-point/new')
  }

  const handleRefresh = () => {
    getAllEntities();
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Pricing Points</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleRefresh} disabled={loading} className="h-8 text-xs">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh List
            </Button>
            <Button onClick={handleCreate} disabled={loading} className="h-8 text-xs">
              <Plus className="h-4 w-4 mr-2" />
              Create new Pricing Point
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
                    type="text"
                    value={localNameFilter || ''}
                    onChange={(e) => handleNameFilterChange(e.target.value)}
                    className="h-7 text-xs"
                    placeholder="Search by Name"
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs">Discount</TableHead>
              <TableHead className="text-xs w-20">Edit</TableHead>
              <TableHead className="text-xs w-20">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs">
                  Loading...
                </TableCell>
              </TableRow>
            ) : pricingPoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs">
                  No pricing points found
                </TableCell>
              </TableRow>
            ) : (
              pricingPoints.map((pricingPoint) => (
                <TableRow key={pricingPoint.id}>
                  <TableCell className="text-xs">
                    <Link
                      to={`/pricing-point/${pricingPoint.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      {pricingPoint.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{pricingPointDiscountLabel(pricingPoint.discount) || '-'}</TableCell>
                  <TableCell className="text-xs">
                    <Link
                      to={`/pricing-point/${pricingPoint.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Link
                      to={`/pricing-point/${pricingPoint.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80 cursor-pointer" />
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

export default PricingPoint;
