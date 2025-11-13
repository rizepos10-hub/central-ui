import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IProduct } from 'app/shared/model/ITEM/retail/product.model';
import { filterEntities as getProducts } from "app/entities/item/retail/product/product.reducer";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { changeEntityField, createEntity, reset } from './order.reducer';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { RiDeleteBin6Fill } from "react-icons/ri";
import PaginationFilter from 'app/shared/components/pagination/pagination-filter';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { getFinalPrice, getPriceAfterTax } from 'app/shared/util/calculations-utils';
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
import { ArrowLeft, X, Loader2, Plus, Search } from 'lucide-react';
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
import { cn } from '@/src/main/webapp/app/lib/utils';

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
    const [searchTermProduct, setSearchTermProduct] = useState('');
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

    useEffect(() => {
        setFilteredOptions(customers)
    }, [customers])

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
        const newQuery = {
            ...query,
            page: parseInt(searchParams.get("page"), 10) - 1 || 0,
            rows: parseInt(searchParams.get("size"), 10) || 24,
            filters: {
                ...query.filters,
                'categories.id': { value: searchParams.get("categoryId"), matchMode: 'equals' },
                'name': { value: searchParams.get("name"), matchMode: 'contains' }
            }
        }
        const updatedQuery = applyMatchModeMap(newQuery);

        dispatch(getProducts({
            query: updatedQuery,
        }))
    }, [searchParams.get("page"), searchParams.get("size"), searchParams.get("name"), searchParams.get("categoryId")])

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
        debouncedItemNameNavigate(searchTermProduct);
    }, [searchTermProduct, debouncedItemNameNavigate]);

    const recalculatePrice = () => {
        console.log(orderEntity?.items, 'orderEntity?.items')
        if (orderEntity?.items?.length > 0) {
            const newOrderEntity = {
                ...orderEntity,
                items: orderEntity.items.map(item => ({
                    ...item,
                    price: item.askForPrice ? item.price : getFinalPrice({
                        branchId: orderEntity.branchId,
                        variantItem: products.find(product => product.id === item.itemId)?.variants?.find(variant => variant.id === item.variantId),
                        item: products.find(product => product.id === item.itemId),
                        customer: customers.find(customer => customer.id === orderEntity.customer?.id),
                        pricingPointId,
                        pricingPoints,
                        selectedOrderMethod: orderEntity.orderMethod
                    }),
                })),
            }
            dispatch(changeEntityField({
                name: 'items',
                value: newOrderEntity.items,
            }))
        }
    }

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return
        }
        recalculatePrice()
    }, [orderEntity?.branchId, pricingPointId, orderEntity.orderMethod]);

    const calculateCustomDiscount = (discountVal: number, originalPrice: number, type?: "PERCENTAGE" | "FLAT") => {
        if (discountVal) {
            if (type === "FLAT") {
                return originalPrice - discountVal;
            } else {
                const discountAmount = (discountVal / 100) * originalPrice;
                return originalPrice - discountAmount;
            }
        }
        return originalPrice;
    }

    const calculateSubTotal = () => {
        const subTotal = orderEntity.items.reduce((acc, item) => {
            return acc + calculateCustomDiscount(item?.discount?.value || 0, item.price * item.amount, item?.discount?.type || 'PERCENTAGE');
        }, 0);
        return subTotal;
    }

    const calculateTaxes = () => {
        const taxes = orderEntity.items.reduce((acc, item) => {
            return (acc + getPriceAfterTax(item.price, item.accountingGroups)) - item.price;
        }, 0);
        return taxes;
    }

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

        dispatch(createEntity(structuredEntity)).then(() => {
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

    return (
        <div className="flex flex-col justify-between max-w-[1100px] mx-auto p-4">
            <Dialog open={visible} onOpenChange={setVisible}>
                <DialogContent className="max-w-[50vw]">
                    <CustomerUpdate firstName={filterValue} isPopUp closePopUp={closePopUp} />
                </DialogContent>
            </Dialog>

            <Dialog open={openPaymentModal} onOpenChange={setOpenPaymentModal}>
                <DialogContent className="max-w-[50vw]">
                    <DialogHeader>
                        <DialogTitle>Amount to Pay: {(calculateSubTotal() + calculateTaxes()).toFixed(2)}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 p-1">
                        {orderEntity?.items.map(item => (
                            <div key={item.id} className="grid grid-cols-12 gap-2">
                                <div className="col-span-2 text-xs">{item.amount}</div>
                                <div className="col-span-7 text-xs">{item.variantName}</div>
                                <div className="col-span-3 text-right text-xs">{item.price?.toFixed(2)}</div>
                            </div>
                        ))}
                        <hr className="my-2" />
                        <div className="grid grid-cols-2 gap-2">
                            <strong className="text-xs">Subtotal</strong>
                            <div className="text-right text-xs">{calculateSubTotal().toFixed(2)}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="text-xs">Tax No Tax</div>
                            <div className="text-right text-xs">{calculateTaxes().toFixed(2)}</div>
                        </div>
                        <hr className="my-2" />
                        <div className="grid grid-cols-2 gap-2">
                            <strong className="text-xs">SALE TOTAL - {orderEntity?.items.length} items</strong>
                            <div className="text-right text-xs">{(calculateSubTotal() + calculateTaxes()).toFixed(2)}</div>
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
                                dispatch(changeEntityField({
                                    name: 'items',
                                    value: [
                                        ...orderEntity.items,
                                        {
                                            askForPrice: true,
                                            cartId: customPriceModalData.product.id + new Date().getTime().toString(),
                                            itemId: customPriceModalData.product.id,
                                            variantId: customPriceModalData.product.variants[0].id,
                                            itemName: customPriceModalData.product.name,
                                            variantName: customPriceModalData.product.variants[0].name,
                                            price: customPriceModalData.product.askForPrice ? customPriceModalData.price : getFinalPrice({
                                                branchId: orderEntity.branchId,
                                                variantItem: customPriceModalData.product.variants?.[0],
                                                item: customPriceModalData.product,
                                            }),
                                            amount: 1,
                                            discount: {},
                                            selectedRetailAttributes: [],
                                            customDiscount: 0,
                                            accountingGroups: customPriceModalData.product.accountingGroups,
                                        }
                                    ]
                                }))
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
            <div className="mb-3">
                <div className="flex justify-between items-center mb-3">
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="h-8 w-8 p-0">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>

                    <div className="flex gap-2">
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
                                    "p-4 border rounded-lg cursor-pointer flex flex-col items-center justify-center relative",
                                    orderEntity?.branchId === registry?.branch?.id ? 'border-green-500' : 'border-gray-300'
                                )}
                                onClick={() => checkTillStatus(registry)}
                            >
                                <div className="text-lg font-semibold">{registry?.branch?.name}</div>
                                <Badge
                                    className={cn(
                                        "absolute -top-1 -right-1 h-3 w-3 p-0 rounded-full",
                                        tillList.find((till) => till?.registry?.branch?.id === registry?.branch?.id)?.status === "OPENED"
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    {!orderEntity?.branchId && orderEntity?.items?.length > 0 && (
                        <div className="text-destructive text-sm">
                            Please select a branch
                        </div>
                    )}
                </div>

                {orderEntity?.branchId && (
                    <div className="mt-5">
                        {tillStatus !== "OPENED" ? (
                            <Button
                                onClick={() => setDialogTillOpen(true)}
                                className="h-8 text-xs"
                            >
                                Open Till
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setCloseTillDialog(true)}
                                variant="destructive"
                                className="h-8 text-xs float-right ml-2"
                            >
                                Close Till
                            </Button>
                        )}
                    </div>
                )}
            </div>

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


            {till && <div className="mb-3">
                <div className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search for products"
                                value={searchTermProduct}
                                onChange={(e) => setSearchTermProduct(e.target.value)}
                                className="pl-8 h-8 text-xs"
                            />
                        </div>
                    </div>
                    <div className="col-span-4">
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
                    <div className="col-span-4 flex justify-end gap-2">
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
                </div>
            </div>
            &&
            <div className="grid grid-cols-12 gap-2" style={{ height: '80vh' }}>
                <div className="col-span-8 p-1 h-full">
                    <div className="max-h-full overflow-y-auto">
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
                                                    dispatch(changeEntityField({
                                                        name: 'items',
                                                        value: [
                                                            ...orderEntity.items,
                                                            {
                                                                cartId: variantDialog.product.id + new Date().getTime().toString(),
                                                                itemId: variantDialog.product.id,
                                                                variantId: variant.id,
                                                                itemName: variantDialog.product.name,
                                                                variantName: variant.name,
                                                                price: getFinalPrice({
                                                                    branchId: orderEntity.branchId,
                                                                    variantItem: variant,
                                                                    item: variantDialog.product,
                                                                    pricingPointId,
                                                                    pricingPoints,
                                                                }),
                                                                amount: 1,
                                                                discount: {},
                                                                selectedRetailAttributes: variantDialog.selectedRetailAttributes,
                                                                customDiscount: 0,
                                                                accountingGroups: variantDialog.product.accountingGroups,
                                                            }
                                                        ]
                                                    }))
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
                        <div className="grid grid-cols-6 gap-2">
                            {products.map((product, index) => (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <Card
                                            className="p-0 cursor-pointer hover:border-primary transition-colors"
                                            style={{ height: '120px', width: '100%' }}
                                            onClick={() => {
                                                if (product.itemVariantType === "RETAIL_SIMPLE") {
                                                    if (product.askForPrice) {
                                                        setCustomPriceModalData({
                                                            visible: true,
                                                            product,
                                                            price: 0
                                                        })
                                                    } else {
                                                        dispatch(changeEntityField({
                                                            name: 'items',
                                                            value: [
                                                                ...orderEntity.items,
                                                                {
                                                                    cartId: product.id + new Date().getTime().toString(),
                                                                    itemId: product.id,
                                                                    variantId: product.variants[0].id,
                                                                    itemName: product.name,
                                                                    variantName: product.variants[0].name,
                                                                    price: getFinalPrice({
                                                                        branchId: orderEntity.branchId,
                                                                        variantItem: product.variants?.[0],
                                                                        item: product,
                                                                    }),
                                                                    amount: 1,
                                                                    discount: {},
                                                                    selectedRetailAttributes: [],
                                                                    customDiscount: 0,
                                                                    accountingGroups: product.accountingGroups,
                                                                }
                                                            ]
                                                        }))
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
                                            <CardContent className="p-0 h-full flex flex-col">
                                                {product.attachments[0]?.url && (
                                                    <img
                                                        src={product.attachments[0]?.url}
                                                        alt={product.name}
                                                        className="w-full h-[75px] object-cover rounded-t-md"
                                                    />
                                                )}
                                                <div className="p-2 flex-1">
                                                    <h6 className="text-xs font-medium truncate">{product.name}</h6>
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
                    </div>
                    <div className="flex justify-center items-center pt-2">
                        <PaginationFilter totalPages={Math.ceil(totalItems / 24)} />
                    </div>
                </div>

                <div className="col-span-4 p-2 flex flex-col justify-between gap-2" style={{ height: '80vh' }}>

                    <div className="px-2">
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
                            <SelectTrigger className="w-full h-8 text-xs">
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
                    </div>

                    <div className="px-2">
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
                            <SelectTrigger className="w-full h-8 text-xs">
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
                    <div
                        className="border p-2"
                        style={{
                            height: '95%',
                            maxHeight: '95%',
                        }}
                    >
                        {displayUserSelectionPricingPoint()}
                        <Accordion
                            type="multiple"
                            className="overflow-x-hidden overflow-y-auto"
                            style={{ maxHeight: '68%', height: '68%' }}
                        >
                            {orderEntity?.items?.map((product, idx) => (
                                <AccordionItem
                                    key={idx}
                                    value={`item-${idx}`}
                                    disabled={!orderEntity?.branchId}
                                >
                                    <AccordionTrigger className="hover:no-underline p-2">
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
                                                    <div className="mb-1 text-xs">
                                                        {calculateCustomDiscount(product?.discount?.value || 0, product.price * product.amount, product?.discount?.type || 'PERCENTAGE').toFixed(2)}
                                                    </div>
                                                    <div className="text-muted-foreground text-[10px] line-through">sale price</div>
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
                                                    onChange={e => dispatch((changeEntityField({
                                                        name: 'items',
                                                        value: orderEntity.items.map(item => item.cartId === product.cartId ? {
                                                            ...item,
                                                            amount: Number(e.target.value)
                                                        } : item)
                                                    })))}
                                                    className="h-7 text-xs"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label className="text-xs">Price</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Price"
                                                    value={calculateCustomDiscount(product?.discount?.value || 0, product.price, product?.discount?.type || 'PERCENTAGE') ?? ''}
                                                    onChange={e => dispatch((changeEntityField({
                                                        name: 'items',
                                                        value: orderEntity.items.map(item => item.cartId === product.cartId ? {
                                                            ...item,
                                                            price: Number(e.target.value)
                                                        } : item)
                                                    })))}
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
                                                    onChange={e => dispatch((changeEntityField({
                                                        name: 'items',
                                                        value: orderEntity.items.map(item => item.cartId === product.cartId ? {
                                                            ...item,
                                                            discount: {
                                                                value: Number(e.target.value),
                                                                type: product?.discount?.type || 'PERCENTAGE'
                                                            },
                                                            customDiscount: Number(e.target.value)
                                                        } : item)
                                                    })))}
                                                    step="0.01"
                                                    className="h-7 text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1 mb-3">
                                            <Label className="text-xs">Discount Type</Label>
                                            <Select
                                                value={product?.discount?.type || 'PERCENTAGE'}
                                                onValueChange={value => dispatch((changeEntityField({
                                                    name: 'items',
                                                    value: orderEntity.items.map(item => item.cartId === product.cartId ? {
                                                        ...item,
                                                        discount: {
                                                            value: item?.customDiscount,
                                                            type: value
                                                        }
                                                    } : item)
                                                })))}
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
                            ))}
                        </Accordion>
                        <div className='w-full flex flex-col gap-2 border-t border-b font-bold py-2'>
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
                            <div className="mb-0 w-full flex justify-between items-center text-xs">
                                <span>Subtotal:</span>
                                <span>{calculateSubTotal().toFixed(2)}</span>
                            </div>
                            <div className="mb-0 w-full flex justify-between items-center text-xs">
                                <span>Tax:</span>
                                <span>{calculateTaxes().toFixed(2)}</span>
                            </div>
                            <div className="mb-0 w-full flex justify-between items-center text-xs">
                                <span>Total:</span>
                                <span>{calculateCustomDiscount(orderEntity?.customDiscount?.value, calculateSubTotal() + calculateTaxes(), orderEntity?.customDiscount?.type).toFixed(2)}</span>
                            </div>
                            <Button
                                className="mt-3 mb-0 w-full flex justify-between items-center h-10 text-sm bg-green-600 hover:bg-green-700"
                                onClick={() => setOpenPaymentModal(true)}
                                disabled={orderEntity?.items.length === 0 || !orderEntity?.branchId}
                            >
                                <span>Pay</span>
                                <span>{(calculateSubTotal() + calculateTaxes()).toFixed(2)}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div> }
        </div>
    )
}

export default OrderCreate