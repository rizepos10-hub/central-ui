import React, { useEffect, useState, useCallback, useRef } from 'react'
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
import { IBranch } from 'app/shared/model/branch.model';
import { toast } from 'react-toastify';
import CustomerUpdate from '../customer/customer-update';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
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
import { ArrowLeft, X, Loader2, Plus, Search, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    const searchParams = new URLSearchParams(location.search);
    const selectedRegistryId = searchParams.get("registerId");
    const branchRegistry: IBranchRegistry[] = useAppSelector(state => state.branchRegistry.entities);
    const filterInputRef = useRef();
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
    const [filteredOptions, setFilteredOptions] = useState(customers);
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

    useEffect(() => {
        setFilteredOptions(customers)
    }, [customers])

    const orderItemsRef = useRef(orderEntity.items ?? []);

    useEffect(() => {
        orderItemsRef.current = orderEntity.items ?? [];
    }, [orderEntity.items]);

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
        dispatch(reset())
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
    }, []);

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

    const addCartItem = useCallback((item: IOrder['items'][number] & { shouldFetchPrice?: boolean }, shouldFetchPrice = true) => {
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
    }, [dispatch, recalculateItemTotals]);

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
            scheduledAt: null,
            orderMethod: orderEntity?.orderMethod,
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
                <div className="pt-3 pb-3">
                    <Select
                        value={pricingPointId}
                        onValueChange={(value) => setPricingPointId(value)}
                    >
                        <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Select a Pricing Point" />
                        </SelectTrigger>
                        <SelectContent>
                            {pricingPoints
                                .filter(pricingPoint => pricingPoint.type === PricingPointType.USER_SELECTED)
                                .map(pricingPoint => (
                                    <SelectItem key={pricingPoint.id} value={pricingPoint.id} className="text-xs">
                                        {pricingPoint.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        return <></>;
    }


    const filterTemplate = (options) => {
        const handleFilterChange = (event) => {
            const value = event.target.value.toLowerCase();
            setFilterValue(value);

            // Apply manual filtering
            const filtered = customers.filter(customer =>
                `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(value)
            );
            setFilteredOptions(filtered);
        };

        const handleFilterReset = () => {
            setFilterValue('');
            setFilteredOptions(customers);
            // @ts-expect-error -- type never
            filterInputRef.current && filterInputRef.current?.focus();
        };

        return (
            <div className="flex gap-1">
                <Input
                    ref={filterInputRef}
                    value={filterValue}
                    onChange={handleFilterChange}
                    placeholder="Search"
                    className="h-8 text-xs"
                />
                <Button variant="ghost" size="sm" onClick={handleFilterReset} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    };

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

    const CartPanel = ({ className }: { className?: string }) => (
        <div
            className={cn(
                "flex h-full flex-col gap-4 rounded-2xl border border-border/70 bg-white p-4 shadow-lg",
                className
            )}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold">Cart</p>
                    <p className="text-xs text-muted-foreground">
                        {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                    </p>
                </div>
                <Badge className="rounded-full px-2 py-1 text-[10px] uppercase tracking-wider">
                    POS
                </Badge>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {cartItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 bg-muted-foreground/20 p-4 text-xs text-muted-foreground">
                        Cart is empty. Add products to start.
                    </div>
                ) : (
                    cartItems.map(product => (
                        <Card key={product.cartId} className="border border-border/60 bg-white/90 shadow-sm">
                            <CardContent className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold">{product.variantName}</p>
                                        {product.selectedRetailAttributes?.length > 0 && (
                                            <p className="text-[10px] text-muted-foreground">
                                                Attributes: {product.selectedRetailAttributes?.map(attr => attr.name).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(changeEntityField({
                                                name: 'items',
                                                value: cartItems.filter(item => item.cartId !== product.cartId)
                                            }))
                                        }}
                                    >
                                        <RiDeleteBin6Fill size={16} />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-[10px]">
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-[10px] uppercase tracking-wide">Qty</Label>
                                        <Input
                                            type="number"
                                            value={product.amount ?? ''}
                                            onChange={e => handleAmountChange(product, Number(e.target.value))}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-[10px] uppercase tracking-wide">
                                            Price
                                            {itemPriceLoading?.[product.cartId] && (
                                                <Loader2 className="ml-1 inline h-3 w-3 animate-spin text-muted-foreground" />
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
                                            step="0.01"
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-[10px] uppercase tracking-wide">Discount</Label>
                                        <Input
                                            type="number"
                                            placeholder="Discount"
                                            value={product.customDiscount ?? ''}
                                            onChange={e => handleDiscountChange(product, Number(e.target.value))}
                                            step="0.01"
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-[10px] uppercase tracking-wide">Discount Type</Label>
                                        <Select
                                            value={product?.discount?.type || 'PERCENTAGE'}
                                            onValueChange={value => handleDiscountTypeChange(product, value as 'PERCENTAGE' | 'FLAT')}
                                        >
                                            <SelectTrigger className="w-full h-7 text-xs">
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PERCENTAGE" className="text-xs">Percentage</SelectItem>
                                                <SelectItem value="FLAT" className="text-xs">Flat</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-[10px] uppercase tracking-wide">Notes</Label>
                                        <Textarea
                                            placeholder="Add note..."
                                            className="h-16 text-xs resize-none"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
            <div className="space-y-2 rounded-2xl border border-border/50 bg-muted-foreground/30 px-3 py-3 text-xs">
                <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="text-muted-foreground">Awaiting backend</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>Awaiting backend</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span>Backend total</span>
                </div>
                <Button
                    onClick={handlePayment}
                    disabled={cartItemCount === 0 || !orderEntity?.branchId || orderLoading}
                    className="mt-2 h-12 w-full justify-between text-sm bg-emerald-600 hover:bg-emerald-700"
                >
                    <span>Pay</span>
                    <span>Backend total</span>
                </Button>
                <p className="text-[10px] text-muted-foreground">
                    Totals are computed server-side once backend endpoints are ready.
                </p>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen flex-col bg-muted-foreground/10">
            <Dialog open={visible} onOpenChange={setVisible}>
                <DialogContent className="max-w-[50vw]">
                    <CustomerUpdate firstName={filterValue} isPopUp closePopUp={closePopUp} />
                </DialogContent>
            </Dialog>

            <Dialog open={openPaymentModal} onOpenChange={setOpenPaymentModal}>
                <DialogContent className="max-w-[50vw]">
                    <DialogHeader>
                        <DialogTitle>Order totals handled by backend</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 p-3">
                        <p className="text-xs text-muted-foreground">
                            Subtotal, tax, and grand total will be provided by the backend once the APIs are available. Review item prices below.
                        </p>
                        {orderEntity?.items.map(item => (
                            <div key={item.cartId || item.id} className="grid grid-cols-12 gap-2">
                                <div className="col-span-2 text-xs">{item.amount}</div>
                                <div className="col-span-7 text-xs">{item.variantName}</div>
                                <div className="col-span-3 text-right text-xs flex items-center justify-end gap-1">
                                    <span>{item.price != null ? `$${item.price.toFixed(2)}` : 'Awaiting price'}</span>
                                    {itemPriceLoading?.[item.cartId] && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                </div>
                            </div>
                        ))}
                        <div className="flex flex-col gap-1 pt-2 text-xs text-muted-foreground">
                            <span>Totals will be calculated by the backend later.</span>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                onClick={handlePayment}
                                disabled={orderLoading}
                                className="mt-3 text-lg h-12 px-4"
                            >
                                Cash
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
                                            className="h-10 pl-10 text-xs"
                                        />
                                    </div>
                                    <div className="min-w-[220px]">
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
                                <div className="flex flex-wrap gap-2">
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
                                </div>
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
                                                    className="group h-[140px] cursor-pointer overflow-hidden border-border/60 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md"
                                                    onClick={() => {
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
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">Cart</p>
                                        <p className="text-xs text-muted-foreground">Review items and apply discounts</p>
                                    </div>
                                    <Badge className="rounded-full px-2 py-1 text-[10px] uppercase tracking-wider">
                                        {cartItemCount} items
                                    </Badge>
                                </div>
                                <div className="grid gap-2">
                                    <Select
                                        value={orderEntity?.orderMethod}
                                        onValueChange={(value) => {
                                            dispatch(
                                                changeEntityField({
                                                    name: 'orderMethod',
                                                    value: value as any,
                                                })
                                            )
                                            localStorage.setItem(ORDER_METHOD, value)
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-9 text-xs">
                                            <SelectValue placeholder="Select an order method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(OrderMethod)
                                                .filter((type) => type !== OrderMethod.DineIn)
                                                .map(type => (
                                                    <SelectItem key={type} value={type} className="text-xs">
                                                        {formatPricingPointOrderType(type)}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={orderEntity?.customer?.id}
                                        onValueChange={(value) => dispatch(changeEntityField({
                                            name: 'customer',
                                            value: {
                                                id: value,
                                            },
                                        }))}
                                        onOpenChange={(open) => {
                                            if (open) {
                                                dispatch(getCustomers({
                                                    query: '',
                                                    size: 1000,
                                                    sort: 'createdAt,asc',
                                                    page: 0
                                                }))
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-9 text-xs">
                                            <SelectValue placeholder="Add a customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <div className="p-2 border-b">
                                                {filterTemplate(null)}
                                            </div>
                                            {filteredOptions.map(customer => (
                                                <SelectItem key={customer.id} value={customer.id} className="text-xs">
                                                    {`${customer.firstName ? customer.firstName : ''} ${customer.lastName ? customer.lastName : ''}`}
                                                </SelectItem>
                                            ))}
                                            <div className="p-2 border-t">
                                                {footerTemplate()}
                                            </div>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <Separator />
                            <ScrollArea className="flex-1 px-4 py-3">
                                {displayUserSelectionPricingPoint()}
                                <Accordion type="multiple" className="space-y-2">
                                    {orderEntity?.items?.map((product, idx) => {
                                        const itemTotal = product.itemTotal ?? itemPriceCalculations?.[product.cartId]?.itemTotal;
                                        const taxTotal = product.taxTotal ?? itemPriceCalculations?.[product.cartId]?.taxTotal;

                                        return (
                                        <AccordionItem
                                            key={idx}
                                            value={`item-${idx}`}
                                            disabled={!orderEntity?.branchId}
                                            className="rounded-lg border border-border/60 px-2"
                                        >
                                            <AccordionTrigger className="hover:no-underline py-2">
                                                <div className='flex justify-between items-center w-full pr-2'>
                                                    <div className="flex flex-col items-start">
                                                        <div className="mb-1 text-xs font-medium">{product.variantName}</div>
                                                        {product.selectedRetailAttributes?.length > 0 && (
                                                            <div className="text-muted-foreground text-[10px]">
                                                                Attributes: {product.selectedRetailAttributes?.map(attr => attr.name).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className='flex justify-between items-center gap-2'>
                                                        <div className="flex flex-col items-end">
                                                            <div className="mb-1 text-xs flex items-center gap-1">
                                                                {itemPriceLoading?.[product.cartId] ? (
                                                                    <>
                                                                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                                                        <span>Fetching price...</span>
                                                                    </>
                                                                ) : (
                                                                    product.price != null ? `$${product.price.toFixed(2)}` : 'Awaiting backend price'
                                                                )}
                                                            </div>
                                                        <div className="text-muted-foreground text-[10px]">Backend price</div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            Item total: {itemTotal != null ? `$${itemTotal.toFixed(2)}` : '—'}
                                                            {taxTotal && taxTotal > 0 ? ' (t)' : ''}
                                                        </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
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
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-2 pb-2">
                                                <div className="grid grid-cols-3 gap-2 mb-3">
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-xs">Quantity</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="Quantity"
                                                            value={product.amount ?? ''}
                                                            onChange={e => handleAmountChange(product, Number(e.target.value))}
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-xs flex items-center gap-1">
                                                            Price
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
                                                            step="0.01"
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-xs">Discount</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="Discount"
                                                            value={product.customDiscount ?? ''}
                                                            onChange={e => handleDiscountChange(product, Number(e.target.value))}
                                                            step="0.01"
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1 mb-3">
                                                    <Label className="text-xs">Discount Type</Label>
                                                    <Select
                                                        value={product?.discount?.type || 'PERCENTAGE'}
                                                        onValueChange={value => handleDiscountTypeChange(product, value as 'PERCENTAGE' | 'FLAT')}
                                                    >
                                                        <SelectTrigger className="w-full h-7 text-xs">
                                                            <SelectValue placeholder="Select Discount Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="PERCENTAGE" className="text-xs">Percentage</SelectItem>
                                                            <SelectItem value="FLAT" className="text-xs">Flat</SelectItem>
                                                        </SelectContent>
                                                    </Select>
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
                            <div className="px-4 pb-4 pt-3">
                                <div className='w-full flex flex-col gap-2'>
                                    <div className="mb-0 w-full flex justify-between items-center">
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
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Totals (subtotal, tax, grand total) will be calculated by the backend soon.
                                    </div>
                                    <div className="text-xs flex justify-between text-muted-foreground">
                                        <span>Items in cart</span>
                                        <span>{orderEntity?.items.length ?? 0}</span>
                                    </div>
                                    <Button
                                        className="mt-2 mb-0 w-full flex justify-between items-center h-10 text-sm bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => setOpenPaymentModal(true)}
                                        disabled={orderEntity?.items.length === 0 || !orderEntity?.branchId}
                                    >
                                        <span>Pay</span>
                                        <span>Backend total</span>
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