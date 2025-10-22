import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import { Pencil, Trash2, RefreshCw, Plus, Eye } from 'lucide-react';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from './tv.reducer';
import { ITv } from "app/shared/model/TV/tv.model";
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';

export const FloorPlanTv = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const tvsList: ITv[] = useAppSelector(state => state.tv.entities);
  const loading = useAppSelector(state => state.tv.loading);
  const totalItems = useAppSelector(state => state.tv.totalItems);
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
  }, [paginationState.activePage, paginationState.order, paginationState.sort]);





  const handleSyncList = () => {
    getAllEntities();
  };

  const handleCreate = () => {
    navigate('/tv/new');
  };

  const filteredTvs = tvsList.filter(tv =>
    tv.name?.toLowerCase().includes(nameFilter.toLowerCase())
  );

  const totalPages = Math.ceil(totalItems / 20);
  const currentPage = paginationState.activePage;

  const handlePageChange = (page: number) => {
    setPaginationState({
      ...paginationState,
      activePage: page,
    });
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="h-7 w-7 text-xs cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="h-7 w-7 text-xs cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="h-7 w-7 text-xs cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="h-7 w-7 text-xs cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <PageWrapper>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Tvs</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-8 text-xs"
              onClick={handleSyncList}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh List
            </Button>
            <Button
              className="h-8 text-xs"
              onClick={handleCreate}
              disabled={loading}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add New Tv
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-xs">Name</TableHead>
                <TableHead className="h-8 text-xs">Branch</TableHead>
                <TableHead className="h-8 text-xs">Width</TableHead>
                <TableHead className="h-8 text-xs">Height</TableHead>
                <TableHead className="h-8 text-xs text-center w-12">Edit</TableHead>
                <TableHead className="h-8 text-xs text-center w-12">Delete</TableHead>
                <TableHead className="h-8 text-xs text-center w-12">View</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="h-8 p-1">
                  <Input
                    placeholder="Search by name"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="h-7 text-xs"
                  />
                </TableHead>
                <TableHead className="h-8"></TableHead>
                <TableHead className="h-8"></TableHead>
                <TableHead className="h-8"></TableHead>
                <TableHead className="h-8"></TableHead>
                <TableHead className="h-8"></TableHead>
                <TableHead className="h-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTvs.map((tv) => {
                const editUrl = `/tv/${tv.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                const deleteUrl = `/tv/${tv.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                const viewUrl = `/tv/${tv.id}/view`;

                return (
                  <TableRow key={tv.id}>
                    <TableCell className="text-xs">
                      <Link to={editUrl} className="text-primary hover:underline">
                        {tv?.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">{tv?.branch?.name}</TableCell>
                    <TableCell className="text-xs">{tv.dimensions?.width}</TableCell>
                    <TableCell className="text-xs">{tv.dimensions?.height}</TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0"
                              asChild
                            >
                              <Link to={editUrl}>
                                <Pencil className="h-3 w-3" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              asChild
                            >
                              <Link to={deleteUrl}>
                                <Trash2 className="h-3 w-3" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0"
                              asChild
                            >
                              <Link to={viewUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-3 w-3" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className="h-7 px-2 text-xs cursor-pointer"
                    aria-disabled={currentPage === 1}
                  >
                    Previous
                  </PaginationLink>
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className="h-7 px-2 text-xs cursor-pointer"
                    aria-disabled={currentPage === totalPages}
                  >
                    Next
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default FloorPlanTv;
