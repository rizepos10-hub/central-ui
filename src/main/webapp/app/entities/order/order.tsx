import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities, filterOrders, getOrderSources, getOrderStatuses, deleteEntity, reset } from './order.reducer';
import { getEntities as getBranches } from '../branch/branch.reducer';
import { getEntitiesByType } from '../settings/branch-registry/branch-registry.reducer';
import { format } from "date-fns";
import { fromZonedTime } from 'date-fns-tz';
import { debounce } from "lodash";
import { translate } from "react-jhipster";
import { formatDateForDisplay } from "app/shared/util/timezone-utils";
import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { PaymentStatus } from 'app/shared/model/ENUMS/payment-status.model';
import { toast } from 'react-toastify';
import Select from 'app/shared/components/select/select';
import { Calendar } from '@/components/ui/calendar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X, Trash2, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Copy } from 'lucide-react';
import { cn } from '@/src/main/webapp/app/lib/utils';
import type { DateRange } from 'react-day-picker';
import { formatNumber } from 'app/shared/util/price-utils';
import { formatSourceScopedIdentifier } from 'app/shared/util/order-identifier-utils';
import { formatOrderMethodLabel } from 'app/shared/util/format-order-method-label';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { RegisterType } from 'app/shared/model/ENUMS/branch-registry-type';
import { IBranchRegistry } from 'app/shared/model/branch-registry.model';

interface LazyTableState {
  first?: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: any;
  filters: any;
  modifiedDate?: boolean;
}

type OrderProps = {
  pageType?: 'history' | 'today' | 'scheduled' | 'ai-ordering' | 'saved' | '';
  customer?: string;
  appSourceProp?: "ONLINE_ORDERING" | "BRANCH_POS" | "BUSINESS_ADMIN" | "CENTRAL_APP" | "MARKETPLACE";
  defaultOrderSource?: "ONLINE_ORDERING" | "BRANCH_POS" | "BUSINESS_ADMIN" | "CENTRAL_APP" | "MARKETPLACE";
  externalFromDate?: string;
  externalToDate?: string;
  externalBranchId?: string | null;
  isEndOfDayMode?: boolean;
  wholesale?: boolean;
}

const ALL_STATUS_TAB = '__all__';

const formatStatusLabel = (value?: string | null) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value)
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatSourceLabel = (value?: string | null) => formatStatusLabel(value);
const formatPaymentStatusLabel = (value?: string | null) => formatStatusLabel(value);

