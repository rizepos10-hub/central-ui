import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { RefreshCw, Plus, ArrowLeftRight, Pencil, DollarSign, Layers } from 'lucide-react';

import { SORT } from 'app/shared/util/pagination.constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities } from './loyalty-card.reducer';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { FilterMatchMode } from 'primereact/api';
import AddBalance from './add-balance';
import TransferFunds from './transfer-funds';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import type { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export const GiftCard = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState({
    activePage: 1,
    itemsPerPage: 10,
    sort: 'id',
    order: 'asc',
  });

  const [transferDialogVisibile, setTransferDialogVisible] = useState(false);
  const [addBalanceDialog, setAddBalanceDialog] = useState({
    entity: null,
    visible: false,
  });

  const loyaltyCardList = useAppSelector(state => state.loyaltycard.entities);
  const loading = useAppSelector(state => state.loyaltycard.loading);
  const totalItems = useAppSelector(state => state.loyaltycard.totalItems);

  const [filters, setFilters] = useState({
    cardHolderName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    referenceNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
    code: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const getAllEntities = () => {
    const query = {
      first: (paginationState.activePage - 1) * paginationState.itemsPerPage,
      rows: paginationState.itemsPerPage,
      page: paginationState.activePage - 1,
      sortField: paginationState.sort,
      sortOrder: paginationState.order === 'asc' ? 1 : -1,
      query: '',
      filters: {
        code: { value: filters.code?.value, matchMode: FilterMatchMode.CONTAINS },
        cardHolderName: { value: filters.cardHolderName?.value, matchMode: FilterMatchMode.CONTAINS },
        referenceNumber: { value: filters.referenceNumber?.value, matchMode: FilterMatchMode.CONTAINS },
      },
    };

    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      searchEntities({
        query: updatedQuery,
      })
    );
  };

  // Fetch entities whenever pagination or filters change
  useEffect(() => {
    getAllEntities();
  }, [
    paginationState.activePage,
    paginationState.itemsPerPage,
    paginationState.order,
    paginationState.sort,
    filters.cardHolderName.value,
    filters.referenceNumber.value,
    filters.code.value,
  ]);

  // Reset to first page when filters change
  useEffect(() => {
    setPaginationState(prevState => ({
      ...prevState,
      activePage: 1,
    }));
  }, [filters.cardHolderName.value, filters.referenceNumber.value, filters.code.value]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const handleCreate = () => {
    navigate('/loyalty-cards/new');
  };

  const onTransferFundsCloseHandle = () => {
    setTransferDialogVisible(false);
    getAllEntities();
  };

  // Generate page numbers with ellipsis
  const generatePageNumbers = () => {
    const totalPages = Math.ceil(totalItems / paginationState.itemsPerPage);
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (paginationState.activePage <= 3) {
        for (let i = 1; i <= maxVisible; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (paginationState.activePage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = paginationState.activePage - 1; i <= paginationState.activePage + 1; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const totalPages = Math.ceil(totalItems / paginationState.itemsPerPage);

  const formatAssignedCustomer = (customer?: ICustomer | null) => {
    if (!customer) {
      return '-';
    }

    const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim();
    const secondary = customer.mobileNumber || customer.phone || customer.email || customer.accountNumber || customer.id;

    if (fullName && secondary) {
      return `${fullName} (${secondary})`;
    }

    return fullName || secondary || '-';
  };

  const getAssignedCustomerLink = (customer?: ICustomer | null) => {
    if (!customer?.id) {
      return null;
    }
    return `/customer/${customer.id}?page=1&sort=id,asc`;
  };

  return (
    <PageWrapper>
      <TransferFunds transferDialogVisibile={transferDialogVisibile} onCloseHandle={onTransferFundsCloseHandle} />

      <AddBalance addBalanceDialog={addBalanceDialog} setAddBalanceDialog={setAddBalanceDialog} />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">
          <Translate contentKey={'loyaltycard.view.table.title'}>Loyalty Cards</Translate>
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-8 text-xs"
            onClick={() => {
              setTransferDialogVisible(true);
            }}
            disabled={loading}
          >
            <ArrowLeftRight className="h-3 w-3" />
            {translate('loyaltycard.view.table.buttons.transfer')}
          </Button>
          <Button variant="outline" className="h-8 text-xs" onClick={handleSyncList} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            {translate('loyaltycard.view.table.buttons.refreshList')}
          </Button>
          <Button variant="outline" className="h-8 text-xs" onClick={() => navigate('/loyalty-cards/bulk-create')} disabled={loading}>
            <Layers className="h-3 w-3" />
            Bulk Create
          </Button>
          <Button className="h-8 text-xs" onClick={handleCreate} disabled={loading}>
            <Plus className="h-3 w-3" />
            {translate('loyaltycard.view.table.buttons.create')}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            {/* Header Row */}
            <TableRow>
              <TableHead className="text-sm font-bold">
                <Translate contentKey="common.cardHolderName">Card Holder Name</Translate>
              </TableHead>
              <TableHead className="text-sm font-bold">
                <Translate contentKey="common.referenceNumber">Reference Number</Translate>
              </TableHead>
              <TableHead className="text-sm font-bold">
                Assigned Customer
              </TableHead>
              <TableHead className="text-sm font-bold">
                <Translate contentKey="common.code">Code</Translate>
              </TableHead>
              <TableHead className="text-sm font-bold text-right">
                <Translate contentKey="common.walletBalance">Wallet Balance</Translate>
              </TableHead>
              <TableHead className="text-sm font-bold">
                <Translate contentKey="common.printed">Printed</Translate>
              </TableHead>
              <TableHead className="text-sm font-bold">
                <Translate contentKey="common.active">Active</Translate>
              </TableHead>
              <TableHead className="text-sm font-bold">
                <Translate contentKey="common.expiryDate">Expiry Date</Translate>
              </TableHead>
              <TableHead className="text-sm font-bold text-center w-12">
                <Translate contentKey="common.addBalance">Add Balance</Translate>
              </TableHead>
              <TableHead className="text-sm font-bold text-center w-12">
                <Translate contentKey="common.edit">Edit</Translate>
              </TableHead>
            </TableRow>
            {/* Filter Row */}
            <TableRow>
              <TableHead>
                <Input
                  placeholder={translate('common.cardHolderName')}
                  className="h-7 text-xs"
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      cardHolderName: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS },
                    }))
                  }
                />
              </TableHead>
              <TableHead>
                <Input
                  placeholder={translate('common.referenceNumber')}
                  className="h-7 text-xs"
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      referenceNumber: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS },
                    }))
                  }
                />
              </TableHead>
              <TableHead>
                <Input placeholder="Assigned Customer" className="h-7 text-xs" disabled />
              </TableHead>
              <TableHead>
                <Input
                  placeholder={translate('common.code')}
                  className="h-7 text-xs"
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      code: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS },
                    }))
                  }
                />
              </TableHead>
              <TableHead />
              <TableHead />
              <TableHead />
              <TableHead />
              <TableHead />
              <TableHead />
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && loyaltyCardList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-xs py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : loyaltyCardList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-xs py-4">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              loyaltyCardList.map(card => (
                <TableRow key={card.id}>
                  <TableCell className="text-xs">{card.cardHolderName}</TableCell>
                  <TableCell className="text-xs">{card.referenceNumber}</TableCell>
                  <TableCell className="text-xs">
                    {getAssignedCustomerLink(card?.wallet?.assignedTo) ? (
                      <Link
                        to={getAssignedCustomerLink(card?.wallet?.assignedTo)!}
                        className="text-primary hover:underline"
                      >
                        {formatAssignedCustomer(card?.wallet?.assignedTo)}
                      </Link>
                    ) : (
                      formatAssignedCustomer(card?.wallet?.assignedTo)
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{card.code}</TableCell>
                  <TableCell className="text-xs text-right">{card?.wallet?.balance}</TableCell>
                  <TableCell className="text-xs">{card.printed?.toString()}</TableCell>
                  <TableCell className="text-xs">{card.active?.toString()}</TableCell>
                  <TableCell className="text-xs">{card?.expiryDate ? formatDateForDisplay(card.expiryDate, 'PP') : null}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() =>
                        setAddBalanceDialog({
                          entity: card,
                          visible: true,
                        })
                      }
                    >
                      <DollarSign className="h-3 w-3" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Link
                      to={`/loyalty-cards/${card.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                    >
                      <Button variant="ghost" className="h-6 w-6 p-0">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (paginationState.activePage > 1) {
                      setPaginationState({ ...paginationState, activePage: paginationState.activePage - 1 });
                    }
                  }}
                  className={`h-8 text-xs ${paginationState.activePage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                />
              </PaginationItem>

              {generatePageNumbers().map((page, idx) =>
                page === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setPaginationState({ ...paginationState, activePage: page as number })}
                      isActive={paginationState.activePage === page}
                      className="h-8 w-8 text-xs cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    if (paginationState.activePage < totalPages) {
                      setPaginationState({ ...paginationState, activePage: paginationState.activePage + 1 });
                    }
                  }}
                  className={`h-8 text-xs ${
                    paginationState.activePage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </PageWrapper>
  );
};

export default GiftCard;
