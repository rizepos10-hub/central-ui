import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { components } from 'react-select';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IProduct } from 'app/shared/model/ITEM/retail/product.model';
import { filterEntities as getProducts } from "app/entities/item/retail/product/product.reducer";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { calculateItemPrice, changeEntityField, createEntity, reset } from './order.reducer';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { RiDeleteBin6Fill } from "react-icons/ri";
import PaginationFilter from 'app/shared/components/pagination/pagination-filter';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { ITaxonomy } from 'app/shared/model/taxonomy.model';
import { IVariantPackage } from 'app/shared/model/ITEM/retail/variable-item.model';
import { getEntities as getCustomers } from 'app/entities/customer/customer.reducer';
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
import { ArrowLeft, Loader2, Plus, Search, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

const OrderCreate = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const ORDER_METHOD = 'orderMethod';
    const orderEntity: IOrder = useAppSelector(state => state.order.entity);
    const orderLoading = useAppSelector(state => state.order.loading);
    const products: IProduct[] = useAppSelector(state => state.product.entities)
    const totalItems: number = useAppSelector(state => state.product.totalItems)
    const branches: IBranch[] = useAppSelector(state => state.branch.entities)
    const customers: ICustomer[] = useAppSelector(state => state.customer.entities)
    const pricingPoints: IPricingPoint[] = useAppSelector(state => state.pricingPoint.entities);
    const authorities = useAppSelector(state => state.authentication.account?.authorities || []);
    const searchParams = new URLSearchParams(location.search);
    const selectedRegistryId = searchParams.get("registerId");
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
    const [pricingPointId, setPricingPointId] = useState('');
    const [scheduledAtLocal, setScheduledAtLocal] = useState('');
    const [roleMode, setRoleMode] = useState<'salesman' | 'admin' | null>(null);
    const [roleChoiceOpen, setRoleChoiceOpen] = useState(false);
    const [addressDialogOpen, setAddressDialogOpen] = useState(false);
    const [addressDialogAddress, setAddressDialogAddress] = useState<IAddress | null>(null);
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
    const [visible, setVisible] = useState(false);
    const itemPriceLoading = useAppSelector(state => state.order.itemPriceLoading);
    const itemPriceCalculations = useAppSelector(state => state.order.itemPriceCalculations);
    const cartStorageKey = `pos-cart:${selectedRegistryId || 'unknown'}`;
    const isFirstContextRun = useRef(true);
    const hasHydratedCart = useRef(false);
    const hasInitializedOrder = useRef(false);
    const isSalesmanRole = authorities.includes('ROLE_WHOLESALE_SALESMAN');
    const isAdminRole = authorities.includes('ROLE_ADMINISTRATOR');
    const requiresRoleChoice = isSalesmanRole && isAdminRole;
    const isSalesmanMode = roleMode === 'salesman' || (isSalesmanRole && !isAdminRole);
    const isRoleSelectionPending = requiresRoleChoice && roleMode === null;
    const missingSchedule = !scheduledAtLocal;
    const missingCustomer = !orderEntity.customer?.id;
    const missingDelivery = isSalesmanMode && orderEntity.orderMethod === OrderMethod.Delivery && !orderEntity.deliverTo;
    const isSalesmanFlowReady = !missingSchedule && !missingCustomer && !missingDelivery;
    const shouldGateSalesman = (isSalesmanMode && !isSalesmanFlowReady) || isRoleSelectionPending;
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

    const orderItemsRef = useRef(orderEntity.items ?? []);

    useEffect(() => {
        orderItemsRef.current = orderEntity.items ?? [];
    }, [orderEntity.items]);

    useEffect(() => {
        if (!selectedRegistryId || hasInitializedOrder.current) {
            return;
        }
        hasInitializedOrder.current = true;
        const storedCart = localStorage.getItem(cartStorageKey);
        if (!storedCart) {
            dispatch(reset());
        }
    }, [cartStorageKey, dispatch, selectedRegistryId]);

    useEffect(() => {
        if (!selectedRegistryId) {
            return;
        }
        const storedCart = localStorage.getItem(cartStorageKey);
        if (!storedCart) {
            dispatch(changeEntityField({
                name: 'items',
                value: [],
            }));
            dispatch(changeEntityField({
                name: 'customer',
                value: null,
            }));
            setPricingPointId('');
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
            if (parsed?.customerId) {
                dispatch(changeEntityField({
                    name: 'customer',
                    value: { id: parsed.customerId },
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
            if (parsed?.scheduledAtLocal) {
                setScheduledAtLocal(parsed.scheduledAtLocal);
            }
            if (parsed?.scheduledAt) {
                dispatch(changeEntityField({
                    name: 'scheduledAt',
                    value: parsed.scheduledAt,
                }));
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
    }, [cartStorageKey, dispatch, selectedRegistryId]);

    useEffect(() => {
        if (!selectedRegistryId || !hasHydratedCart.current) {
            return;
        }
        const payload = {
            items: orderEntity.items ?? [],
            customerId: orderEntity.customer?.id ?? null,
            orderMethod: orderEntity.orderMethod ?? null,
            pricingPointId: pricingPointId || null,
            scheduledAtLocal: scheduledAtLocal || null,
            scheduledAt: orderEntity.scheduledAt ?? null,
            deliverTo: orderEntity.deliverTo ?? null,
        };
        localStorage.setItem(cartStorageKey, JSON.stringify(payload));
    }, [cartStorageKey, orderEntity.items, orderEntity.customer?.id, orderEntity.orderMethod, orderEntity.deliverTo, pricingPointId, selectedRegistryId, scheduledAtLocal]);

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
        checkTillStatus(branchRegistry.find(record => record.id === selectedRegistryId));
    }, [tillList])

    const checkTillStatus = (registry: IBranchRegistry) => {
        dispatch(changeEntityField({
            name: 'branchId',
            value: registry?.branch?.id,
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
            setTillStatus("CLOSED");
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
            setTillStatus("CLOSED");
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
        dispatch(getCustomers({
            query: '',
            size: 1000,
            sort: 'createdAt,asc',
            page: 0
        }))
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
    }, [])
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

        if (item.priceOverridden) {
            const itemTotal = (item.price ?? 0) * (item.amount ?? 0);
            updateCartItem(item.cartId, {
                itemTotal,
                taxTotal: item.taxTotal ?? 0,
                grandTotal: itemTotal + (item.taxTotal ?? 0),
            });
            return;
        }

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
                discountOverride,
            }
        })).then((action) => {
            if (calculateItemPrice.fulfilled.match(action)) {
                const computedPrice = item.price ?? ((item.amount ?? 1) > 0 ? action.payload.data.itemTotal / (item.amount ?? 1) : 0);
                updateCartItem(item.cartId, {
                    itemTotal: action.payload.data.itemTotal,
                    taxTotal: action.payload.data.taxTotal,
                    grandTotal: action.payload.data.grandTotal,
                    price: computedPrice,
                    priceBeforeDiscount: item.priceBeforeDiscount ?? computedPrice,
                });
            }
        });
    }, [dispatch, orderEntity.branchId, orderEntity.orderMethod, orderEntity.customer?.id, updateCartItem]);

    const recalculateAllPrices = useCallback(() => {
        const items = orderItemsRef.current ?? [];
        items.forEach(item => {
            if (!item?.priceOverridden) {
                recalculateItemTotals(item);
            }
        });
    }, [recalculateItemTotals]);

    const addCartItem = useCallback((item: IOrder['items'][number] & { shouldFetchPrice?: boolean }, shouldFetchPrice = true) => {
        if (shouldGateSalesman) {
            toast.error(`${salesmanGateMessage} before adding items.`);
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
        const quantity = item.amount ?? 0;
        const basePrice = item.priceBeforeDiscount ?? item.price ?? 0;
        const baseTotal = basePrice * quantity;
        const discountAmount = discountType === 'PERCENTAGE'
            ? (baseTotal * (discountValue ?? 0)) / 100
            : (discountValue ?? 0);
        const discountedTotal = Math.max(0, baseTotal - discountAmount);
        const discountedPrice = quantity > 0 ? discountedTotal / quantity : 0;

        updateCartItem(item.cartId, {
            discount: {
                value: discountValue,
                type: discountType,
            },
            customDiscount: discountValue,
            price: discountedPrice,
            priceOverridden: true,
            priceBeforeDiscount: basePrice,
            itemTotal: discountedTotal,
            taxTotal: 0,
            grandTotal: discountedTotal,
        });
    }, [updateCartItem]);

    const handleDiscountChange = useCallback((item: IOrder['items'][number], discountValue: number) => {
        applyCustomDiscount(item, discountValue, (item?.discount?.type || 'PERCENTAGE') as 'PERCENTAGE' | 'FLAT');
    }, [applyCustomDiscount]);

    const handleDiscountTypeChange = useCallback((item: IOrder['items'][number], type: 'PERCENTAGE' | 'FLAT') => {
        applyCustomDiscount(item, item?.customDiscount ?? 0, type);
    }, [applyCustomDiscount]);

    const handlePriceChange = useCallback((item: IOrder['items'][number], priceValue: number | null) => {
        const amount = item.amount ?? 0;
        const itemTotal = (priceValue ?? 0) * amount;
        updateCartItem(item.cartId, {
            price: priceValue,
            priceOverridden: true,
            priceBeforeDiscount: priceValue,
            itemTotal,
            grandTotal: itemTotal + (item.taxTotal ?? 0),
        });
    }, [updateCartItem]);

    useEffect(() => {
        if (isFirstContextRun.current) {
            isFirstContextRun.current = false;
            return;
        }
        recalculateAllPrices();
    }, [orderEntity.customer?.id, orderEntity.orderMethod, pricingPointId, recalculateAllPrices]);

    useEffect(() => {
        if (requiresRoleChoice) {
            setRoleChoiceOpen(true);
            setRoleMode(null);
        } else if (isSalesmanRole && !isAdminRole) {
            setRoleMode('salesman');
        } else {
            setRoleMode('admin');
        }
    }, [requiresRoleChoice, isSalesmanRole, isAdminRole]);

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

    const handlePayment = () => {
        if (shouldGateSalesman) {
            toast.error(`${salesmanGateMessage} before placing the order.`);
            return;
        }
        const structuredEntity = {
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
            orderCharges: [],
            scheduledAt: orderEntity?.scheduledAt ?? null,
            orderMethod: orderEntity?.orderMethod,
            deliverTo: orderEntity?.deliverTo ?? null,
            processingStatus: OrderStatus.PROCESSING,
            tillId: till?.id,
        }

        dispatch(createEntity(structuredEntity)).then((action) => {
            if (createEntity.fulfilled.match(action)) {
                setVariantDialog({
                    visible: false,
                    product: {},
                    selectedRetailAttributes: [],
                    chosenVariant: null,
                    availableVariants: []
                })

                const branchId = orderEntity.branchId;
                dispatch(reset());
                if (branchId) {
                    dispatch(changeEntityField({
                        name: 'branchId',
                        value: branchId,
                    }));
                }
                toast.success('Order Created Successfully!')
            } else {
                toast.error(action.error?.message || 'Failed to create order');
            }
        }).finally(() => {
            setOpenPaymentModal(false)
        })
    }
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
                <div className="">
                    <Select
                        options={pricingPointOptions}
                        value={pricingPointOptions.find(option => option.value === pricingPointId) || null}
                        onChange={(option) => setPricingPointId(option?.value || '')}
                        placeholder="Select a Pricing Point"
                        className="text-xs"
                        isClearable
                        isDisabled={shouldGateSalesman}
                    />
                </div>
            );
        }

        return <></>;
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
    const productById = useMemo(() => {
        return new Map(products.map(product => [product.id, product]));
    }, [products]);
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

    const orderMethodOptions = useMemo(
        () => Object.values(OrderMethod)
            .filter((type) => type !== OrderMethod.DineIn)
            .map(type => ({
                value: type,
                label: formatPricingPointOrderType(type),
            })),
        []
    );

    const customerOptions = useMemo(
        () => customers.map(customer => ({
            value: customer.id,
            label: `${customer.firstName ? customer.firstName : ''} ${customer.lastName ? customer.lastName : ''}`.trim() || 'Unnamed customer',
        })),
        [customers]
    );

    const selectedCustomer = useMemo(
        () => customers.find(customer => customer.id === orderEntity.customer?.id) || null,
        [customers, orderEntity.customer?.id]
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

    const handleCustomerInputChange = useCallback((value: string, { action }: { action: string }) => {
        if (action === 'input-change') {
            setFilterValue(value);
        }
        return value;
    }, []);

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
        <div className="flex min-h-screen flex-col bg-muted-foreground/10">
            <Dialog open={visible} onOpenChange={setVisible}>
                <DialogContent className="max-w-[50vw]">
                    <CustomerUpdate firstName={filterValue} isPopUp closePopUp={closePopUp} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={openPaymentModal} onOpenChange={setOpenPaymentModal}>
                <AlertDialogContent className="max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Review your order before confirming payment.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {orderEntity?.items.map(item => (
                            <div key={item.cartId || item.id} className="grid grid-cols-12 gap-2 text-sm">
                                <div className="col-span-2">{item.amount}</div>
                                <div className="col-span-7 truncate">{item.variantName}</div>
                                <div className="col-span-3 text-right flex items-center justify-end gap-1">
                                    <span>{item.price != null ? `$${item.price.toFixed(2)}` : 'Awaiting price'}</span>
                                    {itemPriceLoading?.[item.cartId] && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                </div>
                            </div>
                        ))}
                        <div className="pt-2 border-t space-y-1">
                            <div className="flex justify-between items-center text-sm">
                                <span>Items:</span>
                                <span>{cartQuantityTotal}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Sub-total:</span>
                                <span>${cartTotals.itemsTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Taxes:</span>
                                <span>${cartTotals.totalTaxes.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-semibold pt-1 border-t">
                                <span>Total:</span>
                                <span>${cartTotals.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handlePayment}
                            disabled={orderLoading || shouldGateSalesman}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {orderLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Confirm Payment'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={roleChoiceOpen} onOpenChange={() => {}}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select your mode</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 p-2 text-sm text-muted-foreground">
                        You have both administrator and wholesale salesman roles. Choose how you want to continue.
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRoleMode('admin');
                                setRoleChoiceOpen(false);
                            }}
                            className="h-9 text-xs"
                        >
                            Continue as Admin
                        </Button>
                        <Button
                            onClick={() => {
                                setRoleMode('salesman');
                                setRoleChoiceOpen(false);
                            }}
                            className="h-9 text-xs"
                        >
                            Continue as Salesman
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                    itemTotal: customPrice,
                                    taxTotal: 0,
                                    grandTotal: customPrice,
                                }, false);
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
            <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-4 pb-6 pt-4">
                <Card className="border-border/60 bg-white/80 shadow-sm">
                    <CardContent className="flex flex-col gap-4 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="h-9 w-9 p-0">
                                    <ArrowLeft className="h-4 w-4" />
                                    <span className="sr-only">Back</span>
                                </Button>
                                <div>
                                    <p className="text-sm font-semibold">Point of Sale</p>
                                    <p className="text-xs text-muted-foreground">Create a new order and take payment</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {orderEntity?.branchId && (
                                    <Badge
                                        className={cn(
                                            "rounded-full px-3 py-1 text-[10px] uppercase tracking-wider",
                                            tillStatus === "OPENED" ? "bg-emerald-600 text-white" : "bg-rose-500 text-white"
                                        )}
                                    >
                                        {tillStatus === "OPENED" ? "Till Open" : "Till Closed"}
                                    </Badge>
                                )}
                                {orderEntity?.branchId && (
                                    tillStatus !== "OPENED" ? (
                                        <Button onClick={() => setDialogTillOpen(true)} className="h-9 text-xs">
                                            Open Till
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => setCloseTillDialog(true)}
                                            variant="destructive"
                                            className="h-9 text-xs"
                                        >
                                            Close Till
                                        </Button>
                                    )
                                )}
                            </div>
                        </div>
                        <Separator />
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {branchRegistry.filter((res) => {
                                    if (selectedRegistryId) {
                                        return res.id === selectedRegistryId;
                                    } else {
                                        return res.type === RegisterType.ONLINE;
                                    }
                                }).map((registry) => (
                                    <div
                                        key={registry.id}
                                        className={cn(
                                            "relative flex min-w-[160px] flex-1 cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 transition hover:border-primary/60",
                                            orderEntity?.branchId === registry?.branch?.id
                                                ? "border-emerald-500 bg-emerald-50/40"
                                                : "border-border/70 bg-white"
                                        )}
                                        onClick={() => checkTillStatus(registry)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground">Branch</span>
                                            <span className="text-sm font-semibold">{registry?.branch?.name}</span>
                                        </div>
                                        <Badge
                                            className={cn(
                                                "h-2 w-2 rounded-full p-0",
                                                tillList.find((till) => till?.registry?.branch?.id === registry?.branch?.id)?.status === "OPENED"
                                                    ? "bg-emerald-500"
                                                    : "bg-rose-500"
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                            {!orderEntity?.branchId && orderEntity?.items?.length > 0 && (
                                <div className="text-xs text-destructive">
                                    Please select a branch
                                </div>
                            )}
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


            {till && (
                <div className="grid flex-1 gap-4 lg:grid-cols-12">
                    <div className="flex min-h-0 flex-col gap-4 lg:col-span-8 lg:h-[72vh]">
                        <Card className="border-border/60 bg-white/90 shadow-sm">
                            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-1 flex-wrap items-center gap-3">
                                    <div className="relative flex-1 min-w-[220px]">
                                        <Search className="absolute left-3 top-1/3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search for products"
                                            value={searchParams.get("name")}
                                            onChange={(e) => navigate(createQueryString('name', e.target.value))}
                                            disabled={shouldGateSalesman}
                                            className="h-10 pl-10 text-xs"
                                        />
                                    </div>
                                    <div className={cn("min-w-[220px]", shouldGateSalesman ? "pointer-events-none opacity-60" : undefined)}>
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
                                {/* <div className="flex flex-wrap gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button disabled variant="secondary" className="h-8 text-xs">More Actions</Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-48">
                                            <div className="flex flex-col gap-2">
                                                <Button variant="secondary" className='w-full h-7 text-xs'>Create quote</Button>
                                                <Button variant="secondary" className='w-full h-7 text-xs'>Mark as unfulfilled...</Button>
                                                <Button variant="secondary" className='w-full h-7 text-xs'>Discard sale</Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <Button disabled variant="secondary" className="h-8 text-xs">Retrieve Sale</Button>
                                    <Button disabled variant="secondary" className="h-8 text-xs">Park Sale</Button>
                                </div> */}
                            </CardContent>
                        </Card>
                        <Card className="flex min-h-0 flex-1 flex-col border-border/60 bg-white/95 shadow-sm">
                            <CardContent className="flex items-center justify-between p-4 pb-2">
                                <div>
                                    <p className="text-sm font-semibold">Products</p>
                                    <p className="text-xs text-muted-foreground">Tap a tile to add it to the cart</p>
                                </div>
                                <Badge className="rounded-full px-2 py-1 text-[10px] uppercase tracking-wider">
                                    {totalItems} items
                                </Badge>
                            </CardContent>
                            <Separator />
                            <ScrollArea className="flex-1 px-4 py-3">
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
                                            <div className="flex flex-wrap gap-2 mt-4">
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
                                                            })
                                                        }}>
                                                        {variant.name}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                                    {products.map((product, index) => (
                                        <Tooltip key={index}>
                                            <TooltipTrigger asChild>
                                                <Card
                                                className={cn(
                                                    "group h-[140px] overflow-hidden border-border/60 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md",
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
                                                    <CardContent className="flex h-full flex-col p-0">
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
                                                        <div className="flex flex-1 flex-col gap-1 p-2">
                                                            <h6 className="text-xs font-semibold truncate">{product.name}</h6>
                                                            <span className="text-[10px] text-muted-foreground">Tap to add</span>
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
                                <div className="flex justify-center items-center">
                                    <PaginationFilter totalPages={Math.ceil(totalItems / 24)} />
                                </div>
                            </div>
                        </Card>
                    </div>
                    <div className="flex min-h-0 flex-col gap-4 lg:col-span-4 lg:h-[72vh]">
                        <Card className="flex min-h-0 flex-1 flex-col border-border/60 bg-white/95 shadow-sm">
                            <CardContent className="flex flex-col gap-3 p-4">
                                <div className="grid gap-2">
                                    {isSalesmanMode && !isSalesmanFlowReady && (
                                        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                                            {salesmanGateMessage} before creating an order.
                                        </div>
                                    )}
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
                                        placeholder="Select an order method"
                                        className="text-xs"
                                        isDisabled={isSalesmanMode || shouldGateSalesman}
                                    />
                                    <div className="flex flex-col gap-1">
                                        <Label className={cn("text-xs", isSalesmanMode && missingCustomer ? "text-destructive" : undefined)}>
                                            Customer {isSalesmanMode && <span className="text-destructive">*</span>}
                                        </Label>
                                        <Select
                                            options={customerOptions}
                                            value={customerOptions.find(option => option.value === orderEntity?.customer?.id) || null}
                                            onChange={(option) => {
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
                                                dispatch(getCustomers({
                                                    query: '',
                                                    size: 1000,
                                                    sort: 'createdAt,asc',
                                                    page: 0
                                                }))
                                            }}
                                            onInputChange={handleCustomerInputChange}
                                            components={{ MenuList: CustomerMenuList }}
                                            placeholder="Add a customer"
                                            className="text-xs"
                                            isClearable
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Label className={cn("text-xs", isSalesmanMode && missingSchedule ? "text-destructive" : undefined)}>
                                            Schedule At {isSalesmanMode && <span className="text-destructive">*</span>}
                                        </Label>
                                        <Input
                                            type="datetime-local"
                                            value={scheduledAtLocal}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setScheduledAtLocal(value);
                                                dispatch(changeEntityField({
                                                    name: 'scheduledAt',
                                                    value: value ? toLocalISOString(new Date(value)) : null,
                                                }));
                                            }}
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                    {orderEntity.orderMethod === OrderMethod.Delivery && (
                                        <div className="flex flex-col gap-1">
                                            <Label className={cn("text-xs", isSalesmanMode && missingDelivery ? "text-destructive" : undefined)}>
                                                Delivery Address {isSalesmanMode && <span className="text-destructive">*</span>}
                                            </Label>
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
                                                placeholder={selectedCustomer ? "Select a delivery address" : "Select a customer first"}
                                                className="text-xs"
                                                isClearable
                                                isDisabled={!selectedCustomer}
                                            />
                                            {!selectedCustomer?.deliveryAddresses?.length && (
                                                <span className="text-[10px] text-muted-foreground">No delivery addresses saved.</span>
                                            )}
                                            <div className="flex justify-end">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    disabled={!selectedCustomer}
                                                    onClick={() => {
                                                        setAddressDialogAddress(null);
                                                        setAddressDialogOpen(true);
                                                    }}
                                                >
                                                    <Plus className="mr-1 h-3.5 w-3.5" />
                                                    Add address
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    {displayUserSelectionPricingPoint()}
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
                            <ScrollArea className="flex-1 px-2 py-3">
                                <Accordion type="multiple" className="space-y-2">
                                    {orderEntity?.items?.map((product, idx) => {
                                        const itemTotal = product.itemTotal ?? itemPriceCalculations?.[product.cartId]?.itemTotal;
                                        const taxTotal = product.taxTotal ?? itemPriceCalculations?.[product.cartId]?.taxTotal;
                                        const byWeight = productById.get(product.itemId)?.byWeight;
                                        const qtyDisplay = byWeight ? 1 : (product.amount ?? 0);
                                        const unitPrice = product.price ?? 0;
                                        const amountTotal = unitPrice * qtyDisplay;

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
                                                        ) : (
                                                            `$${amountTotal.toFixed(2)}`
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
                                                            value={product.price ?? ''}
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
                                        </div>
                                        <div className="flex flex-col items-center justify-center rounded-lg border border-border/40 bg-white/70 px-3 py-2">
                                            <span className="text-lg font-semibold">${cartTotals.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    </div>
                                    <Button
                                        className="mt-2 mb-0 w-full flex justify-center items-center text-center h-10 text-sm bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => setOpenPaymentModal(true)}
                                        disabled={orderEntity?.items.length === 0 || !orderEntity?.branchId || shouldGateSalesman}
                                    >
                                        <span>Place Order</span>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
            </div>
        </div>
    )
}

export default OrderCreate