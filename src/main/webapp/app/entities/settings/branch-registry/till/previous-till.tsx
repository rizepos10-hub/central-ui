import React, { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, updateEntity } from './till.reducer';
import { FilterMatchMode } from 'primereact/api';
import { ITill } from 'app/shared/model/till.model';
import { convertDateTimeFromServer, toLocalISOString } from 'app/shared/util/date-utils';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { useNavigate, useParams } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CalendarIcon, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';

export const PreviousTill = ({ registryId, isRegisterClosure }: { registryId: string, isRegisterClosure: boolean | undefined}) => {
  const dispatch = useAppDispatch();
  const { id, tillId } = useParams();

  const tillsList: ITill[] = useAppSelector(state => state.till.entities);
  const loading = useAppSelector(state => state.till.loading);
  const updating = useAppSelector(state => state.till.updating);
  const updateSuccess = useAppSelector(state => state.till.updateSuccess);
  const totalItems = useAppSelector(state => state.till.totalItems);
  const navigate = useNavigate();

  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 20,
    page: 0,
    sortField: "endDate",
    sortOrder: -1,
    query: '',
    filters: {
      'registry.id': { value: registryId, matchMode: FilterMatchMode.EQUALS },

      status: { value: "CLOSED", matchMode: FilterMatchMode.STARTS_WITH },
      startDate: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
      endDate: { value: null, matchMode: FilterMatchMode.ENDS_WITH },
    },
  });

  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: number }>({});

  const getAllEntities = () => {
    const modifiedFilters = applyMatchModeMap(lazyState);
    dispatch(searchEntities(modifiedFilters));
  };

  useEffect(() => {
    getAllEntities();
  }, [lazyState, updateSuccess]);

  const onPage = (newPage: number) => {
    setLazyState(prev => ({
      ...prev,
      first: newPage * prev.rows,
      page: newPage,
    }));
  };

  const handleFilterDateChange = (date: Date | undefined, field: 'startDate' | 'endDate') => {
    setLazyState(prevState => ({
      ...prevState,
      filters: {
        ...lazyState.filters,
        [field]: {
          value: date ? toLocalISOString(date) : null,
          matchMode: field === 'startDate' ? FilterMatchMode.STARTS_WITH : FilterMatchMode.ENDS_WITH,
        },
      },
    }));
  };

  const clearFilterDate = (field: 'startDate' | 'endDate') => {
    setLazyState(prevState => ({
      ...prevState,
      filters: {
        ...lazyState.filters,
        [field]: {
          value: null,
          matchMode: field === 'startDate' ? FilterMatchMode.STARTS_WITH : FilterMatchMode.ENDS_WITH,
        },
      },
    }));
  };

  const handleEditRow = (till: ITill) => {
    setEditingRow(till.id);
    setEditValues({ openAmount: till.openAmount || 0 });
  };

  const handleSaveEdit = (till: ITill) => {
    const updatedTill = {
      ...till,
      openAmount: editValues.openAmount,
    };
    dispatch(updateEntity(updatedTill));
    setEditingRow(null);
    setEditValues({});
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditValues({});
  };

  const handleRowClick = (till: ITill) => {
    if (isRegisterClosure && editingRow !== till.id) {
      navigate(`/analytics/register-closure/${id}/edit/${till.id}`);
    }
  };



  const totalPages = Math.ceil(totalItems / lazyState.rows);
  const currentPage = lazyState.page;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold">Previous Tills</h2>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-7 text-xs">Status</TableHead>
              <TableHead className="h-7 text-xs">Open Amount</TableHead>
              <TableHead className="h-7 text-xs">Close Amount</TableHead>
              <TableHead className="h-7 text-xs">
                <div className="flex items-center gap-2">
                  Start Date
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="h-6 w-6 p-0">
                        <CalendarIcon className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={lazyState?.filters?.startDate?.value ? new Date(lazyState.filters.startDate.value) : undefined}
                        onSelect={(date) => handleFilterDateChange(date, 'startDate')}
                      />
                    </PopoverContent>
                  </Popover>
                  {lazyState?.filters?.startDate?.value && (
                    <Button
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => clearFilterDate('startDate')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TableHead>
              <TableHead className="h-7 text-xs">
                <div className="flex items-center gap-2">
                  End Date
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="h-6 w-6 p-0">
                        <CalendarIcon className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={lazyState?.filters?.endDate?.value ? new Date(lazyState.filters.endDate.value) : undefined}
                        onSelect={(date) => handleFilterDateChange(date, 'endDate')}
                      />
                    </PopoverContent>
                  </Popover>
                  {lazyState?.filters?.endDate?.value && (
                    <Button
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => clearFilterDate('endDate')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TableHead>
              <TableHead className="h-7 text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || updating ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : tillsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  No previous tills found
                </TableCell>
              </TableRow>
            ) : (
              tillsList.map((till) => (
                <TableRow
                  key={till.id}
                  className={`h-7 text-xs ${isRegisterClosure && editingRow !== till.id ? 'cursor-pointer' : ''}`}
                  onClick={() => handleRowClick(till)}
                  onDoubleClick={() => !isRegisterClosure && handleEditRow(till)}
                >
                  <TableCell className="py-1">{till.status}</TableCell>
                  <TableCell className="py-1">
                    {editingRow === till.id ? (
                      <Input
                        type="number"
                        className="h-7 text-xs"
                        value={editValues.openAmount}
                        onChange={(e) => setEditValues({ openAmount: parseFloat(e.target.value) || 0 })}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      till.openAmount
                    )}
                  </TableCell>
                  <TableCell className="py-1">{till.closeAmount}</TableCell>
                  <TableCell className="py-1">{convertDateTimeFromServer(till?.startDate)}</TableCell>
                  <TableCell className="py-1">{convertDateTimeFromServer(till?.endDate)}</TableCell>
                  <TableCell className="py-1">
                    {editingRow === till.id ? (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="default"
                          className="h-6 text-xs px-2"
                          onClick={() => handleSaveEdit(till)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 0 && onPage(currentPage - 1)}
                  className={`h-7 text-xs ${currentPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => onPage(i)}
                    isActive={currentPage === i}
                    className="h-7 w-7 text-xs cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages - 1 && onPage(currentPage + 1)}
                  className={`h-7 text-xs ${currentPage === totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default PreviousTill;
