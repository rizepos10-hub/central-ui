import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from '../../../entities/branch/branch.reducer';
import { format } from "date-fns";
import { startOfDay, endOfDay } from 'date-fns';
import { getOrderSources, getOrderStatuses } from "app/entities/order/order.reducer";
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { PageWrapper } from "app/shared/layout/page-wrapper";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X } from "lucide-react";

export const OpenedOrders = ({ openedOrders }) => {
  const dispatch = useAppDispatch();

  const today = new Date();
  const from = startOfDay(today);
  const to = endOfDay(today);

  const [selectedOrders, setSelectedOrders] = useState(null);
  const [orderStatuses, setOrderStatuses]: any = useState([]);

  const [searchFilters, setSearchFilters] = useState({
    sequenceNumber: '',
    branch: '',
    source: '',
    table: '',
    customerEmail: '',
    customerPhone: '',
    status: ''
  });

  const orderSources = useAppSelector(state => state.order.orderSources);
  const branchList = useAppSelector(state => state.branch.entities);

  const getBranchName = (branchId) => {
    const branch = branchList.find(branch => branch.id === branchId);
    return branch ? branch.name : 'Unknown Branch';
  };

  useEffect(() => {
    dispatch(getBranches({}))
    dispatch(getOrderSources())
    dispatch(getOrderStatuses())
      .then((response: any) => {
        setOrderStatuses(response.payload?.map((status) => ({ label: status, value: status })));
      })
  }, []);

  // Filter orders based on search filters
  const filteredOrders = openedOrders?.filter(order => {
    return (
      (!searchFilters.sequenceNumber || order.sequenceNumber?.toString().includes(searchFilters.sequenceNumber)) &&
      (!searchFilters.branch || getBranchName(order.branchId).toLowerCase().includes(searchFilters.branch.toLowerCase())) &&
      (!searchFilters.source || order.sourceApp?.type.toLowerCase().includes(searchFilters.source.toLowerCase())) &&
      (!searchFilters.table || order.tables?.toLowerCase().includes(searchFilters.table.toLowerCase())) &&
      (!searchFilters.customerEmail || order.customer?.email?.toLowerCase().includes(searchFilters.customerEmail.toLowerCase())) &&
      (!searchFilters.customerPhone || order.customer?.phone?.includes(searchFilters.customerPhone)) &&
      (!searchFilters.status || order.status === searchFilters.status)
    );
  }) || [];

  return (
    <PageWrapper>
      <h2 className="text-lg font-semibold mb-2">Unclosed Orders</h2>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">
                <div className="flex flex-col gap-1">
                  <span>Order ID</span>
                  <Input
                    type="text"
                    placeholder="Enter id"
                    className="h-6 text-xs w-20"
                    value={searchFilters.sequenceNumber}
                    onChange={(e) => setSearchFilters({ ...searchFilters, sequenceNumber: e.target.value })}
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs">Order Branch</TableHead>
              <TableHead className="text-xs">Order Date</TableHead>
              <TableHead className="text-xs">Discount</TableHead>
              <TableHead className="text-xs">
                <div className="flex flex-col gap-1">
                  <span>Order Source</span>
                  <Select
                    value={searchFilters.source}
                    onValueChange={(value) => setSearchFilters({ ...searchFilters, source: value })}
                  >
                    <SelectTrigger className="h-6 text-xs w-24">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="text-xs">All</SelectItem>
                      {orderSources?.map((source) => (
                        <SelectItem key={source} value={source} className="text-xs">
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TableHead>
              <TableHead className="text-xs">
                <div className="flex flex-col gap-1">
                  <span>Order Tables</span>
                  <Input
                    type="text"
                    placeholder="Enter table"
                    className="h-6 text-xs w-24"
                    value={searchFilters.table}
                    onChange={(e) => setSearchFilters({ ...searchFilters, table: e.target.value })}
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs">
                <div className="flex flex-col gap-1">
                  <span>Customer Email</span>
                  <Input
                    type="text"
                    placeholder="Enter email"
                    className="h-6 text-xs w-32"
                    value={searchFilters.customerEmail}
                    onChange={(e) => setSearchFilters({ ...searchFilters, customerEmail: e.target.value })}
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs">
                <div className="flex flex-col gap-1">
                  <span>Customer Phone</span>
                  <Input
                    type="text"
                    placeholder="Enter phone"
                    className="h-6 text-xs w-32"
                    value={searchFilters.customerPhone}
                    onChange={(e) => setSearchFilters({ ...searchFilters, customerPhone: e.target.value })}
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs">
                <div className="flex flex-col gap-1">
                  <span>Order Status</span>
                  <Select
                    value={searchFilters.status}
                    onValueChange={(value) => setSearchFilters({ ...searchFilters, status: value })}
                  >
                    <SelectTrigger className="h-6 text-xs w-24">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="text-xs">All</SelectItem>
                      {orderStatuses?.map((status) => (
                        <SelectItem key={status.value} value={status.value} className="text-xs">
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-xs py-8 text-muted-foreground">
                  No Orders Found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-xs">
                    <Link to={`/order/${order.id}`} className="text-primary hover:underline">
                      {order.sequenceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{getBranchName(order.branchId)}</TableCell>
                  <TableCell className="text-xs">
                    {formatDateForDisplay(order.createdDate)}
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    {order.discount ? (
                      <Check className="h-3 w-3 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-3 w-3 text-red-600 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{order.sourceApp?.type}</TableCell>
                  <TableCell className="text-xs">{order.tables}</TableCell>
                  <TableCell className="text-xs">{order.customer?.email}</TableCell>
                  <TableCell className="text-xs">{order.customer?.phone}</TableCell>
                  <TableCell className="text-xs">{order.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Showing {filteredOrders.length} of {openedOrders?.length || 0} orders
      </div>
    </PageWrapper>
  );
};

export default OpenedOrders;
