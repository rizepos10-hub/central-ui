import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeDeliveryStatus, changeProcessingStatus, createBill, createDraftBill, addPaymentToBill, getEntity, refundBill } from './order.reducer';
import { ArrowLeft, Loader2, RefreshCcw, BanknoteArrowDown, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Select from 'app/shared/components/select/select';
import OrderedItems from './ordered-items';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { PaymentStatus } from 'app/shared/model/ENUMS/payment-status.model';
import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { IBill } from 'app/shared/model/ORDER/bill.model';
import { TransactionMethodEnum } from 'app/shared/model/service-charge.model';
import { changeEntityField as changeBillEntityField, reset } from '../bill/bill.reducer';
import { DeliverStatus } from 'app/shared/model/ENUMS/delivery-status.model';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-toastify';
import { Storage } from 'react-jhipster';
import { assignDriver, cancelBooking, createBooking, getActiveProviders, getTookanAgents, getTookanTeams, syncBooking, updateBooking } from './delivery.reducer';
import { toLocalISOString } from 'app/shared/util/date-utils';
import { getEntity as getUiSettings } from 'app/entities/online-ordering/settings/settings.reducer';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { buildAuthTokenKey } from 'app/shared/util/tenant-utils';

// eslint-disable-next-line complexity
export const OrderDetail = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const billPrintRef = useRef(null);
  const pagePrintRef = useRef(null);

  const { id } = useParams<'id'>();
  const orderEntity: IOrder = useAppSelector(state => state.order.entity);
  const loading = useAppSelector(state => state.order.loading);
  const billEntity: IBill = useAppSelector(state => state.bill.entity);
  const UiSettingsEntity: IUiSettings = useAppSelector(state => state.uiSettings.entity);
  const activeProviders: Array<'ICABBI' | 'TOOKAN'> = useAppSelector(state => state.delivery.activeProviders || []);
  const tookanTeams = useAppSelector(state => state.delivery.teams || []);
  const tookanAgents = useAppSelector(state => state.delivery.agents || []);

  const filteredOrderEntity = {
    ...orderEntity,
    items: orderEntity.items && Array.isArray(orderEntity.items) ? orderEntity.items.filter(item => item.archived !== true) : [],
  };

  const [dataTableValues, setDataTableValues] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [refundMode, setRefundMode] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(filteredOrderEntity.processingStatus);
  
  const getCurrentAuthToken = () => {
    const tokenKey = buildAuthTokenKey();
    return Storage.local.get(tokenKey) || Storage.session.get(tokenKey);
  };
  const [deliveryStatus, setDeliveryStatus] = useState(filteredOrderEntity.deliveryStatus);
  const [processStatusTipAmount, setProcessStatusTipAmount] = useState(0);
  const [rowClick, setRowClick] = useState(true);
  const [showPrintableBillDialog, setShowPrintableBillDialog] = useState(false);
  const [deliveryDateTime, setDeliveryDateTime] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'ICABBI' | 'TOOKAN' | undefined>(undefined);
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);
  const [selectedDriverId, setSelectedDriverId] = useState<string | undefined>(undefined);

  const [activeIndexes, setActiveIndexes] = useState<string[]>([]);

  // AlertDialog states
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [showProcessingConfirm, setShowProcessingConfirm] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [showCancelBookingConfirm, setShowCancelBookingConfirm] = useState(false);
  const [pendingProcessingStatus, setPendingProcessingStatus] = useState<OrderStatus | null>(null);
  const [pendingDeliveryStatus, setPendingDeliveryStatus] = useState<DeliverStatus | null>(null);

  // Refund dialog states
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedBillForRefund, setSelectedBillForRefund] = useState<IBill | null>(null);

  // Payment dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<IBill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentTipAmount, setPaymentTipAmount] = useState<number>(0);
  const [paymentTransactionMethod, setPaymentTransactionMethod] = useState<string>(TransactionMethodEnum.cash);
  const [pendingBillCreation, setPendingBillCreation] = useState(false);

  const toDateTimeLocal = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const toServerDateTime = (value?: string) => {
    if (!value) return null;
    return toLocalISOString(new Date(value));
  };

  const getApiErrorMessage = (error: any, fallback: string) => {
    const data = error?.response?.data;
    return (
      data?.message ||
      data?.localizedMessage ||
      data?.detail ||
      data?.title ||
      error?.message ||
      fallback
    );
  };

  useEffect(() => {
    const delivery = orderEntity.orderDeliveryDetails?.date || orderEntity.orderDeliveryDetails?.pickupDate;
    setDeliveryDateTime(toDateTimeLocal(delivery));
    if (orderEntity.orderDeliveryDetails?.deliveryProvider) {
      setSelectedProvider(orderEntity.orderDeliveryDetails.deliveryProvider);
    }
  }, [orderEntity.orderDeliveryDetails?.date, orderEntity.orderDeliveryDetails?.pickupDate, orderEntity.orderDeliveryDetails?.deliveryProvider]);

  useEffect(() => {
    if (orderEntity?.id && !orderEntity.orderDeliveryDetails) {
      dispatch(getActiveProviders(orderEntity.id));
    }
  }, [dispatch, orderEntity?.id, orderEntity.orderDeliveryDetails]);

  useEffect(() => {
    if (!orderEntity.orderDeliveryDetails && activeProviders.length === 1) {
      setSelectedProvider(activeProviders[0]);
    }
  }, [activeProviders, orderEntity.orderDeliveryDetails]);

  const isTookanBooking = orderEntity.orderDeliveryDetails?.deliveryProvider === 'TOOKAN';

  useEffect(() => {
    if (!isTookanBooking) {
      setSelectedTeamId(undefined);
      setSelectedDriverId(undefined);
      return;
    }
    setSelectedTeamId(orderEntity.orderDeliveryDetails?.integrationDetails?.teamId || undefined);
    setSelectedDriverId(orderEntity.orderDeliveryDetails?.integrationDetails?.fleetId || undefined);
  }, [
    isTookanBooking,
    orderEntity.orderDeliveryDetails?.integrationDetails?.teamId,
    orderEntity.orderDeliveryDetails?.integrationDetails?.fleetId,
  ]);

  const selectedTeamAgents = selectedTeamId
    ? tookanAgents.filter(agent => String(agent.team_id) === selectedTeamId)
    : [];

  useEffect(() => {
    if (isTookanBooking && orderEntity.branchId) {
      dispatch(getTookanTeams(orderEntity.branchId));
    }
  }, [dispatch, isTookanBooking, orderEntity.branchId]);

  useEffect(() => {
    if (isTookanBooking && orderEntity.branchId && selectedTeamId) {
      dispatch(getTookanAgents({ branchId: orderEntity.branchId, teamId: Number(selectedTeamId) }));
    }
  }, [dispatch, isTookanBooking, orderEntity.branchId, selectedTeamId]);

  const openAllAccordions = () => {
    return new Promise(resolve => {
      setActiveIndexes(filteredOrderEntity?.bills?.map((_, index) => index.toString()) || []);
      setTimeout(resolve, 0); // Resolve immediately after the current call stack clears
    });
  };

  const openOneAccordion = (index: number) => {
    return new Promise(resolve => {
      setActiveIndexes([index.toString()]);
      setTimeout(resolve, 0); // Resolve immediately after the current call stack clears
    });
  }

  useEffect(() => {
    dispatch(getEntity(id));
    dispatch(getUiSettings())
  }, []);


  useEffect(() => {
    const newDataTableValues = [];
    filteredOrderEntity?.items?.forEach((item) => {
      newDataTableValues.push({
        id: item.id,
        itemName: item.itemName,
        amount: item.amount,
        price: item.price,
        taxIdsToValues: item.taxIdsToValues,
        discount: item.discount,
        taxValue: item.taxValue,
        isAddon: false,
        total: item.total?.toFixed(2),
      });
      item.addons.forEach((addon) => {
        newDataTableValues.push({
          id: addon.id,
          itemName: addon.name,
          amount: addon.amount,
          price: addon.price,
          taxIdsToValues: addon.taxIdsToValues,
          discount: addon.discount,
          taxValue: addon.taxValue,
          isAddon: true,
          total: addon.total?.toFixed(2),
        });
      });
    });
    setDataTableValues(newDataTableValues);
  }, [orderEntity])

  const changePaymentStatusConfirm = () => {
    setShowPaymentConfirm(true);
  };

  const acceptPaymentStatusConfirm = () => {
    dispatch(createBill({
      id: filteredOrderEntity.id,
      tipAmount: processStatusTipAmount
    }));
    setShowPaymentConfirm(false);
  };

  const handleCreateDraftBill = () => {
    dispatch(createDraftBill({
      orderId: filteredOrderEntity.id,
      payee: null,
      createdBy: null,
      discount: null
    }));
  };

  const openPaymentDialog = (bill: IBill) => {
    setSelectedBillForPayment(bill);
    // Calculate remaining balance
    const totalPaid = bill.paymentTransactions?.reduce((sum, txn) => sum + (txn.amount || 0), 0) || 0;
    const remaining = (bill.total || 0) - totalPaid;
    setPaymentAmount(Math.max(0, remaining));
    setPaymentTipAmount(0);
    setPaymentTransactionMethod(TransactionMethodEnum.cash);
    setShowPaymentDialog(true);
  };

  const handleOpenPaymentDialogOrCreateBill = async () => {
    // Check if order has any bills
    const hasBills = filteredOrderEntity?.bills && filteredOrderEntity.bills.length > 0;
    
    if (!hasBills) {
      // Create draft bill first, then open payment dialog
      try {
        setPendingBillCreation(true);
        await dispatch(createDraftBill({
          orderId: filteredOrderEntity.id,
          payee: null,
          createdBy: null,
          discount: null
        })).unwrap();
        // The useEffect will handle opening the payment dialog when the bill is created
      } catch (error) {
        setPendingBillCreation(false);
        toast.error('Failed to create draft bill');
      }
    } else {
      // Find the first draft bill, or use the first bill
      const draftBill = filteredOrderEntity.bills.find(bill => bill.status === 'DRAFT');
      const billToUse = draftBill || filteredOrderEntity.bills[0];
      if (billToUse) {
        openPaymentDialog(billToUse);
      }
    }
  };

  const handleAddPayment = () => {
    if (!selectedBillForPayment) return;
    
    dispatch(addPaymentToBill({
      orderId: filteredOrderEntity.id,
      billId: selectedBillForPayment.id,
      amount: paymentAmount,
      tipAmount: paymentTipAmount,
      transactionMethod: paymentTransactionMethod
    }));
    
    setShowPaymentDialog(false);
    setSelectedBillForPayment(null);
    setPaymentAmount(0);
    setPaymentTipAmount(0);
    setPaymentTransactionMethod(TransactionMethodEnum.cash);
  };

  const changeProcessingStatusConfirm = (status: OrderStatus) => {
    setPendingProcessingStatus(status);
    setShowProcessingConfirm(true);
  };

  const rejectProcessingStatusConfirm = () => {
    setProcessingStatus(filteredOrderEntity.processingStatus);
    setShowProcessingConfirm(false);
    setPendingProcessingStatus(null);
  };

  const acceptProcessingStatusConfirm = () => {
    const status = pendingProcessingStatus || processingStatus;
    dispatch(changeProcessingStatus({
      id: filteredOrderEntity.id,
      orderProcessingStatus: status,
    })).then(res => {
      // @ts-expect-error -- unknown type
      if (res?.error?.status as unknown !== 200) {
        setProcessingStatus(filteredOrderEntity.processingStatus)
      }
    });
    setShowProcessingConfirm(false);
    setPendingProcessingStatus(null);
  };

  const changeDeliveryStatusConfirm = (status: DeliverStatus) => {
    setPendingDeliveryStatus(status);
    setShowDeliveryConfirm(true);
  };

  const rejectDeliveryStatusConfirm = () => {
    setDeliveryStatus(filteredOrderEntity.deliveryStatus);
    setShowDeliveryConfirm(false);
    setPendingDeliveryStatus(null);
  };

  const acceptDeliveryStatusConfirm = () => {
    const status = pendingDeliveryStatus || deliveryStatus;
    dispatch(changeDeliveryStatus({
      id: filteredOrderEntity.id,
      deliveryStatus: status,
    })).then(res => {
      // @ts-expect-error -- unknown type
      if (res?.error?.status as unknown !== 200) {
        setDeliveryStatus(filteredOrderEntity.deliveryStatus)
      }
    });
    setShowDeliveryConfirm(false);
    setPendingDeliveryStatus(null);
  };

  useEffect(() => {
    setProcessingStatus(filteredOrderEntity.processingStatus);
  }, [filteredOrderEntity.processingStatus])

  useEffect(() => {
    setDeliveryStatus(filteredOrderEntity.deliveryStatus);
  }, [filteredOrderEntity.deliveryStatus])

  // Auto-open payment dialog when draft bill is created
  useEffect(() => {
    if (pendingBillCreation && filteredOrderEntity?.bills && filteredOrderEntity.bills.length > 0) {
      const draftBill = filteredOrderEntity.bills.find(bill => bill.status === 'DRAFT');
      const billToUse = draftBill || filteredOrderEntity.bills[0];
      if (billToUse) {
        setPendingBillCreation(false);
        openPaymentDialog(billToUse);
      }
    }
  }, [filteredOrderEntity?.bills, pendingBillCreation])

  const openRefundDialog = (bill: IBill) => {
    setSelectedBillForRefund(bill);
    dispatch(changeBillEntityField({ name: 'items', value: [] }));
    setShowRefundDialog(true);
  };

  const handleRefund = () => {
    if (!selectedBillForRefund) return;

    dispatch(refundBill({
      id: filteredOrderEntity.id,
      billId: selectedBillForRefund.id,
      items: billEntity.items,
      paymentType: selectedBillForRefund.paymentType,
      chargesShares: selectedBillForRefund.chargesShares,
    }));
    setShowRefundDialog(false);
    setSelectedBillForRefund(null);
  };

  const handleCancelBooking = () => {
    dispatch(cancelBooking(orderEntity));
    setShowCancelBookingConfirm(false);
  };

  const transformOrderForEdit = (order: IOrder): IOrder => {
    const transformedItems = order.items?.map((item, index) => {
      // Generate unique cartId for each item
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
      id: order.id,
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

  const handleEditOrder = () => {
    const transformedOrder = transformOrderForEdit(filteredOrderEntity);
    navigate('/order/create', {
      state: {
        editOrder: transformedOrder,
        orderId: filteredOrderEntity.id,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-lg font-semibold">
          #{orderEntity?.sequenceNumber} - <span className="font-normal text-muted-foreground">{orderEntity?.customer?.firstName} {orderEntity?.customer?.lastName}</span>
          <span className="font-normal text-muted-foreground"> on {filteredOrderEntity.createdDate ? formatDateForDisplay(filteredOrderEntity.createdDate, 'MMM dd, yyyy') : ''}</span>
        </h1>
      </div>
      <div ref={pagePrintRef}>
        <style>
          {`
          @media print {
            body,
              html {
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden;
                box-sizing: border-box;
              }
          }
        `}
        </style>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Order Details */}
            <div className="lg:col-span-8">
              <Card className={editMode ? 'opacity-50' : ''}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      Order Details
                      {orderEntity?.refund && <span className="text-orange-600">(Refund)</span>}
                    </span>
                    <span>
                      {orderEntity?.refund && (
                        <BanknoteArrowDown  className="h-7 w-7 text-orange-600" />
                      )}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium">Items</span>
                    {!editMode && !orderEntity?.refund && orderEntity?.processingStatus !== OrderStatus.REJECTED && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditOrder}
                        className="h-8 text-xs"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit Order
                      </Button>
                    )}
                  </div>
                  {dataTableValues && dataTableValues.length > 0 && (
                    <OrderedItems dataTableValues={dataTableValues} />
                  )}
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm font-bold">
                  <div className="w-full flex justify-between items-center">
                    <span>Items:</span>
                    <span className="text-green-600">+ {orderEntity?.itemsTotal?.toFixed(2)}</span>
                  </div>
                  <div className="w-full flex justify-between items-center">
                    <span>Addons:</span>
                    <span className="text-green-600">+ {orderEntity?.addonsTotal?.toFixed(2)}</span>
                  </div>
                  <div className="w-full flex justify-between items-center">
                    <span>Service Charges:</span>
                    <span className="text-green-600">+ {orderEntity?.orderCharges?.reduce((acc, charge) => acc + charge?.amount, 0).toFixed(2)}</span>
                  </div>
                  <div className="w-full flex justify-between items-center">
                    <span>Taxes:</span>
                    <span className="text-green-600">+ {orderEntity?.totalTaxes?.toFixed(2)}</span>
                  </div>
                  <div className="w-full flex justify-between items-center">
                    <span>Total Tip:</span>
                    <span className="text-green-600">+ {orderEntity?.totalTip?.toFixed(2)}</span>
                  </div>
                  <div className="w-full flex justify-between items-center">
                    <span>Discount:</span>
                    <span className="text-red-600">- {orderEntity?.totalDiscount}</span>
                  </div>
                  <div className="w-full flex justify-between items-center">
                    <span>Total:</span>
                    <span>{orderEntity?.total?.toFixed(2)}</span>
                  </div>
                </CardFooter>
              </Card>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-4 overflow-auto">
              <Card id="orderStatus">
                <CardHeader>
                  <CardTitle>Order status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <label className="font-medium">Order time:</label>
                      <span>
                        {filteredOrderEntity.createdDate ? formatDateForDisplay(filteredOrderEntity.createdDate, 'MMM dd, yyyy') : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="font-medium">Payment Status:</label>
                      {filteredOrderEntity.paymentStatus === PaymentStatus.PAID ? (
                        <Badge variant="default" className="bg-green-500">
                          {filteredOrderEntity.paymentStatus}
                        </Badge>
                      ) : (
                        editMode ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2 items-end">
                              <div className="flex flex-col gap-1">
                                <label className="font-semibold text-xs">Tip Amount</label>
                                <Input
                                  type="number"
                                  value={processStatusTipAmount}
                                  onChange={(e) => setProcessStatusTipAmount(Number(e.target.value))}
                                  min={0}
                                  step={0.01}
                                  className="h-8 text-xs w-24"
                                />
                              </div>
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  changePaymentStatusConfirm();
                                }}
                                className="h-8 text-xs"
                              >
                                Pay Now
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              onClick={handleOpenPaymentDialogOrCreateBill}
                              className="h-8 text-xs"
                            >
                              Add Payment
                            </Button>
                          </div>
                        ) : (
                          <Badge
                            variant="destructive"
                            className={editMode ? 'cursor-pointer' : ''}
                          >
                            {filteredOrderEntity.paymentStatus}
                          </Badge>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="font-medium">Processing Status:</label>
                      {editMode && processingStatus ? (
                        <Select
                          options={Object.values(OrderStatus).map(status => ({
                            label: status,
                            value: status,
                          }))}
                          value={{ label: processingStatus, value: processingStatus }}
                          onChange={(option) => {
                            setProcessingStatus(option.value);
                            changeProcessingStatusConfirm(option.value);
                          }}
                          placeholder="Select a status"
                          className="w-40"
                        />
                      ) : (
                        <span>{filteredOrderEntity.processingStatus}</span>
                      )}
                    </div>
                    {orderEntity?.deliveryStatus != null && (
                      <div className="flex items-center gap-2">
                        <label className="font-medium">Delivery Status:</label>
                        {editMode && deliveryStatus ? (
                          <Select
                            options={Object.values(DeliverStatus).map(status => ({
                              label: status,
                              value: status,
                            }))}
                            value={{ label: deliveryStatus, value: deliveryStatus }}
                            onChange={(option) => {
                              setDeliveryStatus(option.value);
                              changeDeliveryStatusConfirm(option.value);
                            }}
                            placeholder="Select a status"
                            className="w-40"
                          />
                        ) : (
                          <span>{filteredOrderEntity.deliveryStatus}</span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Link to={`/order/${filteredOrderEntity.id}/print?dataTableValues=${JSON.stringify(dataTableValues)}`}>
                        <Button variant="link" className="h-8 text-xs p-0">
                          Print
                        </Button>
                      </Link>
                      {!orderEntity?.refund && orderEntity?.processingStatus !== OrderStatus.REJECTED && (
                        <Button
                          variant="secondary"
                          onClick={() => setEditMode(prev => !prev)}
                          className="h-8 text-xs"
                        >
                          {editMode ? 'View' : 'Edit'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {(UiSettingsEntity.orderConfirmation && orderEntity.processingStatus === OrderStatus.DRAFT) && (
                <Card className={editMode ? 'opacity-50' : ''}>
                  <CardHeader>
                    <CardTitle>Confirm Order</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button onClick={() => changeProcessingStatusConfirm(OrderStatus.CONFIRMED)} className="h-8 text-xs">
                        Confirm
                      </Button>
                      <Button variant="destructive" onClick={() => changeProcessingStatusConfirm(OrderStatus.REJECTED)} className="h-8 text-xs">
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card id="customer" className={editMode ? 'opacity-50' : ''}>
                <CardHeader>
                  <CardTitle>Customer</CardTitle>
                </CardHeader>
                <CardContent className="text-xs">
                  {filteredOrderEntity.customer ? (
                    <div className="flex flex-col gap-2">
                      <div>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 text-xs font-normal text-left justify-start"
                          onClick={() => navigate(`/customer/${filteredOrderEntity.customer.id}/edit?page=1&sort=id,asc`)}
                        >
                          Name: {filteredOrderEntity.customer.firstName + ' ' + filteredOrderEntity.customer.lastName}
                        </Button>
                      </div>
                      {filteredOrderEntity.customer.email && (
                        <div>E-mail: {filteredOrderEntity.customer.email}</div>
                      )}
                      {filteredOrderEntity.customer.phone && (
                        <div>Phone: {filteredOrderEntity.customer.phone}</div>
                      )}
                    </div>
                  ) : (
                    <p>No customer found</p>
                  )}
                </CardContent>
              </Card>
              {filteredOrderEntity?.deliverTo && (
                <Card className={editMode ? 'opacity-50' : ''}>
                  <CardHeader>
                    <CardTitle>Deliver To</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs">
                    <div className="flex flex-col gap-2">
                      {filteredOrderEntity.deliverTo.address && (
                        <div>Address: {filteredOrderEntity.deliverTo.address}</div>
                      )}
                      {filteredOrderEntity.deliverTo.addressType && (
                        <div>Address Type: {filteredOrderEntity.deliverTo.addressType}</div>
                      )}
                      {filteredOrderEntity.deliverTo.contactPersonName && (
                        <div>Contact Person Name: {filteredOrderEntity.deliverTo.contactPersonName}</div>
                      )}
                      {filteredOrderEntity.deliverTo.phoneNumber && (
                        <div>Phone Number: {filteredOrderEntity.deliverTo.phoneNumber}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              {orderEntity.orderDeliveryDetails && (
                <Card id="deliveryDetails" className={editMode ? 'opacity-50' : ''}>
                  <CardHeader>
                    <CardTitle>Delivery Details</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs">
                    <div className="flex flex-col gap-2">
                      <div>{formatDateForDisplay(orderEntity.orderDeliveryDetails?.date)}</div>
                      <div>{orderEntity.orderDeliveryDetails?.driverInformation?.name}</div>
                      <div>{orderEntity.orderDeliveryDetails?.driverInformation?.phone}</div>
                      <div>
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={orderEntity.orderDeliveryDetails?.driverInformation?.trackOrderUrl}
                          className="text-blue-600 hover:underline"
                        >
                          {orderEntity.orderDeliveryDetails?.driverInformation?.trackOrderUrl}
                        </a>
                      </div>
                      <div>
                        Expected Arrival At: {formatDateForDisplay(orderEntity.orderDeliveryDetails?.expectedArrivalAt)}
                      </div>
                      <div>
                        {orderEntity.orderDeliveryDetails?.integrationDetails?.provider}
                        {orderEntity.orderDeliveryDetails?.integrationDetails?.tripId ? `, Trip: ${orderEntity.orderDeliveryDetails.integrationDetails.tripId}` : ''}
                        {orderEntity.orderDeliveryDetails?.integrationDetails?.jobId ? `, Job: ${orderEntity.orderDeliveryDetails.integrationDetails.jobId}` : ''}
                        {orderEntity.orderDeliveryDetails?.integrationDetails?.jobToken ? `, Token: ${orderEntity.orderDeliveryDetails.integrationDetails.jobToken}` : ''}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {!orderEntity?.refund && (
                !orderEntity.orderDeliveryDetails ? (
                  <Card id="booking" className={editMode ? 'opacity-50' : ''}>
                    <CardHeader>
                      <CardTitle>Create Booking</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 text-xs">
                      {activeProviders.length > 1 && (
                        <div className="flex flex-col gap-1">
                          <label className="font-medium">Provider</label>
                          <Select
                            options={activeProviders.map(provider => ({
                              label: provider,
                              value: provider,
                            }))}
                            value={selectedProvider ? { label: selectedProvider, value: selectedProvider } : null}
                            onChange={(option: any) => setSelectedProvider(option?.value)}
                            placeholder="Select provider"
                          />
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <label className="font-medium">Delivery Time</label>
                        <Input type="datetime-local" value={deliveryDateTime} onChange={e => setDeliveryDateTime(e.target.value)} className="h-8 text-xs" />
                      </div>
                      <Button
                        type="button"
                        className="h-8 text-xs"
                        disabled={!deliveryDateTime || (activeProviders.length > 1 && !selectedProvider)}
                        onClick={() => {
                          dispatch(createBooking({
                            orderId: orderEntity.id || '',
                            date: toServerDateTime(deliveryDateTime),
                            provider: selectedProvider,
                          }))
                        }}
                      >
                        Create
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                <Card id="booking" className={editMode ? 'opacity-50' : ''}>
                  <CardHeader>
                    <CardTitle>Update Booking</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="font-medium">Delivery Time</label>
                      <Input type="datetime-local" value={deliveryDateTime} onChange={e => setDeliveryDateTime(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setShowCancelBookingConfirm(true)}
                      >
                        Cancel Booking
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => dispatch(syncBooking(orderEntity.id || ''))}
                      >
                        Sync
                      </Button>
                      <Button
                        type="button"
                        className="h-8 text-xs"
                        disabled={!deliveryDateTime}
                        onClick={() => {
                          dispatch(updateBooking({
                            orderId: orderEntity.id || '',
                            date: toServerDateTime(deliveryDateTime),
                          }))
                        }}
                      >
                        Update
                      </Button>
                    </div>
                    {isTookanBooking && (
                      <div className="border rounded-md p-2 flex flex-col gap-2">
                        <label className="font-medium">Assign Tookan Driver</label>
                        <Select
                          options={tookanTeams.map(team => ({
                            label: team.team_name || `Team ${team.team_id}`,
                            value: String(team.team_id),
                          }))}
                          value={selectedTeamId ? {
                            label: tookanTeams.find(team => String(team.team_id) === selectedTeamId)?.team_name || `Team ${selectedTeamId}`,
                            value: selectedTeamId,
                          } : null}
                          onChange={(option: any) => {
                            setSelectedTeamId(option?.value);
                            setSelectedDriverId(undefined);
                          }}
                          placeholder="Select team"
                        />
                        <Select
                          options={selectedTeamAgents.map(agent => ({
                            label: agent.name || agent.username || `Fleet ${agent.fleet_id}`,
                            value: String(agent.fleet_id),
                          }))}
                          value={selectedDriverId ? {
                            label: selectedTeamAgents.find(agent => String(agent.fleet_id) === selectedDriverId)?.name || `Fleet ${selectedDriverId}`,
                            value: selectedDriverId,
                          } : null}
                          onChange={(option: any) => setSelectedDriverId(option?.value)}
                          placeholder={selectedTeamId ? 'Select driver' : 'Select team first'}
                        />
                        <Button
                          type="button"
                          className="h-8 text-xs"
                          disabled={!selectedTeamId || !selectedDriverId}
                          onClick={async () => {
                            if (!selectedTeamId || !selectedDriverId) {
                              return;
                            }
                            try {
                              await dispatch(assignDriver({
                                orderId: orderEntity.id || '',
                                driverId: selectedDriverId,
                                teamId: selectedTeamId,
                              })).unwrap();
                              toast.success('Driver assigned successfully.');
                            } catch (error: any) {
                              toast.error(getApiErrorMessage(error, 'Failed to assign driver.'));
                            }
                          }}
                        >
                          Assign Driver
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                )
              )}
            </div>
          </div>
          {orderEntity?.bills?.length > 0 && (
            <div className="w-full">
              <Card className={editMode ? 'opacity-50' : ''}>
                <CardHeader>
                  <CardTitle>Bills</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" value={activeIndexes} onValueChange={setActiveIndexes} className="w-full">

                    {filteredOrderEntity?.bills?.map((bill, idx) => {
                      const billStatus = String(bill.status);
                      const getBillStatusColor = (status: string) => {
                        switch (status) {
                          case 'PAID': return 'bg-green-100 text-green-800';
                          case 'REFUNDED': return 'bg-orange-100 text-orange-800';
                          case 'CANCELED': return 'bg-red-100 text-red-800';
                          case 'DRAFT': return 'bg-gray-100 text-gray-800';
                          default: return 'bg-blue-100 text-blue-800';
                        }
                      };

                      return (
                        <AccordionItem key={idx} value={idx.toString()} className="w-full border rounded-lg mb-2">
                          <AccordionTrigger className="hover:no-underline px-4">
                            <div className="flex justify-between items-center w-full pr-4">
                              <div className="flex items-center gap-4">
                                <span className="font-semibold text-sm">Bill #{bill.sequenceNumber}</span>
                                <Badge className={`${getBillStatusColor(billStatus)} text-xs`}>
                                  {billStatus}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-muted-foreground">
                                  {formatDateForDisplay(bill.dateTime, 'MMM d, yyyy HH:mm')}
                                </span>
                                <span className="font-semibold text-sm">${bill?.total?.toFixed(2)}</span>
                              </div>
                              <span id={`actionsTab-${idx}`} className="flex items-center justify-center gap-2">
                                <Link to={`/order/${filteredOrderEntity.id}/print/${bill.id}`}>
                                  <Button variant="link" className="h-8 text-xs p-0">
                                    Print
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  className="h-8 text-xs"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    fetch(`${SERVER_API_URL}/api/orders/${orderEntity.id}/send-invoice?billId=${bill.id}`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${getCurrentAuthToken()}`
                                      },
                                    })
                                      .then((response) => {
                                        if (!response.ok) {
                                          toast.error("An error occurred");
                                        } else {
                                          toast.success("Email resent successfully");
                                        }
                                      })
                                  }}
                                >
                                  Resend E-mail
                                </Button>

                                {!orderEntity?.refund && billStatus !== 'REFUNDED' && (
                                  <Button
                                    className="h-8 text-xs"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openRefundDialog(bill);
                                    }}
                                  >
                                    Refund
                                  </Button>
                                )}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-3">
                              {billStatus === 'DRAFT' && (() => {
                                const totalPaid = bill.paymentTransactions?.reduce((sum, txn) => sum + (txn.amount || 0), 0) || 0;
                                const remaining = (bill.total || 0) - totalPaid;
                                return (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs font-semibold text-blue-900">Remaining Balance</span>
                                      <span className="text-lg font-bold text-blue-900">${remaining.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-blue-700">
                                      <span>Bill Total: ${(bill.total || 0).toFixed(2)}</span>
                                      <span>Paid: ${totalPaid.toFixed(2)}</span>
                                    </div>
                                    <Button
                                      className="mt-3 h-8 text-xs w-full"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openPaymentDialog(bill);
                                      }}
                                    >
                                      Add Payment
                                    </Button>
                                  </div>
                                );
                              })()}
                              <div className="text-xs font-semibold text-muted-foreground mb-2">Payment Transactions</div>
                              {bill?.paymentTransactions?.length > 0 ? (
                                bill.paymentTransactions.map((transaction, txnIdx) => (
                                  <div key={transaction.id} className="bg-muted/30 rounded-lg p-4 border">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="font-semibold text-sm">Txn {txnIdx + 1}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {transaction.status}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">Amount</div>
                                        <div className="font-semibold text-sm">${transaction.amount?.toFixed(2)}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">Method</div>
                                        <div className="font-medium text-sm capitalize">{transaction.method?.name || ''.toLowerCase()}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">Type</div>
                                        <div className="font-medium text-sm capitalize">{String(transaction.type || '').toLowerCase()}</div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-muted-foreground text-center py-4">
                                  No payment transactions
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* AlertDialog for Payment Confirmation */}
      <AlertDialog open={showPaymentConfirm} onOpenChange={setShowPaymentConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={acceptPaymentStatusConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog for Processing Status Change */}
      <AlertDialog open={showProcessingConfirm} onOpenChange={setShowProcessingConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status to {pendingProcessingStatus}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={rejectProcessingStatusConfirm}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={acceptProcessingStatusConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog for Delivery Status Change */}
      <AlertDialog open={showDeliveryConfirm} onOpenChange={setShowDeliveryConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status to {pendingDeliveryStatus}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={rejectDeliveryStatusConfirm}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={acceptDeliveryStatusConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog for Cancel Booking */}
      <AlertDialog open={showCancelBookingConfirm} onOpenChange={setShowCancelBookingConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelBooking}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Refund Bill #{selectedBillForRefund?.sequenceNumber}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedBillForRefund && (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Select items to refund from this bill
                </div>
                <OrderedItems
                  dataTableValues={(() => {
                    const items = [];
                    selectedBillForRefund.billItems?.forEach((item) => {
                      items.push({
                        id: item.id,
                        itemName: item.itemName,
                        amount: item.amount,
                        price: item.price,
                        taxIdsToValues: item.taxIdsToValues,
                        discount: item.discount,
                        taxValue: item.taxValue,
                        isAddon: false,
                        total: item.total?.toFixed(2),
                      });
                      item.addons?.forEach((addon) => {
                        items.push({
                          id: addon.id,
                          itemName: addon.name,
                          amount: addon.amount,
                          price: addon.price,
                          taxIdsToValues: addon.taxIdsToValues,
                          discount: addon.discount,
                          taxValue: addon.taxValue,
                          isAddon: true,
                          total: addon.total?.toFixed(2),
                        });
                      });
                    });
                    return items;
                  })()}
                  rowClick={false}
                  entity={billEntity}
                  changeEntityField={changeBillEntityField}
                  refundMode={true}
                />
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRefundDialog(false);
                setSelectedBillForRefund(null);
              }}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefund}
              disabled={!billEntity.items || billEntity.items.length === 0}
              className="h-8 text-xs"
            >
              Apply Refund
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment to Bill #{selectedBillForPayment?.sequenceNumber}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedBillForPayment && (() => {
              const totalPaid = selectedBillForPayment.paymentTransactions?.reduce((sum, txn) => sum + (txn.amount || 0), 0) || 0;
              const remaining = (selectedBillForPayment.total || 0) - totalPaid;
              return (
                <>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Bill Total:</span>
                      <span className="font-semibold">${(selectedBillForPayment.total || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Total Paid:</span>
                      <span className="font-semibold">${totalPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold">Remaining:</span>
                      <span className="font-bold text-lg">${remaining.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Payment Amount</label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Math.max(0, Number(e.target.value)))}
                        min={0}
                        step={0.01}
                        max={remaining}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Tip Amount (Optional)</label>
                      <Input
                        type="number"
                        value={paymentTipAmount}
                        onChange={(e) => setPaymentTipAmount(Math.max(0, Number(e.target.value)))}
                        min={0}
                        step={0.01}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Payment Method</label>
                      <Select
                        options={Object.values(TransactionMethodEnum).map(method => ({
                          label: method.charAt(0).toUpperCase() + method.slice(1).replace(/([A-Z])/g, ' $1'),
                          value: method,
                        }))}
                        value={{ label: paymentTransactionMethod.charAt(0).toUpperCase() + paymentTransactionMethod.slice(1).replace(/([A-Z])/g, ' $1'), value: paymentTransactionMethod }}
                        onChange={(option) => setPaymentTransactionMethod(option.value)}
                        placeholder="Select payment method"
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentDialog(false);
                setSelectedBillForPayment(null);
                setPaymentAmount(0);
                setPaymentTipAmount(0);
                setPaymentTransactionMethod(TransactionMethodEnum.cash);
              }}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPayment}
              disabled={!selectedBillForPayment || paymentAmount <= 0}
              className="h-8 text-xs"
            >
              Add Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetail;
