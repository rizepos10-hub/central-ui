import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { components } from 'react-select';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IProduct } from 'app/shared/model/ITEM/retail/product.model';
import { filterEntities as getProducts } from "app/entities/item/retail/product/product.reducer";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { addPaymentToBill, calculateItemPrice, changeEntityField, changeProcessingStatus, clearChargesPreview, createDraftBill, createDraftEntity, createEntity, previewCharges, updateDraftEntity, updateEntity, reset } from './order.reducer';
import { IOrder, IOrderCharge } from 'app/shared/model/ORDER/order.model';
import { RiDeleteBin6Fill } from "react-icons/ri";
import PaginationFilter from 'app/shared/components/pagination/pagination-filter';
import { useNavigate, useLocation } from 'react-router-dom';
import _ from 'lodash';
import { ITaxonomy } from 'app/shared/model/taxonomy.model';
import { IVariantPackage } from 'app/shared/model/ITEM/retail/variable-item.model';
import { searchCustomers } from 'app/entities/customer/customer.reducer';
import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { IAddress } from 'app/shared/model/address.model';
import { IBranch } from 'app/shared/model/branch.model';
import { toast } from 'react-toastify';
import CustomerUpdate from '../customer/customer-update';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { toLocalISOString } from 'app/shared/util/date-utils';
import { initialItemFilterState } from 'app/shared/model/filter-state.model';
import { getEntities as getCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import DropDownFilter from 'app/shared/components/filter/drop-down-filter';
import { getEntities as getPricingPoints } from 'app/entities/settings/pricing-point/pricing-point.reducer';
import { IPricingPoint, PricingPointType } from 'app/shared/model/PRICING-POINT/pricing-point';
import { OrderMethod } from "app/shared/model/ENUMS/order-method.model";
import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { getEntitiesByType } from '../settings/branch-registry/branch-registry.reducer';
import { RegisterType } from 'app/shared/model/ENUMS/branch-registry-type';
import { IBranchRegistry } from 'app/shared/model/branch-registry.model';
import { ITill, TillStatus } from 'app/shared/model/till.model';
import { createEntity as createTill, closeEntity, confirmCloseEntity, getEntitiesByStatusOpened } from '../settings/branch-registry/till/till.reducer';
import { ArrowLeft, BadgePercent, CalendarDays, Loader2, MapPin, Plus, RotateCcw, Search, ShoppingCart, Store, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Select from 'app/shared/components/select/select';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/src/main/webapp/app/lib/utils';
import { FilterMatchMode } from 'primereact/api';
import DeliveryAddressDialog from 'app/entities/customer/components/DeliveryAddressDialog';
import OrderPaymentDialog from './order-payment-dialog';
import { formatServiceChargeKey } from 'app/shared/util/service-charge-utils';
import { getFinalPrice } from 'app/shared/util/calculations-utils';

type ChargePreviewRow = {
    key: string;
    label: string;
    amount: number;
};

type CustomerOption = {
    value: string;
    label: string;
    customer: ICustomer;
};

const CUSTOMER_SEARCH_PAGE_SIZE = 20;

const formatCustomerLabel = (customer?: Partial<ICustomer> | null) => {
    const fullName = [customer?.firstName, customer?.lastName]
        .filter(part => typeof part === 'string' && part.trim().length > 0)
        .join(' ')
        .trim();
    const businessName = customer?.businessDetails?.businessName?.trim();

    if (fullName && businessName) {
        return `${fullName} (${businessName})`;
    }

    if (fullName) {
        return fullName;
    }

    if (businessName) {
        return businessName;
    }

    return 'Unnamed customer';
};

const OrderCreate = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const ORDER_METHOD = 'orderMethod';
    const orderEntity: IOrder = useAppSelector(state => state.order.entity);
    const products: IProduct[] = useAppSelector(state => state.product.entities)
    const totalItems: number = useAppSelector(state => state.product.totalItems)
    const branches: IBranch[] = useAppSelector(state => state.branch.entities)
    const customers: ICustomer[] = useAppSelector(state => state.customer.entities)
    const pricingPoints: IPricingPoint[] = useAppSelector(state => state.pricingPoint.entities);
    const authorities = useAppSelector(state => state.authentication.account?.authorities || []);
    const searchParams = new URLSearchParams(location.search);
    const selectedRegistryId = searchParams.get("registerId");
    const isWholesaleMode = searchParams.get("mode") === 'wholesale';
    
    // Check if we're in edit mode
    const locationState = (location.state as { editOrder?: IOrder; orderId?: string; prefillOrder?: IOrder; isDraftEdit?: boolean } | null) || null;
    const editOrderData = locationState?.editOrder;
    const prefillOrderData = locationState?.prefillOrder;
    const editOrderId = locationState?.orderId;
    const isEditMode = !!editOrderId && !!editOrderData;
    const isDraftEditMode = isEditMode && (locationState?.isDraftEdit === true || editOrderData?.processingStatus === OrderStatus.DRAFT);
    const hasInitialOrderState = isEditMode || !!prefillOrderData;
    const initialOrderData = editOrderData || prefillOrderData;
    const branchRegistry: IBranchRegistry[] = useAppSelector(state => state.branchRegistry.entities);
    const initialRender = useRef(true);
    const moreActionsOP = useRef(null);
    const discountOP = useRef(null);
    const [initialAmount, setInitialAmount] = useState(0);
    const [dialogTillOpen, setDialogTillOpen] = useState(false);
    const [closeTillDialog, setCloseTillDialog] = useState(false);
    
    const [till, setTill] = useState<ITill | null>(null);
    const [tillList, setTillList] = useState<ITill[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterValue, setFilterValue] = useState('');
    const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
    const [customerSearchResults, setCustomerSearchResults] = useState<ICustomer[]>([]);
    const [selectedCustomerRecord, setSelectedCustomerRecord] = useState<ICustomer | null>(null);
    const [pricingPointId, setPricingPointId] = useState('');
    const [scheduledAtLocal, setScheduledAtLocal] = useState('');
    const [addressDialogOpen, setAddressDialogOpen] = useState(false);
    const [addressDialogAddress, setAddressDialogAddress] = useState<IAddress | null>(null);
    const [mobileProductDialogOpen, setMobileProductDialogOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [tillStatus, setTillStatus] = useState<TillStatus>(null);
    const [closingAmount, setClosingAmount] = useState<number | null>(null);
    const [variantDialog, setVariantDialog] = useState<{
        product: IProduct,
        visible: boolean,
        selectedRetailAttributes: {
            id: string;
            name: string;
            taxonomy: ITaxonomy;
        }[],
        chosenVariant: IVariantPackage | null,
        availableVariants: IVariantPackage[]
    }>({
        visible: false,
        product: {},
        selectedRetailAttributes: [],
        chosenVariant: null,
        availableVariants: []
    });
    const [customPriceModalData, setCustomPriceModalData] = useState<{
        product: IProduct,
        visible: boolean,
        price: number
    }>({
        visible: false,
        product: {},
        price: 0
    });

    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [submittingOrder, setSubmittingOrder] = useState(false);
    const [visible, setVisible] = useState(false);
    const scheduledAtInputRef = useRef<HTMLInputElement | null>(null);
    const itemPriceLoading = useAppSelector(state => state.order.itemPriceLoading);
    const itemPriceCalculations = useAppSelector(state => state.order.itemPriceCalculations);
    const chargesPreview = useAppSelector(state => state.order.chargesPreview);
    const chargesPreviewError = useAppSelector(state => state.order.chargesPreviewError);
    const cartStorageKey = `pos-cart:${selectedRegistryId || 'unknown'}`;
    const isFirstContextRun = useRef(true);
    const hasHydratedCart = useRef(false);
    const hasInitializedOrder = useRef(false);
    const hasInitializedEditOrder = useRef(false);
    const hasRecalculatedEditTaxes = useRef(false);
    const skipNextCartPersistRef = useRef(false);
    const latestCustomerSearchRequest = useRef(0);
    const isSalesmanMode = isWholesaleMode && authorities.includes('ROLE_WHOLESALE_SALESMAN');
    const missingSchedule = !scheduledAtLocal;
    const missingCustomer = !orderEntity.customer?.id;
    const missingDelivery = isSalesmanMode && orderEntity.orderMethod === OrderMethod.Delivery && !orderEntity.deliverTo;
    const isSalesmanFlowReady = !missingSchedule && !missingCustomer && !missingDelivery;
    const shouldGateSalesman = isSalesmanMode && !isSalesmanFlowReady;
    const missingSalesmanFields = useMemo(() => {
        const fields: string[] = [];
        if (missingCustomer) fields.push('customer');
        if (missingSchedule) fields.push('schedule time');
        if (missingDelivery) fields.push('delivery address');
        return fields;
    }, [missingCustomer, missingDelivery, missingSchedule]);
    const salesmanGateMessage = useMemo(() => {
        if (!missingSalesmanFields.length) {
            return 'Required fields are missing';
        }
        const label = missingSalesmanFields.join(' and ');
        const verb = missingSalesmanFields.length === 1 ? 'is' : 'are';
        return `${label} ${verb} required`;
    }, [missingSalesmanFields]);
    const hasPendingItemPriceCalculation = useMemo(
        () => Object.values(itemPriceLoading || {}).some(Boolean),
        [itemPriceLoading]
    );
    const hasItemWithMissingPrice = useMemo(
        () => (orderEntity?.items ?? []).some(item => item?.price == null),
        [orderEntity?.items]
    );

    const buildCustomerSearchPayload = useCallback((field: string | null, value: string) => {
        const trimmedValue = value.trim();
        return applyMatchModeMap({
            first: 0,
            rows: CUSTOMER_SEARCH_PAGE_SIZE,
            page: 0,
            sortField: null,
            sortOrder: null,
            filters: field && trimmedValue
                ? {
                    [field]: {
                        value: trimmedValue,
                        matchMode: FilterMatchMode.CONTAINS,
                    },
                }
                : {},
        });
    }, []);

    const mergeCustomerResults = useCallback((primary: ICustomer[] = [], secondary: ICustomer[] = []) => {
        const merged: ICustomer[] = [];
        const seenIds = new Set<string>();

        [...primary, ...secondary].forEach(customer => {
            const id = customer?.id;
            if (!id || seenIds.has(id)) {
                return;
            }

            seenIds.add(id);
            merged.push(customer);
        });

        return merged;
    }, []);

    const loadCustomers = useCallback(async (searchValue = '') => {
        const requestId = latestCustomerSearchRequest.current + 1;
        latestCustomerSearchRequest.current = requestId;
        setCustomerSearchLoading(true);

        try {
            const trimmedValue = searchValue.trim();

            let results: ICustomer[] = [];
            if (!trimmedValue) {
                const response: any = await dispatch(searchCustomers(buildCustomerSearchPayload(null, '')));
                results = response?.payload?.data ?? [];
            } else {
                const [nameResponse, businessResponse]: any = await Promise.all([
                    dispatch(searchCustomers(buildCustomerSearchPayload('firstName', trimmedValue))),
                    dispatch(searchCustomers(buildCustomerSearchPayload('businessDetails.businessName', trimmedValue))),
                ]);

                results = mergeCustomerResults(
                    nameResponse?.payload?.data ?? [],
                    businessResponse?.payload?.data ?? []
                );
            }

            if (latestCustomerSearchRequest.current === requestId) {
                setCustomerSearchResults(results);
            }
        } finally {
            if (latestCustomerSearchRequest.current === requestId) {
                setCustomerSearchLoading(false);
            }
        }
    }, [buildCustomerSearchPayload, dispatch, mergeCustomerResults]);

    const openScheduledAtPicker = useCallback(() => {
        const input = scheduledAtInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;

        if (input?.showPicker) {
            input.showPicker();
        }
    }, []);

    const orderItemsRef = useRef(orderEntity.items ?? []);
    const productById = useMemo(() => {
        return new Map(products.map(product => [product.id, product]));
    }, [products]);

    const getItemPriceDisplayMeta = useCallback((item: IOrder['items'][number]) => {
        const product = productById.get(item.itemId);
        const variant = product?.variants?.find(productVariant => productVariant.id === item.variantId) ?? product?.variants?.[0];

        if (!product || !variant) {
            return {
                effectivePrice: item.price ?? null,
                originalPrice: item.priceBeforeDiscount ?? null,
            };
        }

        const effectivePrice = getFinalPrice({
            variantItem: variant,
            branchId: orderEntity.branchId,
            item: product,
            customer: orderEntity.customer,
            pricingPointId,
            pricingPoints,
            selectedOrderMethod: orderEntity.orderMethod || OrderMethod.PickUp,
        });

        const originalPrice = variant.branchVariantDetails?.[orderEntity.branchId]?.price ?? variant.price ?? null;

        return {
            effectivePrice: effectivePrice || item.price || null,
            originalPrice,
        };
    }, [orderEntity.branchId, orderEntity.customer, orderEntity.orderMethod, pricingPointId, pricingPoints, productById]);

    useEffect(() => {
        orderItemsRef.current = orderEntity.items ?? [];
    }, [orderEntity.items]);

    useEffect(() => {
        // Skip reset logic in edit mode - edit mode handles its own initialization
        if (hasInitialOrderState) {
            console.log('fixing branch... skipping reset in edit mode');
            hasInitializedOrder.current = true;
            return;
        }
        if (!selectedRegistryId || hasInitializedOrder.current) {
            return;
        }
        hasInitializedOrder.current = true;
        const storedCart = localStorage.getItem(cartStorageKey);
        if (!storedCart) {
            console.log('fixing branch... calling reset() - this should not happen in edit mode');
            dispatch(reset());
        }
    }, [cartStorageKey, dispatch, selectedRegistryId, hasInitialOrderState]);

    useEffect(() => {
        // Skip cart hydration in edit mode - we load data from location state instead
        if (hasInitialOrderState) {
            console.log('fixing branch... skipping cart hydration in edit mode');
            hasHydratedCart.current = true;
            return;
        }
        if (!selectedRegistryId) {
            return;
        }
        const storedCart = localStorage.getItem(cartStorageKey);
        if (!storedCart) {
            console.log('fixing branch... clearing fields in cart hydration - this should not happen in edit mode');
            dispatch(changeEntityField({
                name: 'items',
                value: [],
            }));
            dispatch(changeEntityField({
                name: 'customer',
                value: null,
            }));
            dispatch(changeEntityField({
                name: 'scheduledAt',
                value: null,
            }));
            dispatch(changeEntityField({
                name: 'deliverTo',
                value: null,
            }));
            setPricingPointId('');
            setScheduledAtLocal('');
            hasHydratedCart.current = true;
            return;
        }
        try {
            const parsed = JSON.parse(storedCart);
            if (Array.isArray(parsed?.items)) {
                dispatch(changeEntityField({
                    name: 'items',
                    value: parsed.items,
                }));
            }
            if (parsed?.customer || parsed?.customerId) {
                dispatch(changeEntityField({
                    name: 'customer',
                    value: parsed.customer ?? { id: parsed.customerId },
                }));
            }
            if (parsed?.orderMethod) {
                dispatch(changeEntityField({
                    name: 'orderMethod',
                    value: parsed.orderMethod as OrderMethod,
                }));
                localStorage.setItem(ORDER_METHOD, parsed.orderMethod);
            }
            if (parsed?.pricingPointId) {
                setPricingPointId(parsed.pricingPointId);
            }
            // Synchronize scheduledAtLocal and scheduledAt
            if (parsed?.scheduledAtLocal) {
                setScheduledAtLocal(parsed.scheduledAtLocal);
                // Also set scheduledAt if scheduledAtLocal exists
                if (parsed.scheduledAt) {
                    dispatch(changeEntityField({
                        name: 'scheduledAt',
                        value: parsed.scheduledAt,
                    }));
                } else {
                    // Convert scheduledAtLocal to scheduledAt if not present
                    const dateValue = parsed.scheduledAtLocal ? toLocalISOString(new Date(parsed.scheduledAtLocal)) : null;
                    dispatch(changeEntityField({
                        name: 'scheduledAt',
                        value: dateValue,
                    }));
                }
            } else {
                // Clear both if scheduledAtLocal is not present
                setScheduledAtLocal('');
                if (parsed?.scheduledAt) {
                    dispatch(changeEntityField({
                        name: 'scheduledAt',
                        value: null,
                    }));
                }
            }
            if (parsed?.deliverTo) {
                dispatch(changeEntityField({
                    name: 'deliverTo',
                    value: parsed.deliverTo,
                }));
            }
        } catch (error) {
            console.error('Failed to parse stored cart', error);
        } finally {
            hasHydratedCart.current = true;
        }
    }, [cartStorageKey, dispatch, selectedRegistryId, hasInitialOrderState]);

    // Load initial order data for edit/reorder flows
    useEffect(() => {
        console.log('fixing branch... edit mode useEffect triggered:', {
            isEditMode,
            hasEditOrderData: !!initialOrderData,
            hasInitializedEditOrder: hasInitializedEditOrder.current,
            editOrderBranchId: initialOrderData?.branchId
        });
        if (hasInitialOrderState && initialOrderData && !hasInitializedEditOrder.current) {
            console.log('fixing branch... initializing edit order data');
            hasInitializedEditOrder.current = true;
            // Set flag early to prevent other initialization logic from running
            hasInitializedOrder.current = true;
            hasHydratedCart.current = true;
            console.log('fixing branch... flags set, hasInitializedOrder:', hasInitializedOrder.current, 'hasHydratedCart:', hasHydratedCart.current);
            
            // Set order ID
            if (editOrderId) {
                dispatch(changeEntityField({
                    name: 'id',
                    value: editOrderId,
                }));
            }
            
            // Set branch - will be properly initialized with till status once branchRegistry is loaded
            if (initialOrderData.branchId) {
                console.log('fixing branch... setting branchId in edit mode:', initialOrderData.branchId);
                dispatch(changeEntityField({
                    name: 'branchId',
                    value: initialOrderData.branchId,
                }));
            } else {
                console.log('fixing branch... editOrderData.branchId is missing:', initialOrderData);
            }
            
            // Set customer
            if (initialOrderData.customer) {
                dispatch(changeEntityField({
                    name: 'customer',
                    value: initialOrderData.customer,
                }));
            }
            
            // Set order method
            if (initialOrderData.orderMethod) {
                dispatch(changeEntityField({
                    name: 'orderMethod',
                    value: initialOrderData.orderMethod,
                }));
                localStorage.setItem(ORDER_METHOD, initialOrderData.orderMethod);
            }
            
            // Set scheduled date
            if (initialOrderData.scheduledAt) {
                dispatch(changeEntityField({
                    name: 'scheduledAt',
                    value: initialOrderData.scheduledAt,
                }));
                const date = new Date(initialOrderData.scheduledAt);
                const localDateTimeString = date.toISOString().slice(0, 16);
                setScheduledAtLocal(localDateTimeString);
            }
            
            // Set delivery address
            if (initialOrderData.deliverTo) {
                dispatch(changeEntityField({
                    name: 'deliverTo',
                    value: initialOrderData.deliverTo,
                }));
            }
            
            // Set order charges
            if (initialOrderData.orderCharges) {
                dispatch(changeEntityField({
                    name: 'orderCharges',
                    value: initialOrderData.orderCharges,
                }));
            }
            
            // Set custom discount
            if (initialOrderData.customDiscount) {
                dispatch(changeEntityField({
                    name: 'customDiscount',
                    value: initialOrderData.customDiscount,
                }));
            }
            
            // Set items - API will recalculate totals including taxes
            if (initialOrderData.items && initialOrderData.items.length > 0) {
                // Mark items with custom prices as priceOverridden so API receives priceOverride
                const itemsWithPriceOverrideFlag = initialOrderData.items.map(item => {
                    // If item has a price set, mark it as priceOverridden so API receives priceOverride
                    const hasCustomPrice = item.price !== undefined && item.price !== null && item.price > 0;
                    return {
                        ...item,
                        priceOverridden: item.priceOverridden ?? hasCustomPrice,
                    };
                });
                
                dispatch(changeEntityField({
                    name: 'items',
                    value: itemsWithPriceOverrideFlag,
                }));
            }
        }
    }, [hasInitialOrderState, initialOrderData, isEditMode, editOrderId, dispatch]);

    // Initialize branch registry and till status for edit/reorder flows
    useEffect(() => {
        if (hasInitialOrderState && initialOrderData?.branchId && branchRegistry.length > 0 && tillList.length >= 0) {
            const matchingRegistry = branchRegistry.find(record => record.branch?.id === initialOrderData.branchId);
            console.log('fixing branch... initializing branch registry and till status:', {
                isEditMode,
                branchId: initialOrderData.branchId,
                branchRegistryLength: branchRegistry.length,
                tillListLength: tillList.length,
                matchingRegistry: matchingRegistry ? 'found' : 'not found'
            });
            if (matchingRegistry) {
                // Set branchId first (checkTillStatus will also set it, but this ensures it's set immediately)
                console.log('fixing branch... setting branchId again before checkTillStatus:', initialOrderData.branchId);
                dispatch(changeEntityField({
                    name: 'branchId',
                    value: initialOrderData.branchId,
                }));
                // Then check till status - pass skipClosedStatus=true in edit mode to allow editing even if till is closed
                console.log('fixing branch... calling checkTillStatus');
                checkTillStatus(matchingRegistry, true);
            } else {
                console.log('fixing branch... matching registry not found for branchId:', initialOrderData.branchId);
            }
        } else {
            console.log('fixing branch... conditions not met for branch registry init:', {
                isEditMode,
                hasBranchId: !!initialOrderData?.branchId,
                branchRegistryLength: branchRegistry.length,
                tillListLength: tillList.length
            });
        }
    }, [hasInitialOrderState, isEditMode, initialOrderData?.branchId, branchRegistry, tillList, dispatch]);

    // Sync scheduledAtLocal with orderEntity.scheduledAt when entity changes (e.g., after reset)
    useEffect(() => {
        if (!hasHydratedCart.current) {
            return;
        }
        // Convert orderEntity.scheduledAt to datetime-local format for the input
        if (orderEntity.scheduledAt) {
            const date = new Date(orderEntity.scheduledAt);
            const localDateTimeString = date.toISOString().slice(0, 16);
            if (scheduledAtLocal !== localDateTimeString) {
                setScheduledAtLocal(localDateTimeString);
            }
        } else if (scheduledAtLocal !== '') {
            // Clear scheduledAtLocal if orderEntity.scheduledAt is null/undefined
            setScheduledAtLocal('');
        }
    }, [orderEntity.scheduledAt]);

    useEffect(() => {
        if (!selectedRegistryId || !hasHydratedCart.current) {
            return;
        }
        if (skipNextCartPersistRef.current) {
            skipNextCartPersistRef.current = false;
            return;
        }
        const payload = {
            items: orderEntity.items ?? [],
            customerId: orderEntity.customer?.id ?? null,
            customer: orderEntity.customer ?? null,
            orderMethod: orderEntity.orderMethod ?? null,
            pricingPointId: pricingPointId || null,
            scheduledAtLocal: scheduledAtLocal || null,
            scheduledAt: orderEntity.scheduledAt ?? null,
            deliverTo: orderEntity.deliverTo ?? null,
        };
        localStorage.setItem(cartStorageKey, JSON.stringify(payload));
    }, [cartStorageKey, orderEntity.items, orderEntity.customer?.id, orderEntity.orderMethod, orderEntity.deliverTo, orderEntity.scheduledAt, pricingPointId, selectedRegistryId, scheduledAtLocal]);

    const getOpenTills = (ids: string[]) => {
        dispatch(
            getEntitiesByStatusOpened(ids)
        ).then((action) => {
            const tillsList = (action?.payload as { data: ITill[] })?.data;
            setTillList(tillsList);
        });
    }

    useEffect(() => {
        const branchRegistryIds = branchRegistry.map(record => record.id);
        getOpenTills(branchRegistryIds);
    }, [branchRegistry])

    useEffect(() => {
        // Skip in edit mode - edit mode handles till status initialization separately
        if (isEditMode) {
            return;
        }
        checkTillStatus(branchRegistry.find(record => record.id === selectedRegistryId));
    }, [tillList, isEditMode, branchRegistry, selectedRegistryId])

    const checkTillStatus = (registry: IBranchRegistry, skipClosedStatus = false) => {
        // Guard against undefined registry to prevent resetting branchId
        if (!registry || !registry.branch?.id) {
            console.log('fixing branch... checkTillStatus called with invalid registry, skipping');
            return;
        }
        console.log('fixing branch... checkTillStatus called with branchId:', registry.branch.id);
        dispatch(changeEntityField({
            name: 'branchId',
            value: registry.branch.id,
        }))

        const orderMethod = localStorage.getItem(ORDER_METHOD) || OrderMethod.PickUp;
        dispatch(
            changeEntityField({
                name: 'orderMethod',
                value: orderMethod as OrderMethod,
            })
        )

        console.log(registry);
        console.log(tillList);
        if (tillList.length === 0) {
            // In edit mode, don't force tillStatus to CLOSED - allow editing even if till is closed
            if (!skipClosedStatus) {
                setTillStatus("CLOSED");
            }
            setTill(null);
            return;
        }

        const openedTill = tillList.find((till) => till?.registry?.branch?.id === registry?.branch?.id);
        console.log(openedTill);

        if (openedTill) {
            setTill(openedTill);
            setTillStatus("OPENED");
        } else {
            setTill(null);
            // In edit mode, don't force tillStatus to CLOSED - allow editing even if till is closed
            if (!skipClosedStatus) {
                setTillStatus("CLOSED");
            }
        }
    }

    const openTill = () => {
        if (tillStatus === "OPENED") return toast.error('Till is already open!');
        if (!initialAmount) return toast.error('Please enter an initial amount!');
        setLoading(true);
        const branchRegistryRecord: IBranchRegistry = branchRegistry.find(record => record.branch.id === orderEntity.branchId);
        if (!branchRegistryRecord) {
            toast.error('Branch registry record not found');
            return;
        }
        dispatch(
            createTill({
                openAmount: initialAmount,
                name: "Online Till",
                registry: branchRegistryRecord,
            })
        ).then((action)=> {
            const till = (action?.payload as { data: ITill })?.data
            setTill(till);
            setDialogTillOpen(false);
            toast.success('Till opened successfully');
            setTillStatus("OPENED")
            getOpenTills(branchRegistry.map(record => record.id));
        }).finally(() => {
            setLoading(false);
        })
        
    };

    const closeTill = () => {
        if (!closingAmount) return toast.error("Please enter a closing amount!");
        setLoading(true);
        try {
            dispatch(closeEntity(till.id)).then(() => {
                dispatch(confirmCloseEntity({
                    id: till.id,
                    closeAmount: closingAmount,
                })).then(() => {
                    toast.success("Till closed successfully");
                    setTillStatus("CLOSED");
                    setCloseTillDialog(false);
                    setTill(null);
                    setClosingAmount(null);
                    setLoading(false);
                    getOpenTills(branchRegistry.map(record => record.id));
                }).catch((error) => {
                    setLoading(false);
                    toast.error("Error closing till:", error);
                })
            }).catch((error) => {
                setLoading(false);
                toast.error("Error closing till:", error);
            })
        } catch (error) {
            setLoading(false);
            toast.success("Error closing till:", error);
        }
    };


    const formatPricingPointOrderType = (orderType: OrderMethod) => {
        switch (orderType) {
            case OrderMethod.PickUp:
                return "Pickup";
            case OrderMethod.WalkIn:
                return "Walk In";
            case OrderMethod.Delivery:
                return "Delivery";
            default:
                return orderType;
        }
    };
    const query = JSON.parse(searchParams.get("query")) || initialItemFilterState;
    useEffect(() => {
        // debounce the query
        const debouncedQuery = _.debounce(() => {
            const newQuery = {
                ...query,
                page: parseInt(searchParams.get("page"), 10) - 1 || 0,
                rows: parseInt(searchParams.get("size"), 10) || 24,
                filters: {
                    ...query.filters,
                    'categories.id': { value: searchParams.get("categoryId"), matchMode: FilterMatchMode.EQUALS },
                    'name': { value: searchParams.get("name"), matchMode: FilterMatchMode.CONTAINS }
                }
            }
            const updatedQuery = applyMatchModeMap(newQuery);
            dispatch(getProducts({
                query: updatedQuery,
            }))
        }, 300);
        debouncedQuery();
        return () => debouncedQuery.cancel();
    }, [searchParams.get("page"), searchParams.get("size"), searchParams.get("name"), searchParams.get("categoryId"), searchParams.get("name")])

    useEffect(() => {
        dispatch(
            getPricingPoints({
                page: 0,
                size: 500,
                sort: 'asc',
            })
        );
        dispatch(getBranches({}))
        dispatch(
            getCategories({
                page: 0,
                size: 1000,
                sort: `id,desc`,
            })
        );

        dispatch(
            getEntitiesByType({
                type: RegisterType.ONLINE,
            })
        )

        void loadCustomers('');
    }, [dispatch, loadCustomers])

    useEffect(() => {
        if (!orderEntity.customer?.id) {
            setSelectedCustomerRecord(null);
            return;
        }

        setSelectedCustomerRecord(prev => {
            if (prev?.id === orderEntity.customer?.id) {
                return prev;
            }

            return customers.find(customer => customer.id === orderEntity.customer?.id)
                || customerSearchResults.find(customer => customer.id === orderEntity.customer?.id)
                || orderEntity.customer
                || null;
        });
    }, [customerSearchResults, customers, orderEntity.customer]);
    const createQueryString = useCallback((name, value) => {
        const sParams = new URLSearchParams(searchParams);
        sParams.set(name, value);
        return `?${sParams.toString()}`;
    }, [searchParams]);

    const deleteQueryString = useCallback((name) => {
        const sParams = new URLSearchParams(searchParams);
        sParams.delete(name);
        return `?${sParams.toString()}`;
    }, [searchParams]);

    const resetCreateForm = useCallback(() => {
        if (isEditMode) {
            return;
        }

        const defaultOrderMethod = OrderMethod.PickUp;
        const currentBranchId =
            branchRegistry.find(record => record.id === selectedRegistryId)?.branch?.id
            || orderEntity.branchId
            || null;

        skipNextCartPersistRef.current = true;
        localStorage.removeItem(cartStorageKey);
        localStorage.setItem(ORDER_METHOD, defaultOrderMethod);

        dispatch(reset());

        if (currentBranchId) {
            dispatch(changeEntityField({
                name: 'branchId',
                value: currentBranchId,
            }));
        }

        dispatch(changeEntityField({
            name: 'orderMethod',
            value: defaultOrderMethod,
        }));
        dispatch(changeEntityField({
            name: 'items',
            value: [],
        }));
        dispatch(changeEntityField({
            name: 'customer',
            value: null,
        }));
        dispatch(changeEntityField({
            name: 'scheduledAt',
            value: null,
        }));
        dispatch(changeEntityField({
            name: 'deliverTo',
            value: null,
        }));
        dispatch(changeEntityField({
            name: 'orderCharges',
            value: [],
        }));
        dispatch(changeEntityField({
            name: 'customDiscount',
            value: null,
        }));
        dispatch(clearChargesPreview());

        setSelectedCustomerRecord(null);
        setCustomerSearchResults([]);
        setPricingPointId('');
        setScheduledAtLocal('');
        setAddressDialogAddress(null);
        setAddressDialogOpen(false);
        setOpenPaymentModal(false);

    }, [branchRegistry, cartStorageKey, dispatch, isEditMode, orderEntity.branchId, selectedRegistryId]);

    const clearCart = useCallback(() => {
        if (isEditMode) {
            return;
        }

        skipNextCartPersistRef.current = true;
        localStorage.removeItem(cartStorageKey);

        dispatch(changeEntityField({
            name: 'items',
            value: [],
        }));
        dispatch(changeEntityField({
            name: 'customDiscount',
            value: null,
        }));
        dispatch(changeEntityField({
            name: 'orderCharges',
            value: [],
        }));
        dispatch(clearChargesPreview());
        setOpenPaymentModal(false);

    }, [cartStorageKey, dispatch, isEditMode]);

    const debouncedItemNameNavigate = useCallback(
        _.debounce((newItemName) => {
            if (searchParams.get('name') !== newItemName) {
                navigate(createQueryString('name', newItemName));
            }
        }, 300),
        []
    );

    useEffect(() => {
        if (initialRender.current) {
            return;
        }
        debouncedItemNameNavigate(searchParams.get("name"));
    }, [searchParams.get("name"), debouncedItemNameNavigate]);

    const updateCartItem = useCallback((cartId: string, updates: Partial<IOrder['items'][number]>) => {
        const currentItems = orderItemsRef.current ?? [];
        const updatedItems = currentItems.map(item => item.cartId === cartId ? { ...item, ...updates } : item);
        orderItemsRef.current = updatedItems;
        dispatch(changeEntityField({
            name: 'items',
            value: updatedItems,
        }));
    }, [dispatch]);

    const recalculateItemTotals = useCallback((item: IOrder['items'][number]) => {
        if (!item?.cartId || !item?.itemId || !orderEntity?.branchId) {
            return;
        }

        // Send priceOverride only for manual unit-price overrides. Built-in discounts stay backend-driven.
        const derivedPriceMeta = getItemPriceDisplayMeta(item);
        const priceOverride = item.priceOverridden ? (item.price ?? undefined) : undefined;
        const discountOverride = item.customDiscount ? {
            type: item?.discount?.type || 'PERCENTAGE',
            value: item.customDiscount,
        } : undefined;

        dispatch(calculateItemPrice({
            cartId: item.cartId,
            payload: {
                itemId: item.itemId,
                variantId: item.variantId,
                quantity: item.amount ?? 0,
                branchId: orderEntity.branchId,
                orderMethod: orderEntity.orderMethod || OrderMethod.PickUp,
                customerId: orderEntity.customer?.id,
                ...(priceOverride != null ? { priceOverride } : {}),
                ...(discountOverride ? { discountOverride } : {}),
            }
        })).then((action) => {
            if (calculateItemPrice.fulfilled.match(action)) {
                const computedPrice = item.priceOverridden
                    ? item.price
                    : derivedPriceMeta.originalPrice
                        ?? item.price
                        ?? derivedPriceMeta.effectivePrice
                    ?? ((item.amount ?? 1) > 0 ? action.payload.data.itemTotal / (item.amount ?? 1) : 0);

                updateCartItem(item.cartId, {
                    itemTotal: action.payload.data.itemTotal,
                    taxTotal: action.payload.data.taxTotal,
                    grandTotal: action.payload.data.grandTotal,
                    price: computedPrice,
                    priceBeforeDiscount: item.priceOverridden
                        ? (item.priceBeforeDiscount ?? item.price ?? null)
                        : null,
                });
            }
        });
    }, [dispatch, getItemPriceDisplayMeta, orderEntity.branchId, orderEntity.orderMethod, orderEntity.customer?.id, updateCartItem]);

    const recalculateAllPrices = useCallback(() => {
        const items = orderItemsRef.current ?? [];
        // Recalculate all items while preserving manual override behavior.
        items?.forEach(item => {
            recalculateItemTotals(item);
        });
    }, [recalculateItemTotals]);

    
    // Recalculate taxes for items in edit mode after branchId and items are initialized
    useEffect(() => {
        if (isEditMode && hasInitializedEditOrder.current && !hasRecalculatedEditTaxes.current && orderEntity.branchId && orderEntity.items && orderEntity.items.length > 0 && orderEntity.orderMethod) {
            // Small delay to ensure all state updates are complete
            const timer = setTimeout(() => {
                console.log('fixing taxes... recalculating taxes for edit mode items');
                recalculateAllPrices();
                hasRecalculatedEditTaxes.current = true;
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isEditMode, orderEntity.branchId, orderEntity.items, orderEntity.orderMethod, recalculateAllPrices]);

    const addCartItem = useCallback((item: IOrder['items'][number] & { shouldFetchPrice?: boolean }, shouldFetchPrice = true) => {
        if (shouldGateSalesman) {
            toast.error(`${salesmanGateMessage} before adding items to a wholesale order.`);
            return;
        }
        const currentItems = orderItemsRef.current ?? [];
        const updatedItems = [...currentItems, item];
        orderItemsRef.current = updatedItems;
        dispatch(changeEntityField({
            name: 'items',
            value: updatedItems,
        }));
        if (shouldFetchPrice) {
            recalculateItemTotals(item);
        }
    }, [dispatch, recalculateItemTotals, salesmanGateMessage, shouldGateSalesman]);

    const handleAmountChange = useCallback((item: IOrder['items'][number], amount: number) => {
        updateCartItem(item.cartId, { amount });
        recalculateItemTotals({ ...item, amount });
    }, [recalculateItemTotals, updateCartItem]);

    const applyCustomDiscount = useCallback((item: IOrder['items'][number], discountValue: number, discountType: 'PERCENTAGE' | 'FLAT') => {
        // Just update discount fields - API will handle all calculations
        updateCartItem(item.cartId, {
            discount: {
                value: discountValue,
                type: discountType,
            },
            customDiscount: discountValue,
        });
        // Recalculate via API with the new discount
        recalculateItemTotals({
            ...item,
            discount: {
                value: discountValue,
                type: discountType,
            },
            customDiscount: discountValue,
        });
    }, [updateCartItem, recalculateItemTotals]);

    const handleDiscountChange = useCallback((item: IOrder['items'][number], discountValue: number) => {
        applyCustomDiscount(item, discountValue, (item?.discount?.type || 'PERCENTAGE') as 'PERCENTAGE' | 'FLAT');
    }, [applyCustomDiscount]);

    const handleDiscountTypeChange = useCallback((item: IOrder['items'][number], type: 'PERCENTAGE' | 'FLAT') => {
        applyCustomDiscount(item, item?.customDiscount ?? 0, type);
    }, [applyCustomDiscount]);

    const handlePriceChange = useCallback((item: IOrder['items'][number], priceValue: number | null) => {
        // Update price and mark as overridden - API will handle all calculations
        updateCartItem(item.cartId, {
            price: priceValue,
            priceOverridden: true,
            priceBeforeDiscount: priceValue,
        });
        // Recalculate via API with the new price override
        recalculateItemTotals({
            ...item,
            price: priceValue,
            priceOverridden: true,
        });
    }, [updateCartItem, recalculateItemTotals]);

    useEffect(() => {
        if (isFirstContextRun.current) {
            isFirstContextRun.current = false;
            return;
        }
        recalculateAllPrices();
    }, [orderEntity.customer?.id, orderEntity.orderMethod, pricingPointId, recalculateAllPrices]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!isSalesmanMode) {
            return;
        }
        if (orderEntity.orderMethod !== OrderMethod.Delivery) {
            dispatch(changeEntityField({
                name: 'orderMethod',
                value: OrderMethod.Delivery,
            }));
            localStorage.setItem(ORDER_METHOD, OrderMethod.Delivery);
        }
    }, [dispatch, isSalesmanMode, orderEntity.orderMethod]);

    useEffect(() => {
        if (orderEntity.orderMethod !== OrderMethod.Delivery && orderEntity.deliverTo) {
            dispatch(changeEntityField({
                name: 'deliverTo',
                value: null,
            }));
        }
    }, [dispatch, orderEntity.deliverTo, orderEntity.orderMethod]);

    useEffect(() => {
        if (!orderEntity.customer?.id && orderEntity.deliverTo) {
            dispatch(changeEntityField({
                name: 'deliverTo',
                value: null,
            }));
        }
    }, [dispatch, orderEntity.customer?.id, orderEntity.deliverTo]);

    const findCombinationVariants = () => {
        const formValues = variantDialog.selectedRetailAttributes;

        // Extract the attributeTax IDs from item.attributes
        const requiredAttributeIds = variantDialog.product.attributes?.map(attr => attr.attributeTax.id);

        // Extract the taxonomy IDs from formValues
        const selectedTaxonomyIds = formValues?.map(value => value.taxonomy.id);

        // Check if all required attributeTax IDs are present in the selected taxonomy IDs
        const hasAllAttributes = requiredAttributeIds?.every(id => selectedTaxonomyIds.includes(id));

        if (!hasAllAttributes) {
            setVariantDialog({
                ...variantDialog,
                availableVariants: []
            });
            return;
        }

        const variantsArray = [];

        for (const variant of variantDialog.product.variants) {
            let isMatch = true; // Assume the variant is a match initially

            // Loop through each formValue (selected attribute)
            for (const formValue of formValues) {
                const attributeValue = variant.attributeValues[formValue.taxonomy.id];

                // Check if the variant has the attribute and if it matches the formValue
                if (!attributeValue || attributeValue.id !== formValue.id) {
                    isMatch = false; // If any attribute does not match, set isMatch to false
                    break; // No need to check further attributes for this variant
                }
            }

            if (isMatch) {
                variantsArray.push(variant);
            }
        }

        setVariantDialog({
            ...variantDialog,
            availableVariants: variantsArray
        });
    };

    useEffect(() => {
        if (!variantDialog.product.variants || variantDialog.product.variants.length === 0 || !variantDialog.selectedRetailAttributes || variantDialog.product.itemVariantType === 'RETAIL_SIMPLE') return;
        findCombinationVariants()
    }, [variantDialog.product.variants, JSON.stringify(variantDialog.selectedRetailAttributes)])

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

    const resetVariantDialogState = () => {
        setVariantDialog({
            visible: false,
            product: {},
            selectedRetailAttributes: [],
            chosenVariant: null,
            availableVariants: []
        });
    };

    const buildBaseStructuredEntity = useCallback(({
        includeId = false,
        includeOrderCharges = true,
        includeWholesale = false,
        processingStatus = OrderStatus.PROCESSING,
    }: {
        includeId?: boolean;
        includeOrderCharges?: boolean;
        includeWholesale?: boolean;
        processingStatus?: OrderStatus;
    } = {}): IOrder => ({
        ...(includeId && isEditMode && orderEntity?.id ? { id: orderEntity.id } : {}),
        items: orderEntity?.items?.map(item => ({
            itemId: item.itemId,
            variantId: item.variantId,
            amount: item.amount,
            price: item.price,
            selectedRetailAttributes: item.selectedRetailAttributes,
            ...(item?.discount?.value && item?.discount?.type ? {
                discount: {
                    value: item.discount.value,
                    type: item.discount.type
                }
            } : {}),
        })),
        branchId: orderEntity?.branchId,
        customer: orderEntity?.customer,
        ...(includeOrderCharges ? { orderCharges: orderEntity?.orderCharges || [] } : {}),
        scheduledAt: orderEntity?.scheduledAt ?? null,
        orderMethod: orderEntity?.orderMethod,
        deliverTo: orderEntity?.deliverTo ?? null,
        processingStatus,
        tillId: till?.id,
        ...(includeWholesale && isWholesaleMode ? { wholesale: true } : {}),
    }), [isEditMode, isWholesaleMode, orderEntity, till?.id]);

    const buildChargesPreviewPayload = useCallback(
        (): IOrder => buildBaseStructuredEntity({ includeOrderCharges: false, includeWholesale: true }),
        [buildBaseStructuredEntity]
    );

    const buildCreateStructuredEntity = useCallback(
        (): IOrder => buildBaseStructuredEntity({ includeOrderCharges: true, includeWholesale: true }),
        [buildBaseStructuredEntity]
    );

    const buildUpdateStructuredEntity = useCallback(
        (): IOrder => buildBaseStructuredEntity({ includeId: true, includeOrderCharges: true, includeWholesale: true }),
        [buildBaseStructuredEntity]
    );

    const buildCreateDraftStructuredEntity = useCallback(
        (): IOrder => buildBaseStructuredEntity({ includeOrderCharges: true, includeWholesale: true, processingStatus: OrderStatus.DRAFT }),
        [buildBaseStructuredEntity]
    );

    const buildUpdateDraftStructuredEntity = useCallback(
        (): IOrder => buildBaseStructuredEntity({ includeId: true, includeOrderCharges: true, includeWholesale: true, processingStatus: OrderStatus.DRAFT }),
        [buildBaseStructuredEntity]
    );

    useEffect(() => {
        if (!orderEntity?.branchId || hasPendingItemPriceCalculation || hasItemWithMissingPrice) {
            dispatch(clearChargesPreview());
            return;
        }

        dispatch(previewCharges(buildChargesPreviewPayload()));
    }, [buildChargesPreviewPayload, dispatch, hasItemWithMissingPrice, hasPendingItemPriceCalculation, orderEntity?.branchId]);

    const finalizeCreatedOrder = (createdOrderId?: string | null) => {
        resetVariantDialogState();
        localStorage.removeItem(cartStorageKey);
        dispatch(reset());
        setOpenPaymentModal(false);

        if (createdOrderId) {
            navigate(`/order/${createdOrderId}`);
        } else {
            navigate('/order');
        }
    };

    const ensureCreateFlowAllowed = () => {
        if (shouldGateSalesman) {
            toast.error(`${salesmanGateMessage} before placing the wholesale order.`);
            return false;
        }

        return true;
    };

    const handleUpdateOrder = async () => {
        if (!ensureCreateFlowAllowed() || !orderEntity?.id) {
            return;
        }

        try {
            setSubmittingOrder(true);
            const response = await dispatch(updateEntity(buildUpdateStructuredEntity())).unwrap();
            resetVariantDialogState();
            toast.success('Order Updated Successfully!');
            navigate(`/order/${response.data?.id || orderEntity.id}`);
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Failed to update order'));
        } finally {
            setSubmittingOrder(false);
        }
    };

    const handleCreateWithoutPayment = async () => {
        if (!ensureCreateFlowAllowed()) {
            return;
        }

        try {
            setSubmittingOrder(true);
            const response = await dispatch(createEntity(buildCreateStructuredEntity())).unwrap();
            toast.success('Order Created Successfully!');
            finalizeCreatedOrder(response.data?.id || orderEntity.id);
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Failed to create order'));
        } finally {
            setSubmittingOrder(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!ensureCreateFlowAllowed()) {
            return;
        }

        try {
            setSubmittingOrder(true);

            if (isDraftEditMode && orderEntity?.id) {
                const response = await dispatch(updateDraftEntity(buildUpdateDraftStructuredEntity())).unwrap();
                resetVariantDialogState();
                toast.success('Draft order updated successfully!');
                navigate(`/order/${response.data?.id || orderEntity.id}`);
                return;
            }

            const response = await dispatch(createDraftEntity(buildCreateDraftStructuredEntity())).unwrap();
            toast.success('Draft order saved successfully!');
            finalizeCreatedOrder(response.data?.id || orderEntity.id);
        } catch (error) {
            toast.error(getApiErrorMessage(error, isDraftEditMode ? 'Failed to update draft order' : 'Failed to save draft order'));
        } finally {
            setSubmittingOrder(false);
        }
    };

    const handleCreateWithPayment = async ({
        amount,
        tipAmount,
        transactionMethod,
    }: {
        amount: number;
        tipAmount: number;
        transactionMethod: string;
    }) => {
        if (!ensureCreateFlowAllowed()) {
            return;
        }

        let createdOrderId: string | null | undefined = null;

        try {
            setSubmittingOrder(true);
            const createResponse = await dispatch(createEntity(buildCreateStructuredEntity())).unwrap();
            createdOrderId = createResponse.data?.id || orderEntity.id;

            if (!createdOrderId) {
                toast.success('Order Created Successfully!');
                finalizeCreatedOrder(createdOrderId);
                return;
            }

            try {
                const draftBillResponse = await dispatch(createDraftBill({
                    orderId: createdOrderId,
                    payee: null,
                    createdBy: null,
                    discount: null,
                })).unwrap();
                const draftBillId = draftBillResponse.data?.id;

                if (!draftBillId) {
                    throw new Error('Draft bill was not created successfully.');
                }

                await dispatch(addPaymentToBill({
                    orderId: createdOrderId,
                    billId: draftBillId,
                    amount,
                    tipAmount,
                    transactionMethod,
                })).unwrap();

                if (isWholesaleMode) {
                    await dispatch(changeProcessingStatus({
                        id: createdOrderId,
                        orderProcessingStatus: OrderStatus.CLOSED,
                    })).unwrap();
                }

                toast.success('Order created and payment added successfully!');
            } catch (paymentError) {
                toast.error(
                    getApiErrorMessage(
                        paymentError,
                        isWholesaleMode
                            ? 'Order created and payment added, but closing the wholesale order failed. You can retry from the order details page.'
                            : 'Order created, but payment failed. You can retry from the order details page.'
                    )
                );
            }

            finalizeCreatedOrder(createdOrderId);
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Failed to create order'));
        } finally {
            setSubmittingOrder(false);
        }
    };

    const handleUpdateWithPayment = async ({
        amount,
        tipAmount,
        transactionMethod,
    }: {
        amount: number;
        tipAmount: number;
        transactionMethod: string;
    }) => {
        if (!ensureCreateFlowAllowed() || !orderEntity?.id) {
            return;
        }

        let updatedOrderId: string | null | undefined = orderEntity.id;

        try {
            setSubmittingOrder(true);
            const updateResponse = await dispatch(updateEntity(buildUpdateStructuredEntity())).unwrap();
            updatedOrderId = updateResponse.data?.id || orderEntity.id;

            if (!updatedOrderId) {
                toast.success('Order updated successfully!');
                resetVariantDialogState();
                setOpenPaymentModal(false);
                navigate('/order');
                return;
            }

            try {
                const updatedBills = updateResponse.data?.bills || [];
                const draftBill = updatedBills.find(bill => bill.status === 'DRAFT');
                const billToUse = draftBill || updatedBills[0];

                let draftBillId = billToUse?.id;

                if (!draftBillId) {
                    const draftBillResponse = await dispatch(createDraftBill({
                        orderId: updatedOrderId,
                        payee: null,
                        createdBy: null,
                        discount: null,
                    })).unwrap();
                    draftBillId = draftBillResponse.data?.id;
                }

                if (!draftBillId) {
                    throw new Error('Draft bill was not created successfully.');
                }

                await dispatch(addPaymentToBill({
                    orderId: updatedOrderId,
                    billId: draftBillId,
                    amount,
                    tipAmount,
                    transactionMethod,
                })).unwrap();

                if (isWholesaleMode) {
                    await dispatch(changeProcessingStatus({
                        id: updatedOrderId,
                        orderProcessingStatus: OrderStatus.CLOSED,
                    })).unwrap();
                }

                toast.success('Order updated and payment added successfully!');
            } catch (paymentError) {
                toast.error(
                    getApiErrorMessage(
                        paymentError,
                        isWholesaleMode
                            ? 'Order updated and payment added, but closing the wholesale order failed. You can retry from the order details page.'
                            : 'Order updated, but payment failed. You can retry from the order details page.'
                    )
                );
            }

            resetVariantDialogState();
            localStorage.removeItem(cartStorageKey);
            dispatch(reset());
            setOpenPaymentModal(false);
            navigate(`/order/${updatedOrderId}`);
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Failed to update order'));
        } finally {
            setSubmittingOrder(false);
        }
    };
    const footerTemplate = () => {
        return (
            <div className="flex items-center justify-center mt-2">
                <Button
                    variant="ghost"
                    onClick={() => setVisible(true)}
                    className="h-8 text-xs"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    {/* eslint-disable-next-line react/no-unescaped-entities */}
                    Add "{filterValue || ''}" as a new customer
                </Button>
            </div>
        )
    };

    const displayUserSelectionPricingPoint = () => {
        const branchId = orderEntity.branchId;
        if (!branchId) return null;

        const userSelectedPricingPoint = pricingPoints.find(
            (pricingPoint) =>
                pricingPoint.type === PricingPointType.USER_SELECTED &&
                pricingPoint.applicableBranches?.some(branch => branch.id === branchId)
        );

        if (userSelectedPricingPoint) {
            return (
                <Select
                    options={pricingPointOptions}
                    value={pricingPointOptions.find(option => option.value === pricingPointId) || null}
                    onChange={(option) => setPricingPointId(option?.value || '')}
                    placeholder="Pricing point"
                    className="text-xs"
                    isClearable
                />
            );
        }

        return null;
    }


    const closePopUp = (id) => {
        setVisible(false)
        // dispatch(changeEntityField({
        //     name: 'customer',
        //     value: {
        //         id,
        //     },
        // }))
    }

    const cartItems = orderEntity.items ?? [];
    const cartItemCount = cartItems.length;
    const cartQuantityTotal = useMemo(() => {
        return cartItems.reduce((acc, item) => {
            const byWeight = productById.get(item.itemId)?.byWeight;
            if (byWeight) {
                return acc + 1;
            }
            return acc + (item.amount ?? 0);
        }, 0);
    }, [cartItems, productById]);
    const cartTotals = useMemo(() => {
        return cartItems.reduce<{ itemsTotal: number; totalTaxes: number; total: number }>((acc, item) => {
            const itemTotal = item.itemTotal ?? ((item.price ?? 0) * (item.amount ?? 0));
            const taxTotal = item.taxTotal ?? 0;
            const grandTotal = item.grandTotal ?? (itemTotal + taxTotal);
            return {
                itemsTotal: acc.itemsTotal + itemTotal,
                totalTaxes: acc.totalTaxes + taxTotal,
                total: acc.total + grandTotal,
            };
        }, { itemsTotal: 0, totalTaxes: 0, total: 0 });
    }, [cartItems]);
    const previewChargeRows = useMemo<ChargePreviewRow[]>(() => {
        const rows: ChargePreviewRow[] = [];
        const seenKeys = new Set<string>();

        const buildChargeKey = (charge?: IOrderCharge | null) => {
            if (charge?.id) {
                return charge.id;
            }
            return `${charge?.chargeType || 'SERVICE_CHARGE'}-${Number(charge?.amount ?? 0).toFixed(2)}`;
        };

        const pushChargeRow = (charge: IOrderCharge | null | undefined, label: string) => {
            if (!charge) {
                return;
            }
            const amount = Number(charge.amount ?? 0);
            if (amount <= 0) {
                return;
            }

            const key = buildChargeKey(charge);
            if (seenKeys.has(key)) {
                return;
            }

            seenKeys.add(key);
            rows.push({
                key,
                label,
                amount,
            });
        };

        (chargesPreview?.orderCharges || []).forEach(charge => {
            pushChargeRow(charge, formatServiceChargeKey(charge.chargeType));
        });

        return rows;
    }, [chargesPreview]);
    const previewChargesTotal = useMemo(() => {
        return previewChargeRows.reduce((sum, charge) => sum + charge.amount, 0);
    }, [previewChargeRows]);
    const finalPayableTotal = cartTotals.total + previewChargesTotal;
    const previewUnavailableMessage = chargesPreviewError
        ? 'Charge preview unavailable. Final charges will be recalculated when the order is submitted.'
        : null;

    const orderMethodOptions = useMemo(
        () => Object.values(OrderMethod)
            .filter((type) => type !== OrderMethod.DineIn)
            .map(type => ({
                value: type,
                label: formatPricingPointOrderType(type),
            })),
        []
    );

    const customerOptions = useMemo<CustomerOption[]>(
        () => customerSearchResults.map(customer => ({
            value: customer.id,
            label: formatCustomerLabel(customer),
            customer,
        })),
        [customerSearchResults]
    );

    const selectedCustomer = useMemo(
        () => customerSearchResults.find(customer => customer.id === orderEntity.customer?.id)
            || selectedCustomerRecord
            || customers.find(customer => customer.id === orderEntity.customer?.id)
            || orderEntity.customer
            || null,
        [customerSearchResults, customers, orderEntity.customer, selectedCustomerRecord]
    );

    const deliveryAddressOptions = useMemo(() => {
        const addresses = selectedCustomer?.deliveryAddresses || [];
        return addresses.map(address => {
            const label = address.address
                || address.fullAddress
                || [address.street, address.city, address.country].filter(Boolean).join(', ')
                || 'Delivery address';
            return {
                value: address.id ?? address.tempId ?? label,
                label,
                address,
            };
        });
    }, [selectedCustomer]);

    const pricingPointOptions = useMemo(
        () => pricingPoints
            .filter(pricingPoint => pricingPoint.type === PricingPointType.USER_SELECTED
                && pricingPoint.applicableBranches?.some(branch => branch.id === orderEntity.branchId))
            .map(pricingPoint => ({
                value: pricingPoint.id,
                label: pricingPoint.name,
            })),
        [pricingPoints, orderEntity.branchId]
    );

    const discountTypeOptions = useMemo(
        () => ([
            { value: 'PERCENTAGE', label: 'Percentage' },
            { value: 'FLAT', label: 'Flat' },
        ]),
        []
    );

    const selectedBranchName = useMemo(() => {
        if (!orderEntity?.branchId) return null;
        return branchRegistry.find(reg => reg.branch?.id === orderEntity.branchId)?.branch?.name;
    }, [orderEntity.branchId, branchRegistry]);

    const branchSelectOptions = useMemo(() => {
        const filtered = branchRegistry.filter((res) => {
            if (selectedRegistryId) {
                return res.id === selectedRegistryId;
            } else {
                // In prefilled flows, include the branch that matches the order's branchId
                if (hasInitialOrderState && orderEntity?.branchId && res.branch?.id === orderEntity.branchId) {
                    return true;
                }
                return res.type === RegisterType.ONLINE;
            }
        });
        
        // Ensure we have the branch in prefilled flows even if it doesn't match the filter
        if (hasInitialOrderState && orderEntity?.branchId && !filtered.some(reg => reg.branch?.id === orderEntity.branchId)) {
            const matchingRegistry = branchRegistry.find(reg => reg.branch?.id === orderEntity.branchId);
            if (matchingRegistry) {
                filtered.push(matchingRegistry);
            }
        }
        
        return filtered.map((registry) => ({
            value: registry.id,
            label: registry?.branch?.name || 'Unknown Branch',
            registry,
        }));
    }, [branchRegistry, selectedRegistryId, hasInitialOrderState, orderEntity?.branchId]);

    const handleCustomerInputChange = useCallback((value: string, { action }: { action: string }) => {
        if (action === 'input-change') {
            setFilterValue(value);
            void loadCustomers(value);
        }
        return value;
    }, [loadCustomers]);

    const CustomerMenuList = (props) => (
        <components.MenuList {...props}>
            {props.children}
            {footerTemplate()}
        </components.MenuList>
    );

    // const CartPanel = ({ className }: { className?: string }) => (
    //     <div
    //         className={cn(
    //             "flex h-full flex-col gap-4 rounded-2xl border border-border/70 bg-white p-4 shadow-lg",
    //             className
    //         )}
    //     >
    //         <div className="flex items-center justify-between">
    //             <div>
    //                 <p className="text-sm font-semibold">Cart</p>
    //                 <p className="text-xs text-muted-foreground">
    //                     {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
    //                 </p>
    //             </div>
    //             <Badge className="rounded-full px-2 py-1 text-[10px] uppercase tracking-wider">
    //                 POS
    //             </Badge>
    //         </div>
    //         <div className="flex-1 space-y-3 overflow-y-auto pr-1">
    //             {cartItems.length === 0 ? (
    //                 <div className="rounded-lg border border-dashed border-border/60 bg-muted-foreground/20 p-4 text-xs text-muted-foreground">
    //                     Cart is empty. Add products to start.
    //                 </div>
    //             ) : (
    //                 cartItems.map(product => (
    //                     <Card key={product.cartId} className="border border-border/60 bg-white/90 shadow-sm">
    //                         <CardContent className="space-y-3">
    //                             <div className="flex items-start justify-between gap-2">
    //                                 <div>
    //                                     <p className="text-sm font-semibold">{product.variantName}</p>
    //                                     {product.selectedRetailAttributes?.length > 0 && (
    //                                         <p className="text-[10px] text-muted-foreground">
    //                                             Attributes: {product.selectedRetailAttributes?.map(attr => attr.name).join(', ')}
    //                                         </p>
    //                                     )}
    //                                 </div>
    //                                 <Button
    //                                     variant="ghost"
    //                                     size="sm"
    //                                     className="h-6 w-6 p-0 text-destructive"
    //                                     onClick={(e) => {
    //                                         e.stopPropagation();
    //                                         dispatch(changeEntityField({
    //                                             name: 'items',
    //                                             value: cartItems.filter(item => item.cartId !== product.cartId)
    //                                         }))
    //                                     }}
    //                                 >
    //                                     <RiDeleteBin6Fill size={16} />
    //                                 </Button>
    //                             </div>
    //                             <div className="grid grid-cols-3 gap-2 text-[10px]">
    //                                 <div className="flex flex-col gap-1">
    //                                     <Label className="text-[10px] uppercase tracking-wide">Qty</Label>
    //                                     <Input
    //                                         type="number"
    //                                         value={product.amount ?? ''}
    //                                         onChange={e => handleAmountChange(product, Number(e.target.value))}
    //                                         className="h-8 text-xs"
    //                                     />
    //                                 </div>
    //                                 <div className="flex flex-col gap-1">
    //                                     <Label className="text-[10px] uppercase tracking-wide">
    //                                         Price
    //                                         {itemPriceLoading?.[product.cartId] && (
    //                                             <Loader2 className="ml-1 inline h-3 w-3 animate-spin text-muted-foreground" />
    //                                         )}
    //                                     </Label>
    //                                     <Input
    //                                         type="number"
    //                                         placeholder="Price"
    //                                         value={product.price ?? ''}
    //                                         onChange={e => {
    //                                             const value = e.target.value;
    //                                             const numericValue = value === '' ? null : Number(value);
    //                                             handlePriceChange(product, numericValue);
    //                                         }}
    //                                         step="0.01"
    //                                         className="h-8 text-xs"
    //                                     />
    //                                 </div>
    //                                 <div className="flex flex-col gap-1">
    //                                     <Label className="text-[10px] uppercase tracking-wide">Discount</Label>
    //                                     <Input
    //                                         type="number"
    //                                         placeholder="Discount"
    //                                         value={product.customDiscount ?? ''}
    //                                         onChange={e => handleDiscountChange(product, Number(e.target.value))}
    //                                         step="0.01"
    //                                         className="h-8 text-xs"
    //                                     />
    //                                 </div>
    //                             </div>
    //                             <div className="grid grid-cols-2 gap-2 text-[10px]">
    //                                 <div className="flex flex-col gap-1">
    //                                     <Label className="text-[10px] uppercase tracking-wide">Discount Type</Label>
    //                                     <Select
    //                                         options={discountTypeOptions}
    //                                         value={discountTypeOptions.find(option => option.value === (product?.discount?.type || 'PERCENTAGE')) || null}
    //                                         onChange={(option) => handleDiscountTypeChange(product, (option?.value || 'PERCENTAGE') as 'PERCENTAGE' | 'FLAT')}
    //                                         placeholder="Type"
    //                                         className="text-xs"
    //                                     />
    //                                 </div>
    //                                 <div className="flex flex-col gap-1">
    //                                     <Label className="text-[10px] uppercase tracking-wide">Notes</Label>
    //                                     <Textarea
    //                                         placeholder="Add note..."
    //                                         className="h-16 text-xs resize-none"
    //                                     />
    //                                 </div>
    //                             </div>
    //                         </CardContent>
    //                     </Card>
    //                 ))
    //             )}
    //         </div>
    //         <div className="rounded-2xl border border-border/50 bg-muted-foreground/30 px-3 py-3 text-xs">
    //             <div className="grid grid-cols-2 gap-3">
    //                 <div className="space-y-2">
    //                     <div className="flex items-center justify-between">
    //                         <span>Items</span>
    //                         <span className="text-muted-foreground">{cartQuantityTotal}</span>
    //                     </div>
    //                     <div className="flex items-center justify-between">
    //                         <span>Sub-total</span>
    //                         <span className="text-muted-foreground">${cartTotals.itemsTotal.toFixed(2)}</span>
    //                     </div>
    //                     <div className="flex items-center justify-between text-muted-foreground">
    //                         <span>Taxes</span>
    //                         <span>${cartTotals.totalTaxes.toFixed(2)}</span>
    //                     </div>
    //                 </div>
    //                 <div className="flex flex-col items-center justify-center rounded-lg border border-border/40 bg-white/70 px-3 py-2">
    //                     <span className="text-lg font-semibold">${cartTotals.total.toFixed(2)}</span>
    //                 </div>
    //             </div>
    //             <Button
    //                 onClick={handlePayment}
    //                 disabled={cartItemCount === 0 || !orderEntity?.branchId || orderLoading}
    //                 className="mt-2 h-12 w-full justify-between text-sm bg-emerald-600 hover:bg-emerald-700"
    //             >
    //                 <span>Pay</span>
    //                 <span>${cartTotals.total.toFixed(2)}</span>
    //             </Button>
    //             <p className="text-[10px] text-muted-foreground">
    //                 Totals are computed locally from cart item values.
    //             </p>
    //         </div>
    //     </div>
    // );

    return (
        <div className="flex h-[calc(100dvh-3rem)] min-h-0 flex-col overflow-hidden bg-muted-foreground/10">
            <Dialog open={visible} onOpenChange={setVisible}>
                <DialogContent className="max-w-[50vw]">
                    <CustomerUpdate firstName={filterValue} isPopUp closePopUp={closePopUp} />
                </DialogContent>
            </Dialog>

            <OrderPaymentDialog
                open={openPaymentModal}
                onOpenChange={setOpenPaymentModal}
                title={
                    isEditMode
                        ? (isWholesaleMode ? 'Update Wholesale Order & Payment' : 'Update Order & Payment')
                        : (isWholesaleMode ? 'Create Wholesale Order & Payment' : 'Create Order & Payment')
                }
                orderBranchId={orderEntity.branchId}
                customerId={orderEntity.customer?.id}
                totalAmount={finalPayableTotal}
                totalPaid={0}
                defaultPaymentAmount={finalPayableTotal}
                baseOrderTotal={cartTotals.total}
                chargePreviewRows={previewChargeRows}
                submitLabel="Pay"
                onSubmit={isEditMode ? handleUpdateWithPayment : handleCreateWithPayment}
                submitting={submittingOrder}
            />

            <DeliveryAddressDialog
                open={addressDialogOpen}
                onOpenChange={(open) => {
                    setAddressDialogOpen(open);
                    if (!open) {
                        setAddressDialogAddress(null);
                    }
                }}
                customer={selectedCustomer}
                address={addressDialogAddress}
                onSaved={(savedAddress) => {
                    dispatch(changeEntityField({
                        name: 'deliverTo',
                        value: savedAddress,
                    }));
                    setAddressDialogOpen(false);
                    setAddressDialogAddress(null);
                }}
            />

            <Dialog
                open={customPriceModalData.visible}
                onOpenChange={(open) => {
                    if (!open) {
                        setCustomPriceModalData({
                            visible: false,
                            product: {},
                            price: 0
                        });
                    }
                }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Set a price for this item</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 p-2">
                        <div className="space-y-2">
                            <Label htmlFor="custom-price">Price</Label>
                            <Input
                                id="custom-price"
                                type="number"
                                placeholder="Price"
                                value={customPriceModalData.price ?? ''}
                                onChange={(e) => {
                                    setCustomPriceModalData({
                                        ...customPriceModalData,
                                        price: Number(e.target.value)
                                    })
                                }}
                                step="0.01"
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                const defaultVariant = customPriceModalData.product.variants?.[0];
                                const customPrice = customPriceModalData.price ?? 0;
                                // Add item with custom price - API will calculate totals including taxes
                                addCartItem({
                                    askForPrice: true,
                                    cartId: customPriceModalData.product.id + new Date().getTime().toString(),
                                    itemId: customPriceModalData.product.id,
                                    variantId: defaultVariant?.id ?? '',
                                    itemName: customPriceModalData.product.name,
                                    variantName: defaultVariant?.name ?? '',
                                    price: customPrice,
                                    amount: 1,
                                    discount: {},
                                    selectedRetailAttributes: [],
                                    customDiscount: 0,
                                    accountingGroups: customPriceModalData.product.accountingGroups,
                                    priceOverridden: true,
                                    priceBeforeDiscount: customPrice,
                                    // Don't set itemTotal, taxTotal, grandTotal - API will calculate them
                                }, true); // Set to true to fetch price from API with priceOverride
                                setCustomPriceModalData({
                                    visible: false,
                                    product: {},
                                    price: 0
                                })
                            }}
                            className="h-8 text-xs"
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-2 overflow-hidden px-3 pb-2 pt-2">
                <Card className="border-border/60 bg-white/80 shadow-sm">
                    <CardContent className="p-2">
                        <div
                            className={cn(
                                "grid min-w-0 items-center gap-1.5",
                                isMobile
                                    ? "grid-cols-[auto,minmax(120px,150px),auto]"
                                    : "grid-cols-[auto,minmax(0,1fr),minmax(120px,160px),minmax(120px,150px),minmax(120px,150px),auto]"
                            )}
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="h-7 w-7 shrink-0 p-0">
                                    <ArrowLeft className="h-4 w-4" />
                                    <span className="sr-only">Back</span>
                                </Button>
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold leading-none">{isWholesaleMode ? 'Wholesale Order' : 'Point of Sale'}</p>
                                </div>
                            </div>
                            {!isMobile && (
                                <>
                                    <div className="relative min-w-0">
                                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Search"
                                            value={searchParams.get("name")}
                                            onChange={(e) => navigate(createQueryString('name', e.target.value))}
                                            disabled={shouldGateSalesman}
                                            className="h-7 min-w-0 pl-8 text-xs"
                                        />
                                    </div>
                                    <div className={cn("min-w-0", shouldGateSalesman ? "pointer-events-none opacity-60" : undefined)}>
                                        <DropDownFilter
                                            placeholder={'Category'}
                                            dropDownOptionType={'RETAIL_CATEGORY'}
                                            selectedOption={searchParams.get("categoryId")}
                                            fieldName={'categories.id'}
                                            handleDropdownChange={(f, v) => {
                                                if (!v.value) {
                                                    navigate(deleteQueryString('categoryId'));
                                                } else {
                                                    navigate(createQueryString('categoryId', v.value))
                                                }
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                            <Select
                                options={branchSelectOptions}
                                value={branchSelectOptions.find(opt => opt.registry?.branch?.id === orderEntity?.branchId) || null}
                                onChange={(option: any) => {
                                    if (option?.registry) {
                                        checkTillStatus(option.registry);
                                    }
                                }}
                                placeholder="Branch"
                                className="min-w-0 text-xs"
                                isClearable={false}
                            />
                            <div className="flex min-w-0 justify-end">
                                {orderEntity?.branchId ? (
                                    tillStatus !== "OPENED" ? (
                                        <Button onClick={() => setDialogTillOpen(true)} className="h-7 px-2.5 text-xs">
                                            Open Till
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => setCloseTillDialog(true)}
                                            variant="destructive"
                                            className="h-7 px-2.5 text-xs"
                                        >
                                            Close Till
                                        </Button>
                                    )
                                ) : orderEntity?.items?.length > 0 && !isEditMode ? (
                                    <span className="truncate text-[11px] text-destructive">
                                        Select a branch
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </CardContent>
                </Card>

            <Dialog open={dialogTillOpen} onOpenChange={setDialogTillOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Enter Initial Amount</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 p-2">
                        <div className="space-y-2">
                            <Label htmlFor="initial-amount">Initial Amount</Label>
                            <Input
                                id="initial-amount"
                                type="number"
                                value={initialAmount ?? ''}
                                onChange={(e) => setInitialAmount(Number(e.target.value))}
                                step="0.01"
                                placeholder="0.00"
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        {!loading && (
                            <>
                                <Button variant="ghost" onClick={() => setDialogTillOpen(false)} className="h-8 text-xs">
                                    Cancel
                                </Button>
                                <Button onClick={openTill} className="h-8 text-xs">
                                    Open Till
                                </Button>
                            </>
                        )}
                        {loading && (
                            <div className='flex justify-center w-full'>
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={closeTillDialog} onOpenChange={setCloseTillDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Enter Closing Amount</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 p-2">
                        <div className="space-y-2">
                            <Label htmlFor="closing-amount">Closing Amount</Label>
                            <Input
                                id="closing-amount"
                                type="number"
                                value={closingAmount ?? ''}
                                onChange={(e) => setClosingAmount(Number(e.target.value))}
                                step="0.01"
                                placeholder="0.00"
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        {!loading && (
                            <>
                                <Button variant="ghost" onClick={() => setCloseTillDialog(false)} className="h-8 text-xs">
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={closeTill} className="h-8 text-xs">
                                    Close Till
                                </Button>
                            </>
                        )}
                        {loading && (
                            <div className='flex justify-center w-full'>
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={variantDialog.visible}
                onOpenChange={(open) => {
                    if (!open) {
                        setVariantDialog({
                            visible: false,
                            product: {},
                            selectedRetailAttributes: [],
                            chosenVariant: null,
                            availableVariants: []
                        });
                    }
                }}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Select Attributes</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 p-2">
                        {variantDialog.product?.attributes?.map((attr, idx) => {
                            return (
                                <div className="space-y-2" key={idx}>
                                    <Label className="font-semibold">{attr.attributeTax.name}</Label>
                                    <RadioGroup
                                        value={variantDialog.selectedRetailAttributes?.find(attrVal => attrVal.taxonomy.id === attr.attributeTax.id)?.id || ''}
                                        onValueChange={(value) => {
                                            const selectedValue = attr.attributeTerms.find(attributeTerm => attributeTerm.id === value)
                                            const taxonomyExistInFormValues = variantDialog.selectedRetailAttributes.find(attr => attr.taxonomy.id === selectedValue.taxonomy.id)

                                            if (taxonomyExistInFormValues) {
                                                const index = variantDialog.selectedRetailAttributes.findIndex(attr => attr.taxonomy.id === selectedValue.taxonomy.id)
                                                variantDialog.selectedRetailAttributes[index] = {
                                                    id: selectedValue.id,
                                                    name: selectedValue.name,
                                                    taxonomy: {
                                                        id: selectedValue.taxonomy.id,
                                                        name: selectedValue.taxonomy.name
                                                    }
                                                }
                                            } else {
                                                variantDialog.selectedRetailAttributes.push({
                                                    id: selectedValue.id,
                                                    name: selectedValue.name,
                                                    taxonomy: {
                                                        id: selectedValue.taxonomy.id,
                                                        name: selectedValue.taxonomy.name
                                                    }
                                                })
                                            }
                                            setVariantDialog({
                                                ...variantDialog,
                                                selectedRetailAttributes: variantDialog.selectedRetailAttributes
                                            })
                                        }}
                                        className="flex gap-3 pl-3"
                                    >
                                        {attr?.attributeTerms?.map((variant, idx) => (
                                            <div className="flex items-center space-x-2" key={idx}>
                                                <RadioGroupItem value={variant.id} id={variant.id} />
                                                <Label htmlFor={variant.id} className="font-normal cursor-pointer">
                                                    {variant.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            )
                        })}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {variantDialog.availableVariants.map((variant, idx) => (
                                <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    disabled={shouldGateSalesman}
                                    onClick={() => {
                                        addCartItem({
                                            cartId: variantDialog.product.id + new Date().getTime().toString(),
                                            itemId: variantDialog.product.id,
                                            variantId: variant.id,
                                            itemName: variantDialog.product.name,
                                            variantName: variant.name,
                                            price: null,
                                            amount: 1,
                                            discount: {},
                                            selectedRetailAttributes: variantDialog.selectedRetailAttributes,
                                            customDiscount: 0,
                                            accountingGroups: variantDialog.product.accountingGroups,
                                        });
                                        setVariantDialog({
                                            visible: false,
                                            chosenVariant: null,
                                            selectedRetailAttributes: [],
                                            product: {},
                                            availableVariants: []
                                        });
                                    }}
                                >
                                    {variant.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>


            {(till || hasInitialOrderState) && (
                <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-12">
                    {!isMobile ? (
                        <div className="flex min-h-0 flex-col gap-4 overflow-hidden lg:col-span-8">
                            <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-border/60 bg-white/95 shadow-sm">
                                <ScrollArea className="h-0 flex-1 px-4 py-3">
                                <div className={cn("grid gap-3", isMobile ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6")}>
                                    {products.map((product, index) => (
                                        <Tooltip key={index}>
                                            <TooltipTrigger asChild>
                                                <Card
                                                className={cn(
                                                    "group overflow-hidden border-border/60 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md",
                                                    isMobile ? "h-auto" : "h-[140px]",
                                                    shouldGateSalesman ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                                                )}
                                                    onClick={() => {
                                                    if (shouldGateSalesman) {
                                                        return;
                                                    }
                                                        if (product.itemVariantType === "RETAIL_SIMPLE") {
                                                            if (product.askForPrice) {
                                                                setCustomPriceModalData({
                                                                    visible: true,
                                                                    product,
                                                                    price: 0
                                                                })
                                                            } else {
                                                                const defaultVariant = product.variants?.[0];
                                                                addCartItem({
                                                                    cartId: product.id + new Date().getTime().toString(),
                                                                    itemId: product.id,
                                                                    variantId: defaultVariant?.id ?? '',
                                                                    itemName: product.name,
                                                                    variantName: defaultVariant?.name ?? '',
                                                                    price: null,
                                                                    amount: 1,
                                                                    discount: {},
                                                                    selectedRetailAttributes: [],
                                                                    customDiscount: 0,
                                                                    accountingGroups: product.accountingGroups,
                                                                });
                                                                if (isMobile) {
                                                                    setMobileProductDialogOpen(false);
                                                                }
                                                            }
                                                        } else {
                                                            setVariantDialog({
                                                                visible: true,
                                                                product,
                                                                selectedRetailAttributes: [],
                                                                chosenVariant: null,
                                                                availableVariants: []
                                                            })
                                                        }
                                                    }}
                                                >
                                                    <CardContent className={cn("flex flex-col p-0", isMobile ? "p-2" : "h-full")}>
                                                        {!isMobile && (
                                                            <>
                                                                {product.attachments[0]?.url ? (
                                                                    <img
                                                                        src={product.attachments[0]?.url}
                                                                        alt={product.name}
                                                                        className="h-[80px] w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-[80px] items-center justify-center bg-muted/30">
                                                                        <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                        <div className="flex flex-1 flex-col gap-1 p-2">
                                                            <h6 className="text-xs font-semibold truncate">{product.name}</h6>
                                                            {!isMobile && <span className="text-[10px] text-muted-foreground">Tap to add</span>}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">{product.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            </ScrollArea>
                            <div className="border-t border-border/60 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <Badge className="rounded-full px-2 py-1 text-[10px] uppercase tracking-wider">
                                        {totalItems} items
                                    </Badge>
                                    <PaginationFilter totalPages={Math.ceil(totalItems / 24)} />
                                </div>
                            </div>
                        </Card>
                    </div>
                    ) : null}
                    <div className="flex min-h-0 flex-col gap-4 overflow-hidden lg:col-span-4">
                        {isMobile && (
                            <div className="flex justify-end">
                                <Button
                                    onClick={() => setMobileProductDialogOpen(true)}
                                    disabled={shouldGateSalesman}
                                    size="sm"
                                    className="h-8 text-xs"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Add Item
                                </Button>
                            </div>
                        )}
                        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-border/60 bg-white/95 shadow-sm">
                            <CardContent className="flex flex-col gap-2 p-3">
                                {isSalesmanMode && !isSalesmanFlowReady && (
                                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive mb-1">
                                        {salesmanGateMessage} before creating a wholesale order.
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center gap-2">
                                            <Store className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                            <div className="flex-1">
                                                <Select
                                                    options={orderMethodOptions}
                                                    value={orderMethodOptions.find(option => option.value === orderEntity?.orderMethod) || null}
                                                    onChange={(option) => {
                                                        if (!option) {
                                                            return;
                                                        }
                                                        dispatch(
                                                            changeEntityField({
                                                                name: 'orderMethod',
                                                                value: option.value as any,
                                                            })
                                                        )
                                                        localStorage.setItem(ORDER_METHOD, option.value)
                                                    }}
                                                    placeholder="Order method"
                                                    className="text-xs"
                                                    isDisabled={isSalesmanMode || shouldGateSalesman}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BadgePercent className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                            <div className="flex-1">
                                                {displayUserSelectionPricingPoint() ?? <div className="h-8" />}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                        <div className="flex-1">
                                            <Select
                                                options={customerOptions}
                                                value={
                                                    customerOptions.find(option => option.value === orderEntity?.customer?.id)
                                                    || (orderEntity?.customer?.id ? {
                                                        value: orderEntity.customer.id,
                                                        label: formatCustomerLabel(selectedCustomer),
                                                    } : null)
                                                }
                                                onChange={(option: CustomerOption | null) => {
                                                    setSelectedCustomerRecord(option?.customer ?? null);
                                                    dispatch(changeEntityField({
                                                        name: 'customer',
                                                        value: option?.value ? { id: option.value } : null,
                                                    }));
                                                    dispatch(changeEntityField({
                                                        name: 'deliverTo',
                                                        value: null,
                                                    }));
                                                }}
                                                onMenuOpen={() => {
                                                    void loadCustomers(filterValue);
                                                }}
                                                onInputChange={handleCustomerInputChange}
                                                components={{ MenuList: CustomerMenuList }}
                                                placeholder="Customer"
                                                className={cn("text-xs", isSalesmanMode && missingCustomer ? "border-destructive" : undefined)}
                                                isClearable
                                                isLoading={customerSearchLoading}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                        <div className="flex items-center gap-1">
                                            <Select
                                                options={deliveryAddressOptions}
                                                value={
                                                    deliveryAddressOptions.find(option => option.address?.id === orderEntity.deliverTo?.id)
                                                    || (orderEntity.deliverTo ? {
                                                        value: orderEntity.deliverTo.id ?? orderEntity.deliverTo.tempId ?? orderEntity.deliverTo.address ?? 'selected',
                                                        label: orderEntity.deliverTo.address
                                                            || orderEntity.deliverTo.fullAddress
                                                            || [orderEntity.deliverTo.street, orderEntity.deliverTo.city, orderEntity.deliverTo.country].filter(Boolean).join(', ')
                                                            || 'Selected address',
                                                        address: orderEntity.deliverTo,
                                                    } : null)
                                                }
                                                onChange={(option: any) => {
                                                    dispatch(changeEntityField({
                                                        name: 'deliverTo',
                                                        value: option?.address || null,
                                                    }));
                                                }}
                                                placeholder={
                                                    orderEntity.orderMethod === OrderMethod.Delivery
                                                        ? (selectedCustomer ? "Address" : "Select customer")
                                                        : "Address"
                                                }
                                                className={cn("text-xs flex-1", isSalesmanMode && missingDelivery ? "border-destructive" : undefined)}
                                                isClearable
                                                isDisabled={orderEntity.orderMethod !== OrderMethod.Delivery || !selectedCustomer}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0 flex-shrink-0"
                                                disabled={orderEntity.orderMethod !== OrderMethod.Delivery || !selectedCustomer}
                                                onClick={() => {
                                                    setAddressDialogAddress(null);
                                                    setAddressDialogOpen(true);
                                                }}
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                        <div className="flex-1">
                                            <Input
                                                ref={scheduledAtInputRef}
                                                type="datetime-local"
                                                value={scheduledAtLocal}
                                                onClick={openScheduledAtPicker}
                                                onFocus={openScheduledAtPicker}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setScheduledAtLocal(value);
                                                    dispatch(changeEntityField({
                                                        name: 'scheduledAt',
                                                        value: value ? toLocalISOString(new Date(value)) : null,
                                                    }));
                                                }}
                                                className={cn("h-8 text-xs", isSalesmanMode && missingSchedule ? "border-destructive" : undefined)}
                                                placeholder="Schedule at"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <Separator />
                            <div className="px-4 pt-3 text-[10px] uppercase tracking-wide text-muted-foreground">
                                <div className="grid w-full grid-cols-[32px,1fr,16px,110px,20px,20px] items-center gap-2 pr-2">
                                    <div>Qty</div>
                                    <div>Name</div>
                                    <div className="text-center">Taxes</div>
                                    <div className="text-right">Amount</div>
                                    <div />
                                    <div />
                                </div>
                            </div>
                            <ScrollArea className="h-0 flex-1 px-2 py-3">
                                <Accordion type="multiple" className="space-y-2">
                                    {orderEntity?.items?.map((product, idx) => {
                                        const itemTotal = product.itemTotal ?? itemPriceCalculations?.[product.cartId]?.itemTotal;
                                        const taxTotal = product.taxTotal ?? itemPriceCalculations?.[product.cartId]?.taxTotal;
                                        const grandTotal = product.grandTotal ?? itemPriceCalculations?.[product.cartId]?.grandTotal;
                                        const byWeight = productById.get(product.itemId)?.byWeight;
                                        const derivedPriceMeta = getItemPriceDisplayMeta(product);
                                        const qtyDisplay = byWeight ? 1 : (product.amount ?? 0);
                                        const inputUnitPrice = product.priceOverridden
                                            ? (product.price ?? '')
                                            : (product.price ?? derivedPriceMeta.originalPrice ?? '');
                                        const inputDisplayedPrice =
                                            inputUnitPrice === '' || inputUnitPrice == null
                                                ? null
                                                : Number(inputUnitPrice);
                                        const effectiveUnitPrice = product.priceOverridden
                                            ? (product.price ?? 0)
                                            : (derivedPriceMeta.effectivePrice ?? product.price ?? 0);
                                        const amountTotal = effectiveUnitPrice * qtyDisplay;
                                        const displayAmount = grandTotal ?? amountTotal;
                                        const showCalculatedGrandTotal =
                                            inputDisplayedPrice != null &&
                                            Number.isFinite(inputDisplayedPrice) &&
                                            Math.abs(displayAmount - inputDisplayedPrice) > 0.0001;

                                        return (
                                        <AccordionItem
                                            key={idx}
                                            value={`item-${idx}`}
                                            disabled={!orderEntity?.branchId}
                                            className="rounded-lg border border-border/60"
                                        >
                                            <AccordionTrigger className="hover:no-underline py-2">
                                                <div className='grid w-full grid-cols-[32px,1fr,16px,110px,20px,20px] items-center gap-2 pr-2 text-xs'>
                                                    <div className="text-muted-foreground">{qtyDisplay}</div>
                                                    <div className="truncate font-medium text-foreground">
                                                        {product.variantName}
                                                    </div>
                                                    <div className="text-center text-muted-foreground">
                                                        {taxTotal && taxTotal > 0 ? 'T' : ''}
                                                    </div>
                                                    <div className="text-right font-semibold">
                                                        {itemPriceLoading?.[product.cartId] ? (
                                                            <Loader2 className="ml-auto h-3 w-3 animate-spin text-muted-foreground" />
                                                        ) : showCalculatedGrandTotal ? (
                                                            <div className="flex items-center justify-end gap-1">
                                                                <span className="text-[11px] font-normal text-muted-foreground line-through">
                                                                    ${inputDisplayedPrice.toFixed(2)}
                                                                </span>
                                                                <span>${displayAmount.toFixed(2)}</span>
                                                            </div>
                                                        ) : (
                                                            `$${displayAmount.toFixed(2)}`
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                                        disabled={shouldGateSalesman}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            dispatch(changeEntityField({
                                                                name: 'items',
                                                                value: orderEntity.items.filter(item => item.cartId !== product.cartId)
                                                            }))
                                                        }}
                                                    >
                                                        <RiDeleteBin6Fill size={16} />
                                                    </Button>
                                                    <div />
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-2 pb-2">
                                                <div className="grid grid-cols-2 gap-2 mb-3">
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-xs">Quantity</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="Quantity"
                                                            value={product.amount ?? ''}
                                                            onChange={e => handleAmountChange(product, Number(e.target.value))}
                                                            disabled={shouldGateSalesman}
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-xs flex items-center gap-1">
                                                            Unit Price
                                                            {itemPriceLoading?.[product.cartId] && (
                                                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                                            )}
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="Price"
                                                            value={inputUnitPrice}
                                                            onChange={e => {
                                                                const value = e.target.value;
                                                                const numericValue = value === '' ? null : Number(value);
                                                                handlePriceChange(product, numericValue);
                                                            }}
                                                            disabled={shouldGateSalesman}
                                                            step="0.01"
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 mb-3">
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-xs">Discount</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="Discount"
                                                            value={product.customDiscount ?? ''}
                                                            onChange={e => handleDiscountChange(product, Number(e.target.value))}
                                                            disabled={shouldGateSalesman}
                                                            step="0.01"
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-xs">Discount Type</Label>
                                                        <Select
                                                            options={discountTypeOptions}
                                                            value={discountTypeOptions.find(option => option.value === (product?.discount?.type || 'PERCENTAGE')) || null}
                                                            onChange={(option) => handleDiscountTypeChange(product, (option?.value || 'PERCENTAGE') as 'PERCENTAGE' | 'FLAT')}
                                                            placeholder="Select Discount Type"
                                                            className="text-xs"
                                                        isDisabled={shouldGateSalesman}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-xs">Notes</Label>
                                                    <Textarea
                                                        placeholder="Type to add note..."
                                                        className="h-16 text-xs resize-none"
                                                    />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )})}
                                </Accordion>
                            </ScrollArea>
                            <Separator />
                            <div className="px-4 pt-1">
                                <div className='w-full flex flex-col gap-2'>
                                    {/* <div className="mb-0 w-full flex justify-between items-center">
                                        <span className="text-xs">ADD</span>
                                        <span className="flex gap-1">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button disabled variant="ghost" className="h-7 text-xs">
                                                    Discount
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80">
                                                <div className='flex flex-col gap-3'>
                                                    <div className="text-sm font-semibold">Add Discount</div>
                                                    <div className='flex justify-between items-center gap-2'>
                                                        <div className='flex items-center justify-center gap-1'>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className='h-8 w-10 text-xs'
                                                                onClick={() => dispatch(changeEntityField({
                                                                    name: 'customDiscount',
                                                                    value: {
                                                                        type: 'PERCENTAGE',
                                                                    }
                                                                }))}
                                                            >
                                                                %
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className='h-8 w-10 text-xs'
                                                                onClick={() => dispatch(changeEntityField({
                                                                    name: 'customDiscount',
                                                                    value: {
                                                                        type: 'FLAT',
                                                                    }
                                                                }))}
                                                            >
                                                                $
                                                            </Button>
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            placeholder="Discount"
                                                            value={orderEntity.customDiscount?.value ?? ''}
                                                            onChange={e => dispatch((changeEntityField({
                                                                name: 'customDiscount',
                                                                value: {
                                                                    value: Number(e.target.value),
                                                                }
                                                            })))}
                                                            className="h-8 text-xs w-24"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                    <div className='text-xs text-muted-foreground'>This discount will be applied to all items</div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <Button disabled variant="ghost" className="h-7 text-xs">
                                            Promo Code
                                        </Button>
                                        <Button disabled variant="ghost" className="h-7 text-xs">
                                            Note
                                        </Button>
                                    </span>
                                    </div> */}
                                    <div className="rounded-xl border border-border/50 bg-muted-foreground/20 p-1 text-xs">
                                    <div className="grid grid-cols-2 gap-1">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span>Items</span>
                                                <span className="text-muted-foreground">{cartQuantityTotal}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Sub-total</span>
                                                <span className="text-muted-foreground">${cartTotals.itemsTotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-muted-foreground">
                                                <span>Taxes</span>
                                                <span>${cartTotals.totalTaxes.toFixed(2)}</span>
                                            </div>
                                            {(previewChargeRows.length > 0 || previewUnavailableMessage) ? (
                                                <>
                                                    {previewChargeRows.map(charge => (
                                                        <div key={charge.key} className="flex items-center justify-between text-muted-foreground">
                                                            <span>{charge.label}</span>
                                                            <span>${charge.amount.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                    {previewUnavailableMessage ? (
                                                        <div className="pt-1 text-[10px] text-amber-700">
                                                            {previewUnavailableMessage}
                                                        </div>
                                                    ) : null}
                                                </>
                                            ) : null}
                                        </div>
                                        <div className="flex flex-col items-center justify-center rounded-lg border border-border/40 bg-white/70 px-3 py-2">
                                            <span className="text-lg font-semibold">${finalPayableTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    </div>
                                    {isEditMode ? (
                                        isDraftEditMode ? (
                                            <div className="mt-2 mb-0 grid grid-cols-2 gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="w-full flex justify-center items-center text-center h-10 text-sm"
                                                    onClick={() => {
                                                        void handleSaveDraft();
                                                    }}
                                                    disabled={orderEntity?.items.length === 0 || !orderEntity?.branchId || shouldGateSalesman || submittingOrder}
                                                >
                                                    {submittingOrder ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            <span>Saving Draft...</span>
                                                        </>
                                                    ) : (
                                                        <span>Save Draft</span>
                                                    )}
                                                </Button>
                                                <Button
                                                    className="w-full flex justify-center items-center text-center h-10 text-sm bg-emerald-600 hover:bg-emerald-700"
                                                    onClick={() => {
                                                        setOpenPaymentModal(true);
                                                    }}
                                                    disabled={orderEntity?.items.length === 0 || !orderEntity?.branchId || shouldGateSalesman || submittingOrder}
                                                >
                                                    {submittingOrder ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            <span>Processing...</span>
                                                        </>
                                                    ) : (
                                                        <span>Pay</span>
                                                    )}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="mt-2 mb-0 grid grid-cols-2 gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="w-full flex justify-center items-center text-center h-10 text-sm"
                                                    onClick={() => {
                                                        void handleUpdateOrder();
                                                    }}
                                                    disabled={orderEntity?.items.length === 0 || !orderEntity?.branchId || shouldGateSalesman || submittingOrder}
                                                >
                                                    {submittingOrder ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            <span>Updating...</span>
                                                        </>
                                                    ) : (
                                                        <span>Update Order</span>
                                                    )}
                                                </Button>
                                                <Button
                                                    className="w-full flex justify-center items-center text-center h-10 text-sm bg-emerald-600 hover:bg-emerald-700"
                                                    onClick={() => {
                                                        setOpenPaymentModal(true);
                                                    }}
                                                    disabled={orderEntity?.items.length === 0 || !orderEntity?.branchId || shouldGateSalesman || submittingOrder}
                                                >
                                                    {submittingOrder ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            <span>Processing...</span>
                                                        </>
                                                    ) : (
                                                        <span>Pay</span>
                                                    )}
                                                </Button>
                                            </div>
                                        )
                                    ) : (
                                        <>
                                            <div className="mt-2 mb-0 grid grid-cols-2 gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="w-full flex justify-center items-center text-center h-9 text-sm"
                                                    onClick={resetCreateForm}
                                                    disabled={submittingOrder}
                                                >
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                    <span>Reset Form</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="w-full flex justify-center items-center text-center h-9 text-sm text-rose-600 hover:text-rose-700"
                                                    onClick={clearCart}
                                                    disabled={orderEntity?.items.length === 0 || submittingOrder}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Clear Cart</span>
                                                </Button>
                                            </div>
                                            <div className="mt-2 mb-0 grid grid-cols-2 gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="w-full flex justify-center items-center text-center h-10 text-sm"
                                                    onClick={() => {
                                                        void handleSaveDraft();
                                                    }}
                                                    disabled={orderEntity?.items.length === 0 || !orderEntity?.branchId || shouldGateSalesman || submittingOrder}
                                                >
                                                    {submittingOrder ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            <span>Saving Draft...</span>
                                                        </>
                                                    ) : (
                                                        <span>Save Draft</span>
                                                    )}
                                                </Button>
                                                <Button
                                                    className="w-full flex justify-center items-center text-center h-10 text-sm bg-emerald-600 hover:bg-emerald-700"
                                                    onClick={() => {
                                                        setOpenPaymentModal(true);
                                                    }}
                                                    disabled={orderEntity?.items.length === 0 || !orderEntity?.branchId || shouldGateSalesman || submittingOrder}
                                                >
                                                    {submittingOrder ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            <span>Processing...</span>
                                                        </>
                                                    ) : (
                                                        <span>Pay</span>
                                                    )}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* Mobile Product Dialog */}
            <Dialog open={mobileProductDialogOpen} onOpenChange={setMobileProductDialogOpen}>
                <DialogContent className="max-w-full max-h-[85vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-4 pb-2 flex-shrink-0">
                        <DialogTitle>Add Item</DialogTitle>
                    </DialogHeader>
                    <div className="px-4 pb-2 flex-shrink-0 space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search for products"
                                value={searchParams.get("name") || ''}
                                onChange={(e) => navigate(createQueryString('name', e.target.value))}
                                className="h-10 pl-10 text-xs"
                            />
                        </div>
                        <div className={cn(shouldGateSalesman ? "pointer-events-none opacity-60" : undefined)}>
                            <DropDownFilter
                                placeholder={'Select Category'}
                                dropDownOptionType={'RETAIL_CATEGORY'}
                                selectedOption={searchParams.get("categoryId")}
                                fieldName={'categories.id'}
                                handleDropdownChange={(f, v) => {
                                    if (!v.value) {
                                        navigate(deleteQueryString('categoryId'));
                                    } else {
                                        navigate(createQueryString('categoryId', v.value))
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto px-4">
                        <div className="space-y-2 py-2">
                            {products.map((product, index) => (
                                <Card
                                    key={index}
                                    className={cn(
                                        "cursor-pointer border-border/60 transition hover:border-primary/60 hover:shadow-md",
                                        shouldGateSalesman ? "cursor-not-allowed opacity-60" : ""
                                    )}
                                    onClick={() => {
                                        if (shouldGateSalesman) {
                                            return;
                                        }
                                        if (product.itemVariantType === "RETAIL_SIMPLE") {
                                            if (product.askForPrice) {
                                                setCustomPriceModalData({
                                                    visible: true,
                                                    product,
                                                    price: 0
                                                });
                                                setMobileProductDialogOpen(false);
                                            } else {
                                                const defaultVariant = product.variants?.[0];
                                                addCartItem({
                                                    cartId: product.id + new Date().getTime().toString(),
                                                    itemId: product.id,
                                                    variantId: defaultVariant?.id ?? '',
                                                    itemName: product.name,
                                                    variantName: defaultVariant?.name ?? '',
                                                    price: null,
                                                    amount: 1,
                                                    discount: {},
                                                    selectedRetailAttributes: [],
                                                    customDiscount: 0,
                                                    accountingGroups: product.accountingGroups,
                                                });
                                                setMobileProductDialogOpen(false);
                                            }
                                        } else {
                                            setVariantDialog({
                                                visible: true,
                                                product,
                                                selectedRetailAttributes: [],
                                                chosenVariant: null,
                                                availableVariants: []
                                            });
                                            setMobileProductDialogOpen(false);
                                        }
                                    }}
                                >
                                    <CardContent className="p-3">
                                        <h6 className="text-sm font-semibold break-words">{product.name}</h6>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-border/60 p-3 flex-shrink-0">
                        <div className="flex justify-center items-center">
                            <PaginationFilter totalPages={Math.ceil(totalItems / 24)} />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            </div>
        </div>
    )
}

export default OrderCreate
