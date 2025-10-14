import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { filterOrders, getOrderSources, getOrderStatuses } from './order.reducer';
import { getEntities as getBranches } from '../branch/branch.reducer';
import { format } from "date-fns";
import { startOfDay, endOfDay } from 'date-fns';
import { translate } from "react-jhipster";
import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { getEntity as getUiSettings } from 'app/entities/online-ordering/settings/settings.reducer';
import Select from 'react-select';
import { Check, X, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: any;
  filters: any;
  modifiedDate?: boolean;
}

const Order = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const today = new Date();

  const from = startOfDay(today);
  const to = endOfDay(today);
  const LOCAL_STORAGE_KEY = "order-today-columns";
  const [orderStatuses, setOrderStatuses]: any = useState([]);

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 10,
    page: 0,
    sortField: null,
    sortOrder: null,
    modifiedDate: true,
    filters: {
      createdDate: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      id: { value: '', matchMode: 'contains' },
      byClient: { value: '', matchMode: 'contains' },
      status: { value: '', matchMode: 'contains' },
      "customer.email": { value: '', matchMode: 'contains' },
      "customer.phone": { value: '', matchMode: 'contains' },
      branchId: { value: '', matchMode: 'equals' },
      tables: { value: '', matchMode: 'contains' }
    }
  });

  const orderList = useAppSelector(state => state.order.entities);
  const totalOrders = useAppSelector(state => state.order.totalOrders);
  const loading = useAppSelector(state => state.order.loading);
  const orderSources = useAppSelector(state => state.order.orderSources);
  const branchList = useAppSelector(state => state.branch.entities);
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

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const storedData = JSON.parse(localStorage.getItem("visible_columns")) || {};

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
    };

    return storedFields;
  });

  const toCamelCaseWithSpace = (str) => {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (match) => match.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  };

  const onColumnToggle = (columnKey) => {
    setVisibleColumns((prevState) => {
      const updatedColumns = {
        ...prevState,
        [columnKey]: !prevState[columnKey],
      };

      const visibleColumnsData = JSON.parse(localStorage.getItem("visible_columns")) || {};
      visibleColumnsData[LOCAL_STORAGE_KEY] = updatedColumns;

      console.log(visibleColumnsData);
      localStorage.setItem("visible_columns", JSON.stringify(visibleColumnsData));

      return updatedColumns;
    });
  };

  const columnOptions = Object.keys(visibleColumns)
    .map((field) => ({
      field,
      header: toCamelCaseWithSpace(field),
    }));

  useEffect(() => {
    const queryParams = {
      client: lazyState.filters.orderSource?.value || '',
      orderProcessingStatus: lazyState.filters.status?.value || '',
      first: lazyState.first,
      sequenceId: lazyState.filters.id?.value || '',
      page: lazyState.page,
      customerPhone: lazyState.filters['customer.phone']?.value || '',
      customerEmail: lazyState.filters['customer.email']?.value || '',
      branchId: lazyState.filters.branchId?.value || '',
      tables: lazyState.filters.tables?.value || '',
      size: lazyState.rows,
      fromDate: lazyState.filters.createdDate?.from ? new Date(lazyState.filters.createdDate.from).toISOString() : '',
      toDate: lazyState.filters.createdDate?.to ? new Date(lazyState.filters.createdDate.to).toISOString() : '',
      modifiedDate: true,
      sort: `_id,asc`
    };

    const filteredQueryParams = Object.fromEntries(
      Object.entries(queryParams).filter(
        ([_, value]) => value !== '' && value !== null && value !== undefined
      )
    );

    dispatch(filterOrders(filteredQueryParams));
  }, [lazyState]);

  useEffect(() => {
    dispatch(getBranches({}))
    dispatch(getUiSettings())
    dispatch(getOrderSources())
    dispatch(getOrderStatuses())
      .then((response: any) => {
        setOrderStatuses(response.payload?.map((status) => ({ label: status, value: status })));
      })
  }, []);

  const currentPage = Math.floor(lazyState.first / lazyState.rows) + 1;
  const totalPages = Math.ceil(totalOrders / lazyState.rows);

  return (
    <PageWrapper>
      <div className="border rounded-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold">Order History</h2>
          <div className="flex items-center gap-3">
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
                      }))
                    } else {
                      setLazyState((prevState) => ({
                        ...prevState,
                        filters: {
                          ...prevState.filters,
                          orderSource: { value: null, matchMode: 'equals' },
                          status: { value: null, matchMode: 'equals' },
                        },
                      }))
                    }
                  }}
                />
              </div>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold mb-2">Select Columns</h4>
                  {columnOptions.map((col) => (
                    <div key={col.field} className="flex items-center gap-2">
                      <Checkbox
                        id={col.field}
                        checked={visibleColumns[col.field]}
                        onCheckedChange={() => onColumnToggle(col.field)}
                      />
                      <Label htmlFor={col.field} className="text-xs cursor-pointer">
                        {col.header}
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.orderId && (
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>{translate('orders.view.table.fields.id')}</div>
                    <Input
                      className="h-7 text-xs"
                      onChange={(e) =>
                        setLazyState((prevState) => ({
                          ...prevState,
                          filters: {
                            ...prevState.filters,
                            id: { value: e.target.value, matchMode: 'equals' },
                          },
                        }))
                      }
                      placeholder={translate('orders.view.table.filters.id')}
                    />
                  </div>
                </TableHead>
              )}

              {visibleColumns.orderBranch && (
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>{translate('orders.view.table.fields.branch')}</div>
                    <Select
                      value={filteredBranchOptions.find(opt => opt.value === lazyState.filters.branchId?.value) || null}
                      options={filteredBranchOptions}
                      onChange={(option) =>
                        setLazyState((prevState) => ({
                          ...prevState,
                          filters: {
                            ...prevState.filters,
                            branchId: { value: option?.value || '', matchMode: 'equals' },
                          },
                        }))
                      }
                      isClearable
                      placeholder={translate('orders.view.table.filters.branch')}
                      styles={{
                        control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                        option: (base) => ({ ...base, fontSize: '0.75rem' })
                      }}
                    />
                  </div>
                </TableHead>
              )}

              {visibleColumns.OrderDate && (
                <TableHead className="text-xs">
                  {translate('orders.view.table.fields.date')}
                </TableHead>
              )}

              {visibleColumns.orderStatus && (
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>{translate('orders.view.table.fields.status')}</div>
                    <Select
                      value={orderStatuses.find(opt => opt.value === lazyState.filters.status?.value) || null}
                      options={orderStatuses}
                      onChange={(option) =>
                        setLazyState((prevState) => ({
                          ...prevState,
                          filters: {
                            ...prevState.filters,
                            status: { value: option?.value || '', matchMode: 'equals' },
                          },
                        }))
                      }
                      isClearable
                      placeholder={translate('orders.view.table.filters.status')}
                      styles={{
                        control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                        option: (base) => ({ ...base, fontSize: '0.75rem' })
                      }}
                    />
                  </div>
                </TableHead>
              )}

              {visibleColumns.orderSource && (
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>{translate('orders.view.table.fields.source')}</div>
                    <Select
                      value={orderSources?.map((source) => ({ label: source, value: source })).find(opt => opt.value === lazyState.filters.orderSource?.value) || null}
                      options={orderSources?.map((source) => ({ label: source, value: source }))}
                      onChange={(option) =>
                        setLazyState((prevState) => ({
                          ...prevState,
                          filters: {
                            ...prevState.filters,
                            orderSource: { value: option?.value || '', matchMode: 'equals' },
                          },
                        }))
                      }
                      isClearable
                      placeholder={translate('orders.view.table.filters.source')}
                      styles={{
                        control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                        option: (base) => ({ ...base, fontSize: '0.75rem' })
                      }}
                    />
                  </div>
                </TableHead>
              )}

              {visibleColumns.orderTable && (
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>{translate('orders.view.table.fields.tables')}</div>
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

              {visibleColumns.customerEmail && (
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>{translate('orders.view.table.fields.customerEmail')}</div>
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

              {visibleColumns.customerPhone && (
                <TableHead className="text-xs">
                  <div className="space-y-1">
                    <div>{translate('orders.view.table.fields.customerPhone')}</div>
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
                <TableHead className="text-xs">
                  {translate('orders.view.table.fields.discount')}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-xs py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : orderList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-xs py-8">
                  {translate('orders.view.table.emptyMessage')}
                </TableCell>
              </TableRow>
            ) : (
              orderList.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/order/${order.id}`)}
                >
                  {visibleColumns.orderId && (
                    <TableCell className="text-xs">
                      <Link to={`/order/${order.id}`} onClick={(e) => e.stopPropagation()}>
                        {order.sequenceNumber}
                      </Link>
                    </TableCell>
                  )}

                  {visibleColumns.orderBranch && (
                    <TableCell className="text-xs">
                      {getBranchName(order.branchId)}
                    </TableCell>
                  )}

                  {visibleColumns.OrderDate && (
                    <TableCell className="text-xs">
                      {format(new Date(order.createdDate), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                  )}

                  {visibleColumns.orderStatus && (
                    <TableCell className="text-xs">
                      {order.processingStatus}
                    </TableCell>
                  )}

                  {visibleColumns.orderSource && (
                    <TableCell className="text-xs">
                      {order.sourceApp?.type}
                    </TableCell>
                  )}

                  {visibleColumns.orderTable && (
                    <TableCell className="text-xs">
                      {order.tables}
                    </TableCell>
                  )}

                  {visibleColumns.customerEmail && (
                    <TableCell className="text-xs">
                      {order.customer?.email}
                    </TableCell>
                  )}

                  {visibleColumns.customerPhone && (
                    <TableCell className="text-xs">
                      {order.customer?.phone}
                    </TableCell>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-muted-foreground">
            Showing {orderList.length === 0 ? 0 : lazyState.first + 1} to {Math.min(lazyState.first + lazyState.rows, totalOrders)} of {totalOrders} orders
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={{ label: `${lazyState.rows} per page`, value: lazyState.rows }}
              options={[10, 20, 30, 40, 50, 100, 200].map(val => ({ label: `${val} per page`, value: val }))}
              onChange={(option) => setLazyState(prev => ({ ...prev, rows: option.value, first: 0, page: 0 }))}
              styles={{
                control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem', minWidth: '120px' }),
                option: (base) => ({ ...base, fontSize: '0.75rem' })
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setLazyState(prev => ({ ...prev, first: Math.max(0, prev.first - prev.rows), page: Math.max(0, prev.page - 1) }))}
              disabled={lazyState.first === 0}
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              Previous
            </Button>
            <span className="text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setLazyState(prev => ({ ...prev, first: prev.first + prev.rows, page: prev.page + 1 }))}
              disabled={lazyState.first + lazyState.rows >= totalOrders}
            >
              Next
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Order;
