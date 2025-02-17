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

    useEffect(() => {
        const storedSelected = localStorage.getItem('selectedVariants')
        if (storedSelected) {
            setVariantsSkusToPrint(JSON.parse(storedSelected))
        }
    }, [])

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

    useEffect(() => {
        variantsSkusToPrint.forEach((vSku, index) => {
            if (printBarcodeRefs.current[index]) {
                JsBarcode(printBarcodeRefs.current[index]!, vSku.sku, {
                    format: 'CODE128',
                    displayValue: true,
                    lineColor: '#1a1a1a',
                    background: '#ffffff',
                    fontSize: 10,
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

    const isVariantSelected = (vSku: VariantSkus) => {
        return variantsSkusToPrint.some(item => item.variantId === vSku.variantId)
    }

    const toggleVariantSelection = (vSku: VariantSkus) => {
        if (isVariantSelected(vSku)) {
            setVariantsSkusToPrint(prev => prev.filter(item => item.variantId !== vSku.variantId))
        } else {
            setVariantsSkusToPrint(prev => [...prev, vSku])
        }
    }

    const isAllSelected =
        variantsSkus.length > 0 && variantsSkus.every(vSku => isVariantSelected(vSku))

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

    // Default settings in mm matching label paper: 50mm x 30mm with 1mm spacing
    const [showPrintModal, setShowPrintModal] = useState(false)
    const [printSettings, setPrintSettings] = useState({
        cardWidth: '50mm',
        cardHeight: '30mm',
        spacing: '1mm',
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

            {/* Print Container with controlled width */}
            <div
                ref={printRef}
                className="print-container"
                style={{
                    width: '82mm',
                    padding: 0,
                    // marginTop: '6mm',
                }}
            >
                {variantsSkusToPrint.map((vSku, index) => (
                    <div
                        key={vSku.variantId}
                        className="print-card"
                        style={{
                            width: printSettings.cardWidth,
                            height: printSettings.cardHeight,
                            marginTop: printSettings.spacing,
                            // marginBottom: printSettings.spacing,
                            marginLeft: 'auto',
                        }}
                    >
                        <div className="text-center rounded-3" style={{ height: printSettings.cardHeight }}>
                            <div className="d-flex flex-column justify-content-end align-items-center">
                                <div style={{
                                    height: '8mm'
                                }}>
                                    {printSettings.showVariant && <h6 className="mb-1">{vSku.variantName}</h6>}
                                    {printSettings.showSku && <p className="mb-1" style={{ fontSize: '0.8rem' }}>SKU: {vSku.sku}</p>}
                                </div>
                                <canvas ref={el => (printBarcodeRefs.current[index] = el)} style={{
                                    width: printSettings.cardWidth,
                                    height: `calc(${printSettings.cardHeight} - 8mm)`,
                                }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

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

            <Modal isOpen={showPrintModal} toggle={() => setShowPrintModal(!showPrintModal)}>
                <ModalHeader toggle={() => setShowPrintModal(!showPrintModal)}>Print Settings</ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label for="cardWidth">Label Width</Label>
                        <Input
                            id="cardWidth"
                            type="text"
                            value={printSettings.cardWidth}
                            onChange={e =>
                                setPrintSettings({ ...printSettings, cardWidth: e.target.value })
                            }
                        />
                        <small className="text-muted">Use mm (e.g., 50mm)</small>
                    </FormGroup>
                    <FormGroup>
                        <Label for="cardHeight">Label Height</Label>
                        <Input
                            id="cardHeight"
                            type="text"
                            value={printSettings.cardHeight}
                            onChange={e =>
                                setPrintSettings({ ...printSettings, cardHeight: e.target.value })
                            }
                        />
                        <small className="text-muted">Use mm (e.g., 30mm)</small>
                    </FormGroup>
                    <FormGroup>
                        <Label for="spacing">Spacing between labels</Label>
                        <Input
                            id="spacing"
                            type="text"
                            value={printSettings.spacing}
                            onChange={e =>
                                setPrintSettings({ ...printSettings, spacing: e.target.value })
                            }
                        />
                        <small className="text-muted">Use mm (e.g., 1mm)</small>
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


            <style>{`
        /* Remove default page margin to fill entire sheet */
        @page {
          size: A4;
        }
        @media screen {
          .print-container {
            display: block;
          }
        }
        @media print {
          html, body {
            width: 82mm;
          }
          .print-container {
            display: block;
          }
          .selection-container {
            display: none;
          }
          /* Remove all container/card spacing for print */
          .container, .row, .col, .card, .card-body {
          }
          .print-card canvas {
            width: 100%;
            height: auto;
          }
        }
      `}</style>
        </Container>
    )
}

export default Barcode
