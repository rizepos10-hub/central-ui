import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeDeliveryStatus, changeProcessingStatus, createBill, getEntity, refundBill } from './order.reducer';
import { ArrowLeft, Loader2, RefreshCcw } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import Select from 'react-select';
import OrderedItems from './ordered-items';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { PaymentStatus } from 'app/shared/model/ENUMS/payment-status.model';
import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { IBill } from 'app/shared/model/ORDER/bill.model';
import { changeEntityField as changeBillEntityField, reset } from '../bill/bill.reducer';
import { DeliverStatus } from 'app/shared/model/ENUMS/delivery-status.model';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-toastify';
import { Storage } from 'react-jhipster';
import { cancelBooking, createBooking, updateBooking } from './delivery.reducer';
import { toLocalISOString } from 'app/shared/util/date-utils';
import { getEntity as getUiSettings } from 'app/entities/online-ordering/settings/settings.reducer';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';

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

  const filteredOrderEntity = {
    ...orderEntity,
    items: orderEntity.items && Array.isArray(orderEntity.items) ? orderEntity.items.filter(item => item.archived !== true) : [],
  };

  const [dataTableValues, setDataTableValues] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [refundMode, setRefundMode] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(filteredOrderEntity.processingStatus);
  const [deliveryStatus, setDeliveryStatus] = useState(filteredOrderEntity.deliveryStatus);
  const [processStatusTipAmount, setProcessStatusTipAmount] = useState(0);
  const [rowClick, setRowClick] = useState(true);
  const [showPrintableBillDialog, setShowPrintableBillDialog] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);

  const [activeIndexes, setActiveIndexes] = useState<string[]>([]);

  // AlertDialog states
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [showProcessingConfirm, setShowProcessingConfirm] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [showCancelBookingConfirm, setShowCancelBookingConfirm] = useState(false);
  const [pendingProcessingStatus, setPendingProcessingStatus] = useState<OrderStatus | null>(null);
  const [pendingDeliveryStatus, setPendingDeliveryStatus] = useState<DeliverStatus | null>(null);

  useEffect(() => {
    if (orderEntity.orderDeliveryDetails) {
      setBookingDate(new Date(orderEntity.orderDeliveryDetails.pickupDate))
    }
  }, [orderEntity])

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

  const handleRefund = (bill: IBill) => {
    dispatch(refundBill({
      id: filteredOrderEntity.id,
      billId: bill.id,
      items: billEntity.items,
      paymentType: bill.paymentType,
      chargesShares: bill.chargesShares,
    }))
  }

  const handleCancelBooking = () => {
    dispatch(cancelBooking(orderEntity));
    setShowCancelBookingConfirm(false);
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
          <span className="font-normal text-muted-foreground"> on {filteredOrderEntity.createdDate ? new Date(filteredOrderEntity.createdDate).toDateString() : ''}</span>
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
                      {orderEntity?.refund && <span className="text-green-600">(Refunded)</span>}
                    </span>
                    <span>
                      {orderEntity?.refund && (
                        <RefreshCcw className="h-7 w-7 text-green-600" />
                      )}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                        {filteredOrderEntity.createdDate ? new Date(filteredOrderEntity.createdDate).toDateString() : ''}
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
                          styles={{
                            control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                            option: (base) => ({ ...base, fontSize: '0.75rem' }),
                          }}
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
                            styles={{
                              control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                              option: (base) => ({ ...base, fontSize: '0.75rem' }),
                            }}
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
                      <div>{new Date(orderEntity.orderDeliveryDetails?.date).toLocaleString()}</div>
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
                        Expected Arrival At: {new Date(orderEntity.orderDeliveryDetails?.expectedArrivalAt).toLocaleString()}
                      </div>
                      <div>
                        {orderEntity.orderDeliveryDetails?.integrationDetails?.provider}, {orderEntity.orderDeliveryDetails?.integrationDetails?.tripId}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!orderEntity.orderDeliveryDetails ? (
                <Card id="booking" className={editMode ? 'opacity-50' : ''}>
                  <CardHeader>
                    <CardTitle>Create Booking</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-8 text-xs justify-start">
                          {bookingDate ? format(bookingDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={bookingDate}
                          onSelect={setBookingDate}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      className="h-8 text-xs"
                      onClick={() => {
                        dispatch(createBooking({
                          date: bookingDate?.toISOString(),
                          orderId: orderEntity.id
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
                  <CardContent className="flex flex-col gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-8 text-xs justify-start">
                          {bookingDate ? format(bookingDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={bookingDate}
                          onSelect={setBookingDate}
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="flex justify-between gap-2">
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
                        className="h-8 text-xs"
                        onClick={() => {
                          dispatch(updateBooking({
                            date: toLocalISOString(bookingDate),
                            orderId: orderEntity.id
                          }))
                        }}
                      >
                        Update
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                      const newDataTableValues = [];
                      bill?.billItems?.forEach((item) => {
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
                        console.log(newDataTableValues, 'newDataTableValues')
                        item.addons?.forEach((addon) => {
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

                      return (
                        <AccordionItem key={idx} value={idx.toString()} className="w-full">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex justify-between items-center w-full pr-4 text-xs">
                              <span>{new Date(bill.dateTime).toDateString()}</span>
                              <span>{bill.status}</span>
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
                                        'Authorization': `Bearer ${Storage.local.get('jhi-authenticationToken')}`,
                                      },
                                    })
                                      .then((response) => {
                                        console.log(response)
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

                                {!orderEntity?.refund && (
                                  <>
                                    <Button
                                      className="h-8 text-xs"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setRefundMode(prev => !prev);
                                      }}
                                    >
                                      {refundMode ? 'Cancel' : 'Refund'}
                                    </Button>
                                    {refundMode && (
                                      <Button
                                        className="h-8 text-xs"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleRefund(bill)
                                        }}
                                      >
                                        Apply Refund
                                      </Button>
                                    )}
                                  </>
                                )}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <Card>
                              <CardContent className="pt-2">
                                <OrderedItems
                                  ref={billPrintRef}
                                  dataTableValues={newDataTableValues}
                                  rowClick={rowClick}
                                  entity={billEntity}
                                  changeEntityField={changeBillEntityField}
                                  refundMode={refundMode}
                                />
                              </CardContent>
                              <CardFooter className="text-sm font-bold px-5">
                                <div className="w-full flex justify-between items-center">
                                  <span>Total:</span>
                                  <span>{bill?.total?.toFixed(2)}</span>
                                </div>
                              </CardFooter>
                            </Card>
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
    </div>
  );
};

export default OrderDetail;
