import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities, filterOrders, getOrderSources, getOrderStatuses, deleteEntity, reset } from './order.reducer';
import { getEntities as getBranches } from '../branch/branch.reducer';
import { format } from "date-fns";
import { fromZonedTime } from 'date-fns-tz';
import { debounce } from "lodash";
import { translate } from "react-jhipster";
import { formatDateForDisplay } from "app/shared/util/timezone-utils";
import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { getEntity as getUiSettings } from 'app/entities/online-ordering/settings/settings.reducer';
import { toast } from 'react-toastify';
import Select from 'app/shared/components/select/select';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X, Trash2 } from 'lucide-react';
import { cn } from '@/src/main/webapp/app/lib/utils';
import type { DateRange } from 'react-day-picker';
import { formatNumber } from 'app/shared/util/price-utils';

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
  pageType?: 'history' | 'today' | 'scheduled' | '';
  customer?: string;
  appSourceProp?: "ONLINE_ORDERING" | "BRANCH_POS" | "BUSINESS_ADMIN" | "CENTRAL_APP";
  externalFromDate?: string;
  externalToDate?: string;
  externalBranchId?: string | null;
  isEndOfDayMode?: boolean;
  wholesale?: boolean;
}

export const Order = ({ pageType = '', customer = '', appSourceProp, externalFromDate, externalToDate, externalBranchId, isEndOfDayMode = false, wholesale = false }: OrderProps) => {
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
  };

  const pageConfig = config[pageType];
  const LOCAL_STORAGE_KEY = pageConfig.storageKey;

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [orderStatuses, setOrderStatuses]: any = useState([]);
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
      status: { value: '', matchMode: 'contains' },
      "customer.email": { value: '', matchMode: 'contains' },
      "customer.id": { value: customer, matchMode: 'contains' },
      "customer.phone": { value: '', matchMode: 'contains' },
      branchId: { value: externalBranchId || '', matchMode: 'equals' },
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
  const orderSources = useAppSelector(state => state.order.orderSources);
  const UiSettingsEntity: IUiSettings = useAppSelector(state => state.uiSettings.entity);
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



  const handleRowClick = (orderId: string, items: any[], sequenceNumber: string) => {
    if (items?.length > 0) {
      navigate(`/order/${orderId}`);
    } else {
      toast.warn(`No Order Items - Order ID: ${sequenceNumber}`, { autoClose: 3000 });
    }
  };

  const handleDeleteOrder = async (orderId: string, sequenceNumber: string) => {
    try {
      await dispatch(deleteEntity(orderId));
      await dispatch(filterOrders(buildOrderQueryParams()));
      toast.success(`Order ${sequenceNumber} deleted successfully`, { autoClose: 3000 });
    } catch (error) {
      toast.error(`Failed to delete order: ${error.message}`, { autoClose: 3000 });
    }
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
      orderSource: true,
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

  const handleSort = (field: string) => {
    const isAsc = lazyState.sortField === field && lazyState.sortOrder === 1;
    setLazyState(prev => ({
      ...prev,
      sortField: field,
      sortOrder: isAsc ? -1 : 1
    }));
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
    const shouldExcludeWholesaleOrders = !wholesale && ['', 'today', 'history', 'scheduled'].includes(pageType);

    const queryParams = {
      ...(wholesale && { wholesale: true }),
      ...(shouldExcludeWholesaleOrders && { wholesale: false }),
      ...(pageType === 'scheduled' && { scheduled: true }),
      id: lazyState.filters._id?.value || '',
      client: appSourceProp || lazyState.filters.orderSource?.value || '',
      orderProcessingStatus: lazyState.filters.status?.value || '',
      first: lazyState.first,
      sequenceId: lazyState.filters.id?.value || '',
      page: lazyState.page,
      customerPhone: lazyState.filters['customer.phone']?.value || '',
      customerEmail: lazyState.filters['customer.email']?.value || '',
      customerId: lazyState.filters['customer.id']?.value || '',
      branchId: lazyState.filters.branchId?.value || '',
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
    dispatch(getOrderSources())
    dispatch(getUiSettings())
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
      minHeight: '28px',
      height: '28px',
      fontSize: '0.75rem',
      borderRadius: '0.375rem',
    }),
    valueContainer: (base: any) => ({
      ...base,
      height: '28px',
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
      height: '28px',
    }),
    option: (base: any) => ({
      ...base,
      fontSize: '0.75rem',
      padding: '4px 8px',
    }),
    placeholder: (base: any) => ({
      ...base,
      fontSize: '0.75rem',
    }),
    singleValue: (base: any) => ({
      ...base,
      fontSize: '0.75rem',
    }),
  };

  const cellClass = 'text-xs break-words whitespace-normal';

  return (
    <Card className={`${isEndOfDayMode ? 'p-0 w-full max-w-full' : 'p-4'}`}>
      <CardHeader className={`${isEndOfDayMode ? 'pb-2 px-2 pt-2' : 'pb-4'}`}>
        <div className="flex justify-between items-center min-w-0">
          <CardTitle className="text-lg truncate">{pageConfig.title}</CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            {UiSettingsEntity.orderConfirmation && (
              <div className="flex items-center gap-2">
                <Label className="text-xs">Filter By Awaiting Confirmation</Label>
                <Checkbox
                  checked={lazyState.filters?.status?.value === OrderStatus.DRAFT && lazyState.filters?.orderSource?.value === 'ONLINE_ORDERING'}
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      setLazyState((prevState) => ({
                        ...prevState,
                        filters: {
                          ...prevState.filters,
                          orderSource: { value: 'ONLINE_ORDERING', matchMode: 'equals' },
                          status: { value: OrderStatus.DRAFT, matchMode: 'equals' },
                        },
                      }));
                    } else {
                      setLazyState((prevState) => ({
                        ...prevState,
                        filters: {
                          ...prevState.filters,
                          orderSource: { value: null, matchMode: 'equals' },
                          status: { value: null, matchMode: 'equals' },
                        },
                      }));
                    }
                  }}
                />
              </div>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm mb-3">Select Columns</h4>
                  {columnOptions.map((col) => (
                    <div key={col.field} className="flex items-center space-x-2">
                      <Checkbox
                        id={col.field}
                        checked={visibleColumns[col.field] === true}
                        onCheckedChange={() => onColumnToggle(col.field)}
                      />
                      <label
                        htmlFor={col.field}
                        className="text-xs cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
      </CardHeader>

      <CardContent className={`overflow-hidden ${isEndOfDayMode ? 'px-2 pb-2' : ''}`}>
        <div className="border rounded-md overflow-x-auto max-w-full">
          <Table className={`w-full table-fixed ${isEndOfDayMode ? 'min-w-full' : 'min-w-[1200px]'}`}>
            <TableHeader>
              <TableRow>
                {visibleColumns.orderId && (
                  <TableHead className="w-24">
                    <div className="space-y-1">
                      <div
                        className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                        onClick={() => handleSort('sequenceNumber')}
                      >
                        Sequence Number {getSortIcon('sequenceNumber')}
                      </div>
                      <Input
                        className="h-7 text-xs"
                        onChange={(e) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            filters: {
                              ...prevState.filters,
                              _id: { value: e.target.value, matchMode: 'equals' },
                            },
                          }))
                        }
                        placeholder={translate('orders.view.table.filters.id')}
                      />
                    </div>
                  </TableHead>
                )}
                {visibleColumns.orderBranch && (
                  <TableHead>
                    <div className="space-y-1">
                      <div
                        className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                        onClick={() => !isEndOfDayMode && handleSort('branchId')}
                      >
                        {translate('orders.view.table.fields.branch')} {!isEndOfDayMode && getSortIcon('branchId')}
                      </div>
                      {!isEndOfDayMode && (
                        <Select
                          styles={selectStyles}
                          value={filteredBranchOptions.find(opt => opt.value === lazyState.filters.branchId?.value) || null}
                          options={filteredBranchOptions}
                          isClearable
                          onChange={(option) =>
                            setLazyState((prevState) => ({
                              ...prevState,
                              filters: {
                                ...prevState.filters,
                                branchId: { value: option?.value || '', matchMode: 'equals' },
                              },
                            }))
                          }
                          placeholder={translate('orders.view.table.filters.branch')}
                        />
                      )}
                      {isEndOfDayMode && externalBranchId && (
                        <div className="text-xs text-muted-foreground">
                          {getBranchName(externalBranchId)}
                        </div>
                      )}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.orderTotal && (
                  <TableHead>
                    <div className="space-y-1">
                      <div className="text-xs font-medium">Total</div>
                    </div>
                  </TableHead>
                )}
                {visibleColumns.OrderDate && (
                  <TableHead className="min-w-[140px]">
                    <div className="space-y-1">
                      <div
                        className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                        onClick={() => pageConfig.showDatePicker && !isEndOfDayMode && handleSort('createdDate')}
                      >
                        {translate('orders.view.table.fields.date')} {pageConfig.showDatePicker && !isEndOfDayMode && getSortIcon('createdDate')}
                      </div>
                      {pageConfig.showDatePicker && !isEndOfDayMode && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="h-7 text-xs w-full justify-start">
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {dateRange?.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "PP")} - {format(dateRange.to, "PP")}
                                  </>
                                ) : (
                                  format(dateRange.from, "PP")
                                )
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
                      )}
                      {isEndOfDayMode && externalFromDate && externalToDate && (
                        <div className="text-[10px] text-muted-foreground leading-tight whitespace-nowrap">
                          {format(new Date(externalFromDate), "MMM dd")} - {format(new Date(externalToDate), "MMM dd, yyyy")}
                        </div>
                      )}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.orderStatus && (
                  <TableHead>
                    <div className="space-y-1">
                      <div
                        className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                        onClick={() => handleSort('processingStatus')}
                      >
                        {translate('orders.view.table.fields.status')} {getSortIcon('processingStatus')}
                      </div>
                      <Select
                        styles={selectStyles}
                        value={orderStatuses.find((opt: any) => opt.value === lazyState.filters.status?.value) || null}
                        options={orderStatuses}
                        isClearable
                        onChange={(option) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            filters: {
                              ...prevState.filters,
                              status: { value: option?.value || '', matchMode: 'equals' },
                            },
                          }))
                        }
                        placeholder={translate('orders.view.table.filters.status')}
                      />
                    </div>
                  </TableHead>
                )}
                {visibleColumns.orderRefund && (
                  <TableHead>
                    <div className="space-y-1">
                      <div className="text-xs font-medium">Refund</div>
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
                            filters: {
                              ...prevState.filters,
                              refund: { value: selected?.value ?? null, matchMode: 'equals' },
                            },
                          }))
                        }
                        placeholder="Filter"
                      />
                    </div>
                  </TableHead>
                )}
                {visibleColumns.orderSource && (
                  <TableHead>
                    <div className="space-y-1">
                      <div
                        className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                        onClick={() => handleSort('sourceApp.type')}
                      >
                        {translate('orders.view.table.fields.source')} {getSortIcon('sourceApp.type')}
                      </div>
                      {!appSourceProp && (
                        <Select
                          styles={selectStyles}
                          value={orderSources?.map((source) => ({ label: source, value: source }))?.find((opt: any) => opt.value === lazyState.filters.orderSource?.value) || null}
                          options={orderSources?.map((source) => ({ label: source, value: source }))}
                          isClearable
                          onChange={(option) =>
                            setLazyState((prevState) => ({
                              ...prevState,
                              filters: {
                                ...prevState.filters,
                                orderSource: { value: option?.value || '', matchMode: 'equals' },
                              },
                            }))
                          }
                          placeholder={translate('orders.view.table.filters.source')}
                        />
                      )}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.orderTable && (
                  <TableHead>
                    <div className="space-y-1">
                      <div
                        className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                        onClick={() => handleSort('tables')}
                      >
                        {translate('orders.view.table.fields.tables')} {getSortIcon('tables')}
                      </div>
                      <Input
                        className="h-7 text-xs"
                        onChange={(e) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            filters: {
                              ...prevState.filters,
                              tables: { value: e.target.value, matchMode: 'equals' },
                            },
                          }))
                        }
                        placeholder={translate('orders.view.table.filters.tables')}
                      />
                    </div>
                  </TableHead>
                )}
                {!customer && visibleColumns.customerEmail && (
                  <TableHead>
                    <div className="space-y-1">
                      <div
                        className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                        onClick={() => handleSort('customer.email')}
                      >
                        {translate('orders.view.table.fields.customerEmail')} {getSortIcon('customer.email')}
                      </div>
                      <Input
                        className="h-7 text-xs"
                        onChange={(e) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            filters: {
                              ...prevState.filters,
                              "customer.email": { value: e.target.value, matchMode: 'equals' },
                            },
                          }))
                        }
                        placeholder={translate('orders.view.table.filters.customerEmail')}
                      />
                    </div>
                  </TableHead>
                )}
                {!customer && visibleColumns.customerPhone && (
                  <TableHead>
                    <div className="space-y-1">
                      <div
                        className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                        onClick={() => handleSort('customer.phone')}
                      >
                        {translate('orders.view.table.fields.customerPhone')} {getSortIcon('customer.phone')}
                      </div>
                      <Input
                        className="h-7 text-xs"
                        onChange={(e) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            filters: {
                              ...prevState.filters,
                              "customer.phone": { value: e.target.value, matchMode: 'equals' },
                            },
                          }))
                        }
                        placeholder={translate('orders.view.table.filters.customerPhone')}
                      />
                    </div>
                  </TableHead>
                )}
                {visibleColumns.createdBy && (
                  <TableHead>
                    <div className="space-y-1">
                      <div className="text-xs font-medium">Created By</div>
                      <Input
                        className="h-7 text-xs"
                        onChange={(e) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            filters: {
                              ...prevState.filters,
                              createdBy: { value: e.target.value, matchMode: 'contains' },
                            },
                          }))
                        }
                        value={lazyState.filters.createdBy?.value || ''}
                        placeholder="Filter by creator"
                      />
                    </div>
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
                  <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="h-24 text-center text-xs">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : orderList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="h-24 text-center text-xs">
                    {translate('orders.view.table.emptyMessage')}
                  </TableCell>
                </TableRow>
              ) : (
                orderList.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(order.id, order.items, order.sequenceNumber)}
                  >
                    {visibleColumns.orderId && (
                      <TableCell className={cellClass}>
                        <Link to={`/order/${order.id}`} className="text-blue-600 hover:underline">
                          {order.sequenceNumber}
                        </Link>
                      </TableCell>
                    )}
                    {visibleColumns.orderBranch && (
                      <TableCell className={cellClass}>{getBranchName(order.branchId)}</TableCell>
                    )}
                    {visibleColumns.orderTotal && (
                      <TableCell className={cellClass}>{formatNumber(order.total)}</TableCell>
                    )}
                    {visibleColumns.OrderDate && (
                      <TableCell className={cellClass}>
                        {order.createdDate && formatDateForDisplay(order.createdDate)}
                      </TableCell>
                    )}
                    {visibleColumns.orderStatus && (
                      <TableCell className={cellClass}>{order.processingStatus}</TableCell>
                    )}
                    {visibleColumns.orderRefund && (
                      <TableCell className={`${cellClass} text-center`}>
                        {order.refund ? (
                          <Check className="h-4 w-4 text-green-600 inline" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 inline" />
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.orderSource && (
                      <TableCell className={cellClass}>{order.sourceApp?.type}</TableCell>
                    )}
                    {visibleColumns.orderTable && (
                      <TableCell className={cellClass}>{order.tables}</TableCell>
                    )}
                    {!customer && visibleColumns.customerEmail && (
                      <TableCell className={cellClass}>{order.customer?.email}</TableCell>
                    )}
                    {!customer && visibleColumns.customerPhone && (
                      <TableCell className={cellClass}>{order.customer?.phone}</TableCell>
                    )}
                    {visibleColumns.createdBy && (
                      <TableCell className={cellClass}>{order.createdBy || '-'}</TableCell>
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Order</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete order {order.sequenceNumber}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteOrder(order.id, order.sequenceNumber)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Custom Pagination */}
        <div className="flex items-center justify-between px-2 py-4">
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

          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {lazyState.first + 1}-{Math.min(lazyState.first + lazyState.rows, totalOrders)} of {totalOrders}
            </span>
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
      </CardContent>
    </Card>
  );
};



export default Order;

