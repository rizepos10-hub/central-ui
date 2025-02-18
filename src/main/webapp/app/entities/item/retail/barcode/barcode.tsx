import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Dialog } from 'primereact/dialog'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Card, CardBody, Col, Container, Row } from 'reactstrap'
import ReactBarcode from 'react-barcode'
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
import { InputNumber } from 'primereact/inputnumber'
import { Checkbox } from 'primereact/checkbox'

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
    const [showPrintDialog, setShowPrintDialog] = useState(false)
    const [printSettings, setPrintSettings] = useState({
        showSku: true,
        showName: true,
        showBarcodeValue: true,
        labelWidth: '50mm',
        labelHeight: '30mm',
        barcodeSize: 40,
        barcodePosition: 'BOTTOM',
    })

    const printRef = useRef<HTMLDivElement>(null)
    const products: IProduct[] = useAppSelector(state => state.product.entities)
    const productsTotalItems = useAppSelector(state => state.product.totalItems)

    const [searchParams] = useSearchParams()
    const query = JSON.parse(searchParams.get('query') || 'null') || {
        ...initialItemFilterState,
        rows: 20,
    }

    const getAllEntities = () => {
        const updatedQuery = applyMatchModeMap({
            ...query,
            page: Number(searchParams.get('page')) ? Number(searchParams.get('page')) - 1 : 0,
            rows: Number(searchParams.get('rows')) || 20,
            filters: {
                name: { value: searchParams.get('name'), matchMode: FilterMatchMode.CONTAINS },
                'categories.id': { value: searchParams.get('categoryId'), matchMode: FilterMatchMode.EQUALS },
            },
        })
        dispatch(filterEntities({ query: updatedQuery }))
    }

    useEffect(() => {
        const stored = localStorage.getItem('selectedVariants')
        if (stored) setVariantsSkusToPrint(JSON.parse(stored))
    }, [])

    useEffect(() => {
        localStorage.setItem('selectedVariants', JSON.stringify(variantsSkusToPrint))
    }, [variantsSkusToPrint])

    useEffect(() => {
        getAllEntities()
    }, [
        searchParams.get('page'),
        searchParams.get('rows'),
        searchParams.get('name'),
        searchParams.get('categoryId'),
    ])

    useEffect(() => {
        const updated: VariantSkus[] = []
        products.forEach(product => {
            product.variants.forEach(variant => {
                if (variant.sku) {
                    updated.push({
                        variantId: variant.id,
                        variantName: variant.name,
                        sku: variant.sku,
                    })
                }
            })
        })
        setVariantsSkus(updated)
    }, [products])

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

    const isVariantSelected = (vSku: VariantSkus) =>
        variantsSkusToPrint.some(item => item.variantId === vSku.variantId)

    const toggleVariantSelection = (vSku: VariantSkus) => {
        if (isVariantSelected(vSku)) {
            setVariantsSkusToPrint(prev => prev.filter(item => item.variantId !== vSku.variantId))
        } else {
            setVariantsSkusToPrint(prev => [...prev, vSku])
        }
    }

    const isAllSelected = variantsSkus.length > 0 && variantsSkus.every(isVariantSelected)

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setVariantsSkusToPrint(prev =>
                prev.filter(item => !variantsSkus.some(v => v.variantId === item.variantId))
            )
        } else {
            const newSelections = variantsSkus.filter(v => !isVariantSelected(v))
            setVariantsSkusToPrint(prev => [...prev, ...newSelections])
        }
    }

    const printVariants = [...variantsSkusToPrint]

    const onDialogPrint = () => {
        setShowPrintDialog(false)
        handlePrint()
    }

    return (
        <Container className="d-flex flex-column align-items-center p-5">
            <Row className="w-100 mb-4">
                <Col md={12}>
                    <div className="d-flex justify-content-between">
                        <div className="d-flex gap-2">
                            <InputText
                                className="w-100 me-2"
                                placeholder="search items"
                                value={searchParams.get('name') || ''}
                                onChange={e => handleNavigation(createQueryString('name', e.target.value))}
                            />
                            <DropDownFilter
                                placeholder="Select Category"
                                dropDownOptionType="RETAIL_CATEGORY"
                                selectedOption={searchParams.get('categoryId')}
                                fieldName="categories.id"
                                handleDropdownChange={(f, v) => {
                                    if (!v.value) {
                                        navigate(deleteQueryString('categoryId'))
                                    } else {
                                        navigate(createQueryString('categoryId', v.value))
                                    }
                                }}
                            />
                        </div>
                        <Button severity="info" onClick={() => setShowPrintDialog(true)}>
                            Print
                        </Button>
                    </div>
                </Col>
            </Row>

            <Dialog
                header="Print Settings"
                visible={showPrintDialog}
                onHide={() => setShowPrintDialog(false)}
                style={{ width: '80vw', maxWidth: '1000px' }}
            >
                <div className="row">
                    <div className="col-md-6 d-flex flex-column gap-3">
                        <div className="d-flex align-items-center gap-2">
                            <Checkbox
                                checked={printSettings.showSku}
                                onChange={(e) => setPrintSettings({ ...printSettings, showSku: e.checked })}
                                inputId="showSku"
                            />
                            <span>Show SKU</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <Checkbox
                                checked={printSettings.showName}
                                onChange={(e) => setPrintSettings({ ...printSettings, showName: e.checked })}
                                inputId="showName"
                            />
                            <span>Show Name</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <Checkbox
                                checked={printSettings.showBarcodeValue}
                                onChange={(e) =>
                                    setPrintSettings({ ...printSettings, showBarcodeValue: e.checked })
                                }
                                inputId="showName"
                            />
                            <span>Show Barcode Value</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <InputText
                                value={printSettings.labelWidth}
                                onChange={(e) =>
                                    setPrintSettings({ ...printSettings, labelWidth: e.target.value })
                                }
                                placeholder="Label Width"
                                className="form-control w-auto"
                            />
                            <span>Label Width (e.g. 50mm)</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <InputText
                                value={printSettings.labelHeight}
                                onChange={(e) =>
                                    setPrintSettings({ ...printSettings, labelHeight: e.target.value })
                                }
                                placeholder="Label Height"
                                className="form-control w-auto"
                            />
                            <span>Label Height (e.g. 30mm)</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <InputNumber
                                value={printSettings.barcodeSize}
                                onChange={(e) =>
                                    setPrintSettings({ ...printSettings, barcodeSize: e.value })
                                }
                                placeholder="Barcode Size"
                            />
                            <span>Barcode Size (e.g. 40)</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <Dropdown
                                options={[
                                    { label: 'TOP', value: 'TOP' },
                                    { label: 'BOTTOM', value: 'BOTTOM' },
                                ]}
                                value={printSettings.barcodePosition}
                                onChange={(e) => setPrintSettings({ ...printSettings, barcodePosition: e.value })}
                                placeholder="Barcode Position"
                            />
                            <span>Barcode Position</span>
                        </div>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <Button label="Cancel" onClick={() => setShowPrintDialog(false)} />
                            <Button label="Print" severity="info" onClick={onDialogPrint} />
                        </div>
                    </div>
                    <div className='col-md-6 d-flex justify-content-end'>
                        <div
                            style={{
                                maxHeight: '400px',
                                overflowY: 'auto',
                                border: '1px solid #ccc',
                                padding: '10px',
                            }}
                        >
                            {printVariants.length === 0 && (
                                <div className="text-muted">No items selected</div>
                            )}
                            {printVariants.map((vSku) => (
                                <div
                                    key={vSku.variantId}
                                    style={{
                                        width: printSettings.labelWidth,
                                        border: '1px dashed #ccc',
                                        position: 'relative',
                                        // overflow: 'hidden',
                                        marginBottom: '10px',
                                        maxHeight: printSettings.labelHeight,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {printSettings.barcodePosition === 'TOP' && (
                                        <ReactBarcode
                                            value={vSku.sku}
                                            format="CODE128"
                                            displayValue={printSettings.showBarcodeValue}
                                            lineColor="#1a1a1a"
                                            background="#ffffff"
                                            fontSize={10}
                                            width={1}
                                            height={printSettings.barcodeSize}
                                        />
                                    )}
                                    {printSettings.showName && (
                                        <div
                                            style={{ height: '5mm', width: '100%', textAlign: 'center' }} className="fs-6 text-truncate"
                                        >
                                            {vSku.variantName}
                                        </div>
                                    )}
                                    {printSettings.showSku && (
                                        <div
                                            style={{ height: '5mm' }}
                                        >
                                            {vSku.sku}
                                        </div>
                                    )}
                                    {printSettings.barcodePosition === 'BOTTOM' && (
                                        <ReactBarcode
                                            value={vSku.sku}
                                            format="CODE128"
                                            displayValue={printSettings.showBarcodeValue}
                                            lineColor="#1a1a1a"
                                            background="#ffffff"
                                            fontSize={10}
                                            width={1}
                                            height={printSettings.barcodeSize}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Dialog>

            <div className="selection-container w-100">
                <Row className="mb-2">
                    <Col md={12}>
                        <label>
                            <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} /> Select All
                        </label>
                    </Col>
                </Row>
                <Row className="mb-3 w-100">
                    {variantsSkus.map(vSku => (
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
                                    <div className="mt-2">
                                        <ReactBarcode
                                            value={vSku.sku}
                                            format="CODE128"
                                            displayValue
                                            lineColor="#1a1a1a"
                                            background="#ffffff"
                                            fontSize={14}
                                            height={50}
                                        />
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            <div ref={printRef} className='print-container'>
                {printVariants.map(vSku => (
                    <div key={vSku.variantId}>
                        <div style={{
                            // width: printSettings.labelWidth,
                            // maxHeight: printSettings.labelHeight,
                            // height: printSettings.labelHeight,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            {printSettings.barcodePosition === 'TOP' && (
                                <ReactBarcode
                                    value={vSku.sku}
                                    format="CODE128"
                                    displayValue={printSettings.showBarcodeValue}
                                    lineColor="#1a1a1a"
                                    background="#ffffff"
                                    fontSize={10}
                                    width={1}
                                    height={printSettings.barcodeSize}
                                />
                            )}
                            {printSettings.showName && (
                                <div style={{ height: '5mm', width: '100%', textAlign: 'center' }} className="fs-6 text-truncate">
                                    {vSku.variantName}
                                </div>
                            )}
                            {printSettings.showSku && (
                                <div style={{ height: '5mm' }}>
                                    {vSku.sku}
                                </div>
                            )}
                            {printSettings.barcodePosition === 'BOTTOM' && (
                                <ReactBarcode
                                    value={vSku.sku}
                                    format="CODE128"
                                    displayValue={printSettings.showBarcodeValue}
                                    lineColor="#1a1a1a"
                                    background="#ffffff"
                                    fontSize={10}
                                    width={1}
                                    height={printSettings.barcodeSize}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Row className="w-100">
                <Col md={12}>
                    <div className="d-flex justify-content-center">
                        <PaginationFilter
                            totalPages={Math.ceil(
                                productsTotalItems / (Number(searchParams.get('rows')) || 20)
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
                                value={searchParams.get('rows') || '25'}
                                onChange={e => handleNavigation(createQueryString('rows', e.value))}
                                placeholder="Rows"
                                className="w-100"
                            />
                        </div>
                    </div>
                </Col>
            </Row>

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
                }
            `}</style>
        </Container>
    )
}

export default Barcode
