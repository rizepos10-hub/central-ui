import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeProcessingStatus, createDraftBill, addPaymentToBill, getEntity, refundBill } from './order.reducer';
import { ArrowLeft, Loader2, BanknoteArrowDown, Pencil, Plus, Copy, CheckIcon, LoaderCircleIcon, LockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Select from 'app/shared/components/select/select';
import OrderedItems from './ordered-items';
import { IOrder, IOrderIntegrationTask, OrderIntegrationTaskDeliveryStatus } from 'app/shared/model/ORDER/order.model';
import { PaymentStatus } from 'app/shared/model/ENUMS/payment-status.model';
import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { IBill } from 'app/shared/model/ORDER/bill.model';
import { changeEntityField as changeBillEntityField } from '../bill/bill.reducer';
import { toast } from 'react-toastify';
import { Storage } from 'react-jhipster';
import { assignDriver, cancelBooking, createBooking, getTookanAgents, getTookanTeams, syncBooking, updateBooking } from './delivery.reducer';
import { toLocalISOString } from 'app/shared/util/date-utils';
import { getEntity as getUiSettings } from 'app/entities/online-ordering/settings/settings.reducer';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { formatSourceScopedIdentifier } from 'app/shared/util/order-identifier-utils';
import { buildAuthTokenKey } from 'app/shared/util/tenant-utils';
import { formatTransactionMethodLabel } from 'app/shared/util/payment-method-utils';
import OrderPaymentDialog from './order-payment-dialog';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { getEntitiesByType } from '../settings/branch-registry/branch-registry.reducer';
import { RegisterType } from 'app/shared/model/ENUMS/branch-registry-type';
import { IBranchRegistry } from 'app/shared/model/branch-registry.model';
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper';

type TaskStepperState = 'active' | 'completed' | 'inactive';
type DeliveryProgressTaskType = 'goingToRestaurant' | 'pickedUpPackage' | 'deliveredToCustomer';

const DELIVERY_PROGRESS_TASKS: Array<{
  taskType: DeliveryProgressTaskType;
  title: string;
  doneStatus: OrderIntegrationTaskDeliveryStatus;
}> = [
  {
    taskType: 'goingToRestaurant',
    title: 'Going To Restaurant',
    doneStatus: OrderIntegrationTaskDeliveryStatus.ARRIVED,
  },
  {
    taskType: 'pickedUpPackage',
    title: 'Picked Up Package',
    doneStatus: OrderIntegrationTaskDeliveryStatus.HANDED,
  },
  {
    taskType: 'deliveredToCustomer',
    title: 'Delivered To Customer',
    doneStatus: OrderIntegrationTaskDeliveryStatus.DELIVERED,
  },
];

const prettifyTaskType = (taskType?: string | null) => {
  if (!taskType) {
    return 'Unnamed Task';
  }

  return taskType
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
};

const formatTaskBadge = (status?: OrderIntegrationTaskDeliveryStatus | null) => {
  if (!status || status === OrderIntegrationTaskDeliveryStatus.CREATED) {
    return 'Pending';
  }

  return status;
};

const getTaskStepperState = (
  status?: OrderIntegrationTaskDeliveryStatus | null,
  doneStatus?: OrderIntegrationTaskDeliveryStatus
): TaskStepperState => {
  switch (status) {
    case doneStatus:
      return 'completed';
    case OrderIntegrationTaskDeliveryStatus.IN_DELIVERY:
    case OrderIntegrationTaskDeliveryStatus.ARRIVED:
    case OrderIntegrationTaskDeliveryStatus.HANDED:
      return 'active';
    case OrderIntegrationTaskDeliveryStatus.ACCEPTED:
    case OrderIntegrationTaskDeliveryStatus.CREATED:
    case OrderIntegrationTaskDeliveryStatus.FAILED:
    case OrderIntegrationTaskDeliveryStatus.CANCELLED:
    default:
      return 'inactive';
  }
};

const getTaskSupportText = (task: IOrderIntegrationTask, fallbackTitle?: string) => {
  if (task.jobDescription?.trim()) {
    return task.jobDescription.trim();
  }

  return `${fallbackTitle || prettifyTaskType(task.taskType)} task`;
};

const getTaskIcon = (state: TaskStepperState) => {
  if (state === 'completed') {
    return <CheckIcon className="size-4" />;
  }

  if (state === 'active') {
    return <LoaderCircleIcon className="size-4 animate-spin" />;
  }

  return <LockIcon className="size-4" />;
};

const getBadgeClasses = (state: TaskStepperState) => {
  switch (state) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';
    case 'active':
      return 'bg-sky-100 text-sky-700 hover:bg-sky-100';
    default:
      return 'border-slate-200 text-slate-500';
  }
};

