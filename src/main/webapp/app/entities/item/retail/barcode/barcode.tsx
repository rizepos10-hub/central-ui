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
import { Checkbox } from 'primereact/checkbox'
import "./barcode.css"
import { InputNumber } from 'primereact/inputnumber'

type VariantSkus = {
    variantId: string
    variantName: string
    sku: string
    price?: number | string
}

type PrintSettings = {
    showSku: boolean
    skuHeight: string
    showName: boolean
    nameHeight: string
    showBarcodeValue: boolean
    labelWidth: string
    labelHeight: string
    barcodeHeight: string
    barcodeWidth: number
    barcodePosition: 'TOP' | 'BOTTOM'
    barcodeFormat?:
    | "CODE39"
    | "CODE128"
    | "CODE128A"
    | "CODE128B"
    | "CODE128C"
    | "EAN13"
    | "EAN8"
    | "EAN5"
    | "EAN2"
    | "UPC"
    | "UPCE"
    | "ITF14"
    | "ITF"
    | "MSI"
    | "MSI10"
    | "MSI11"
    | "MSI1010"
    | "MSI1110"
    | "pharmacode"
    | "codabar"
    | "GenericBarcode";
    nameFontSize: string
    skuFontSize: string
    showPrice: boolean
    priceHeight: string
    priceFontSize: string
}

