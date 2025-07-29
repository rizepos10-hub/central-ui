import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Container, Row, Col, Card, CardImg, CardBody, CardTitle, InputGroup, InputGroupText, Input } from 'reactstrap';
import { Button } from 'primereact/button';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IProduct } from 'app/shared/model/ITEM/retail/product.model';
import { filterEntities as getProducts } from "app/entities/item/retail/product/product.reducer";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { changeEntityField, createEntity, reset } from './order.reducer';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { RiDeleteBin6Fill } from "react-icons/ri";
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import PaginationFilter from 'app/shared/components/pagination/pagination-filter';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { Dropdown } from 'primereact/dropdown';
import { getFinalPrice, getPriceAfterTax } from 'app/shared/util/calculations-utils';
import { Dialog } from 'primereact/dialog';
import { ITaxonomy } from 'app/shared/model/taxonomy.model';
import { IVariantPackage } from 'app/shared/model/ITEM/retail/variable-item.model';
import { RadioButton } from 'primereact/radiobutton';
import { getEntities as getCustomers } from 'app/entities/customer/customer.reducer';
import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { IBranch } from 'app/shared/model/branch.model';
import { toast } from 'react-toastify';
import { Tooltip } from 'primereact/tooltip';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputText } from 'primereact/inputtext';
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
import { ProgressSpinner } from 'primereact/progressspinner';
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";
import { FaArrowLeft } from 'react-icons/fa';

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
            <>
                <div className="p-d-flex p-ai-center p-jc-center p-mt-2">
                    <Button
                        label={`Add "${filterValue || ''}" as a new customer`}
                        icon="pi pi-plus"
                        className="p-button-link"
                        onClick={() => setVisible(true)}
                    />
                </div>
            </>
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
                    <Dropdown
                        value={pricingPointId}
                        options={pricingPoints
                            .filter(pricingPoint => pricingPoint.type === PricingPointType.USER_SELECTED)
                            .map(pricingPoint => ({ label: pricingPoint.name, value: pricingPoint.id }))}
                        onChange={(e) => {
                            setPricingPointId(e.value);
                        }}
                        placeholder="Select a Pricing Point"
                        className='w-100'
                        showClear
                        filter
                    />
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
            <div className="p-inputgroup">
                <InputText
                    ref={filterInputRef}
                    value={filterValue}
                    onChange={handleFilterChange}
                    placeholder="Search"
                />
                <Button icon="pi pi-times" onClick={handleFilterReset} />
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
        <Container fluid className="d-flex flex-column justify-content-between" style={{
            maxWidth: '1100px',
            margin: '0 auto'
        }}>
            <Dialog header="" visible={visible} style={{ width: '50vw' }} onHide={() => {
                setVisible(false);
            }}>
                <CustomerUpdate firstName={filterValue} isPopUp closePopUp={closePopUp} />
            </Dialog>

            <Dialog
                header={`Amount to Pay : ${(calculateSubTotal() + calculateTaxes()).toFixed(2)}`}
                visible={openPaymentModal}
                style={{ width: '50vw' }}
                onHide={() => {
                    setOpenPaymentModal(false);
                }}>
                <Row className="h-100 p-1">
                    <Col md={12} className="p-1">
                        <Container>
                            {orderEntity?.items.map(item => (
                                <Row key={item.id}>
                                    <Col xs="2">{item.amount}</Col>
                                    <Col>{item.variantName}</Col>
                                    <Col xs="3" className="text-right">{item.price?.toFixed(2)}</Col>
                                </Row>
                            ))}
                            <hr />
                            <Row>
                                <Col><strong>Subtotal</strong></Col>
                                <Col className="text-right">{calculateSubTotal().toFixed(2)}</Col>
                            </Row>
                            <Row>
                                <Col>Tax No Tax</Col>
                                <Col className="text-right">{calculateTaxes().toFixed(2)}</Col>
                            </Row>
                            <hr />
                            <Row>
                                <Col><strong>SALE TOTAL</strong> {"  "} {orderEntity?.items.length} items</Col>
                                <Col className="text-right">{(calculateSubTotal() + calculateTaxes()).toFixed(2)}</Col>
                            </Row>
                            <Row className='d-flex justify-content-end'>
                                <Button
                                    color="success"
                                    className="mt-3 fs-3"
                                    onClick={handlePayment}
                                    style={{
                                        width: '70px',
                                        padding: '10px'
                                    }}
                                    disabled={orderLoading}
                                >
                                    Cash
                                </Button>
                            </Row>
                        </Container>
                    </Col>
                </Row>
            </Dialog>

            <Dialog
                header={`Set a price for this item`}
                visible={customPriceModalData.visible}
                onHide={() => {
                    setCustomPriceModalData({
                        visible: false,
                        product: {},
                        price: 0
                    });
                }}>

                <div>
                    <InputNumber
                        placeholder="Price"
                        value={customPriceModalData.price}
                        onChange={(e) => {
                            setCustomPriceModalData({
                                ...customPriceModalData,
                                price: e.value
                            })
                        }}
                        minFractionDigits={2}
                        maxFractionDigits={2}
                    />
                    <Button
                        color="success"
                        className="mt-3 mb-0 d-flex justify-content-between align-items-center"
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
                    >
                        Save
                    </Button>
                </div>
            </Dialog>
            <Row className="mb-3 h-100">
                <Col md={4} className="d-flex justify-content-between align-items-center">
                    <button type="button" className="btn btn-outline-secondary btn-icon" onClick={() => navigate(-1)}>
                        <FaArrowLeft size={16} />
                        <span className="visually-hidden">Back</span>
                    </button>

                    {branchRegistry.filter((res) => {
                        if (selectedRegistryId) {
                            return res.id === selectedRegistryId;
                        } else {
                            return res.type === RegisterType.ONLINE;
                        }
                    }).map((registry) => (
                        <div
                        key={registry.id}
                        className={`p-4 ml-5 border rounded-lg cursor-pointer flex flex-col items-center justify-center ${
                            orderEntity?.branchId === registry?.branch?.id ? 'border-green-500' : 'border-gray-300'
                        }`}
                        onClick={() => checkTillStatus(registry)}
                        >
                        <div className="text-lg font-semibold">{registry?.branch?.name}</div>
                        <div className="relative ml-4">
                            <Badge
                                value=""
                                className={`absolute bottom-0 right-0 h-5 w-5 border-2 border-white rounded-full p-1 ${
                                    tillList.find((till) => till?.registry?.branch?.id === registry?.branch?.id)?.status === "OPENED"
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                }`}
                            />
                        </div>
                    </div>
                    ))}

                </Col>
                <Col md={12} className="d-flex justify-content-between align-items-center">
                    {!orderEntity?.branchId && orderEntity?.items?.length > 0 && (
                        <div className="text-danger">
                            Please select a branch
                        </div>
                    )}
                </Col>  
                {orderEntity?.branchId && (
                    <div style={{ marginTop: "20px" }}>
                            {tillStatus !== "OPENED" ? (
                        <Button
                            onClick={() => setDialogTillOpen(true)}
                            className="p-button-primary"
                        >
                            Open Till
                        </Button>
                        ) : (
                        <>
                            <Button
                            onClick={() => setCloseTillDialog(true)}
                            className="p-button-danger float-end"
                            style={{ marginLeft: "10px" }}
                            >
                            Close Till
                            </Button>
                        </>
                        )}
                    </div>
                    )}
            </Row>

            <Dialog
                visible={dialogTillOpen}
                onHide={() => setDialogTillOpen(false)}
                header="Enter Initial Amount"
                footer={
                <>
                    {!loading && <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={() => setDialogTillOpen(false)} /> &&
                    <Button label="Open Till" icon="pi pi-check" className="p-button-primary" onClick={openTill} />}

                    {
                        loading && 
                        <div className='d-flex justify-content-center'>
                            <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
                        </div>
                    }
                </>
                }
            >
                <div className="flex flex-column gap-2">
                <label>Initial Amount</label>
                <InputNumber
                    value={initialAmount}
                    onValueChange={(e) => setInitialAmount(e.value)}
                    mode="currency"
                    currency="USD"
                    className="w-full"
                />
                </div>
            </Dialog>

            <Dialog
                visible={closeTillDialog}
                onHide={() => setCloseTillDialog(false)}
                header="Enter Closing Amount"
                footer={
                <>
                    {!loading && 
                    <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={() => setCloseTillDialog(false)} /> &&
                    <Button label="Close Till" icon="pi pi-lock" className="p-button-danger" onClick={closeTill} />}


                    {
                        loading && 
                        <div className='d-flex justify-content-center'>
                            <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
                        </div>
                    }

                </>
                }
            >
                <div className="flex flex-column gap-2">
                <label>Closing Amount</label>
                <InputNumber
                    value={closingAmount}
                    onValueChange={(e) => setClosingAmount(e.value)}
                    mode="currency"
                    currency="USD"
                    className="w-full"
                />
                </div>
            </Dialog>


            {till && <Row className="mb-3 h-100">
                <Col md={8}>
                    <Row>
                        <Col md={6}>
                            <InputGroup>
                                <InputGroupText>Search for products</InputGroupText>
                                <Input
                                    placeholder="Search for products"
                                    value={searchTermProduct}
                                    onChange={(e) => setSearchTermProduct(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={6}>
                            <InputGroup>
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
                            </InputGroup>
                        </Col>
                    </Row>
                </Col>
                <Col md={4} className="d-flex justify-content-end gap-2">
                    <Button disabled color="primary">Retrieve Sale</Button>
                    <Button disabled color="primary">Park Sale</Button>
                    <Button disabled color="primary" onClick={(e) => moreActionsOP.current.toggle(e)}>More Actions</Button>
                    <OverlayPanel ref={moreActionsOP} showCloseIcon>
                        <div className="d-flex flex-column gap-2">
                            <Button color="primary" className='w-100'>Create quote</Button>
                            <Button color="primary" className='w-100'>Mark as unfulfilled...</Button>
                            <Button color="primary" className='w-100'>Discard sale</Button>
                        </div>
                    </OverlayPanel>
                </Col>
            </Row>
            &&
            <Row style={{
                height: '80vh'
            }}>
                <Col md={8} className="p-1 h-100">
                    <Row style={{
                        maxHeight: '100%',
                        overflowY: 'auto'
                    }}>
                        <Dialog
                            header="Select Attributes"
                            visible={variantDialog.visible}
                            style={{ width: '50vw' }}
                            onHide={() => {
                                setVariantDialog({
                                    visible: false,
                                    product: {},
                                    selectedRetailAttributes: [],
                                    chosenVariant: null,
                                    availableVariants: []
                                });
                            }}
                        >
                            <p className="m-0">
                                {variantDialog.product?.attributes?.map((attr, idx) => {
                                    return (
                                        <div className="flex flex-wrap gap-3" key={idx}>
                                            <div className='flex flex-column gap-2'>
                                                <div className="flex align-items-center fw-semibold">
                                                    <label htmlFor={attr.attributeTax.id} className="ml-2">{attr.attributeTax.name}</label>
                                                </div>
                                                <div className='flex gap-2 ps-3'>
                                                    {attr?.attributeTerms?.map((variant, idx) => (
                                                        <div className="flex align-items-center" key={idx}>
                                                            <RadioButton
                                                                inputId={variant.id}
                                                                className="w-100 mb-2"
                                                                name={variant.id}
                                                                value={variant.id}
                                                                onChange={e => {
                                                                    const selectedValue = attr.attributeTerms.find(attributeTerm => attributeTerm.id === e.value)

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
                                                                checked={variant.id === variantDialog.selectedRetailAttributes?.find(attrVal => attrVal.taxonomy.id === attr.attributeTax.id)?.id}
                                                            />
                                                            <label htmlFor={variant.id} className="ml-2">{variant.name}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div className="flex flex-wrap gap-3">
                                    {variantDialog.availableVariants.map((variant, idx) => (
                                        <Button
                                            key={idx}
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
                            </p>
                        </Dialog>
                        {products.map((product, index) => (
                            <Col md={2} key={index} className="p-1 m-0">
                                <Tooltip target={`.card-${index}`} />
                                <Card
                                    data-pr-tooltip={product.name}
                                    data-pr-position="top"
                                    className={`p-0 card-${index}`}
                                    style={{
                                        height: '120px',
                                        width: '100%',
                                        cursor: 'pointer'
                                    }}
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
                                    {product.attachments[0]?.url && (
                                        <CardImg top height="75px" width="100%" src={product.attachments[0]?.url} alt={product.name} />
                                    )}
                                    <CardBody style={{ height: '100px' }}>
                                        <CardTitle tag="h6" className="text-truncate">{product.name}</CardTitle>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    <Row>
                        <Col md={12} className="d-flex justify-content-center align-items-center pt-2">
                            <PaginationFilter totalPages={Math.ceil(totalItems / 24)} />
                        </Col>
                    </Row>
                </Col>

                <Col md={4} className="p-2 flex flex-column justify-content-between gap-2" style={{
                    height: '80vh'
                }}>

                    <div className="px-2">
                        <Dropdown
                            options={Object.values(OrderMethod)
                                .filter((type) => type !== OrderMethod.DineIn)
                                .map(type => ({
                                    label: formatPricingPointOrderType(type),
                                    value: type
                                }))}
                            placeholder="Select an order method"
                            value={orderEntity?.orderMethod} // Replace this with your actual state field
                            onChange={(e) =>{
                                dispatch(
                                    changeEntityField({
                                        name: 'orderMethod',
                                        value: e.value,
                                    })
                                )
                                localStorage.setItem(ORDER_METHOD, e.value)
                            }}
                            className="w-100"
                            showClear
                            filter
                            filterTemplate={filterTemplate}
                        />
                    </div>

                    <div className="px-2">
                        <Dropdown
                            options={filteredOptions.map(customer => ({
                                label: `${customer.firstName ? customer.firstName : ''} ${customer.lastName ? customer.lastName : ''}`,
                                value: customer.id,
                            }))}
                            placeholder="Add a customer"
                            value={orderEntity?.customer?.id}
                            onChange={(e) => dispatch(changeEntityField({
                                name: 'customer',
                                value: {
                                    id: e.value,
                                },
                            }))}
                            className="w-100"
                            showClear
                            filter
                            filterTemplate={filterTemplate}
                            panelFooterTemplate={footerTemplate}
                            // eslint-disable-next-line @typescript-eslint/no-misused-promises
                            onFocus={() => dispatch(getCustomers({
                                query: '',
                                size: 1000,
                                sort: 'createdAt,asc',
                                page: 0
                            }))}
                        />
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
                            style={{
                                overflowX: 'hidden',
                                overflowY: 'auto',
                                maxHeight: '68%',
                                height: '68%'
                            }}>
                            {orderEntity?.items?.map((product, idx) => (
                                <AccordionTab
                                    key={idx}
                                    disabled={!orderEntity?.branchId}
                                    header={
                                        <div className='d-flex justify-content-between align-items-center'>
                                            <div className="d-flex flex-column">
                                                <div className="mb-1">{product.variantName}</div>
                                                {product.selectedRetailAttributes?.length > 0 && (
                                                    <div className="text-muted fs-6">Attributes: {product.selectedRetailAttributes?.map(attr => attr.name).join(', ')}</div>
                                                )}
                                            </div>
                                            <div className='d-flex justify-content-between align-items-center'>
                                                <div className="d-flex flex-column">
                                                    <div className="mb-1">
                                                        {calculateCustomDiscount(product?.discount?.value || 0, product.price * product.amount, product?.discount?.type || 'PERCENTAGE')}
                                                    </div>
                                                    <div className="text-muted fs-6 text-decoration-line-through">sale price</div>
                                                </div>
                                                <div
                                                    onClick={() => {
                                                        dispatch(changeEntityField({
                                                            name: 'items',
                                                            value: orderEntity.items.filter(item => item.cartId !== product.cartId)
                                                        }))
                                                    }}
                                                >
                                                    <RiDeleteBin6Fill size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    }
                                >
                                    <Row>
                                        <Col md={4} className="d-flex flex-column gap-2">
                                            <label className="mb-0">Quantity</label>
                                            <InputNumber
                                                placeholder="Quantity"
                                                inputStyle={{
                                                    width: "100px"
                                                }}
                                                value={product.amount}
                                                onChange={e => dispatch((changeEntityField({
                                                    name: 'items',
                                                    value: orderEntity.items.map(item => item.cartId === product.cartId ? {
                                                        ...item,
                                                        amount: e.value
                                                    } : item)
                                                })))}
                                            />
                                        </Col>
                                        <Col md={4} className="d-flex flex-column gap-2">
                                            <label className="mb-0">Price</label>
                                            <InputNumber
                                                placeholder="Price"
                                                inputStyle={{
                                                    width: "100px"
                                                }}
                                                minFractionDigits={2}
                                                maxFractionDigits={2}
                                                value={calculateCustomDiscount(product?.discount?.value || 0, product.price, product?.discount?.type || 'PERCENTAGE') || 0}
                                                onChange={e => dispatch((changeEntityField({
                                                    name: 'items',
                                                    value: orderEntity.items.map(item => item.cartId === product.cartId ? {
                                                        ...item,
                                                        price: e.value
                                                    } : item)
                                                })))}
                                            />
                                        </Col>
                                        <Col md={4} className="d-flex flex-column gap-2">
                                            <label className="mb-0">Discount</label>
                                            <InputNumber
                                                placeholder="Discount"
                                                inputStyle={{
                                                    width: "100px"
                                                }}
                                                value={product.customDiscount}
                                                onChange={e => dispatch((changeEntityField({
                                                    name: 'items',
                                                    value: orderEntity.items.map(item => item.cartId === product.cartId ? {
                                                        ...item,
                                                        discount: {
                                                            value: e.value,
                                                            type: product?.discount?.type || 'PERCENTAGE'
                                                        },
                                                        customDiscount: e.value
                                                    } : item)
                                                })))}
                                            />
                                        </Col>

                                        <Col md={12} className="d-flex flex-column gap-2">
                                            <label className="mb-0">Discount Type</label>
                                            <Dropdown
                                                value={product?.discount?.type || 'PERCENTAGE'}
                                                options={[
                                                    { label: "Percentage", value: "PERCENTAGE" },
                                                    { label: "Flat", value: "FLAT" }
                                                ]}

                                                onChange={e => dispatch((changeEntityField({
                                                    name: 'items',
                                                    value: orderEntity.items.map(item => item.cartId === product.cartId ? {
                                                        ...item,
                                                        discount: {
                                                            value: item?.customDiscount,
                                                            type: e.value
                                                        }
                                                    } : item)
                                                })))}

                                                placeholder="Select Discount Type"
                                                className="w-100"
                                                showClear
                                            />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={12} className="d-flex flex-column gap-2">
                                            <label className="mb-0">Notes</label>
                                            <InputTextarea
                                                placeholder="Type to add note..."
                                            />
                                        </Col>
                                    </Row>
                                </AccordionTab>
                            ))}
                        </Accordion>
                        <div className='w-100 d-flex flex-column gap-2 border-top border-bottom fw-bold' style={{
                        }}>
                            <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                                <span>
                                    ADD
                                </span>
                                <span>
                                    <OverlayPanel ref={discountOP} showCloseIcon>
                                        <div className='d-flex flex-column gap-2'>
                                            <div>Add Discount</div>
                                            <div className='d-flex justify-content-between align-items-center'>
                                                <span className='d-flex align-items-center justify-content-center'>
                                                    <Button
                                                        className='d-flex align-items-center justify-content-center'
                                                        text
                                                        raised
                                                        style={{
                                                            width: "40px",
                                                        }}
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
                                                        className='d-flex align-items-center justify-content-center'
                                                        text
                                                        raised
                                                        style={{
                                                            width: "40px",
                                                        }}
                                                        onClick={() => dispatch(changeEntityField({
                                                            name: 'customDiscount',
                                                            value: {
                                                                type: 'FLAT',
                                                            }
                                                        }))}
                                                    >
                                                        $
                                                    </Button>
                                                </span>
                                                <span>
                                                    <InputNumber
                                                        placeholder="Discount"
                                                        inputStyle={{
                                                            width: "100px"
                                                        }}
                                                        value={orderEntity.customDiscount?.value}
                                                        onChange={e => dispatch((changeEntityField({
                                                            name: 'customDiscount',
                                                            value: {
                                                                value: e.value,
                                                            }
                                                        })))}
                                                    />
                                                </span>
                                            </div>
                                            <div className='text-muted'>This discount will be applied to all items</div>
                                        </div>
                                    </OverlayPanel>
                                    <Button disabled text onClick={(e) => discountOP.current.toggle(e)}>
                                        Discount
                                    </Button>
                                    <Button text disabled>
                                        Promo Code
                                    </Button>
                                    <Button text disabled>
                                        Note
                                    </Button>
                                </span>
                            </div>
                            <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                                <span>
                                    Subtotal:
                                </span>
                                <span>
                                    {calculateSubTotal().toFixed(2)}
                                </span>
                            </div>
                            <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                                <span>
                                    Tax:
                                </span>
                                <span>
                                    {calculateTaxes().toFixed(2)}
                                </span>
                            </div>
                            <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                                <span>
                                    Total:
                                </span>
                                <span>
                                    {calculateCustomDiscount(orderEntity?.customDiscount?.value, calculateSubTotal() + calculateTaxes(), orderEntity?.customDiscount?.type).toFixed(2)}
                                </span>
                            </div>
                            <Button
                                color="success"
                                className="mt-3 mb-0 w-100 d-flex justify-content-between align-items-center"
                                onClick={() => setOpenPaymentModal(true)}
                                disabled={orderEntity?.items.length === 0 || !orderEntity?.branchId}
                            >
                                <span>
                                    Pay
                                </span>
                                <span>
                                    {(calculateSubTotal() + calculateTaxes()).toFixed(2)}
                                </span>
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row> }
        </Container >
    )
}

export default OrderCreate