import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './production-center.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const ProductionCenter = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const productionCenterList = useAppSelector(state => state.productionCenter.entities);
  const loading = useAppSelector(state => state.productionCenter.loading);
  const totalItems = useAppSelector(state => state.productionCenter.totalItems);

  const [nameFilter, setNameFilter] = useState('');
  const [orderMethodFilter, setOrderMethodFilter] = useState('');
  const [printingProfileFilter, setPrintingProfileFilter] = useState('');

  const getAllEntities = () => {
    if (search) {
      dispatch(
        searchEntities({
          query: search,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    } else {
      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }
  };


  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (location.search !== endURL) {
      navigate(`${location.pathname}${endURL}`);
    }
  };

  useEffect(() => {
    sortEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort, search]);

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



  const handleSyncList = () => {
    sortEntities();
  };

  const handleCreate = () => {
    navigate('/production-center/new')
  }

  const filteredData = useMemo(() => {
    return productionCenterList?.filter(item => {
      const matchesName = !nameFilter || item.name?.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesOrderMethod = !orderMethodFilter || item.orderMethod?.toLowerCase().includes(orderMethodFilter.toLowerCase());
      const matchesPrintingProfile = !printingProfileFilter || item.printingProfile?.name?.toLowerCase().includes(printingProfileFilter.toLowerCase());
      return matchesName && matchesOrderMethod && matchesPrintingProfile;
    });
  }, [productionCenterList, nameFilter, orderMethodFilter, printingProfileFilter]);

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Production Centers</h1>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="h-8 text-xs"
              onClick={handleSyncList}
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
              Create New Production Center
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">
                  Name
                  <Input
                    placeholder="Search by name"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="h-7 text-xs mt-1"
                  />
                </TableHead>
                <TableHead className="text-xs">
                  Order Method
                  <Input
                    placeholder="Search by order method"
                    value={orderMethodFilter}
                    onChange={(e) => setOrderMethodFilter(e.target.value)}
                    className="h-7 text-xs mt-1"
                  />
                </TableHead>
                <TableHead className="text-xs">
                  Printing Profile
                  <Input
                    placeholder="Search by printing profile"
                    value={printingProfileFilter}
                    onChange={(e) => setPrintingProfileFilter(e.target.value)}
                    className="h-7 text-xs mt-1"
                  />
                </TableHead>
                <TableHead className="text-xs">Is Virtual</TableHead>
                <TableHead className="text-xs w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredData && filteredData.length > 0 ? (
                filteredData.map((productionCenter) => {
                  const editUrl = `/production-center/${productionCenter.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                  const deleteUrl = `/production-center/${productionCenter.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

                  return (
                    <TableRow key={productionCenter.id}>
                      <TableCell className="text-xs">
                        <Link to={editUrl} className="text-blue-600 hover:underline">
                          {productionCenter.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">{productionCenter.orderMethod || '-'}</TableCell>
                      <TableCell className="text-xs">{productionCenter.printingProfile?.name || '-'}</TableCell>
                      <TableCell className="text-xs">{productionCenter.virtual ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex gap-2">
                          <Link to={editUrl}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Pencil className="h-4 w-4 text-gray-500" />
                            </Button>
                          </Link>
                          <Link to={deleteUrl}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs">
                    <Translate contentKey="tempApp.productionCenter.home.notFound">No Production Centers found</Translate>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ProductionCenter;
