import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Container, Row, Col, Card, CardImg, CardBody, CardTitle, CardSubtitle, InputGroup, InputGroupText, Input, Label } from 'reactstrap';
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

const OrderCreate = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const orderEntity: IOrder = useAppSelector(state => state.order.entity);
    const orderLoading = useAppSelector(state => state.order.loading);
    const products: IProduct[] = useAppSelector(state => state.product.entities)
    const totalItems: number = useAppSelector(state => state.product.totalItems)
    const branches: IBranch[] = useAppSelector(state => state.branch.entities)
    const customers: ICustomer[] = useAppSelector(state => state.customer.entities)

    const searchParams = new URLSearchParams(location.search);

    const filterInputRef = useRef();
    const initialRender = useRef(true);
    const moreActionsOP = useRef(null);
    const discountOP = useRef(null);

    const [filterValue, setFilterValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(customers);
    const [searchTermProduct, setSearchTermProduct] = useState('');
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
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setFilteredOptions(customers)
    }, [customers])

    const query = JSON.parse(searchParams.get("query")) || initialItemFilterState;
    useEffect(() => {
        console.log(query, 'query')
        const newQuery = {
            ...query,
            page: parseInt(searchParams.get("page"), 10) - 1 || 0,
            size: parseInt(searchParams.get("size"), 10) || 24,
            name: searchParams.get("name") || '',
            filters: {
                ...query.filters,
                'categories.id': { value: searchParams.get("categoryId"), matchMode: 'equals' }
            }
        }
        const updatedQuery = applyMatchModeMap(newQuery);
        console.log(updatedQuery, 'updatedQuery')

        dispatch(getProducts({
            query: updatedQuery,
        }))
    }, [searchParams.get("page"), searchParams.get("size"), searchParams.get("name"), searchParams.get("categoryId")])

    useEffect(() => {
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
        dispatch(reset())
    }, [])
    console.log(orderEntity, 'orderEntity')
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
        if (orderEntity?.items?.length > 0) {
            const newOrderEntity = {
                ...orderEntity,
                items: orderEntity.items.map(item => ({
                    ...item,
                    price: getFinalPrice({
                        branchId: orderEntity.branchId,
                        variantItem: products.find(product => product.id === item.itemId)?.variants?.find(variant => variant.id === item.variantId),
                        item: products.find(product => product.id === item.itemId),
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
    }, [orderEntity?.branchId]);

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
        }

        dispatch(createEntity(structuredEntity)).then(() => {
            setVariantDialog({
                visible: false,
                product: {},
                selectedRetailAttributes: [],
                chosenVariant: null,
                availableVariants: []
            })

            dispatch(reset())
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
                    placeholder="Search customers"
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
                                    <Col xs="3" className="text-right">{item.price.toFixed(2)}</Col>
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
            <Row className="mb-3 h-100">
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
                                                            <label htmlFor={variant.id} className="ml-2">Cheese</label>
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
                    <div className="px-2">Edit User
                        <Dropdown
                            options={filteredOptions.map(customer => ({
                                label: `${customer.firstName} ${customer.lastName}`,
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
                        <Dropdown
                            value={orderEntity?.branchId}
                            options={branches.map(branch => ({ label: branch.name, value: branch.id }))}
                            onChange={(e) => dispatch(changeEntityField({
                                name: 'branchId',
                                value: e.value,
                            }))}
                            placeholder="Select a Branch"
                            className='w-100'
                            showClear
                            filter
                        />
                        {!orderEntity?.branchId && orderEntity?.items?.length > 0 && (
                            <span className="text-danger">
                                Please select a branch
                            </span>
                        )}
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
                                                value={calculateCustomDiscount(product?.discount?.value || 0, product.price, product?.discount?.type || 'PERCENTAGE')}
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
            </Row>
        </Container >
    )
}

export default OrderCreate