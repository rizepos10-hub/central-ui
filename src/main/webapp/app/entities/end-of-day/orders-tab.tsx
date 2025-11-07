import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { filterOrders, getEntity as getOrder } from 'app/entities/order/order.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Select from 'app/shared/components/select/select';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { Translate } from 'react-jhipster';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OrdersTabProps {
  branchId: string | null;
  fromDate: string;
  toDate: string;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ branchId, fromDate, toDate }) => {
  const dispatch = useAppDispatch();
  const orderList = useAppSelector(state => state.order.entities);
  const totalOrders = useAppSelector(state => state.order.totalOrders);
  const loading = useAppSelector(state => state.order.loading);
  const branchList = useAppSelector(state => state.branch.entities);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 20,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      createdDate: {
        from: fromDate,
        to: toDate,
      },
      id: { value: '', matchMode: 'contains' },
      status: { value: '', matchMode: 'contains' },
      'customer.email': { value: '', matchMode: 'contains' },
      'customer.phone': { value: '', matchMode: 'contains' },
      branchId: { value: branchId || '', matchMode: 'equals' },
    }
  });

  useEffect(() => {
    dispatch(getBranches({ page: 0, size: 300, sort: 'asc' }));
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      setLazyState(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          createdDate: { from: fromDate, to: toDate },
          branchId: { value: branchId || '', matchMode: 'equals' },
        }
      }));
    }
  }, [fromDate, toDate, branchId]);

  useEffect(() => {
    loadOrders();
  }, [lazyState]);

  const loadOrders = () => {
    dispatch(filterOrders({ query: lazyState }));
  };

  const handleRowClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    dispatch(getOrder(orderId));
  };

  const handleFilterChange = (field: string, value: any) => {
    setLazyState(prev => ({
      ...prev,
      page: 0,
      first: 0,
      filters: {
        ...prev.filters,
        [field]: { ...prev.filters[field], value }
      }
    }));
  };

  const handlePageChange = (newPage: number) => {
    setLazyState(prev => ({
      ...prev,
      page: newPage,
      first: newPage * prev.rows
    }));
  };

  const getBranchName = (branchId: string) => {
    const branch = branchList.find(b => b.id === branchId);
    return branch ? branch.name : 'Unknown';
  };

  const totalPages = Math.ceil(totalOrders / lazyState.rows);
  const currentPage = lazyState.page;

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          <Translate contentKey="endOfDay.selectBranchFirst">Please select a branch first</Translate>
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Orders Table */}
      <div className={selectedOrderId ? 'w-1/2' : 'w-full'}>
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Order ID"
              value={lazyState.filters.id.value}
              onChange={(e) => handleFilterChange('id', e.target.value)}
              className="h-7 text-xs"
            />
            <Input
              placeholder="Customer Email"
              value={lazyState.filters['customer.email'].value}
              onChange={(e) => handleFilterChange('customer.email', e.target.value)}
              className="h-7 text-xs"
            />
            <Input
              placeholder="Customer Phone"
              value={lazyState.filters['customer.phone'].value}
              onChange={(e) => handleFilterChange('customer.phone', e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Order ID</TableHead>
                <TableHead className="text-xs">Branch</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Total</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs">Loading...</TableCell>
                </TableRow>
              ) : orderList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs">No orders found</TableCell>
                </TableRow>
              ) : (
                orderList.map((order: any) => (
                  <TableRow
                    key={order.id}
                    className={`cursor-pointer text-xs ${selectedOrderId === order.id ? 'bg-accent' : ''}`}
                    onClick={() => handleRowClick(order.id)}
                  >
                    <TableCell className="text-xs">{order.sequenceNumber || order.id}</TableCell>
                    <TableCell className="text-xs">{getBranchName(order.branchId)}</TableCell>
                    <TableCell className="text-xs">
                      {order.customer?.firstName} {order.customer?.lastName}
                    </TableCell>
                    <TableCell className="text-xs">{order.status}</TableCell>
                    <TableCell className="text-xs">{order.total?.toFixed(2)}</TableCell>
                    <TableCell className="text-xs">
                      {order.createdDate ? formatDateForDisplay(order.createdDate) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {currentPage + 1} of {totalPages || 1} ({totalOrders} total)
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="h-7"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="h-7"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bills Placeholder */}
      {selectedOrderId && (
        <div className="w-1/2 border-l pl-4">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground text-sm">Bills here</p>
          </div>
        </div>
      )}
    </div>
  );
};