const Barcode = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const [variantsSkus, setVariantsSkus] = useState<VariantSkus[]>([])
    const [variantsSkusToPrint, setVariantsSkusToPrint] = useState<VariantSkus[]>([])
    const [showPrintDialog, setShowPrintDialog] = useState(false)
    const [printSettings, setPrintSettings] = useState<PrintSettings>({
        showSku: true,
        skuHeight: '5mm',
        showName: true,
        nameHeight: '5mm',
        showBarcodeValue: true,
        labelWidth: '50mm',
        labelHeight: '30mm',
        barcodeHeight: '20mm',
        barcodeWidth: 1,
        barcodePosition: 'BOTTOM',
        barcodeFormat: 'CODE128',
        nameFontSize: '14px',
        skuFontSize: '12px',
        showPrice: true,
        priceHeight: '5mm',
        priceFontSize: '12px',
    })

    // For warning color about height sum vs label height
    const [heightValidationColor, setHeightValidationColor] = useState<'red' | 'green'>('red')

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
                        price: variant.price,
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

    // Reset heights if toggles are false
    useEffect(() => {
        if (!printSettings.showSku) {
            setPrintSettings(prev => ({ ...prev, skuHeight: '0mm' }))
        }
        if (!printSettings.showName) {
            setPrintSettings(prev => ({ ...prev, nameHeight: '0mm' }))
        }
        if (!printSettings.showPrice) {
            setPrintSettings(prev => ({ ...prev, priceHeight: '0mm' }))
        }
    }, [printSettings.showSku, printSettings.showName, printSettings.showPrice])

    // Simple helper to parse dimension strings like "5mm" or "12.5px"
    const parseDimension = (dim: string) => {
        const numeric = parseFloat(dim)
        return isNaN(numeric) ? 0 : numeric
    }

    // Watch for changes in relevant fields to determine if total height matches label height
    useEffect(() => {
        const labelH = parseDimension(printSettings.labelHeight)
        const nameH = printSettings.showName ? parseDimension(printSettings.nameHeight) : 0
        const skuH = printSettings.showSku ? parseDimension(printSettings.skuHeight) : 0
        const priceH = printSettings.showPrice ? parseDimension(printSettings.priceHeight) : 0
        const barcodeH = parseDimension(printSettings.barcodeHeight)

        const total = nameH + skuH + priceH + barcodeH

        setHeightValidationColor(total === labelH ? 'green' : 'red')
    }, [
        printSettings.labelHeight,
        printSettings.nameHeight,
        printSettings.skuHeight,
        printSettings.priceHeight,
        printSettings.barcodeHeight,
        printSettings.showName,
        printSettings.showSku,
        printSettings.showPrice
    ])

    const barcodeFormats = [
        { label: "CODE39", value: "CODE39" },
        { label: "CODE128", value: "CODE128" },
        { label: "CODE128A", value: "CODE128A" },
        { label: "CODE128B", value: "CODE128B" },
        { label: "CODE128C", value: "CODE128C" },
        { label: "EAN13", value: "EAN13" },
        { label: "EAN8", value: "EAN8" },
        { label: "EAN5", value: "EAN5" },
        { label: "EAN2", value: "EAN2" },
        { label: "UPC", value: "UPC" },
        { label: "UPCE", value: "UPCE" },
        { label: "ITF14", value: "ITF14" },
        { label: "ITF", value: "ITF" },
        { label: "MSI", value: "MSI" },
        { label: "MSI10", value: "MSI10" },
        { label: "MSI11", value: "MSI11" },
        { label: "MSI1010", value: "MSI1010" },
        { label: "MSI1110", value: "MSI1110" },
        { label: "pharmacode", value: "pharmacode" },
        { label: "codabar", value: "codabar" },
        { label: "GenericBarcode", value: "GenericBarcode" },
    ]

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
                        <Row className='d-flex flex-column gap-1'>
                            <h6 className='m-0 p-0'>Label Settings</h6>
                            <div className='d-flex gap-2'>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Width (e.g. 50mm)</span>
                                    <InputText
                                        value={printSettings.labelWidth}
                                        onChange={(e) =>
                                            setPrintSettings({ ...printSettings, labelWidth: e.target.value })
                                        }
                                        placeholder="Width"
                                        className="w-auto"
                                    />
                                </div>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Height (e.g. 30mm)</span>
                                    <InputText
                                        value={printSettings.labelHeight}
                                        onChange={(e) =>
                                            setPrintSettings({ ...printSettings, labelHeight: e.target.value })
                                        }
                                        placeholder="Height"
                                        className="w-auto"
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: '8px', fontWeight: 'bold', color: heightValidationColor }}>
                                {heightValidationColor === 'green'
                                    ? 'Heights match the label height!'
                                    : 'Warning: The sum of name, sku, price, and barcode heights does NOT match the label height!'}
                            </div>
                        </Row>

                        <Row className='d-flex flex-column gap-1'>
                            <h6 className='m-0 p-0'>Sku Settings</h6>
                            <div className="d-flex gap-2">
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Show</span>
                                    <Checkbox
                                        checked={printSettings.showSku}
                                        onChange={(e) => setPrintSettings({ ...printSettings, showSku: e.checked })}
                                        inputId="showSku"
                                    />
                                </div>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Height (e.g. 5mm)</span>
                                    <InputText
                                        value={printSettings.skuHeight}
                                        onChange={(e) =>
                                            setPrintSettings({ ...printSettings, skuHeight: e.target.value })
                                        }
                                        placeholder="Height"
                                        className="w-auto"
                                        disabled={!printSettings.showSku}
                                    />
                                </div>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Font Size (e.g. 12px)</span>
                                    <InputText
                                        value={printSettings.skuFontSize}
                                        onChange={(e) =>
                                            setPrintSettings({ ...printSettings, skuFontSize: e.target.value })
                                        }
                                        placeholder="Font Size"
                                        className="w-auto"
                                    />
                                </div>
                            </div>
                        </Row>

                        <Row className='d-flex flex-column gap-1'>
                            <h6 className='m-0 p-0'>Name Settings</h6>
                            <div className='d-flex gap-2'>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Show</span>
                                    <Checkbox
                                        checked={printSettings.showName}
                                        onChange={(e) => setPrintSettings({ ...printSettings, showName: e.checked })}
                                        inputId="showName"
                                    />
                                </div>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Height (e.g. 5mm)</span>
                                    <InputText
                                        value={printSettings.nameHeight}
                                        onChange={(e) =>
                                            setPrintSettings({ ...printSettings, nameHeight: e.target.value })
                                        }
                                        placeholder="Height"
                                        className="w-auto"
                                        disabled={!printSettings.showName}
                                    />
                                </div>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Font Size (e.g. 14px)</span>
                                    <InputText
                                        value={printSettings.nameFontSize}
                                        onChange={(e) =>
                                            setPrintSettings({ ...printSettings, nameFontSize: e.target.value })
                                        }
                                        placeholder="Font Size"
                                        className="w-auto"
                                    />
                                </div>
                            </div>
                        </Row>

                        <Row className='d-flex flex-column gap-1'>
                            <h6 className='m-0 p-0'>Price Settings</h6>
                            <div className='d-flex gap-2'>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Show</span>
                                    <Checkbox
                                        checked={printSettings.showPrice}
                                        onChange={(e) => setPrintSettings({ ...printSettings, showPrice: e.checked })}
                                        inputId="showPrice"
                                    />
                                </div>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Height (e.g. 5mm)</span>
                                    <InputText
                                        value={printSettings.priceHeight}
                                        onChange={(e) =>
                                            setPrintSettings({ ...printSettings, priceHeight: e.target.value })
                                        }
                                        placeholder="Height"
                                        className="w-auto"
                                        disabled={!printSettings.showPrice}
                                    />
                                </div>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Font Size (e.g. 12px)</span>
                                    <InputText
                                        value={printSettings.priceFontSize}
                                        onChange={(e) =>
                                            setPrintSettings({ ...printSettings, priceFontSize: e.target.value })
                                        }
                                        placeholder="Font Size"
                                        className="w-auto"
                                    />
                                </div>
                            </div>
                        </Row>

                        <Row className='d-flex flex-column gap-1'>
                            <h6 className='m-0 p-0'>Barcode Settings</h6>
                            <div className='d-flex gap-2'>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Show Value</span>
                                    <Checkbox
                                        checked={printSettings.showBarcodeValue}
                                        onChange={(e) =>
                                            setPrintSettings({ ...printSettings, showBarcodeValue: e.checked })
                                        }
                                        inputId="showBarcodeValue"
                                    />
                                </div>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Height (e.g. 20mm)</span>
                                    <InputText
                                        value={printSettings.barcodeHeight}
                                        onChange={(e) =>
                                            setPrintSettings({ ...printSettings, barcodeHeight: e.target.value })
                                        }
                                        placeholder="Height"
                                        className="w-auto"
                                    />
                                </div>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Width (e.g. 40mm)</span>
                                    <InputNumber
                                        value={printSettings.barcodeWidth}
                                        onChange={(e) =>
                                            setPrintSettings({ ...printSettings, barcodeWidth: e.value })
                                        }
                                        step={0.01}
                                        placeholder="Width"
                                        className="w-auto"
                                    />
                                </div>
                            </div>
                            <div className='d-flex gap-2'>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Position</span>
                                    <Dropdown
                                        options={[
                                            { label: 'TOP', value: 'TOP' },
                                            { label: 'BOTTOM', value: 'BOTTOM' },
                                        ]}
                                        value={printSettings.barcodePosition}
                                        onChange={(e) => setPrintSettings({ ...printSettings, barcodePosition: e.value })}
                                        placeholder="Position"
                                    />
                                </div>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span>Format</span>
                                    <Dropdown
                                        options={barcodeFormats}
                                        value={printSettings.barcodeFormat}
                                        onChange={(e) => setPrintSettings({ ...printSettings, barcodeFormat: e.value })}
                                        placeholder="Format"
                                    />
                                </div>
                            </div>
                        </Row>

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
                                        marginBottom: '10px',
                                        maxHeight: printSettings.labelHeight,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {printSettings.barcodePosition === 'TOP' && (
                                        <div style={{ height: printSettings.barcodeHeight }} className="barcode-wrapper pr-1">
                                            <ReactBarcode
                                                value={vSku.sku}
                                                format={printSettings.barcodeFormat}
                                                displayValue={printSettings.showBarcodeValue}
                                                lineColor="#1a1a1a"
                                                background="#ffffff"
                                                fontSize={10}
                                                width={printSettings.barcodeWidth}
                                            />
                                        </div>
                                    )}
                                    {printSettings.showName && (
                                        <div
                                            style={{
                                                height: printSettings.nameHeight,
                                                width: '100%',
                                                textAlign: 'center',
                                                fontSize: printSettings.nameFontSize
                                            }}
                                        >
                                            {vSku.variantName}
                                        </div>
                                    )}
                                    {printSettings.showSku && (
                                        <div style={{ height: printSettings.skuHeight, fontSize: printSettings.skuFontSize }}>
                                            {vSku.sku}
                                        </div>
                                    )}
                                    {printSettings.showPrice && (
                                        <div style={{ height: printSettings.priceHeight, fontSize: printSettings.priceFontSize }}>
                                            {vSku.price}
                                        </div>
                                    )}
                                    {printSettings.barcodePosition === 'BOTTOM' && (
                                        <div style={{ height: printSettings.barcodeHeight }} className="barcode-wrapper pr-1">
                                            <ReactBarcode
                                                value={vSku.sku}
                                                format={printSettings.barcodeFormat}
                                                displayValue={printSettings.showBarcodeValue}
                                                lineColor="#1a1a1a"
                                                background="#ffffff"
                                                fontSize={10}
                                                width={printSettings.barcodeWidth}
                                            />
                                        </div>
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
                                            <p className="mb-2">Price: {vSku.price}</p>
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
                                            format={printSettings.barcodeFormat}
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
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {printSettings.barcodePosition === 'TOP' && (
                                <div style={{ height: printSettings.barcodeHeight }} className="barcode-wrapper pr-1">
                                    <ReactBarcode
                                        value={vSku.sku}
                                        format={printSettings.barcodeFormat}
                                        displayValue={printSettings.showBarcodeValue}
                                        lineColor="#1a1a1a"
                                        background="#ffffff"
                                        fontSize={10}
                                        width={printSettings.barcodeWidth}
                                    />
                                </div>
                            )}
                            {printSettings.showName && (
                                <div
                                    style={{
                                        height: printSettings.nameHeight,
                                        width: '100%',
                                        textAlign: 'center',
                                        fontSize: printSettings.nameFontSize
                                    }}
                                >
                                    {vSku.variantName}
                                </div>
                            )}
                            {printSettings.showSku && (
                                <div style={{ height: printSettings.skuHeight, fontSize: printSettings.skuFontSize }}>
                                    {vSku.sku}
                                </div>
                            )}
                            {printSettings.showPrice && (
                                <div style={{ height: printSettings.priceHeight, fontSize: printSettings.priceFontSize }}>
                                    {vSku.price}
                                </div>
                            )}
                            {printSettings.barcodePosition === 'BOTTOM' && (
                                <div style={{ height: printSettings.barcodeHeight }} className="barcode-wrapper pr-1">
                                    <ReactBarcode
                                        value={vSku.sku}
                                        format={printSettings.barcodeFormat}
                                        displayValue={printSettings.showBarcodeValue}
                                        lineColor="#1a1a1a"
                                        background="#ffffff"
                                        fontSize={10}
                                        width={printSettings.barcodeWidth}
                                    />
                                </div>
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
