import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Award, CalendarIcon, CreditCard, Pencil, RefreshCw, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import type { DateRange } from 'react-day-picker';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, payByOnAccount } from './customer.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { ICustomerOnAccountAudit } from 'app/shared/model/customer-on-account-audit.model';
import { ICustomerOrderPayment } from 'app/shared/model/customer-order-payment.model';
import { ICustomerPayByOnAccountRequest } from 'app/shared/model/customer-pay-by-on-account.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { WsPopoverContent as PopoverContent } from 'app/modules/logistics/wholesale-ui/wholesale-overlays';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/src/main/webapp/app/lib/utils';
import { TransactionType } from 'app/shared/model/ENUMS/transaction-type.model';
import CustomerPayOnAccountDialog from './components/CustomerPayOnAccountDialog';
import CustomerStoreCreditTab from './components/CustomerStoreCreditTab';
import { getCustomerOnAccountPaydownValidation } from './customer-pay-by-on-account.utils';
import LoyaltyPointHistoryTable from 'app/entities/loyalty/components/LoyaltyPointHistoryTable';

const DetailRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="rounded-md border p-3">
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    <div className="mt-1 text-sm">{value?.trim() ? value : '-'}</div>
  </div>
);

export const CustomerDashboard = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<'id'>();
  const navigate = useNavigate();

  const customerEntity: ICustomer = useAppSelector(state => state.customer.entity);
  const customerLoading = useAppSelector(state => state.customer.loading);
  const customerUpdating = useAppSelector(state => state.customer.updating);
  const branchList = useAppSelector(state => state.branch.entities);
  const businessTimeZone = useAppSelector(state => state.businessTimeZone.timeZone);

  const [onAccountAudits, setOnAccountAudits] = useState<ICustomerOnAccountAudit[]>([]);
  const [onAccountAuditsLoading, setOnAccountAuditsLoading] = useState(false);
  const [onAccountAuditsError, setOnAccountAuditsError] = useState<string | null>(null);
  const [onAccountAuditsDateRange, setOnAccountAuditsDateRange] = useState<DateRange | undefined>(undefined);
  const [appliedOnAccountAuditsDateRange, setAppliedOnAccountAuditsDateRange] = useState<{ fromDate: string; toDate: string } | null>(null);
  const [previousSales, setPreviousSales] = useState<ICustomerOrderPayment[]>([]);
  const [previousSalesLoading, setPreviousSalesLoading] = useState(false);
  const [previousSalesError, setPreviousSalesError] = useState<string | null>(null);
  const [payOnAccountOpen, setPayOnAccountOpen] = useState(false);

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

  const formatPaymentType = (value?: string | TransactionType) => {
    const stringValue = value as string;
    if (!stringValue?.trim()) {
      return '-';
    }

    return stringValue.charAt(0).toUpperCase() + stringValue.slice(1).toLowerCase();
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

  const loadPreviousSales = () => {
    if (!id) {
      return Promise.resolve();
    }

    setPreviousSalesLoading(true);
    setPreviousSalesError(null);

    return axios
      .get<ICustomerOrderPayment[]>(`api/customers/${id}/order-payments`)
      .then(response => {
        setPreviousSales(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        setPreviousSales([]);
        setPreviousSalesError('Unable to load previous sales.');
      })
      .finally(() => {
        setPreviousSalesLoading(false);
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

  useEffect(() => {
    if (!id) {
      setPreviousSales([]);
      setPreviousSalesError(null);
      setPreviousSalesLoading(false);
      return;
    }

    loadPreviousSales();
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
  const loyaltyPointsRemaining = customerEntity?.loyaltyPointsRemaining ?? 0;
  const assignedLoyaltyCards = customerEntity?.loyaltyCards || [];
  const unlimitedOnAccount = customerEntity?.unlimitedOnAccount === true;
  const onAccountDebitLimit = customerEntity?.onAccountDebitLimit ?? 0;
  const onAccountDebitUsed = customerEntity?.onAccountDebitUsed ?? 0;
  const onAccountRemaining = unlimitedOnAccount ? null : onAccountDebitLimit - onAccountDebitUsed;
  const canOpenPayOnAccount =
    customerEntity?.onAccountEnabled === true &&
    getCustomerOnAccountPaydownValidation({
      customer: customerEntity,
    }).payableBalance > 0;

  const handlePayOnAccount = async (payload: ICustomerPayByOnAccountRequest) => {
    if (!id) {
      return;
    }

    try {
      await dispatch(
        payByOnAccount({
          customerId: id,
          entity: payload,
        })
      ).unwrap();
      toast.success('On account payment recorded successfully.');
      setPayOnAccountOpen(false);
      dispatch(getEntity(id));
      await loadOnAccountAudits(appliedOnAccountAuditsDateRange);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to record on account payment.');
    }
  };

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
              {id && <CustomerStoreCreditTab customerId={id} timeZone={businessTimeZone} branchName={getBranchName} />}
            </TabsContent>

            <TabsContent value="loyalty" className="space-y-3">
              {customerLoading ? (
                <div className="text-xs text-muted-foreground">Loading loyalty information...</div>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-xl border bg-gradient-to-br from-amber-50 via-background to-orange-50">
                    <div className="grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
                      <div className="p-5 md:p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-100/80 text-[11px] font-semibold text-amber-800">
                            Loyalty Overview
                          </Badge>
                          {/* <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                            Synced from central
                          </div> */}
                        </div>

                        <div className="mt-4 flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Available Points</div>
                            <div className="mt-2 text-3xl font-semibold leading-none tracking-tight">{loyaltyPointsRemaining.toFixed(2)}</div>
                            <p className="mt-2 max-w-[18rem] text-xs leading-5 text-muted-foreground">
                              This balance is read directly from the customer loyalty record and reflects the current available points.
                            </p>
                          </div>
                          <div className="hidden rounded-2xl bg-amber-100 p-3 text-amber-700 md:block">
                            <Award className="h-6 w-6" />
                          </div>
                        </div>
                      </div>

                      <div className="border-t bg-background/70 p-5 md:border-l md:border-t-0 md:p-5">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground">Current Loyalty Cards</div>
                            <div className="mt-0.5 text-sm font-semibold">
                              {assignedLoyaltyCards.length > 0 ? `${assignedLoyaltyCards.length} assigned` : 'No card assigned'}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <Badge variant="outline" className="rounded-full bg-background/80">
                            {assignedLoyaltyCards.length} total
                          </Badge>
                          <Badge variant="outline" className="rounded-full bg-background/80">
                            {assignedLoyaltyCards.filter(card => card.active !== false).length} active
                          </Badge>
                          {assignedLoyaltyCards.some(card => card.active === false) ? (
                            <Badge variant="outline" className="rounded-full border-red-200 bg-red-50 text-red-700">
                              {assignedLoyaltyCards.filter(card => card.active === false).length} inactive
                            </Badge>
                          ) : null}
                        </div>

                        <div className="mt-4">
                          {assignedLoyaltyCards.length === 0 ? (
                            <div className="rounded-lg border border-dashed bg-background p-3 text-xs text-muted-foreground">
                              No loyalty cards are currently assigned to this customer.
                            </div>
                          ) : (
                            <div className="w-full overflow-x-auto rounded-xl border bg-background/40">
                              <div className="flex min-w-max gap-3 p-3">
                                {assignedLoyaltyCards.map((card, index) => (
                                  <div
                                    key={card.id || card.referenceNumber}
                                    className="flex w-[260px] shrink-0 flex-col whitespace-normal rounded-xl border bg-background p-3 shadow-sm"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                          Card {index + 1}
                                        </div>
                                        {card.id ? (
                                          <Link to={`/loyalty-cards/${card.id}/edit`} className="mt-1 block truncate font-mono text-sm font-semibold text-primary hover:underline">
                                            {card.referenceNumber || '-'}
                                          </Link>
                                        ) : (
                                          <div className="mt-1 truncate font-mono text-sm font-semibold">
                                            {card.referenceNumber || '-'}
                                          </div>
                                        )}
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={
                                          card.active === false
                                            ? 'shrink-0 rounded-full border-red-200 bg-red-50 text-red-700'
                                            : 'shrink-0 rounded-full border-emerald-200 bg-emerald-50 text-emerald-700'
                                        }
                                      >
                                        {card.active === false ? 'Inactive' : 'Active'}
                                      </Badge>
                                    </div>

                                    <div className="mt-3 text-xs text-muted-foreground">
                                      {card.cardHolderName || 'No holder name'}
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                      <div className="rounded-lg bg-muted/40 p-2">
                                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Balance</div>
                                        <div className="mt-1 text-sm font-semibold">{(card.wallet?.balance ?? 0).toFixed(2)}</div>
                                      </div>
                                      <div className="rounded-lg bg-muted/40 p-2">
                                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Expiry</div>
                                        <div className="mt-1 break-words text-sm font-semibold">
                                          {card.expiryDate ? formatDateForDisplay(card.expiryDate) : '-'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {assignedLoyaltyCards.length === 0 && loyaltyPointsRemaining === 0 ? (
                    <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                      This customer has no assigned loyalty card and no available loyalty points yet.
                    </div>
                  ) : null}

                  <LoyaltyPointHistoryTable customerId={id} title="Points Activity" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="account" className="space-y-3">
              <div className="space-y-3">
                {customerLoading ? (
                  <div className="text-xs text-muted-foreground">Loading account summary...</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-md border p-3">
                      <div className="text-xs font-medium text-muted-foreground">Account Limit</div>
                      <div className="mt-1 text-sm whitespace-nowrap">{unlimitedOnAccount ? 'Unlimited' : formatAuditAmount(onAccountDebitLimit)}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs font-medium text-muted-foreground">Account Balance</div>
                      <div className="mt-1 text-sm whitespace-nowrap">{formatAuditAmount(onAccountDebitUsed)}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs font-medium text-muted-foreground">Account Remaining</div>
                      <div className="mt-1 text-sm whitespace-nowrap">{unlimitedOnAccount ? 'Unlimited' : formatAuditAmount(onAccountRemaining)}</div>
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
                        onClick={() => setPayOnAccountOpen(true)}
                        disabled={!canOpenPayOnAccount}
                      >
                        Pay On Account
                      </Button>
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
                          <TableRow
                            key={audit.id || `${audit.createdDate}-${audit.orderId}-${audit.amount}`}
                            className={audit.orderId ? 'cursor-pointer hover:bg-muted/50' : undefined}
                            onClick={audit.orderId ? () => navigate(`/order/${audit.orderId}`) : undefined}
                          >
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
              {previousSalesLoading ? (
                <div className="text-xs text-muted-foreground">Loading previous sales...</div>
              ) : previousSalesError ? (
                <div className="text-xs text-destructive">{previousSalesError}</div>
              ) : previousSales.length === 0 ? (
                <div className="text-xs text-muted-foreground">No previous sales found.</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Order #</TableHead>
                        <TableHead className="text-xs">Branch</TableHead>
                        <TableHead className="text-xs">Payment Method</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs">Received</TableHead>
                        <TableHead className="text-xs">Tip</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Created By</TableHead>
                        <TableHead className="text-xs">Bill ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previousSales.map(paymentRow => {
                        const payment = paymentRow.payment;
                        const paymentDate = payment?.dateTime || payment?.createdDate;
                        const paymentMethod = payment?.method?.name || payment?.method?.transactionMethod || '-';

                        return (
                          <TableRow key={`${paymentRow.orderId}-${paymentRow.billId}-${payment?.dateTime || payment?.createdDate || payment?.amount}`}>
                            <TableCell className="text-xs align-top whitespace-nowrap">
                              {paymentDate ? formatDateForDisplay(paymentDate) : '-'}
                            </TableCell>
                            <TableCell className="text-xs align-top whitespace-nowrap">
                              {paymentRow.orderId && paymentRow.orderSequenceNumber ? (
                                <Link to={`/order/${paymentRow.orderId}`} className="text-blue-600 hover:underline">
                                  {paymentRow.orderSequenceNumber}
                                </Link>
                              ) : (
                                paymentRow.orderSequenceNumber || '-'
                              )}
                            </TableCell>
                            <TableCell className="text-xs align-top">{getBranchName(paymentRow.branchId)}</TableCell>
                            <TableCell className="text-xs align-top">{paymentMethod}</TableCell>
                            <TableCell className="text-xs align-top">{formatPaymentType(payment?.type)}</TableCell>
                            <TableCell className="text-xs align-top whitespace-nowrap">{formatAuditAmount(payment?.amount)}</TableCell>
                            <TableCell className="text-xs align-top whitespace-nowrap">{formatAuditAmount(payment?.receivedAmount)}</TableCell>
                            <TableCell className="text-xs align-top whitespace-nowrap">{formatAuditAmount(payment?.tipAmount)}</TableCell>
                            <TableCell className="text-xs align-top">{payment?.status || '-'}</TableCell>
                            <TableCell className="text-xs align-top">{payment?.createdBy || '-'}</TableCell>
                            <TableCell className="text-xs align-top">{paymentRow.billId || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <CustomerPayOnAccountDialog
        open={payOnAccountOpen}
        onOpenChange={setPayOnAccountOpen}
        customer={customerEntity}
        submitting={customerUpdating}
        onSubmit={handlePayOnAccount}
      />
    </PageWrapper>
  );
};

export default CustomerDashboard;
