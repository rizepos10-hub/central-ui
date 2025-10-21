import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities, filterOrders, getOrderSources, getOrderStatuses, reset } from './order.reducer';
import { getEntities as getBranches } from '../branch/branch.reducer';
import { endOfDay, startOfDay, format } from "date-fns";
import { debounce } from "lodash";
import { translate } from "react-jhipster";
import { toLocalISOString } from "app/shared/util/date-utils";
import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { getEntity as getUiSettings } from 'app/entities/online-ordering/settings/settings.reducer';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { cn } from '@/src/main/webapp/app/lib/utils';
import type { DateRange } from 'react-day-picker';

interface LazyTableState {
  first?: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: any;
  filters: any;
}

type OrderProps = {
  customer?: string;
  appSourceProp?: "ONLINE_ORDERING" | "BRANCH_POS" | "BUSINESS_ADMIN" | "CENTRAL_APP";
}


export const Order = ({ customer = '', appSourceProp }: OrderProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const LOCAL_STORAGE_KEY = "order-history-columns";
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [orderStatuses, setOrderStatuses]: any = useState([]);
  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'createdDate',
    sortOrder: "asc",
    filters: {
      createdDate: {
        from: '',
        to: ''
      },
      id: { value: '', matchMode: 'contains' },
      byClient: { value: '', matchMode: 'contains' },
      status: { value: '', matchMode: 'contains' },
      "customer.email": { value: '', matchMode: 'contains' },
      "customer.id": { value: customer, matchMode: 'contains' },
      "customer.phone": { value: '', matchMode: 'contains' },
      branchId: { value: '', matchMode: 'equals' },
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


  const getBranchName = (branchId) => {
    const branch = branchList.find(branch => branch.id === branchId);
    return branch ? branch.name : 'Unknown Branch';
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


  const [visibleColumns, setVisibleColumns] = useState(() => {
    const storedData = JSON.parse(localStorage.getItem("visible_columns")) || {};

    // Check if 'orderToday' exists in the stored data, otherwise initialize it with default visibility
    const storedFields = storedData[LOCAL_STORAGE_KEY] || {
      orderId: true,
      orderBranch: true,
      OrderDate: true,
      orderStatus: true,
      orderSource: true,
      orderTable: true,
      customerEmail: true,
      customerPhone: true,
      orderDiscount: true,
      orderRefund: true,
    };

    return storedFields;
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
      
      console.log(visibleColumnsData);
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
        dateRange?.from ||
        dateRange?.to
      ) {
        const queryParams = {
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
          discount: lazyState.filters.discount?.value,
          refund: lazyState.filters.refund?.value,
          size: lazyState.rows,
          fromDate: dateRange?.from ? toLocalISOString(startOfDay(dateRange.from)) : '',
          toDate: dateRange?.to ? toLocalISOString(endOfDay(dateRange.to)) : '',
          sort: `${lazyState.sortField},${lazyState.sortOrder === 1 ? 'asc' : 'desc'}`
        };

        const filteredQueryParams = Object.fromEntries(
          Object.entries(queryParams).filter(
            ([_, value]) => value !== '' && value !== null && value !== undefined
          )
        );

        dispatch(filterOrders(filteredQueryParams));
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

  return (
    <Card className="p-4">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Order History</CardTitle>
          <div className="flex items-center gap-4">
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

      <CardContent>
        <div className="border rounded-md">
          <Table>
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
                        onClick={() => handleSort('branchId')}
                      >
                        {translate('orders.view.table.fields.branch')} {getSortIcon('branchId')}
                      </div>
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
                    </div>
                  </TableHead>
                )}
                {visibleColumns.OrderDate && (
                  <TableHead>
                    <div className="space-y-1">
                      <div
                        className="text-xs font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                        onClick={() => handleSort('createdDate')}
                      >
                        {translate('orders.view.table.fields.date')} {getSortIcon('createdDate')}
                      </div>
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
                {visibleColumns.orderDiscount && (
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
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
                      <TableCell className="text-xs">
                        <Link to={`/order/${order.id}`} className="text-blue-600 hover:underline">
                          {order.sequenceNumber}
                        </Link>
                      </TableCell>
                    )}
                    {visibleColumns.orderBranch && (
                      <TableCell className="text-xs">{getBranchName(order.branchId)}</TableCell>
                    )}
                    {visibleColumns.OrderDate && (
                      <TableCell className="text-xs">
                        {order.createdDate && new Date(order.createdDate).toLocaleString()}
                      </TableCell>
                    )}
                    {visibleColumns.orderStatus && (
                      <TableCell className="text-xs">{order.processingStatus}</TableCell>
                    )}
                    {visibleColumns.orderSource && (
                      <TableCell className="text-xs">{order.sourceApp?.type}</TableCell>
                    )}
                    {visibleColumns.orderTable && (
                      <TableCell className="text-xs">{order.tables}</TableCell>
                    )}
                    {!customer && visibleColumns.customerEmail && (
                      <TableCell className="text-xs">{order.customer?.email}</TableCell>
                    )}
                    {!customer && visibleColumns.customerPhone && (
                      <TableCell className="text-xs">{order.customer?.phone}</TableCell>
                    )}
                    {visibleColumns.orderDiscount && (
                      <TableCell className="text-xs text-center">
                        {order.discount ? (
                          <Check className="h-4 w-4 text-green-600 inline" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 inline" />
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.orderRefund && (
                      <TableCell className="text-xs text-center">
                        {order.refund ? (
                          <Check className="h-4 w-4 text-green-600 inline" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 inline" />
                        )}
                      </TableCell>
                    )}
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
              styles={{
                ...selectStyles,
                control: (base: any) => ({ ...base, minHeight: '28px', width: '80px', fontSize: '0.75rem' }),
              }}
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

