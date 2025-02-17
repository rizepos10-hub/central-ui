import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
    Card,
    CardBody,
    Col,
    Container,
    Row,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Label,
    FormGroup,
    Button as RSButton,
} from 'reactstrap'
import JsBarcode from 'jsbarcode'
import { useReactToPrint } from 'react-to-print'
import { IProduct } from 'app/shared/model/ITEM/retail/product.model'
import { useAppDispatch, useAppSelector } from 'app/config/store'
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util'
import { filterEntities } from '../product/product.reducer'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { initialItemFilterState } from 'app/shared/model/filter-state.model'
import PaginationFilter from 'app/shared/components/pagination/pagination-filter'
import { Dropdown } from 'primereact/dropdown'
import { FilterMatchMode } from 'primereact/api'
import DropDownFilter from 'app/shared/components/filter/drop-down-filter'

type VariantSkus = {
    variantId: string
    variantName: string
    sku: string
}

const Barcode = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const [variantsSkus, setVariantsSkus] = useState<VariantSkus[]>([])
    const [variantsSkusToPrint, setVariantsSkusToPrint] = useState<VariantSkus[]>([])

    const barcodeRefs = useRef<(HTMLCanvasElement | null)[]>([])
    const printBarcodeRefs = useRef<(HTMLCanvasElement | null)[]>([])
    const printRef = useRef<HTMLDivElement>(null)
    const products: IProduct[] = useAppSelector(state => state.product.entities)
    const productsTotalItems = useAppSelector(state => state.product.totalItems)

    const [searchParams, setSearchParams] = useSearchParams()
    const query = JSON.parse(searchParams.get('query') || 'null') || {
        ...initialItemFilterState,
        rows: 20,
    }

    const getAllEntities = () => {
        const updatedQuery = applyMatchModeMap({
            ...query,
            page: JSON.parse((parseInt(searchParams.get('page') || '1', 10) - 1).toString() || '0'),
            rows: JSON.parse(searchParams.get('rows') || '20'),
            filters: {
                'name': { value: searchParams.get('name'), matchMode: FilterMatchMode.CONTAINS },
                'categories.id': { value: searchParams.get('categoryId'), matchMode: FilterMatchMode.EQUALS },
            },
        })

        dispatch(
            filterEntities({
                query: updatedQuery,
            })
        )
    }

    // Load selected variants from localStorage on mount
    useEffect(() => {
        const storedSelected = localStorage.getItem('selectedVariants')
        if (storedSelected) {
            setVariantsSkusToPrint(JSON.parse(storedSelected))
        }
    }, [])

    // Persist selected variants in localStorage when they change
    useEffect(() => {
        localStorage.setItem('selectedVariants', JSON.stringify(variantsSkusToPrint))
    }, [variantsSkusToPrint])

    useEffect(() => {
        getAllEntities()
        return () => {
            searchParams.set('query', '')
        }
    }, [
        searchParams.get('page'),
        searchParams.get('rows'),
        searchParams.get('name'),
        searchParams.get('categoryId'),
    ])

    // Rebuild the variants list when products change
    useEffect(() => {
        const updatedVariants: VariantSkus[] = []
        products.forEach(product => {
            product.variants.forEach(variant => {
                if (variant.sku) {
                    updatedVariants.push({
                        variantId: variant.id,
                        variantName: variant.name,
                        sku: variant.sku,
                    })
                }
            })
        })
        setVariantsSkus(updatedVariants)
    }, [products])

    // Render barcodes in the main (selection) container
    useEffect(() => {
        variantsSkus.forEach((vSku, index) => {
            if (barcodeRefs.current[index]) {
                JsBarcode(barcodeRefs.current[index]!, vSku.sku, {
                    format: 'CODE128',
                    displayValue: true,
                    lineColor: '#1a1a1a',
                    background: '#ffffff',
                    fontSize: 14,
                    margin: 10,
                })
            }
        })
    }, [variantsSkus])

    // Render barcodes in the print container (selected variants only)
    useEffect(() => {
        variantsSkusToPrint.forEach((vSku, index) => {
            if (printBarcodeRefs.current[index]) {
                JsBarcode(printBarcodeRefs.current[index]!, vSku.sku, {
                    format: 'CODE128',
                    displayValue: true,
                    lineColor: '#1a1a1a',
                    background: '#ffffff',
                    fontSize: 14,
                    margin: 10,
                })
            }
        })
    }, [variantsSkusToPrint])

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: 'Barcode Print',
    })

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams)
            params.set(name, value)
            return `?${params.toString()}`
        },
        [searchParams]
    )

    const deleteQueryString = useCallback(
        (name: string) => {
            const params = new URLSearchParams(searchParams)
            params.delete(name)
            return `?${params.toString()}`
        },
        [searchParams]
    )

    const handleNavigation = (path: string) => {
        navigate(path)
    }

    // Check if a variant is selected
    const isVariantSelected = (vSku: VariantSkus) => {
        return variantsSkusToPrint.some(item => item.variantId === vSku.variantId)
    }

    // Toggle variant selection
    const toggleVariantSelection = (vSku: VariantSkus) => {
        if (isVariantSelected(vSku)) {
            setVariantsSkusToPrint(prev => prev.filter(item => item.variantId !== vSku.variantId))
        } else {
            setVariantsSkusToPrint(prev => [...prev, vSku])
        }
    }

    // Check if all variants on the current page are selected
    const isAllSelected =
        variantsSkus.length > 0 && variantsSkus.every(vSku => isVariantSelected(vSku))

    // Toggle all variants on the current page
    const toggleSelectAll = () => {
        if (isAllSelected) {
            setVariantsSkusToPrint(prev =>
                prev.filter(item => !variantsSkus.some(vSku => vSku.variantId === item.variantId))
            )
        } else {
            const newSelections = variantsSkus.filter(vSku => !isVariantSelected(vSku))
            setVariantsSkusToPrint(prev => [...prev, ...newSelections])
        }
    }

    const [showPrintModal, setShowPrintModal] = useState(false)
    const [printSettings, setPrintSettings] = useState({
        cardWidth: '300px',
        cardHeight: 'auto',
        spacing: '10px',
        showSku: true,
        showVariant: true,
    })

    return (
        <Container className="d-flex flex-column align-items-center p-5">
            <Row className="w-100 mb-4">
                <Col md={12}>
                    <div className="d-flex justify-content-between">
                        <div className="d-flex gap-2">
                            <InputText
                                className="w-100 me-2 p-input"
                                placeholder="search items"
                                value={searchParams.get('name') || ''}
                                onChange={e => handleNavigation(createQueryString('name', e.target.value))}
                            />
                            <DropDownFilter
                                placeholder={'Select Category'}
                                dropDownOptionType={'RETAIL_CATEGORY'}
                                selectedOption={searchParams.get('categoryId')}
                                fieldName={'categories.id'}
                                handleDropdownChange={(f, v) => {
                                    if (!v.value) {
                                        navigate(deleteQueryString('categoryId'))
                                    } else {
                                        navigate(createQueryString('categoryId', v.value))
                                    }
                                }}
                            />
                        </div>
                        <Button severity="info" onClick={() => setShowPrintModal(true)}>
                            Print
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Selection Container */}
            <div className="selection-container w-100">
                <Row className="mb-2">
                    <Col md={12}>
                        <label>
                            <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} /> Select All
                        </label>
                    </Col>
                </Row>
                <Row className="mb-3 w-100">
                    {variantsSkus.map((vSku, index) => (
                        <Col md={4} key={vSku.variantId}>
                            <Card className="p-2 text-center rounded-3">
                                <CardBody>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 className="mb-2">{vSku.variantName}</h5>
                                            <p className="mb-2">SKU: {vSku.sku}</p>
                                        </div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={isVariantSelected(vSku)}
                                                onChange={() => toggleVariantSelection(vSku)}
                                            />
                                        </div>
                                    </div>
                                    <canvas ref={el => (barcodeRefs.current[index] = el)} className="mt-2" />
                                </CardBody>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* Print Container */}
            <div ref={printRef} className="print-container w-100">
                {variantsSkusToPrint.map((vSku, index) => (
                    <div
                        key={vSku.variantId}
                        className="print-card"
                        style={{
                            width: printSettings.cardWidth,
                            height: printSettings.cardHeight,
                            marginBottom: printSettings.spacing,
                            display: 'inline-block',
                        }}
                    >
                        <Card className="p-2 text-center rounded-3">
                            <CardBody>
                                {printSettings.showVariant && <h5 className="mb-2">{vSku.variantName}</h5>}
                                {printSettings.showSku && <p className="mb-2">SKU: {vSku.sku}</p>}
                                <canvas ref={el => (printBarcodeRefs.current[index] = el)} className="mt-2" />
                            </CardBody>
                        </Card>
                    </div>
                ))}
            </div>

            {/* Pagination & Rows Per Page */}
            <Row className="w-100">
                <Col md={12}>
                    <div className="d-flex justify-content-center">
                        <PaginationFilter
                            totalPages={Math.ceil(
                                productsTotalItems / (parseInt(searchParams.get('rows') || '20', 10))
                            )}
                        />
                        <div>
                            <Dropdown
                                options={[
                                    { label: '25', value: '25' },
                                    { label: '50', value: '50' },
                                    { label: '75', value: '75' },
                                    { label: '100', value: '100' },
                                    { label: '200', value: '200' },
                                ]}
                                value={searchParams.get('rows') || { label: '25', value: '25' }}
                                onChange={e => handleNavigation(createQueryString('rows', e.value))}
                                placeholder="Rows"
                                className="w-100"
                            />
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Print Settings Modal */}
            <Modal isOpen={showPrintModal} toggle={() => setShowPrintModal(!showPrintModal)}>
                <ModalHeader toggle={() => setShowPrintModal(!showPrintModal)}>Print Settings</ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label for="cardWidth">Card Width</Label>
                        <Input
                            id="cardWidth"
                            type="text"
                            value={printSettings.cardWidth}
                            onChange={e =>
                                setPrintSettings({ ...printSettings, cardWidth: e.target.value })
                            }
                        />
                        <small className="text-muted">Example: 300px, 50%</small>
                    </FormGroup>
                    <FormGroup>
                        <Label for="cardHeight">Card Height</Label>
                        <Input
                            id="cardHeight"
                            type="text"
                            value={printSettings.cardHeight}
                            onChange={e =>
                                setPrintSettings({ ...printSettings, cardHeight: e.target.value })
                            }
                        />
                        <small className="text-muted">Example: auto, 200px</small>
                    </FormGroup>
                    <FormGroup>
                        <Label for="spacing">Spacing between elements</Label>
                        <Input
                            id="spacing"
                            type="text"
                            value={printSettings.spacing}
                            onChange={e =>
                                setPrintSettings({ ...printSettings, spacing: e.target.value })
                            }
                        />
                        <small className="text-muted">Example: 10px, 1em</small>
                    </FormGroup>
                    <FormGroup check>
                        <Label check>
                            <Input
                                type="checkbox"
                                checked={printSettings.showSku}
                                onChange={e =>
                                    setPrintSettings({ ...printSettings, showSku: e.target.checked })
                                }
                            />{' '}
                            Show SKU Title
                        </Label>
                    </FormGroup>
                    <FormGroup check className="mt-2">
                        <Label check>
                            <Input
                                type="checkbox"
                                checked={printSettings.showVariant}
                                onChange={e =>
                                    setPrintSettings({ ...printSettings, showVariant: e.target.checked })
                                }
                            />{' '}
                            Show Variant Name
                        </Label>
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <RSButton color="secondary" onClick={() => setShowPrintModal(false)}>
                        Cancel
                    </RSButton>
                    <RSButton
                        color="primary"
                        onClick={() => {
                            setShowPrintModal(false)
                            handlePrint()
                        }}
                    >
                        Print
                    </RSButton>
                </ModalFooter>
            </Modal>

            {/* Global Print Styles */}
            <style>{`
                @media screen {
                    .print-container {
                        display: none;
                    }
                }
                @media print {
                    .print-container {
                        display: block;
                    }
                    .selection-container {
                        display: none;
                    }
                    /* Removed forced page break to allow multiple cards per page */
                    .print-card {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </Container>
    )
}

export default Barcode