const OrderProgressStepper = ({ tasks }: { tasks?: IOrderIntegrationTask[] | null }) => {
  const normalizedTasks = Array.isArray(tasks) ? tasks.filter(Boolean) : [];

  if (normalizedTasks.length === 0) {
    return null;
  }

  const stepTasks = DELIVERY_PROGRESS_TASKS.map(taskConfig => {
    const task = normalizedTasks.find(candidate => candidate?.taskType === taskConfig.taskType);
    const taskState = getTaskStepperState(task?.deliveryStatus, taskConfig.doneStatus);

    return {
      ...taskConfig,
      badgeText: formatTaskBadge(task?.deliveryStatus),
      supportText: task
        ? getTaskSupportText(task, taskConfig.title)
        : `${taskConfig.title} task`,
      taskState,
      task,
    };
  });

  const activeIndex = stepTasks.findIndex(task => task.taskState === 'active');
  const completedCount = stepTasks.filter(task => task.taskState === 'completed').length;
  const currentStep = activeIndex >= 0 ? activeIndex + 1 : Math.min(completedCount + 1, stepTasks.length);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Delivery Progress</h2>
          <p className="text-sm text-slate-500">Live delivery milestones from the provider integration.</p>
        </div>
      </div>

      <Stepper
        value={currentStep}
        indicators={{
          completed: <CheckIcon className="size-3.5" />,
          loading: <LoaderCircleIcon className="size-3.5 animate-spin" />,
        }}
        className="w-full space-y-4"
      >
        <StepperNav className="justify-center gap-3">
          {stepTasks.map((task, index) => {
            return (
              <StepperItem
                key={task.taskType}
                step={index + 1}
                state={task.taskState}
                className="relative flex-1 items-start"
              >
                <StepperTrigger
                  className="flex grow flex-col items-start justify-center gap-2.5"
                  asChild
                >
                  <StepperIndicator className="size-8 border-2 data-[state=inactive]:border-slate-200 data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-400 data-[state=completed]:bg-emerald-500 data-[state=completed]:text-white">
                    {getTaskIcon(task.taskState)}
                  </StepperIndicator>
                  <div className="flex flex-col items-start gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Step {index + 1}
                    </div>
                    <StepperTitle className="text-start text-sm font-semibold text-slate-900 group-data-[state=inactive]/step:text-slate-500">
                      {task.title}
                    </StepperTitle>
                    <div className="text-[11px] leading-relaxed text-slate-500">
                      {task.supportText}
                    </div>
                    <div>
                      <Badge
                        variant={task.taskState === 'inactive' ? 'outline' : 'secondary'}
                        className={getBadgeClasses(task.taskState)}
                      >
                        {task.badgeText}
                      </Badge>
                    </div>
                  </div>
                </StepperTrigger>

                {stepTasks.length > index + 1 && (
                  <StepperSeparator className="absolute inset-x-0 start-9 top-4 m-0 group-data-[orientation=horizontal]/stepper-nav:w-[calc(100%-2rem)] group-data-[orientation=horizontal]/stepper-nav:flex-none group-data-[state=completed]/step:bg-emerald-500" />
                )}
              </StepperItem>
            );
          })}
        </StepperNav>

        <StepperPanel className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          {stepTasks.map((task, index) => (
            <StepperContent
              key={`${task.taskType}-content`}
              value={index + 1}
              className="flex items-center justify-start"
            >
              {task.supportText}
            </StepperContent>
          ))}
        </StepperPanel>
      </Stepper>
    </div>
  );
};

