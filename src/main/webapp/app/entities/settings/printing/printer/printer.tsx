import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IPrinter } from 'app/shared/model/PRINTER/printer.model';
import { searchEntities, getEntities } from './printer.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const Printer = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const printerList = useAppSelector(state => state.printer.entities);
  const loading = useAppSelector(state => state.printer.loading);
  const totalItems = useAppSelector(state => state.printer.totalItems);

  const [nameFilter, setNameFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

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
    navigate('/printer/new');
  };

  // Client-side filtering
  const filteredPrinterList = useMemo(() => {
    return printerList?.filter(printer => {
      const matchesName = !nameFilter || printer.name?.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesModel = !modelFilter || printer.model?.toLowerCase().includes(modelFilter.toLowerCase());
      const matchesBrand = !brandFilter || printer.brand?.toLowerCase().includes(brandFilter.toLowerCase());
      const matchesBranch = !branchFilter || printer.branch?.name?.toLowerCase().includes(branchFilter.toLowerCase());
      return matchesName && matchesModel && matchesBrand && matchesBranch;
    });
  }, [printerList, nameFilter, modelFilter, brandFilter, branchFilter]);

  return (
    <PageWrapper>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Printers</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSyncList}
              disabled={loading}
              className="h-8 text-xs"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh List
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="h-8 text-xs"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create new Printer
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>Name</div>
                    <Input
                      placeholder="Search by name"
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>Model</div>
                    <Input
                      placeholder="Search by model"
                      value={modelFilter}
                      onChange={(e) => setModelFilter(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>Brand</div>
                    <Input
                      placeholder="Search by brand"
                      value={brandFilter}
                      onChange={(e) => setBrandFilter(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>Branch</div>
                    <Input
                      placeholder="Search by branch"
                      value={branchFilter}
                      onChange={(e) => setBranchFilter(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="text-xs">Print Speed</TableHead>
                <TableHead className="text-xs">Color Printer</TableHead>
                <TableHead className="text-xs">Edit</TableHead>
                <TableHead className="text-xs">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrinterList?.length > 0 ? (
                filteredPrinterList.map((printer) => {
                  const editUrl = `/printer/${printer.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                  const deleteUrl = `/printer/${printer.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

                  return (
                    <TableRow key={printer.id}>
                      <TableCell className="text-xs">
                        <Link to={editUrl} className="text-primary hover:underline">
                          {printer.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">{printer.model}</TableCell>
                      <TableCell className="text-xs">{printer.brand}</TableCell>
                      <TableCell className="text-xs">{printer.branch?.name}</TableCell>
                      <TableCell className="text-xs">{printer.printSpeed}</TableCell>
                      <TableCell className="text-xs">{printer.colorPrinter ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-xs">
                        <Link to={editUrl}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Link to={deleteUrl}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-16 text-center text-xs">
                    No printers found.
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

export default Printer;