const getStatusBadgeClassName = (status?: string | null) => {
  switch (status) {
    case OrderStatus.DRAFT:
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case OrderStatus.CONFIRMED:
    case OrderStatus.READY_FOR_PROCESSING:
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case OrderStatus.PROCESSING:
      return 'border-violet-200 bg-violet-50 text-violet-700';
    case OrderStatus.READY:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case OrderStatus.IN_DELIVERY:
      return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    case OrderStatus.CLOSED:
      return 'border-emerald-200 bg-emerald-100 text-emerald-800';
    case OrderStatus.REJECTED:
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const getSourceBadgeClassName = (source?: string | null) => {
  switch (source) {
    case 'ONLINE_ORDERING':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'BRANCH_POS':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'BUSINESS_ADMIN':
      return 'border-purple-200 bg-purple-50 text-purple-700';
    case 'CENTRAL_APP':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const getOrderTypeBadgeClassName = (orderMethod?: string | null) => {
  switch (orderMethod) {
    case 'Delivery':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    case 'PickUp':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'DineIn':
      return 'border-violet-200 bg-violet-50 text-violet-700';
    case 'WalkIn':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const getPaymentStatusBadgeClassName = (status?: string | null) => {
  switch (status) {
    case 'PAID':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'UNPAID':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const getReorderActionLabel = (order?: IOrder | null) =>
  order?.processingStatus === OrderStatus.DRAFT ? 'Clone' : 'Re-order';

const transformOrderForReorder = (order: IOrder): IOrder => {
  const transformedItems = order.items?.map((item, index) => {
    const cartId = `${item.id || item.itemId || 'item'}-${Date.now()}-${index}`;

    return {
      ...item,
      cartId,
      itemId: item.itemId || item.id,
      variantId: item.variantId || '',
      amount: item.amount || 1,
      price: item.price || 0,
      selectedRetailAttributes: item.selectedRetailAttributes || [],
      discount: item.discount || {},
      customDiscount: item.discount?.value || 0,
    };
  }) || [];

  return {
    ...order,
    id: undefined,
    items: transformedItems,
    branchId: order.branchId,
    customer: order.customer,
    orderMethod: order.orderMethod,
    scheduledAt: order.scheduledAt,
    deliverTo: order.deliverTo,
    orderCharges: order.orderCharges || [],
    customDiscount: order.customDiscount,
  };
};

export const Order = ({
  pageType = '',
  customer = '',
  appSourceProp,
  defaultOrderSource,
  externalFromDate,
  externalToDate,
  externalBranchId,
  isEndOfDayMode = false,
  wholesale = false,
}: OrderProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Configure based on page type
  const today = new Date();
  const from = new Date(today);
  from.setHours(0, 0, 0, 0);
  const to = new Date(today);
  to.setHours(23, 59, 59, 999);

  const config = {
    '': {
      storageKey: 'order-columns',
      title: 'Orders',
      sortField: 'createdDate',
      sortOrder: -1 as any,
      dateFrom: '',
      dateTo: '',
      modifiedDate: false,
      showDatePicker: true,
    },
    history: {
      storageKey: 'order-history-columns',
      title: 'Order History',
      sortField: 'createdDate',
      sortOrder: -1 as any,
      dateFrom: '',
      dateTo: '',
      modifiedDate: false,
      showDatePicker: true,
    },
    today: {
      storageKey: 'order-today-columns',
      title: "Today's Orders",
      sortField: 'createdDate',
      sortOrder: -1 as any,
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
      modifiedDate: true,
      showDatePicker: false,
    },
    scheduled: {
      storageKey: 'order-scheduled-columns',
      title: 'Scheduled Orders',
      sortField: 'createdDate',
      sortOrder: -1 as any,
      dateFrom: '',
      dateTo: '',
      modifiedDate: false,
      showDatePicker: true,
    },
    'ai-ordering': {
      storageKey: 'order-ai-ordering-columns',
      title: 'Ai Ordering',
      sortField: 'createdDate',
      sortOrder: -1 as any,
      dateFrom: '',
      dateTo: '',
      modifiedDate: false,
      showDatePicker: true,
    },
    saved: {
      storageKey: 'order-saved-columns',
      title: 'Saved Orders',
      sortField: 'createdDate',
      sortOrder: -1 as any,
      dateFrom: '',
      dateTo: '',
      modifiedDate: false,
      showDatePicker: true,
    },
  };

  const pageConfig = config[pageType];
  const LOCAL_STORAGE_KEY = pageConfig.storageKey;

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [orderStatuses, setOrderStatuses] = useState<Array<{ label: string; value: string }>>([]);
  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 10,
    page: 0,
    sortField: pageConfig.sortField,
    sortOrder: pageConfig.sortOrder,
    modifiedDate: pageConfig.modifiedDate,
    filters: {
      createdDate: {
        from: externalFromDate || pageConfig.dateFrom,
        to: externalToDate || pageConfig.dateTo,
      },
      id: { value: '', matchMode: 'contains' },
      byClient: { value: '', matchMode: 'contains' },
      status: { value: pageType === 'saved' ? OrderStatus.DRAFT : '', matchMode: pageType === 'saved' ? 'equals' : 'contains' },
      "customer.email": { value: '', matchMode: 'contains' },
      "customer.id": { value: customer, matchMode: 'contains' },
      "customer.phone": { value: '', matchMode: 'contains' },
      branchId: { value: externalBranchId || '', matchMode: 'equals' },
      paymentStatus: { value: '', matchMode: 'equals' },
      orderSource: { value: defaultOrderSource || '', matchMode: 'equals' },
      total: { value: null, matchMode: 'equals' },
      tables: { value: '', matchMode: 'contains' },
      discount: { value: null, matchMode: 'equals' },
      refund: { value: null, matchMode: 'equals' }
    }
  });

  const orderList = useAppSelector(state => state.order.entities);
  const totalOrders = useAppSelector(state => state.order.totalOrders);
  const loading = useAppSelector(state => state.order.loading);
  const branchList = useAppSelector(state => state.branch.entities);
  const branchRegistry: IBranchRegistry[] = useAppSelector(state => state.branchRegistry.entities);
  const orderSources = useAppSelector(state => state.order.orderSources);
  const businessTimeZone = useAppSelector(state => state.businessTimeZone.timeZone);


  const getBranchName = (branchId) => {
    const matchedBranch = branchList.find(item => item.id === branchId);
    return matchedBranch ? matchedBranch.name : 'Unknown Branch';
  };

  const filteredBranchOptions = branchList
    .map((branch) => ({
      label: branch.name,
      value: branch.id,
    }));

  const filteredOrderStatuses = wholesale ? orderStatuses.filter(status => status.value !== OrderStatus.DRAFT) : orderStatuses;

  const statusTabs = [
    { label: 'All', value: ALL_STATUS_TAB },
    ...filteredOrderStatuses.map(status => ({
      label: formatStatusLabel(status.value),
      value: status.value,
    })),
  ];

  const activeStatusTab = lazyState.filters.status?.value || ALL_STATUS_TAB;
  const isSavedOrdersPage = pageType === 'saved';



  const handleRowClick = (orderId: string, items: any[], displaySequenceNumber: string) => {
    if (items?.length > 0) {
      navigate(`/order/${orderId}`);
    } else {
      toast.warn(`No Order Items - Order ID: ${displaySequenceNumber}`, { autoClose: 3000 });
    }
  };

  const handleDeleteOrder = async (orderId: string, displaySequenceNumber: string) => {
    try {
      await dispatch(deleteEntity(orderId));
      await dispatch(filterOrders(buildOrderQueryParams()));
      toast.success(`Order ${displaySequenceNumber} deleted successfully`, { autoClose: 3000 });
    } catch (error) {
      toast.error(`Failed to delete order: ${error.message}`, { autoClose: 3000 });
    }
  };

  const handleReorder = (order: IOrder) => {
    const displaySequenceNumber = formatSourceScopedIdentifier(order.sourceApp?.type, order.sequenceNumber, order.id);
    if (!order?.items?.length) {
      toast.warn(`No Order Items - Order ID: ${displaySequenceNumber}`, { autoClose: 3000 });
      return;
    }

    const transformedOrder = transformOrderForReorder(order);
    const matchingRegistry = branchRegistry.find(record => record.branch?.id === order.branchId);
    const search = new URLSearchParams();

    if (matchingRegistry?.id) {
      search.set('registerId', matchingRegistry.id);
    }

    if (order.wholesale) {
      search.set('mode', 'wholesale');
    }

    navigate(`/order/create${search.toString() ? `?${search.toString()}` : ''}`, {
      state: {
        prefillOrder: transformedOrder,
      },
    });
  };

  const handleRefresh = () => {
    dispatch(filterOrders(buildOrderQueryParams()));
  };


  const [visibleColumns, setVisibleColumns] = useState(() => {
    const storedData = JSON.parse(localStorage.getItem("visible_columns")) || {};

    // Default column visibility settings
    const defaultFields = {
      orderId: true,
      orderBranch: true,
      orderTotal: true,
      OrderDate: true,
      orderStatus: true,
      paymentStatus: true,
      orderSource: true,
      orderType: true,
      orderTable: true,
      customerEmail: true,
      customerPhone: true,
      createdBy: true,
      // orderDiscount: true,
      orderRefund: true,
    };

    // Get stored fields, or use defaults if none exist
    const storedFields = storedData[LOCAL_STORAGE_KEY] || {};
    
    // Merge defaults with stored fields - defaults take precedence for new fields
    // This ensures new fields like 'createdBy' are visible even if not in localStorage
    return {
      ...defaultFields,
      ...storedFields,
    };
  });

  const toCamelCaseWithSpace = (str) => {
    return str
      .replace(/([A-Z])/g, ' $1')  // Add space before uppercase letters
      .replace(/^./, (match) => match.toUpperCase()) // Capitalize first letter
      .replace(/\s+/g, ' ')         // Remove any extra spaces
      .trim(); // Remove leading and trailing spaces
  };

  const onColumnToggle = (columnKey) => {
    setVisibleColumns((prevState) => {
      const updatedColumns = {
        ...prevState,
        [columnKey]: !prevState[columnKey],
      };
  
      // Retrieve existing visible columns data from localStorage
      const visibleColumnsData = JSON.parse(localStorage.getItem("visible_columns")) || {};
  
      // Update or set the 'orderToday' key with the new column visibility
      visibleColumnsData[LOCAL_STORAGE_KEY] = updatedColumns;
      
      // Save the updated data back to localStorage
      localStorage.setItem("visible_columns", JSON.stringify(visibleColumnsData));
  
      return updatedColumns;
    });
  };

  const columnOptions = Object.keys(visibleColumns)
  .map((field) => ({
    field,
    header: toCamelCaseWithSpace(field), // Convert the field name to a human-readable header
  }));

  const shouldShowLoadingState = loading && !(isEndOfDayMode && orderList.length > 0);
  const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length + 1;

  const handleStatusTabChange = (value: string) => {
    if (isSavedOrdersPage) {
      return;
    }

    setLazyState(prevState => ({
      ...prevState,
      first: 0,
      page: 0,
      filters: {
        ...prevState.filters,
        status: {
          value: value === ALL_STATUS_TAB ? '' : value,
          matchMode: 'equals',
        },
      },
    }));
  };

  const handleSort = (field: string) => {
    const isAsc = lazyState.sortField === field && lazyState.sortOrder === 1;
    setLazyState(prev => ({
      ...prev,
      sortField: field,
      sortOrder: isAsc ? -1 : 1
    }));
  };

  const renderSortIcon = (field: string) => {
    if (lazyState.sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    }

    return lazyState.sortOrder === 1 ? (
      <ArrowUp className="h-3 w-3 text-foreground" />
    ) : (
      <ArrowDown className="h-3 w-3 text-foreground" />
    );
  };

  const getSortIcon = (field: string) => {
    if (lazyState.sortField !== field) return null;
    return lazyState.sortOrder === 1 ? '↑' : '↓';
  };

  const getSelectedDateRangeBoundary = (value: Date, boundary: 'start' | 'end') => {
    const targetTimeZone = (externalBranchId ? branchList.find(b => b.id === externalBranchId)?.timezone : null) || businessTimeZone;
    const dateStr = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    const time = boundary === 'start' ? '00:00:00' : '23:59:59';
    return fromZonedTime(`${dateStr} ${time}`, targetTimeZone).toISOString();
  };

  const buildOrderQueryParams = () => {
    const shouldExcludeWholesaleOrders = !wholesale && ['', 'today', 'history', 'scheduled', 'ai-ordering', 'saved'].includes(pageType);

    const queryParams = {
      ...(wholesale && { wholesale: true }),
      ...(shouldExcludeWholesaleOrders && { wholesale: false }),
      ...(wholesale && !isSavedOrdersPage && { excludeProcessingStatus: OrderStatus.DRAFT }),
      ...(pageType === 'scheduled' && { scheduled: true }),
      ...(isSavedOrdersPage && { orderProcessingStatus: OrderStatus.DRAFT }),
      id: lazyState.filters._id?.value || '',
      client: appSourceProp || lazyState.filters.orderSource?.value || '',
      ...(!isSavedOrdersPage && { orderProcessingStatus: lazyState.filters.status?.value || '' }),
      first: lazyState.first,
      sequenceId: lazyState.filters.id?.value || '',
      page: lazyState.page,
      customerPhone: lazyState.filters['customer.phone']?.value || '',
      customerEmail: lazyState.filters['customer.email']?.value || '',
      customerId: lazyState.filters['customer.id']?.value || '',
      branchId: lazyState.filters.branchId?.value || '',
      paymentStatus: lazyState.filters.paymentStatus?.value || '',
      tables: lazyState.filters.tables?.value || '',
      total: lazyState.filters.total?.value,
      discount: lazyState.filters.discount?.value,
      refund: lazyState.filters.refund?.value,
      createdBy: lazyState.filters.createdBy?.value || '',
      size: lazyState.rows,
      fromDate: isEndOfDayMode
        ? (externalFromDate || '')
        : pageConfig.showDatePicker
        ? (dateRange?.from ? getSelectedDateRangeBoundary(dateRange.from, 'start') : '')
        : (lazyState.filters.createdDate?.from ? new Date(lazyState.filters.createdDate.from).toISOString() : ''),
      toDate: isEndOfDayMode
        ? (externalToDate || '')
        : pageConfig.showDatePicker
        ? (dateRange?.to ? getSelectedDateRangeBoundary(dateRange.to, 'end') : '')
        : (lazyState.filters.createdDate?.to ? new Date(lazyState.filters.createdDate.to).toISOString() : ''),
      modifiedDate: pageConfig.modifiedDate,
      sort: lazyState.sortField ? `${lazyState.sortField},${lazyState.sortOrder === 1 ? 'asc' : 'desc'}` : 'createdDate,desc'
    };

    return Object.fromEntries(
      Object.entries(queryParams).filter(
        ([_, value]) => value !== '' && value !== null && value !== undefined
      )
    );
  };

  useEffect(() => {
    const handleFilterOrders = debounce(() => {
      if (
        lazyState.first ||
        lazyState.sortOrder ||
        lazyState.sortField ||
        lazyState.filters.createdDate?.from ||
        lazyState.filters.createdDate?.to ||
        lazyState.filters.byClient?.value ||
        lazyState.filters.status?.value ||
        lazyState.filters['customer.phone']?.value ||
        lazyState.filters['customer.email']?.value ||
        lazyState.filters.branchId?.value ||
        lazyState.filters.paymentStatus?.value ||
        lazyState.filters.id?.value ||
        lazyState.filters.tables?.value ||
        lazyState.filters.orderSource?.value ||
        lazyState.filters.status?.value ||
        lazyState.filters.discount?.value !== null ||
        lazyState.filters.refund?.value !== null ||
        lazyState.filters.createdBy?.value ||
        (!isEndOfDayMode && (dateRange?.from || dateRange?.to)) ||
        (isEndOfDayMode && externalFromDate && externalToDate)
      ) {
        dispatch(filterOrders(buildOrderQueryParams()));
      } else {
        dispatch(getEntities({}));
      }
    }, 300);

    handleFilterOrders();

    return () => {
      handleFilterOrders.cancel();
    };
  }, [lazyState, dateRange]);



  useEffect(() => {
    dispatch(getBranches({}))
    dispatch(
      getEntitiesByType({
        type: RegisterType.ONLINE,
      })
    )
    dispatch(getOrderSources())
    dispatch(getOrderStatuses())
      .then((response: any) => {
        setOrderStatuses(response.payload?.map((status) => ({ label: status, value: status })));
      })
  }, []);

  // Update lazyState when external dates or branch change
  useEffect(() => {
    if (externalFromDate || externalToDate || externalBranchId) {
      setLazyState(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          createdDate: {
            from: externalFromDate || prev.filters.createdDate.from,
            to: externalToDate || prev.filters.createdDate.to,
          },
          branchId: {
            value: externalBranchId || prev.filters.branchId?.value || '',
            matchMode: 'equals'
          }
        }
      }));
    }
  }, [externalFromDate, externalToDate, externalBranchId]);

  // Ultra-compact react-select styles
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: '26px',
      height: '26px',
      fontSize: '0.7rem',
      borderRadius: '0.375rem',
    }),
    valueContainer: (base: any) => ({
      ...base,
      height: '26px',
      padding: '0 6px',
    }),
    input: (base: any) => ({
      ...base,
      margin: '0px',
      padding: '0px',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      height: '26px',
    }),
    option: (base: any) => ({
      ...base,
      fontSize: '0.7rem',
      padding: '4px 8px',
    }),
    placeholder: (base: any) => ({
      ...base,
      fontSize: '0.7rem',
    }),
    singleValue: (base: any) => ({
      ...base,
      fontSize: '0.7rem',
    }),
  };

  const cellClass = 'text-xs break-words whitespace-normal';

  return (
    <Card className={cn('w-full border-border/70 shadow-sm', isEndOfDayMode ? 'p-0' : 'overflow-hidden')}>
      <CardHeader className={cn('space-y-4 border-b bg-muted/20', isEndOfDayMode ? 'px-2 pb-3 pt-2' : 'px-4 pb-4 pt-4')}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="truncate text-xl font-semibold">{pageConfig.title}</CardTitle>
              {pageType === 'today' && <Badge variant="secondary" className="rounded-full">Today</Badge>}
              {pageType === 'scheduled' && <Badge variant="secondary" className="rounded-full">Scheduled</Badge>}
              {pageType === 'ai-ordering' && <Badge variant="secondary" className="rounded-full">Online Ordering</Badge>}
              {pageType === 'saved' && <Badge variant="secondary" className="rounded-full">Draft Only</Badge>}
              {!!wholesale && <Badge variant="outline" className="rounded-full">Wholesale</Badge>}
              {!!customer && <Badge variant="outline" className="rounded-full">Customer Orders</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {totalOrders || 0} order{totalOrders === 1 ? '' : 's'} across the current filters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn('mr-1 h-3.5 w-3.5', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Settings className="mr-1 h-3.5 w-3.5" />
                  Columns
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <h4 className="mb-3 text-sm font-medium">Select Columns</h4>
                  {columnOptions.map((col) => (
                    <div key={col.field} className="flex items-center space-x-2">
                      <Checkbox
                        id={col.field}
                        checked={visibleColumns[col.field] === true}
                        onCheckedChange={() => onColumnToggle(col.field)}
                      />
                      <label
                        htmlFor={col.field}
                        className="text-xs leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {col.header}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border bg-background p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full">
              <div className="w-full overflow-x-auto pb-1">
                <Tabs value={isSavedOrdersPage ? OrderStatus.DRAFT : activeStatusTab} onValueChange={handleStatusTabChange}>
                  <TabsList className="h-auto w-max min-w-full justify-start gap-1.5 rounded-xl border bg-muted/40 p-1 pr-7">
                    {(isSavedOrdersPage ? [{ label: 'Draft', value: OrderStatus.DRAFT }] : statusTabs).map(tab => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="h-7 rounded-lg border border-transparent bg-transparent px-2.5 text-xs data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              <div className="pointer-events-none absolute inset-y-1 right-0 w-6 rounded-r-xl bg-gradient-to-l from-background via-background/85 to-transparent" />
            </div>

            {!isSavedOrdersPage && !wholesale && (
              <div className="flex items-center gap-2 rounded-full border px-3 py-1.5">
                <Checkbox
                  checked={lazyState.filters?.status?.value === OrderStatus.DRAFT && !lazyState.filters?.orderSource?.value}
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      setLazyState((prevState) => ({
                        ...prevState,
                        first: 0,
                        page: 0,
                        filters: {
                          ...prevState.filters,
                          orderSource: { value: null, matchMode: 'equals' },
                          status: { value: OrderStatus.DRAFT, matchMode: 'equals' },
                        },
                      }));
                    } else {
                      setLazyState((prevState) => ({
                        ...prevState,
                        first: 0,
                        page: 0,
                        filters: {
                          ...prevState.filters,
                          orderSource: { value: null, matchMode: 'equals' },
                          status: { value: null, matchMode: 'equals' },
                        },
                      }));
                    }
                  }}
                />
                <Label className="text-xs">Awaiting Confirmation</Label>
              </div>
            )}
          </div>

          <Accordion type="single" collapsible defaultValue="filters" className="rounded-xl border px-3">
            <AccordionItem value="filters" className="border-b-0">
              <AccordionTrigger className="py-2 text-xs font-medium hover:no-underline">
                Filters
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                  {pageConfig.showDatePicker && !isEndOfDayMode && (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Date Range</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-7 w-full justify-start text-[11px] font-normal">
                            <CalendarIcon className="mr-1.5 h-3 w-3" />
                            {dateRange?.from ? (
                              dateRange.to ? `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}` : format(dateRange.from, 'PP')
                            ) : (
                              <span>{translate('orders.view.table.filters.date')}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={(range) => setDateRange(range)}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {!isEndOfDayMode && (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{translate('orders.view.table.fields.branch')}</Label>
                      <Select
                        styles={selectStyles}
                        value={filteredBranchOptions.find(opt => opt.value === lazyState.filters.branchId?.value) || null}
                        options={filteredBranchOptions}
                        isClearable
                        onChange={(option) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            first: 0,
                            page: 0,
                            filters: {
                              ...prevState.filters,
                              branchId: { value: option?.value || '', matchMode: 'equals' },
                            },
                          }))
                        }
                        placeholder={translate('orders.view.table.filters.branch')}
                      />
                    </div>
                  )}

                  {!appSourceProp && (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{translate('orders.view.table.fields.source')}</Label>
                      <Select
                        styles={selectStyles}
                        value={orderSources?.map((source) => ({ label: formatSourceLabel(source), value: source }))?.find((opt: any) => opt.value === lazyState.filters.orderSource?.value) || null}
                        options={orderSources?.map((source) => ({ label: formatSourceLabel(source), value: source }))}
                        isClearable
                        onChange={(option) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            first: 0,
                            page: 0,
                            filters: {
                              ...prevState.filters,
                              orderSource: { value: option?.value || '', matchMode: 'equals' },
                            },
                          }))
                        }
                        placeholder={translate('orders.view.table.filters.source')}
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Payment Status</Label>
                    <Select
                      styles={selectStyles}
                      value={
                        [
                          { label: formatPaymentStatusLabel(PaymentStatus.PAID), value: PaymentStatus.PAID },
                          { label: formatPaymentStatusLabel(PaymentStatus.UNPAID), value: PaymentStatus.UNPAID },
                        ].find((opt: any) => opt.value === lazyState.filters.paymentStatus?.value) || null
                      }
                      options={[
                        { label: formatPaymentStatusLabel(PaymentStatus.PAID), value: PaymentStatus.PAID },
                        { label: formatPaymentStatusLabel(PaymentStatus.UNPAID), value: PaymentStatus.UNPAID },
                      ]}
                      isClearable
                      onChange={(option) =>
                        setLazyState((prevState) => ({
                          ...prevState,
                          first: 0,
                          page: 0,
                          filters: {
                            ...prevState.filters,
                            paymentStatus: { value: option?.value || '', matchMode: 'equals' },
                          },
                        }))
                      }
                      placeholder="Payment Status"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Refund</Label>
                    <Select
                      styles={selectStyles}
                      value={
                        lazyState.filters.refund?.value === true
                          ? { label: 'Yes', value: true }
                          : lazyState.filters.refund?.value === false
                            ? { label: 'No', value: false }
                            : null
                      }
                      options={[
                        { label: 'Yes', value: true },
                        { label: 'No', value: false }
                      ]}
                      isClearable
                      onChange={(selected) =>
                        setLazyState((prevState) => ({
                          ...prevState,
                          first: 0,
                          page: 0,
                          filters: {
                            ...prevState.filters,
                            refund: { value: selected?.value ?? null, matchMode: 'equals' },
                          },
                        }))
                      }
                      placeholder="Refund"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Sequence Number
                    </Label>
                    <Input
                      className="h-7 text-[11px]"
                      value={lazyState.filters._id?.value || ''}
                      onChange={(e) =>
                        setLazyState((prevState) => ({
                          ...prevState,
                          first: 0,
                          page: 0,
                          filters: {
                            ...prevState.filters,
                            _id: { value: e.target.value, matchMode: 'equals' },
                          },
                        }))
                      }
                      placeholder={translate('orders.view.table.filters.id')}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {translate('orders.view.table.fields.tables')}
                    </Label>
                    <Input
                      className="h-7 text-[11px]"
                      value={lazyState.filters.tables?.value || ''}
                      onChange={(e) =>
                        setLazyState((prevState) => ({
                          ...prevState,
                          first: 0,
                          page: 0,
                          filters: {
                            ...prevState.filters,
                            tables: { value: e.target.value, matchMode: 'equals' },
                          },
                        }))
                      }
                      placeholder={translate('orders.view.table.filters.tables')}
                    />
                  </div>

                  {!customer && (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {translate('orders.view.table.fields.customerEmail')}
                      </Label>
                      <Input
                        className="h-7 text-[11px]"
                        value={lazyState.filters['customer.email']?.value || ''}
                        onChange={(e) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            first: 0,
                            page: 0,
                            filters: {
                              ...prevState.filters,
                              'customer.email': { value: e.target.value, matchMode: 'equals' },
                            },
                          }))
                        }
                        placeholder={translate('orders.view.table.filters.customerEmail')}
                      />
                    </div>
                  )}

                  {!customer && (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {translate('orders.view.table.fields.customerPhone')}
                      </Label>
                      <Input
                        className="h-7 text-[11px]"
                        value={lazyState.filters['customer.phone']?.value || ''}
                        onChange={(e) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            first: 0,
                            page: 0,
                            filters: {
                              ...prevState.filters,
                              'customer.phone': { value: e.target.value, matchMode: 'equals' },
                            },
                          }))
                        }
                        placeholder={translate('orders.view.table.filters.customerPhone')}
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Created By
                    </Label>
                    <Input
                      className="h-7 text-[11px]"
                      value={lazyState.filters.createdBy?.value || ''}
                      onChange={(e) =>
                        setLazyState((prevState) => ({
                          ...prevState,
                          first: 0,
                          page: 0,
                          filters: {
                            ...prevState.filters,
                            createdBy: { value: e.target.value, matchMode: 'contains' },
                          },
                        }))
                      }
                      placeholder="Filter by creator"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardHeader>

      <CardContent className={cn('space-y-0 px-0 pb-0', isEndOfDayMode ? 'pt-0' : 'pt-0')}>
        <div className="border-t" />
        <div className="p-3">
        <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <Table className={cn('w-full table-fixed', isEndOfDayMode ? 'min-w-full' : 'min-w-[1200px]')}>
            <TableHeader>
              <TableRow className="border-b bg-muted/30">
                {visibleColumns.orderId && (
                  <TableHead className="w-24">
                    <div
                      className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                      onClick={() => handleSort('sequenceNumber')}
                    >
                      Sequence Number {renderSortIcon('sequenceNumber')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.orderBranch && (
                  <TableHead>
                    <div
                      className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                      onClick={() => !isEndOfDayMode && handleSort('branchId')}
                    >
                      {translate('orders.view.table.fields.branch')} {!isEndOfDayMode && renderSortIcon('branchId')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.orderTotal && (
                  <TableHead>
                    <div className="text-xs font-medium">Total</div>
                  </TableHead>
                )}
                {visibleColumns.OrderDate && (
                  <TableHead className="min-w-[140px]">
                    <div
                      className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                      onClick={() => pageConfig.showDatePicker && !isEndOfDayMode && handleSort('createdDate')}
                    >
                      {translate('orders.view.table.fields.date')} {pageConfig.showDatePicker && !isEndOfDayMode && renderSortIcon('createdDate')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.orderStatus && (
                  <TableHead>
                    <div
                      className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                      onClick={() => handleSort('processingStatus')}
                    >
                      {translate('orders.view.table.fields.status')} {renderSortIcon('processingStatus')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.paymentStatus && (
                  <TableHead>
                    <div
                      className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                      onClick={() => handleSort('paymentStatus')}
                    >
                      Payment Status {renderSortIcon('paymentStatus')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.orderRefund && (
                  <TableHead>
                    <div className="text-xs font-medium">Refund</div>
                  </TableHead>
                )}
                {visibleColumns.orderSource && (
                  <TableHead>
                    <div
                      className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                      onClick={() => handleSort('sourceApp.type')}
                    >
                      {translate('orders.view.table.fields.source')} {renderSortIcon('sourceApp.type')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.orderType && (
                  <TableHead>
                    <div
                      className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                      onClick={() => handleSort('orderMethod')}
                    >
                      Order Type {renderSortIcon('orderMethod')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.orderTable && (
                  <TableHead>
                    <div
                      className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                      onClick={() => handleSort('tables')}
                    >
                      {translate('orders.view.table.fields.tables')} {renderSortIcon('tables')}
                    </div>
                  </TableHead>
                )}
                {!customer && visibleColumns.customerEmail && (
                  <TableHead>
                    <div
                      className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                      onClick={() => handleSort('customer.email')}
                    >
                      {translate('orders.view.table.fields.customerEmail')} {renderSortIcon('customer.email')}
                    </div>
                  </TableHead>
                )}
                {!customer && visibleColumns.customerPhone && (
                  <TableHead>
                    <div
                      className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                      onClick={() => handleSort('customer.phone')}
                    >
                      {translate('orders.view.table.fields.customerPhone')} {renderSortIcon('customer.phone')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.createdBy && (
                  <TableHead>
                    <div className="text-xs font-medium">Created By</div>
                  </TableHead>
                )}
                {/* {visibleColumns.orderDiscount && (
                  <TableHead>
                    <div className="space-y-1">
                      <div className="text-xs font-medium">{translate('orders.view.table.fields.discount')}</div>
                      <Select
                        styles={selectStyles}
                        value={
                          lazyState.filters.discount?.value === true
                            ? { label: 'Yes', value: true }
                            : lazyState.filters.discount?.value === false
                            ? { label: 'No', value: false }
                            : null
                        }
                        options={[
                          { label: 'Yes', value: true },
                          { label: 'No', value: false }
                        ]}
                        isClearable
                        onChange={(selected) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            filters: {
                              ...prevState.filters,
                              discount: { value: selected?.value ?? null, matchMode: 'equals' },
                            },
                          }))
                        }
                        placeholder="Filter"
                      />
                    </div>
                  </TableHead>
                )} */}
                <TableHead className="w-16">
                  <div className="text-xs font-medium">Actions</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shouldShowLoadingState ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} className="h-24 text-center text-xs">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : orderList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} className="h-24 text-center text-xs">
                    {translate('orders.view.table.emptyMessage')}
                  </TableCell>
                </TableRow>
              ) : (
                orderList.map((order) => {
                  const displaySequenceNumber = formatSourceScopedIdentifier(order.sourceApp?.type, order.sequenceNumber, order.id);
                  return (
                  <TableRow
                    key={order.id}
                    data-testid={order === orderList[0] ? 'order-row-latest' : `order-row-${order.id}`}
                    className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/40"
                    onClick={() => handleRowClick(order.id, order.items, displaySequenceNumber)}
                  >
                    {visibleColumns.orderId && (
                      <TableCell className={cellClass}>
                        <Link to={`/order/${order.id}`} className="font-medium text-primary hover:underline">
                          {displaySequenceNumber}
                        </Link>
                      </TableCell>
                    )}
                    {visibleColumns.orderBranch && (
                      <TableCell className={cellClass}>
                        <Badge variant="outline" className="rounded-md">
                          {getBranchName(order.branchId)}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.orderTotal && (
                      <TableCell className={cn(cellClass, 'font-semibold')}>{formatNumber(order.total)}</TableCell>
                    )}
                    {visibleColumns.OrderDate && (
                      <TableCell className={cellClass}>
                        <div className="space-y-0.5">
                          <div>{order.createdDate && formatDateForDisplay(order.createdDate)}</div>
                          {order.scheduledAt && (
                            <div className="text-[11px] text-muted-foreground">
                              Scheduled: {formatDateForDisplay(order.scheduledAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.orderStatus && (
                      <TableCell className={cellClass}>
                        <Badge variant="outline" className={cn('rounded-full', getStatusBadgeClassName(order.processingStatus))}>
                          {formatStatusLabel(order.processingStatus)}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.paymentStatus && (
                      <TableCell className={cellClass}>
                        <Badge
                          variant="outline"
                          className={cn('rounded-full', getPaymentStatusBadgeClassName(order.paymentStatus))}
                        >
                          {formatPaymentStatusLabel(order.paymentStatus)}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.orderRefund && (
                      <TableCell className={`${cellClass} text-center`}>
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-full',
                            order.refund
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-50 text-slate-600'
                          )}
                        >
                          {order.refund ? 'Refunded' : 'No'}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.orderSource && (
                      <TableCell className={cellClass}>
                        <Badge variant="outline" className={cn('rounded-full', getSourceBadgeClassName(order.sourceApp?.type))}>
                          {formatSourceLabel(order.sourceApp?.type)}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.orderType && (
                      <TableCell className={cellClass}>
                        <Badge variant="outline" className={cn('rounded-full', getOrderTypeBadgeClassName(order.orderMethod))}>
                          {formatOrderMethodLabel(order.orderMethod)}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.orderTable && (
                      <TableCell className={cellClass}>{order.tables || '-'}</TableCell>
                    )}
                    {!customer && visibleColumns.customerEmail && (
                      <TableCell className={cn(cellClass, 'text-muted-foreground')}>{order.customer?.email || '-'}</TableCell>
                    )}
                    {!customer && visibleColumns.customerPhone && (
                      <TableCell className={cn(cellClass, 'text-muted-foreground')}>{order.customer?.phone || '-'}</TableCell>
                    )}
                    {visibleColumns.createdBy && (
                      <TableCell className={cn(cellClass, 'text-muted-foreground')}>{order.createdBy || '-'}</TableCell>
                    )}
                    {/* {visibleColumns.orderDiscount && (
                      <TableCell className="text-xs text-center">
                        {order.discount ? (
                          <Check className="h-4 w-4 text-green-600 inline" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 inline" />
                        )}
                      </TableCell>
                    )} */}
                    <TableCell className={cellClass} onClick={(e) => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Order actions</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-44 p-1.5">
                          <div className="space-y-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-full justify-start rounded-lg px-2 text-xs font-medium"
                              onClick={() => handleReorder(order)}
                            >
                              <Copy className="mr-2 h-3.5 w-3.5" />
                              {getReorderActionLabel(order)}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 w-full justify-start rounded-lg px-2 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Order</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete order {displaySequenceNumber}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteOrder(order.id, displaySequenceNumber)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        </div>

        {/* Custom Pagination */}
        <div className="flex flex-col gap-3 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2">
            <Label className="text-xs">Rows per page:</Label>
            <Select
              value={{ label: String(lazyState.rows), value: lazyState.rows }}
              options={[10, 20, 30, 40, 50, 100, 200].map((size) => ({ label: String(size), value: size }))}
              onChange={(option) =>
                setLazyState((prev) => ({
                  ...prev,
                  rows: option?.value || 10,
                  first: 0,
                  page: 0,
                }))
              }
            />
          </div>

          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="rounded-full text-[11px]">
              {totalOrders === 0 ? 0 : lazyState.first + 1}-{Math.min(lazyState.first + lazyState.rows, totalOrders)} of {totalOrders}
            </Badge>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() =>
                  setLazyState((prev) => ({
                    ...prev,
                    first: Math.max(0, prev.first - prev.rows),
                    page: Math.max(0, prev.page - 1),
                  }))
                }
                disabled={lazyState.first === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() =>
                  setLazyState((prev) => ({
                    ...prev,
                    first: prev.first + prev.rows,
                    page: prev.page + 1,
                  }))
                }
                disabled={lazyState.first + lazyState.rows >= totalOrders}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
        </div>
        </div>
        </div>
      </CardContent>
    </Card>
  );
};



export default Order;