// eslint-disable-next-line complexity
export const OrderDetail = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const pagePrintRef = useRef(null);

  const { id } = useParams<'id'>();
  const orderEntity: IOrder = useAppSelector(state => state.order.entity);
  const loading = useAppSelector(state => state.order.loading);
  const billEntity: IBill = useAppSelector(state => state.bill.entity);
  const UiSettingsEntity: IUiSettings = useAppSelector(state => state.uiSettings.entity);
  const tookanTeams = useAppSelector(state => state.delivery.teams || []);
  const tookanAgents = useAppSelector(state => state.delivery.agents || []);
  const branchRegistry: IBranchRegistry[] = useAppSelector(state => state.branchRegistry.entities);

  const filteredOrderEntity = {
    ...orderEntity,
    items: orderEntity.items && Array.isArray(orderEntity.items) ? orderEntity.items.filter(item => item.archived !== true) : [],
  };

  const [dataTableValues, setDataTableValues] = useState([]);
  
  const getCurrentAuthToken = () => {
    const tokenKey = buildAuthTokenKey();
    return Storage.local.get(tokenKey) || Storage.session.get(tokenKey);
  };
  const [deliveryDateTime, setDeliveryDateTime] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);
  const [selectedDriverId, setSelectedDriverId] = useState<string | undefined>(undefined);

  // AlertDialog states
  const [showProcessingConfirm, setShowProcessingConfirm] = useState(false);
  const [showCancelBookingConfirm, setShowCancelBookingConfirm] = useState(false);
  const [pendingProcessingStatus, setPendingProcessingStatus] = useState<OrderStatus | null>(null);

  // Refund dialog states
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedBillForRefund, setSelectedBillForRefund] = useState<IBill | null>(null);

  // Payment dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<IBill | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [hasLoadedInitialOrder, setHasLoadedInitialOrder] = useState(false);
  const orderProviderCode = orderEntity.orderDeliveryDetails?.deliveryProviderCode as 'ICABBI' | 'TOOKAN' | undefined;
  const canEditOrder = !orderEntity?.refund && orderEntity?.processingStatus !== OrderStatus.REJECTED;
  const canManageProcessingStatus = !orderEntity?.refund;
  const processingStatusOptions = Object.values(OrderStatus).map(status => ({
    label: status,
    value: status,
  }));

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
  }, [orderEntity.orderDeliveryDetails?.date, orderEntity.orderDeliveryDetails?.pickupDate]);

  const isTookanBooking = orderProviderCode === 'TOOKAN';

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
    if (isTookanBooking) {
      dispatch(getTookanTeams());
    }
  }, [dispatch, isTookanBooking]);

  useEffect(() => {
    if (isTookanBooking && selectedTeamId) {
      dispatch(getTookanAgents({ teamId: Number(selectedTeamId) }));
    }
  }, [dispatch, isTookanBooking, selectedTeamId]);

  useEffect(() => {
    setHasLoadedInitialOrder(false);
    dispatch(getEntity(id));
    dispatch(getUiSettings());
    dispatch(
      getEntitiesByType({
        type: RegisterType.ONLINE,
      })
    );
  }, [dispatch, id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const intervalId = window.setInterval(() => {
      dispatch(getEntity(id));
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [dispatch, id]);

  useEffect(() => {
    if (!loading && orderEntity?.id) {
      setHasLoadedInitialOrder(true);
    }
  }, [loading, orderEntity?.id]);


  useEffect(() => {
    const newDataTableValues = [];
    filteredOrderEntity?.items?.forEach((item) => {
      newDataTableValues.push({
        id: item.id,
        itemName: item.itemName,
        imageUrl: getOrderItemImageUrl(item),
        amount: item.amount,
        price: item.price,
        taxIdsToValues: item.taxIdsToValues,
        discount: item.discount,
        taxValue: item.taxValue,
        isAddon: false,
        total: item.total?.toFixed(2),
      });
      item.addons?.forEach((addon) => {
        newDataTableValues.push({
          id: addon.id,
          itemName: addon.name,
          imageUrl: getOrderItemImageUrl(addon),
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

  const openPaymentDialog = (bill: IBill) => {
    setSelectedBillForPayment(bill);
    setShowPaymentDialog(true);
  };

  const handleOpenPaymentDialogOrCreateBill = async () => {
    const hasBills = filteredOrderEntity?.bills && filteredOrderEntity.bills.length > 0;

    if (!hasBills) {
      try {
        const createdBillResponse = await dispatch(createDraftBill({
          orderId: filteredOrderEntity.id,
          payee: null,
          createdBy: null,
          discount: null
        })).unwrap();
        openPaymentDialog(createdBillResponse.data);
      } catch (error) {
        toast.error('Failed to create draft bill');
      }
    } else {
      const draftBill = filteredOrderEntity.bills.find(bill => bill.status === 'DRAFT');
      const billToUse = draftBill || filteredOrderEntity.bills[0];
      if (billToUse) {
        openPaymentDialog(billToUse);
      }
    }
  };

  const resetPaymentDialog = () => {
    setShowPaymentDialog(false);
    setSelectedBillForPayment(null);
    setPaymentSubmitting(false);
  };

  const handleAddPayment = async ({
    amount,
    tipAmount,
    loyaltyPointsToRedeem,
    transactionMethod,
  }: {
    amount: number;
    tipAmount: number;
    loyaltyPointsToRedeem?: number;
    transactionMethod: string;
  }) => {
    if (!selectedBillForPayment) return;

    try {
      setPaymentSubmitting(true);
      await dispatch(
        addPaymentToBill({
          orderId: filteredOrderEntity.id,
          billId: selectedBillForPayment.id,
          amount,
          tipAmount,
          loyaltyPointsToRedeem,
          transactionMethod,
        })
      ).unwrap();

      if (filteredOrderEntity.wholesale) {
        await dispatch(
          changeProcessingStatus({
            id: filteredOrderEntity.id,
            orderProcessingStatus: OrderStatus.CLOSED,
          })
        ).unwrap();
      }

      resetPaymentDialog();
    } catch (error) {
      setPaymentSubmitting(false);
      toast.error('Failed to add payment');
    }
  };

  const changeProcessingStatusConfirm = (status: OrderStatus) => {
    setPendingProcessingStatus(status);
    setShowProcessingConfirm(true);
  };

  const rejectProcessingStatusConfirm = () => {
    setShowProcessingConfirm(false);
    setPendingProcessingStatus(null);
  };

  const acceptProcessingStatusConfirm = () => {
    if (!pendingProcessingStatus) {
      return;
    }

    dispatch(changeProcessingStatus({
      id: filteredOrderEntity.id,
      orderProcessingStatus: pendingProcessingStatus,
    }));
    setShowProcessingConfirm(false);
    setPendingProcessingStatus(null);
  };

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

  const sendOrderEmail = async (url: string, successMessage: string, fallbackErrorMessage: string) => {
    try {
      const response = await fetch(`${SERVER_API_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getCurrentAuthToken()}`,
        },
      });

      if (!response.ok) {
        toast.error(fallbackErrorMessage);
        return;
      }

      toast.success(successMessage);
    } catch (error) {
      toast.error(fallbackErrorMessage);
    }
  };

  const handleSendReceiptEmail = () =>
    sendOrderEmail(`/api/orders/${orderEntity.id}/send-invoices`, 'Receipt emailed successfully', 'Failed to send receipt email');

  const handleSendBillEmail = (billId: string) =>
    sendOrderEmail(`/api/orders/${orderEntity.id}/send-invoice?billId=${billId}`, 'E-mail sent successfully', 'Failed to send bill e-mail');

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
    const matchingRegistry = branchRegistry.find(record => record.branch?.id === filteredOrderEntity.branchId);
    const search = new URLSearchParams();

    if (matchingRegistry?.id) {
      search.set('registerId', matchingRegistry.id);
    }

    if (filteredOrderEntity.wholesale) {
      search.set('mode', 'wholesale');
    }

    navigate(`/order/create${search.toString() ? `?${search.toString()}` : ''}`, {
      state: {
        editOrder: transformedOrder,
        orderId: filteredOrderEntity.id,
        isDraftEdit: filteredOrderEntity.processingStatus === OrderStatus.DRAFT,
      },
    });
  };

  const handleReorder = () => {
    const transformedOrder = transformOrderForEdit(filteredOrderEntity);
    const matchingRegistry = branchRegistry.find(record => record.branch?.id === filteredOrderEntity.branchId);
    const search = new URLSearchParams();

    if (matchingRegistry?.id) {
      search.set('registerId', matchingRegistry.id);
    }

    if (filteredOrderEntity.wholesale) {
      search.set('mode', 'wholesale');
    }

    navigate(`/order/create${search.toString() ? `?${search.toString()}` : ''}`, {
      state: {
        prefillOrder: transformedOrder,
      },
    });
  };

  const customerFullName = [filteredOrderEntity?.customer?.firstName, filteredOrderEntity?.customer?.lastName].filter(Boolean).join(' ');
  const reorderActionLabel = filteredOrderEntity?.processingStatus === OrderStatus.DRAFT ? 'Clone' : 'Re-order';
  const formatStatusLabel = (value?: string | null) =>
    value
      ? value
          .toLowerCase()
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : '-';
  const orderCreatedOn = filteredOrderEntity.createdDate ? formatDateForDisplay(filteredOrderEntity.createdDate, 'MMM dd, yyyy') : '';
  const orderCreatedAt = filteredOrderEntity.createdDate ? formatDateForDisplay(filteredOrderEntity.createdDate, 'MMM dd, yyyy HH:mm') : '';
  const paymentStatusIsPaid = filteredOrderEntity.paymentStatus === PaymentStatus.PAID;
  const orderChargesTotal = orderEntity?.orderCharges?.reduce((acc, charge) => acc + (charge?.amount || 0), 0) || 0;
  const orderMetaCards = [
    { label: 'Payment status', value: formatStatusLabel(filteredOrderEntity.paymentStatus), emphasis: true },
    { label: 'Processing status', value: formatStatusLabel(filteredOrderEntity.processingStatus), emphasis: true },
    { label: 'Order method', value: formatStatusLabel(filteredOrderEntity.orderMethod) },
    { label: 'Created', value: orderCreatedAt || '-' },
  ];

  if (filteredOrderEntity.deliveryStatus != null) {
    orderMetaCards.push({ label: 'Delivery status', value: String(filteredOrderEntity.deliveryStatus) });
  }

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'REFUNDED':
        return 'bg-orange-100 text-orange-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getOrderItemImageUrl = (item: any) => {
    return item?.attachments?.[0]?.url || item?.image?.url || item?.variants?.[0]?.attachments?.[0]?.url || item?.variants?.[0]?.image?.url || '';
  };

  const summaryRows = [
    { label: 'Items', value: `+ ${orderEntity?.itemsTotal?.toFixed(2) || '0.00'}`, valueClassName: 'text-green-600' },
    { label: 'Addons', value: `+ ${orderEntity?.addonsTotal?.toFixed(2) || '0.00'}`, valueClassName: 'text-green-600' },
    { label: 'Service charges', value: `+ ${orderChargesTotal.toFixed(2)}`, valueClassName: 'text-green-600' },
    { label: 'Taxes', value: `+ ${orderEntity?.totalTaxes?.toFixed(2) || '0.00'}`, valueClassName: 'text-green-600' },
    { label: 'Total tip', value: `+ ${orderEntity?.totalTip?.toFixed(2) || '0.00'}`, valueClassName: 'text-green-600' },
    { label: 'Discount', value: `- ${orderEntity?.totalDiscount || '0.00'}`, valueClassName: 'text-red-600' },
  ];

  if (loading && !hasLoadedInitialOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-100 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6" ref={pagePrintRef}>
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

          <header className="sticky top-0 z-20 rounded-3xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur md:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border-slate-200 text-slate-600 transition hover:bg-slate-50"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Button>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Rize POS</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Order Details</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                      Order {formatSourceScopedIdentifier(orderEntity?.sourceApp?.type, orderEntity?.sequenceNumber, orderEntity?.id)}
                    </h1>
                    {orderEntity?.refund && (
                      <Badge className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100">
                        <BanknoteArrowDown className="mr-1 h-3.5 w-3.5" />
                        Refunded
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {orderCreatedOn || '-'}
                    {customerFullName ? ` • ${customerFullName}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold ${paymentStatusIsPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${paymentStatusIsPaid ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {formatStatusLabel(filteredOrderEntity.paymentStatus)}
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                  {filteredOrderEntity.processingStatus || '-'}
                </div>
                  {filteredOrderEntity?.items?.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleReorder} className="rounded-2xl border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      {reorderActionLabel}
                    </Button>
                  )}
                {canEditOrder && (
                  <Button variant="outline" size="sm" onClick={handleEditOrder} className="rounded-2xl border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit Order
                  </Button>
                )}
                {!orderEntity?.refund && (
                  <Button onClick={handleOpenPaymentDialogOrCreateBill} size="sm" className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Payment
                  </Button>
                )}
              </div>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[1.65fr_0.9fr]">
            <section className="space-y-6">
              <OrderProgressStepper tasks={filteredOrderEntity.orderDeliveryDetails?.integrationDetails?.tasks} />

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4 md:px-6">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Order Items</h2>
                      <p className="text-sm text-slate-500">Ordered products, quantities, modifiers, and totals.</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 md:mt-0">
                      <Link to={`/order/${filteredOrderEntity.id}/print?dataTableValues=${JSON.stringify(dataTableValues)}`}>
                        <Button variant="outline" className="w-fit rounded-2xl border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                          Print Receipt
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="rounded-2xl border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        onClick={handleSendReceiptEmail}
                      >
                        E-mail Receipt
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 md:px-6">
                  {dataTableValues && dataTableValues.length > 0 ? (
                    <OrderedItems dataTableValues={dataTableValues} />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No order items available.</div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Bills</h2>
                    <p className="text-sm text-slate-500">Transaction records linked to this order.</p>
                  </div>
                </div>

                <div className="mt-5">
                  {filteredOrderEntity?.bills?.length > 0 ? (
                    <div className="space-y-4">
                      {filteredOrderEntity?.bills?.map((bill, idx) => {
                        const billStatus = String(bill.status);

                        return (
                          <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200">
                            <div className="px-4 py-4">
                              <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-base font-semibold text-slate-900">
                                      Bill {formatSourceScopedIdentifier(orderEntity?.sourceApp?.type, bill.sequenceNumber, bill.id)}
                                    </h3>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getBillStatusColor(billStatus)}`}>
                                      {billStatus}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-slate-500">{formatDateForDisplay(bill.dateTime, 'MMM d, yyyy HH:mm')}</p>
                                </div>

                                <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center">
                                  <p className="text-lg font-bold text-slate-900">${bill?.total?.toFixed(2)}</p>
                                  <span id={`actionsTab-${idx}`} className="flex flex-wrap gap-2">
                                    <Link to={`/order/${filteredOrderEntity.id}/print/${bill.id}`}>
                                      <Button variant="outline" className="rounded-2xl border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                        Print
                                      </Button>
                                    </Link>
                                    <Button
                                      variant="outline"
                                      className="rounded-2xl border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                      onClick={() => handleSendBillEmail(bill.id)}
                                    >
                                      E-mail Bill
                                    </Button>
                                    {!orderEntity?.refund && billStatus !== 'REFUNDED' && (
                                      <Button
                                        className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                                        onClick={() => {
                                          openRefundDialog(bill);
                                        }}
                                      >
                                        Refund
                                      </Button>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="border-t border-slate-100 px-4 pb-4 pt-4">
                              <div className="space-y-4">
                                {billStatus === 'DRAFT' &&
                                  (() => {
                                    const totalPaid = bill.paymentTransactions?.reduce((sum, txn) => sum + (txn.amount || 0), 0) || 0;
                                    const remaining = (bill.total || 0) - totalPaid;
                                    return (
                                      <div className="rounded-2xl bg-slate-50 p-4">
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                          <div>
                                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Remaining Balance</div>
                                            <div className="mt-1 text-2xl font-bold text-slate-900">${remaining.toFixed(2)}</div>
                                            <div className="mt-1 text-sm text-slate-500">
                                              Bill Total: ${(bill.total || 0).toFixed(2)} | Paid: ${totalPaid.toFixed(2)}
                                            </div>
                                          </div>
                                          <Button
                                            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                            disabled={orderEntity?.refund}
                                            onClick={() => {
                                              openPaymentDialog(bill);
                                            }}
                                          >
                                            Add Payment
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                {bill?.paymentTransactions?.length > 0 ? (
                                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
                                    {bill.paymentTransactions.map((transaction, txnIdx) => (
                                      <div key={transaction.id} className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_140px_140px_140px] md:items-center">
                                        <div className="min-w-0">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold text-slate-900">Transaction {txnIdx + 1}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {transaction.status}
                                            </Badge>
                                          </div>
                                          <div className="mt-1 text-sm text-slate-500 capitalize">{String(transaction.type || '').toLowerCase()}</div>
                                        </div>
                                        <div className="text-sm">
                                          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Amount</div>
                                          <div className="mt-1 font-medium text-slate-800">${transaction.amount?.toFixed(2)}</div>
                                        </div>
                                        <div className="text-sm">
                                          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Method</div>
                                          <div className="mt-1 font-medium text-slate-800">{formatTransactionMethodLabel(transaction.method?.name)}</div>
                                        </div>
                                        <div className="text-sm">
                                          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Type</div>
                                          <div className="mt-1 font-medium capitalize text-slate-800">{String(transaction.type || '').toLowerCase()}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No payment transactions.</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No bills available</div>
                  )}
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Financial Snapshot</h2>
                    <p className="text-sm text-slate-500">At-a-glance payment state.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-900 px-3 py-2 text-right text-white">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Total</p>
                    <p className="text-xl font-bold">{orderEntity?.total?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {summaryRows.map(row => (
                    <div key={row.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="text-sm font-medium text-slate-600">{row.label}</span>
                      <span className={`text-sm font-semibold ${row.valueClassName === 'text-red-600' ? 'text-rose-600' : 'text-slate-900'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="my-5 h-px bg-slate-100" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Paid</span>
                    <span className="text-base font-semibold text-emerald-600">
                      {(
                        filteredOrderEntity?.bills?.reduce(
                          (sum, bill) => sum + (bill.paymentTransactions?.reduce((txnSum, txn) => txnSum + (txn.amount || 0), 0) || 0),
                          0
                        ) || 0
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Balance</span>
                    <span className="text-base font-semibold text-slate-900">
                      {(
                        (orderEntity?.total || 0) -
                        (filteredOrderEntity?.bills?.reduce(
                          (sum, bill) => sum + (bill.paymentTransactions?.reduce((txnSum, txn) => txnSum + (txn.amount || 0), 0) || 0),
                          0
                        ) || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <h2 className="text-lg font-semibold text-slate-900">Customer</h2>
                {filteredOrderEntity.customer ? (
                  <div className="mt-4 flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
                      {(customerFullName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 text-left text-base font-semibold text-slate-900 hover:bg-transparent"
                        onClick={() => navigate(`/customer/${filteredOrderEntity.customer.id}?page=1&sort=id,asc`)}
                      >
                        {customerFullName || '-'}
                      </Button>
                      {filteredOrderEntity.customer.email && <p className="text-sm text-slate-500">{filteredOrderEntity.customer.email}</p>}
                      {filteredOrderEntity.customer.phone && <p className="text-sm text-slate-500">{filteredOrderEntity.customer.phone}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-slate-500">No customer found.</div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <h2 className="text-lg font-semibold text-slate-900">Order Status</h2>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                    <span className="font-medium text-emerald-800">Payment Status</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                      {formatStatusLabel(filteredOrderEntity.paymentStatus)}
                    </span>
                  </div>
                  <div className="space-y-2 rounded-2xl bg-sky-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sky-800">Processing</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-sky-700 shadow-sm">
                        {formatStatusLabel(filteredOrderEntity.processingStatus)}
                      </span>
                    </div>
                    <Select
                      options={processingStatusOptions}
                      value={
                        filteredOrderEntity.processingStatus
                          ? {
                              label: filteredOrderEntity.processingStatus,
                              value: filteredOrderEntity.processingStatus,
                            }
                          : null
                      }
                      onChange={(option: any) => {
                        const nextStatus = option?.value as OrderStatus | undefined;

                        if (!nextStatus || nextStatus === filteredOrderEntity.processingStatus) {
                          return;
                        }

                        changeProcessingStatusConfirm(nextStatus);
                      }}
                      placeholder="Processing Status"
                      isDisabled={!canManageProcessingStatus}
                    />
                  </div>
                  {orderEntity?.deliveryStatus != null && (
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-medium text-slate-700">Delivery Status</span>
                      <span className="text-sm font-semibold text-slate-900">{filteredOrderEntity.deliveryStatus}</span>
                    </div>
                  )}
                </div>
              </div>

              {(filteredOrderEntity?.deliverTo || orderEntity.orderDeliveryDetails) && (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <h2 className="text-lg font-semibold text-slate-900">Delivery</h2>
                  <div className="mt-4 space-y-4 text-sm text-slate-600">
                    {filteredOrderEntity?.deliverTo?.address && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Address</p>
                        <p className="mt-1 text-slate-800">{filteredOrderEntity.deliverTo.address}</p>
                      </div>
                    )}
                    {filteredOrderEntity?.deliverTo?.contactPersonName && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Contact Person</p>
                        <p className="mt-1 text-slate-800">{filteredOrderEntity.deliverTo.contactPersonName}</p>
                      </div>
                    )}
                    {filteredOrderEntity?.deliverTo?.phoneNumber && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Phone Number</p>
                        <p className="mt-1 text-slate-800">{filteredOrderEntity.deliverTo.phoneNumber}</p>
                      </div>
                    )}
                    {orderEntity.orderDeliveryDetails?.date && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Scheduled Time</p>
                        <p className="mt-1 text-slate-800">{formatDateForDisplay(orderEntity.orderDeliveryDetails?.date) || '-'}</p>
                      </div>
                    )}
                    {orderEntity.orderDeliveryDetails?.driverInformation?.name && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Driver</p>
                        <p className="mt-1 text-slate-800">{orderEntity.orderDeliveryDetails.driverInformation.name}</p>
                      </div>
                    )}
                    {orderEntity.orderDeliveryDetails?.driverInformation?.trackOrderUrl && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Tracking Link</p>
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={orderEntity.orderDeliveryDetails.driverInformation.trackOrderUrl}
                          className="mt-1 block break-all text-sky-700 hover:underline"
                        >
                          {orderEntity.orderDeliveryDetails.driverInformation.trackOrderUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!orderEntity?.refund && (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <h2 className="text-lg font-semibold text-slate-900">{orderEntity.orderDeliveryDetails ? 'Manage Booking' : 'Schedule Delivery'}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {orderEntity.orderDeliveryDetails ? 'Update, sync, or assign the delivery booking.' : 'Optional follow-up action for this order.'}
                  </p>
                  <div className="mt-4">
                    <Input type="datetime-local" value={deliveryDateTime} onChange={e => setDeliveryDateTime(e.target.value)} className="rounded-2xl border-slate-200 px-4 py-3 text-sm text-slate-700" />
                  </div>
                  {!orderEntity.orderDeliveryDetails ? (
                    <Button
                      type="button"
                      className="mt-4 h-auto w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      disabled={!deliveryDateTime}
                      onClick={() => {
                        dispatch(
                          createBooking({
                            orderId: orderEntity.id || '',
                            date: toServerDateTime(deliveryDateTime),
                          })
                        );
                      }}
                    >
                      Create Booking
                    </Button>
                  ) : (
                    <>
                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <Button type="button" variant="outline" className="rounded-2xl border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => setShowCancelBookingConfirm(true)}>
                          Cancel Booking
                        </Button>
                        <Button type="button" variant="outline" className="rounded-2xl border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => dispatch(syncBooking(orderEntity.id || ''))}>
                          Sync
                        </Button>
                        <Button
                          type="button"
                          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                          disabled={!deliveryDateTime}
                          onClick={() => {
                            dispatch(
                              updateBooking({
                                orderId: orderEntity.id || '',
                                date: toServerDateTime(deliveryDateTime),
                              })
                            );
                          }}
                        >
                          Update
                        </Button>
                      </div>
                      {isTookanBooking && (
                        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tookan Assignment</p>
                            <p className="mt-1 text-sm text-slate-500">Choose the team and driver before assigning.</p>
                          </div>
                          <Select
                            options={tookanTeams.map(team => ({
                              label: team.team_name || `Team ${team.team_id}`,
                              value: String(team.team_id),
                            }))}
                            value={
                              selectedTeamId
                                ? {
                                    label: tookanTeams.find(team => String(team.team_id) === selectedTeamId)?.team_name || `Team ${selectedTeamId}`,
                                    value: selectedTeamId,
                                  }
                                : null
                            }
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
                            value={
                              selectedDriverId
                                ? {
                                    label: selectedTeamAgents.find(agent => String(agent.fleet_id) === selectedDriverId)?.name || `Fleet ${selectedDriverId}`,
                                    value: selectedDriverId,
                                  }
                                : null
                            }
                            onChange={(option: any) => setSelectedDriverId(option?.value)}
                            placeholder={selectedTeamId ? 'Select driver' : 'Select team first'}
                          />
                          <Button
                            type="button"
                            className="h-auto w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            disabled={!selectedTeamId || !selectedDriverId}
                            onClick={async () => {
                              if (!selectedTeamId || !selectedDriverId) {
                                return;
                              }
                              try {
                                await dispatch(
                                  assignDriver({
                                    orderId: orderEntity.id || '',
                                    driverId: selectedDriverId,
                                    teamId: selectedTeamId,
                                  })
                                ).unwrap();
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
                    </>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

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
            <DialogTitle>
              Refund Bill {formatSourceScopedIdentifier(orderEntity?.sourceApp?.type, selectedBillForRefund?.sequenceNumber, selectedBillForRefund?.id)}
            </DialogTitle>
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
                        imageUrl: getOrderItemImageUrl(item),
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
                          imageUrl: getOrderItemImageUrl(addon),
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

      <OrderPaymentDialog
        open={showPaymentDialog}
        onOpenChange={open => {
          if (!open) {
            resetPaymentDialog();
          }
        }}
        title={`Add Payment to Bill ${formatSourceScopedIdentifier(orderEntity?.sourceApp?.type, selectedBillForPayment?.sequenceNumber, selectedBillForPayment?.id)}`}
        orderBranchId={orderEntity.branchId}
        customerId={orderEntity.customer?.id}
        loyaltyPreviewEligible={Boolean(orderEntity.loyaltyPreview?.eligible)}
        loyaltyPreviewPoints={orderEntity.loyaltyPreview?.points ?? 0}
        totalAmount={selectedBillForPayment?.total ?? 0}
        totalPaid={selectedBillForPayment?.paymentTransactions?.reduce((sum, txn) => sum + (txn.amount || 0), 0) || 0}
        defaultPaymentAmount={Math.max(
          0,
          (selectedBillForPayment?.total || 0) -
            (selectedBillForPayment?.paymentTransactions?.reduce((sum, txn) => sum + (txn.amount || 0), 0) || 0)
        )}
        submitLabel="Add Payment"
        onSubmit={handleAddPayment}
        submitting={paymentSubmitting}
        submitDisabled={!selectedBillForPayment}
      />
    </>
  );
};

export default OrderDetail;
