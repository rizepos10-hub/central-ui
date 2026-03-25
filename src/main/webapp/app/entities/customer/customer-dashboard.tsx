import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { CalendarIcon, Pencil, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import type { DateRange } from 'react-day-picker';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity } from './customer.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { ICustomerOnAccountAudit } from 'app/shared/model/customer-on-account-audit.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/src/main/webapp/app/lib/utils';

const EmptyTabState = ({ title }: { title: string }) => (
  <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
    {title} content will be added here later.
  </div>
);

const DetailRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="rounded-md border p-3">
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    <div className="mt-1 text-sm">{value?.trim() ? value : '-'}</div>
  </div>
);

export const CustomerDashboard = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<'id'>();

  const customerEntity: ICustomer = useAppSelector(state => state.customer.entity);
  const customerLoading = useAppSelector(state => state.customer.loading);
  const branchList = useAppSelector(state => state.branch.entities);
  const businessTimeZone = useAppSelector(state => state.businessTimeZone.timeZone);

  const [onAccountAudits, setOnAccountAudits] = useState<ICustomerOnAccountAudit[]>([]);
  const [onAccountAuditsLoading, setOnAccountAuditsLoading] = useState(false);
  const [onAccountAuditsError, setOnAccountAuditsError] = useState<string | null>(null);
  const [onAccountAuditsDateRange, setOnAccountAuditsDateRange] = useState<DateRange | undefined>(undefined);
  const [appliedOnAccountAuditsDateRange, setAppliedOnAccountAuditsDateRange] = useState<{ fromDate: string; toDate: string } | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    dispatch(getEntity(id));
    dispatch(
      getBranches({
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );
  }, [dispatch, id]);

  const formatAuditAmount = (value?: number | null) => {
    return typeof value === 'number' ? value.toFixed(2) : '0.00';
  };

  const formatBoundaryDate = (date: Date, boundary: 'start' | 'end') => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = boundary === 'start' ? '00:00:00' : '23:59:59';

    if (!businessTimeZone) {
      const localDate = new Date(date);
      if (boundary === 'start') {
        localDate.setHours(0, 0, 0, 0);
      } else {
        localDate.setHours(23, 59, 59, 0);
      }
      return localDate.toISOString();
    }

    return fromZonedTime(`${year}-${month}-${day} ${time}`, businessTimeZone).toISOString();
  };

  const getBranchName = (branchId?: string | null) => {
    if (!branchId) {
      return '-';
    }

    return branchList.find(branch => branch.id === branchId)?.name || branchId;
  };

  const loadOnAccountAudits = (filters?: { fromDate: string; toDate: string } | null) => {
    if (!id) {
      return Promise.resolve();
    }

    setOnAccountAuditsLoading(true);
    setOnAccountAuditsError(null);

    return axios
      .get<ICustomerOnAccountAudit[]>(`api/customers/${id}/on-account-audits`, {
        params: {
          fromDate: filters?.fromDate,
          toDate: filters?.toDate,
        },
      })
      .then(response => {
        setOnAccountAudits(Array.isArray(response.data) ? response.data : []);
        setAppliedOnAccountAuditsDateRange(filters || null);
      })
      .catch(() => {
        setOnAccountAudits([]);
        setOnAccountAuditsError('Unable to load on account audits.');
      })
      .finally(() => {
        setOnAccountAuditsLoading(false);
      });
  };

  useEffect(() => {
    if (!id) {
      setOnAccountAudits([]);
      setOnAccountAuditsError(null);
      setOnAccountAuditsLoading(false);
      setAppliedOnAccountAuditsDateRange(null);
      return;
    }

    loadOnAccountAudits();
  }, [id]);

  const handleApplyOnAccountAuditsFilter = async () => {
    if ((onAccountAuditsDateRange?.from && !onAccountAuditsDateRange?.to) || (!onAccountAuditsDateRange?.from && onAccountAuditsDateRange?.to)) {
      setOnAccountAuditsError('Please select both from and to dates.');
      return;
    }

    if (!onAccountAuditsDateRange?.from || !onAccountAuditsDateRange?.to) {
      await loadOnAccountAudits();
      return;
    }

    await loadOnAccountAudits({
      fromDate: formatBoundaryDate(onAccountAuditsDateRange.from, 'start'),
      toDate: formatBoundaryDate(onAccountAuditsDateRange.to, 'end'),
    });
  };

  const handleResetOnAccountAuditsFilter = async () => {
    setOnAccountAuditsDateRange(undefined);
    await loadOnAccountAudits();
  };

  const onAccountAuditsDateRangeLabel = useMemo(() => {
    if (!onAccountAuditsDateRange?.from) {
      return 'Pick a date range';
    }

    if (!onAccountAuditsDateRange.to) {
      return format(onAccountAuditsDateRange.from, 'PP');
    }

    return `${format(onAccountAuditsDateRange.from, 'PP')} - ${format(onAccountAuditsDateRange.to, 'PP')}`;
  }, [onAccountAuditsDateRange]);

  const customerTitle = [customerEntity?.firstName, customerEntity?.lastName].filter(Boolean).join(' ').trim();
  const headerTitle = customerTitle || customerEntity?.businessDetails?.businessName || 'Customer';
  const onAccountDebitLimit = customerEntity?.onAccountDebitLimit ?? 0;
  const onAccountDebitUsed = customerEntity?.onAccountDebitUsed ?? 0;
  const onAccountRemaining = onAccountDebitLimit - onAccountDebitUsed;

  return (
    <PageWrapper>
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{headerTitle}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {customerEntity?.businessDetails?.businessName || 'Customer dashboard'}
              </div>
            </div>
            <Button asChild size="sm" className="h-8 text-xs self-start">
              <Link to={`/customer/${id}/edit`}>
                <Pencil className="mr-1 h-3 w-3" />
                Edit Customer
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs defaultValue="details">
            <TabsList className="mb-4 flex h-auto flex-wrap justify-start">
              <TabsTrigger value="details" className="text-xs h-7">Details</TabsTrigger>
              <TabsTrigger value="store-credit" className="text-xs h-7">Store credit</TabsTrigger>
              <TabsTrigger value="loyalty" className="text-xs h-7">Loyalty</TabsTrigger>
              <TabsTrigger value="account" className="text-xs h-7">Account</TabsTrigger>
              <TabsTrigger value="delivery-addresses" className="text-xs h-7">Delivery addresses</TabsTrigger>
              <TabsTrigger value="previous-sales" className="text-xs h-7">Previous sales</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-3">
              {customerLoading ? (
                <div className="text-xs text-muted-foreground">Loading customer details...</div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailRow label="First name" value={customerEntity?.firstName} />
                  <DetailRow label="Last name" value={customerEntity?.lastName} />
                  <DetailRow label="Phone" value={customerEntity?.phone} />
                  <DetailRow label="Mobile number" value={customerEntity?.mobileNumber} />
                  <DetailRow label="Fax" value={customerEntity?.fax} />
                  <DetailRow label="Email" value={customerEntity?.email} />
                  <DetailRow label="Business name" value={customerEntity?.businessDetails?.businessName} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="store-credit" className="space-y-3">
              <EmptyTabState title="Store credit" />
            </TabsContent>

            <TabsContent value="loyalty" className="space-y-3">
              <EmptyTabState title="Loyalty" />
            </TabsContent>

            <TabsContent value="account" className="space-y-3">
              <div className="space-y-3">
                {customerLoading ? (
                  <div className="text-xs text-muted-foreground">Loading account summary...</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-md border p-3">
                      <div className="text-xs font-medium text-muted-foreground">Account Limit</div>
                      <div className="mt-1 text-sm whitespace-nowrap">{formatAuditAmount(onAccountDebitLimit)}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs font-medium text-muted-foreground">Account Balance</div>
                      <div className="mt-1 text-sm whitespace-nowrap">{formatAuditAmount(onAccountDebitUsed)}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs font-medium text-muted-foreground">Account Remaining</div>
                      <div className="mt-1 text-sm whitespace-nowrap">{formatAuditAmount(onAccountRemaining)}</div>
                    </div>
                  </div>
                )}

                <Separator className="my-1" />

                <div className="rounded-md border p-3 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Date Range</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn('h-7 text-xs w-full justify-start', !onAccountAuditsDateRange?.from && 'text-muted-foreground')}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {onAccountAuditsDateRangeLabel}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="range" selected={onAccountAuditsDateRange} onSelect={setOnAccountAuditsDateRange} numberOfMonths={2} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {appliedOnAccountAuditsDateRange ? 'Date filter applied' : 'Showing all audits'}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => loadOnAccountAudits(appliedOnAccountAuditsDateRange)}
                        disabled={onAccountAuditsLoading}
                      >
                        <RefreshCw className={`mr-2 h-3 w-3 ${onAccountAuditsLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={handleResetOnAccountAuditsFilter}
                        disabled={onAccountAuditsLoading}
                      >
                        Show All
                      </Button>
                      <Button
                        type="button"
                        className="h-7 text-xs"
                        onClick={handleApplyOnAccountAuditsFilter}
                        disabled={onAccountAuditsLoading}
                      >
                        Apply Filter
                      </Button>
                    </div>
                  </div>
                </div>

                {onAccountAuditsLoading ? (
                  <div className="text-xs text-muted-foreground">Loading on account audits...</div>
                ) : onAccountAuditsError ? (
                  <div className="text-xs text-destructive">{onAccountAuditsError}</div>
                ) : onAccountAudits.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No on account audits found.</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Created Date</TableHead>
                          <TableHead className="text-xs">Action</TableHead>
                          <TableHead className="text-xs">Branch</TableHead>
                          <TableHead className="text-xs">Amount</TableHead>
                          <TableHead className="text-xs">Balance Before</TableHead>
                          <TableHead className="text-xs">Balance After</TableHead>
                          <TableHead className="text-xs">Debit Limit</TableHead>
                          <TableHead className="text-xs">Order ID</TableHead>
                          <TableHead className="text-xs">Note</TableHead>
                          <TableHead className="text-xs">Created By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {onAccountAudits.map(audit => (
                          <TableRow key={audit.id || `${audit.createdDate}-${audit.orderId}-${audit.amount}`}>
                            <TableCell className="text-xs align-top whitespace-nowrap">
                              {audit.createdDate ? formatDateForDisplay(audit.createdDate) : '-'}
                            </TableCell>
                            <TableCell className="text-xs align-top">{audit.action || '-'}</TableCell>
                            <TableCell className="text-xs align-top">{getBranchName(audit.branchId)}</TableCell>
                            <TableCell className="text-xs align-top whitespace-nowrap">{formatAuditAmount(audit.amount)}</TableCell>
                            <TableCell className="text-xs align-top whitespace-nowrap">{formatAuditAmount(audit.balanceBefore)}</TableCell>
                            <TableCell className="text-xs align-top whitespace-nowrap">{formatAuditAmount(audit.balanceAfter)}</TableCell>
                            <TableCell className="text-xs align-top whitespace-nowrap">{formatAuditAmount(audit.debitLimit)}</TableCell>
                            <TableCell className="text-xs align-top">{audit.orderId || '-'}</TableCell>
                            <TableCell className="text-xs align-top break-words">{audit.note || '-'}</TableCell>
                            <TableCell className="text-xs align-top">{audit.createdBy || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="delivery-addresses" className="space-y-3">
              {customerLoading ? (
                <div className="text-xs text-muted-foreground">Loading delivery addresses...</div>
              ) : !customerEntity?.deliveryAddresses?.length ? (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  No delivery addresses found for this customer.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Contact Person Name</TableHead>
                        <TableHead className="text-xs">Phone Number</TableHead>
                        <TableHead className="text-xs">Address</TableHead>
                        <TableHead className="text-xs">Address Type</TableHead>
                        <TableHead className="text-xs">Country</TableHead>
                        <TableHead className="text-xs">City</TableHead>
                        <TableHead className="text-xs">Street</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerEntity.deliveryAddresses.map(address => (
                        <TableRow key={address.id || address.tempId || `${address.address}-${address.phoneNumber}`}>
                          <TableCell className="text-xs">{address.contactPersonName || '-'}</TableCell>
                          <TableCell className="text-xs">{address.phoneNumber || '-'}</TableCell>
                          <TableCell className="text-xs">{address.address || '-'}</TableCell>
                          <TableCell className="text-xs">{address.addressType || '-'}</TableCell>
                          <TableCell className="text-xs">{address.country || '-'}</TableCell>
                          <TableCell className="text-xs">{address.city || '-'}</TableCell>
                          <TableCell className="text-xs">{address.street || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="previous-sales" className="space-y-3">
              <EmptyTabState title="Previous sales" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default CustomerDashboard;
