import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useReactToPrint } from 'react-to-print'
import ReactBarcode from 'react-barcode'
import { IProduct } from 'app/shared/model/ITEM/retail/product.model'
import { useAppDispatch, useAppSelector } from 'app/config/store'
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util'
import { filterEntities } from '../product/product.reducer'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { initialItemFilterState } from 'app/shared/model/filter-state.model'
import PaginationFilter from 'app/shared/components/pagination/pagination-filter'
import { FilterMatchMode } from 'primereact/api'
import DropDownFilter from 'app/shared/components/filter/drop-down-filter'
import "./barcode.css"
import { formatVariant } from 'app/shared/util/variant-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import Select from 'react-select'

type VariantSkus = {
    variantId: string
    variantName: string
    sku: string
    attributeValues: any
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
                        attributeValues: variant.attributeValues,
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
        { label: "CODE39" as const, value: "CODE39" as const },
        { label: "CODE128" as const, value: "CODE128" as const },
        { label: "CODE128A" as const, value: "CODE128A" as const },
        { label: "CODE128B" as const, value: "CODE128B" as const },
        { label: "CODE128C" as const, value: "CODE128C" as const },
        { label: "EAN13" as const, value: "EAN13" as const },
        { label: "EAN8" as const, value: "EAN8" as const },
        { label: "EAN5" as const, value: "EAN5" as const },
        { label: "EAN2" as const, value: "EAN2" as const },
        { label: "UPC" as const, value: "UPC" as const },
        { label: "UPCE" as const, value: "UPCE" as const },
        { label: "ITF14" as const, value: "ITF14" as const },
        { label: "ITF" as const, value: "ITF" as const },
        { label: "MSI" as const, value: "MSI" as const },
        { label: "MSI10" as const, value: "MSI10" as const },
        { label: "MSI11" as const, value: "MSI11" as const },
        { label: "MSI1010" as const, value: "MSI1010" as const },
        { label: "MSI1110" as const, value: "MSI1110" as const },
        { label: "pharmacode" as const, value: "pharmacode" as const },
        { label: "codabar" as const, value: "codabar" as const },
        { label: "GenericBarcode" as const, value: "GenericBarcode" as const },
    ] as const

    return (
        <div className="flex flex-col items-center p-5">
            <div className="w-full mb-4">
                <div>
                    <div className="flex justify-between">
                        <div className="flex gap-2">
                            <Input
                                className="w-full h-8 text-xs"
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
                        <Button onClick={() => setShowPrintDialog(true)} className="h-8 text-xs">
                            Print
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
                <DialogContent className="max-w-[1000px] w-[80vw]">
                    <DialogHeader>
                        <DialogTitle className="text-base">Print Settings</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-3">
                            <div className='flex flex-col gap-1'>
                                <h6 className='m-0 p-0'>Label Settings</h6>
                                <div className='flex gap-2'>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Width (e.g. 50mm)</span>
                                        <Input
                                            value={printSettings.labelWidth}
                                            onChange={(e) =>
                                                setPrintSettings({ ...printSettings, labelWidth: e.target.value })
                                            }
                                            placeholder="Width"
                                            className="w-auto h-8 text-xs"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Height (e.g. 30mm)</span>
                                        <Input
                                            value={printSettings.labelHeight}
                                            onChange={(e) =>
                                                setPrintSettings({ ...printSettings, labelHeight: e.target.value })
                                            }
                                            placeholder="Height"
                                            className="w-auto h-8 text-xs"
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '8px', fontWeight: 'bold', color: heightValidationColor }}>
                                    {heightValidationColor === 'green'
                                        ? 'Heights match the label height!'
                                        : 'Warning: The sum of name, sku, price, and barcode heights does NOT match the label height!'}
                                </div>
                            </div>

                            <div className='flex flex-col gap-1'>
                                <h6 className='m-0 p-0'>Sku Settings</h6>
                                <div className="flex gap-2">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Show</span>
                                        <Checkbox
                                            id="showSku"
                                            checked={printSettings.showSku}
                                            onCheckedChange={(checked) => setPrintSettings({ ...printSettings, showSku: checked === true })}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Height (e.g. 5mm)</span>
                                        <Input
                                            value={printSettings.skuHeight}
                                            onChange={(e) =>
                                                setPrintSettings({ ...printSettings, skuHeight: e.target.value })
                                            }
                                            placeholder="Height"
                                            className="w-auto h-8 text-xs"
                                            disabled={!printSettings.showSku}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Font Size (e.g. 12px)</span>
                                        <Input
                                            value={printSettings.skuFontSize}
                                            onChange={(e) =>
                                                setPrintSettings({ ...printSettings, skuFontSize: e.target.value })
                                            }
                                            placeholder="Font Size"
                                            className="w-auto h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='flex flex-col gap-1'>
                                <h6 className='m-0 p-0'>Name Settings</h6>
                                <div className='flex gap-2'>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Show</span>
                                        <Checkbox
                                            id="showName"
                                            checked={printSettings.showName}
                                            onCheckedChange={(checked) => setPrintSettings({ ...printSettings, showName: checked === true })}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Height (e.g. 5mm)</span>
                                        <Input
                                            value={printSettings.nameHeight}
                                            onChange={(e) =>
                                                setPrintSettings({ ...printSettings, nameHeight: e.target.value })
                                            }
                                            placeholder="Height"
                                            className="w-auto h-8 text-xs"
                                            disabled={!printSettings.showName}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Font Size (e.g. 14px)</span>
                                        <Input
                                            value={printSettings.nameFontSize}
                                            onChange={(e) =>
                                                setPrintSettings({ ...printSettings, nameFontSize: e.target.value })
                                            }
                                            placeholder="Font Size"
                                            className="w-auto h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='flex flex-col gap-1'>
                                <h6 className='m-0 p-0'>Price Settings</h6>
                                <div className='flex gap-2'>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Show</span>
                                        <Checkbox
                                            id="showPrice"
                                            checked={printSettings.showPrice}
                                            onCheckedChange={(checked) => setPrintSettings({ ...printSettings, showPrice: checked === true })}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Height (e.g. 5mm)</span>
                                        <Input
                                            value={printSettings.priceHeight}
                                            onChange={(e) =>
                                                setPrintSettings({ ...printSettings, priceHeight: e.target.value })
                                            }
                                            placeholder="Height"
                                            className="w-auto h-8 text-xs"
                                            disabled={!printSettings.showPrice}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Font Size (e.g. 12px)</span>
                                        <Input
                                            value={printSettings.priceFontSize}
                                            onChange={(e) =>
                                                setPrintSettings({ ...printSettings, priceFontSize: e.target.value })
                                            }
                                            placeholder="Font Size"
                                            className="w-auto h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='flex flex-col gap-1'>
                                <h6 className='m-0 p-0'>Barcode Settings</h6>
                                <div className='flex gap-2'>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Show Value</span>
                                        <Checkbox
                                            id="showBarcodeValue"
                                            checked={printSettings.showBarcodeValue}
                                            onCheckedChange={(checked) =>
                                                setPrintSettings({ ...printSettings, showBarcodeValue: checked === true })
                                            }
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Height (e.g. 20mm)</span>
                                        <Input
                                            value={printSettings.barcodeHeight}
                                            onChange={(e) =>
                                                setPrintSettings({ ...printSettings, barcodeHeight: e.target.value })
                                            }
                                            placeholder="Height"
                                            className="w-auto h-8 text-xs"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Width (factor)</span>
                                        <Input
                                            type="number"
                                            value={printSettings.barcodeWidth}
                                            onChange={(e) =>
                                                setPrintSettings({ ...printSettings, barcodeWidth: parseFloat(e.target.value) || 1 })
                                            }
                                            step={0.01}
                                            placeholder="Width"
                                            className="w-auto h-8 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className='flex gap-2'>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Position</span>
                                        <Select
                                            value={{ label: printSettings.barcodePosition, value: printSettings.barcodePosition }}
                                            options={[
                                                { label: 'TOP', value: 'TOP' },
                                                { label: 'BOTTOM', value: 'BOTTOM' },
                                            ]}
                                            onChange={(option) => setPrintSettings({ ...printSettings, barcodePosition: option?.value as 'TOP' | 'BOTTOM' })}
                                            placeholder="Position"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs">Format</span>
                                        <Select
                                            value={{ label: printSettings.barcodeFormat, value: printSettings.barcodeFormat }}
                                            options={barcodeFormats}
                                            onChange={(option) => setPrintSettings({ ...printSettings, barcodeFormat: option?.value as any })}
                                            placeholder="Format"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='flex justify-end'>
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
                                            <div style={{ height: printSettings.barcodeHeight }} className="barcode-wrapper">
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
                                            <div style={{ height: printSettings.barcodeHeight }} className="barcode-wrapper">
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
                    <DialogFooter>
                        <Button onClick={() => setShowPrintDialog(false)} variant="outline" className="h-8 text-xs">Cancel</Button>
                        <Button onClick={onDialogPrint} className="h-8 text-xs">Print</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="selection-container w-full">
                <div className="mb-2">
                    <div>
                        <Label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                            <span>Select All</span>
                        </Label>
                    </div>
                </div>
                <div className="mb-3 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                    {variantsSkus.map(vSku => (
                        <div key={vSku.variantId}>
                            <Card className="p-2 text-center rounded-lg">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h5 className="mb-2 text-base font-semibold">{formatVariant(vSku.variantName, vSku.attributeValues)}</h5>
                                            <p className="mb-2 text-xs">SKU: {vSku.sku}</p>
                                            <p className="mb-2 text-xs">Price: {vSku.price}</p>
                                        </div>
                                        <div>
                                            <Checkbox
                                                checked={isVariantSelected(vSku)}
                                                onCheckedChange={() => toggleVariantSelection(vSku)}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <ReactBarcode
                                            value={vSku.sku}
                                            format='CODE128'
                                            displayValue
                                            lineColor="#1a1a1a"
                                            background="#ffffff"
                                            fontSize={14}
                                            height={50}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>

            <div ref={printRef} className='print-container'>
                {printVariants.map(vSku => (
                    <div key={vSku.variantId}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {printSettings.barcodePosition === 'TOP' && (
                                <div style={{ height: printSettings.barcodeHeight }} className="barcode-wrapper">
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
                                <div style={{ height: printSettings.barcodeHeight }} className="barcode-wrapper">
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
            <div className="w-full">
                <div>
                    <div className="flex justify-center">
                        <PaginationFilter
                            totalPages={Math.ceil(
                                productsTotalItems / (Number(searchParams.get('rows')) || 20)
                            )}
                        />
                        <div>
                            <Select
                                value={{ label: searchParams.get('rows') || '25', value: searchParams.get('rows') || '25' }}
                                options={[
                                    { label: '25', value: '25' },
                                    { label: '50', value: '50' },
                                    { label: '75', value: '75' },
                                    { label: '100', value: '100' },
                                    { label: '200', value: '200' },
                                ]}
                                onChange={option => handleNavigation(createQueryString('rows', option?.value || '25'))}
                                placeholder="Rows"
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

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
        </div>
    )
}

export default Barcode
