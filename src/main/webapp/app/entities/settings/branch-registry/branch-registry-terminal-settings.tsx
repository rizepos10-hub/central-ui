import { IBranchRegistry } from 'app/shared/model/branch-registry.model'
import React, { useEffect } from 'react'
import { ConnectionTypesEnum, CreditCardIntegrationTypeEnum, DataBitsEnum, DebitMachineSettingsInterfaceSettingsEnum, DeviceInterfaceEnum, DeviceTypesEnum, EncryptionSchemeEnum, HandShakeEnum, openDrawerTypeEnum, ParityEnum, PrinterConnectionTypeEnum, PrinterSizeEnum, ProviderTypesEnum, ScaleIntegrationTypeEnum, StopBitsEnum } from 'app/shared/model/terminal-settings';
import { BusinessTypeEnum } from 'app/shared/model/business-type';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeTerminalField, updateEntity } from './branch-registry.reducer';
import { OrderMethod } from 'app/shared/model/ENUMS/order-method.model';
import Select from 'app/shared/components/select/select';
import { getEntities } from '../tv-config/tv/tv.reducer';
import { ITv } from 'app/shared/model/TV/tv.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

type MenuItem = {
    label: string;
    component: React.FC;
};

const fontScaleOptions = [
    { label: 'Small', value: 0.85 },
    { label: 'Smaller', value: 0.93 },
    { label: 'Medium', value: 1.0 },
    { label: 'Bigger', value: 1.25 },
    { label: 'Big', value: 1.5 },
];

const customerScreenFontSizeOptions = [
    { label: 'Regular', value: 'regular' },
    { label: 'Large', value: 'large' },
];

const getAllowedOrderMethods = (businessType?: BusinessTypeEnum) =>
    businessType === BusinessTypeEnum.RETAIL
        ? Object.values(OrderMethod).filter(method => method !== OrderMethod.DineIn)
        : Object.values(OrderMethod);

const normalizeString = (value: string) => {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
};

const parseNumberOrNull = (value: string) => {
    if (value.trim() === '') {
        return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const DEFAULT_RECEIPT_COPIES = 1;

const isValidReceiptCopies = (value?: number | null): value is number =>
    Number.isSafeInteger(value) && value > 0;

const parsePositiveInteger = (value: string) => {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) {
        return null;
    }

    const parsed = Number(trimmed);
    return isValidReceiptCopies(parsed) ? parsed : null;
};

const parseOptionalPositiveInteger = (value: string) => {
    if (value.trim() === '') {
        return null;
    }

    return parsePositiveInteger(value) ?? undefined;
};

const getNearestFontScale = (fontScale?: number | null) => {
    const current = fontScale ?? 1.0;
    return fontScaleOptions.reduce((closest, option) => (
        Math.abs(option.value - current) < Math.abs(closest.value - current) ? option : closest
    ));
};

const FieldWrapper: React.FC<{
    icon?: string;
    title: string;
    description?: string;
    children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
    <div className="flex items-center justify-between mb-1 p-1 border rounded">
        <div className="flex-1">
            <Label className="text-xs font-medium">{title}</Label>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="ml-2">
            {children}
        </div>
    </div>
);

const BranchRegistryTerminalSettings = () => {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();


    const saveEntity = () => {
        dispatch(updateEntity(branchRegistry)).then(() => {
            // dispatch(getEntity(branchRegistry.id))
        });
    };

    useEffect(() => {
        dispatch(getEntities({}))
    }, [])

    return (
        <Card>
            <CardContent className="p-1">
                <Tabs defaultValue={sections[0].label.toLowerCase()} className="w-full">
                    <TabsList className="mb-1">
                        {sections.map(section => (
                            <TabsTrigger key={section.label} value={section.label.toLowerCase()} className="text-xs">
                                {section.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {sections.map(section => (
                        <TabsContent key={section.label} value={section.label.toLowerCase()}>
                            <section.component />
                        </TabsContent>
                    ))}
                </Tabs>

                {/* Save Button */}
                <div className="mt-1 flex justify-end">
                    <Button onClick={saveEntity} id="save-entity" data-cy="entityCreateSaveButton" size="sm">
                        Save
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// Section Components
function GeneralSettings() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();
    const selectedBusinessType = branchRegistry?.terminalSettings?.businessType;
    const orderMethods = getAllowedOrderMethods(selectedBusinessType);

    return (
        <div className="space-y-1">
            <FieldWrapper
                title="Business Type"
                description="Choose business type"
            >
                <ShadcnSelect
                    value={selectedBusinessType}
                    onValueChange={(value: BusinessTypeEnum) => {
                        dispatch(changeTerminalField({ name: 'businessType', value }));
                        if (value === BusinessTypeEnum.RETAIL && branchRegistry?.terminalSettings?.orderType === OrderMethod.DineIn) {
                            dispatch(changeTerminalField({ name: 'orderType', value: OrderMethod.WalkIn }));
                        }
                    }}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="RETAIL">Retail</SelectItem>
                        <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                    </SelectContent>
                </ShadcnSelect>
            </FieldWrapper>

            <FieldWrapper
                title="Order Type"
                description="Choose Order type"
            >
                <ShadcnSelect
                    value={branchRegistry?.terminalSettings?.orderType}
                    onValueChange={(value) => dispatch(changeTerminalField({ name: 'orderType', value }))}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select order type" />
                    </SelectTrigger>
                    <SelectContent>
                        {orderMethods.map(method => (
                            <SelectItem key={method} value={method}>{method}</SelectItem>
                        ))}
                    </SelectContent>
                </ShadcnSelect>
            </FieldWrapper>

            <FieldWrapper
                title="Enable Split Bills"
                description="Enable Split Bills"
            >
                <Checkbox
                    checked={branchRegistry?.terminalSettings?.enableSplitBill}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'enableSplitBill', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="Enable walk in"
                description='Enable the option to specify the walk-in order is "for here" or "to go"'
            >
                <Checkbox
                    checked={branchRegistry?.terminalSettings?.enableWalkInType}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'enableWalkInType', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="Receive Online Order Popups"
                description="Receive Online Order Popups"
            >
                <Checkbox
                    checked={branchRegistry?.terminalSettings?.receiveOnlineOrderPopups}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'receiveOnlineOrderPopups', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="HST Number"
                description="Enter HST number"
            >
                <Input
                    value={branchRegistry?.terminalSettings?.hstNumber ?? ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'hstNumber', value: normalizeString(e.target.value) }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="GST Number"
                description="Enter GST number"
            >
                <Input
                    value={branchRegistry?.terminalSettings?.gstNumber ?? ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'gstNumber', value: normalizeString(e.target.value) }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="PST Number"
                description="Enter PST number"
            >
                <Input
                    value={branchRegistry?.terminalSettings?.pstNumber ?? ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'pstNumber', value: normalizeString(e.target.value) }))}
                    className="w-48"
                />
            </FieldWrapper>
        </div>
    );
}

function PersonalizationSettings() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();

    return (
        <div className="space-y-1">
            <FieldWrapper
                title="Show Item Pictures"
                description="Show item pictures in the app"
            >
                <Checkbox
                    checked={branchRegistry?.terminalSettings?.showItemsPic}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'showItemsPic', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="Show Item Thumbnail In Order Items"
                description="Show item thumbnails in order item rows"
            >
                <Checkbox
                    checked={branchRegistry?.terminalSettings?.showItemThumbnailInOrderItems}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'showItemThumbnailInOrderItems', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="Show Retail Items Only"
                description="Show Retail Items Only in the app"
            >
                <Checkbox
                    checked={branchRegistry?.terminalSettings?.showRetailItemsOnly}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'showRetailItemsOnly', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="Show Currency"
                description="Show the currency code on printouts"
            >
                <Checkbox
                    checked={branchRegistry?.terminalSettings?.showCurrencyOnPrintouts}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'showCurrencyOnPrintouts', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="Always Show Scrollbar"
                description="Force scrollbar to always be visible"
            >
                <Checkbox
                    checked={branchRegistry?.terminalSettings?.alwaysShowScrollbar}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'alwaysShowScrollbar', value: checked }))}
                />
            </FieldWrapper>

            {branchRegistry?.terminalSettings?.alwaysShowScrollbar && (
                <FieldWrapper
                    title="Scrollbar Thickness"
                    description="Thickness in pixels"
                >
                    <Input
                        type="number"
                        value={branchRegistry?.terminalSettings?.scrollbarThickness ?? ''}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'scrollbarThickness', value: parseNumberOrNull(e.target.value) }))}
                        className="w-48"
                    />
                </FieldWrapper>
            )}

            <FieldWrapper
                title="UI Font Scale"
                description="Text size: Small, Smaller, Medium, Bigger, or Big"
            >
                <ShadcnSelect
                    value={String(getNearestFontScale(branchRegistry?.terminalSettings?.fontScale).value)}
                    onValueChange={(value) => dispatch(changeTerminalField({ name: 'fontScale', value: Number(value) }))}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select font scale" />
                    </SelectTrigger>
                    <SelectContent>
                        {fontScaleOptions.map(option => (
                            <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                        ))}
                    </SelectContent>
                </ShadcnSelect>
            </FieldWrapper>

            <FieldWrapper
                title="Enable Custom On-Screen Keyboard"
                description="Show custom keyboard when text fields are focused (Windows only)"
            >
                <Checkbox
                    checked={branchRegistry?.terminalSettings?.enableCustomKeyboard}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'enableCustomKeyboard', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="Change POS Language"
                description="Change display language of the terminal"
            >
                <Input
                    value={branchRegistry?.terminalSettings?.languageCode || ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'languageCode', value: e.target.value }))}
                    className="w-48"
                />
            </FieldWrapper>
        </div>
    );
}

function AdminActionsSettings() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();

    return (
        <div className="space-y-1">
            <FieldWrapper
                title="Select Pricing Point"
                description="Select Pricing Point"
            >
                <Checkbox
                    checked={branchRegistry?.terminalSettings?.selectPricingPoint}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'selectPricingPoint', value: checked }))}
                />
            </FieldWrapper>
        </div>
    );
}

function ScaleSettings() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();

    return (
        <div className="space-y-1">
            <FieldWrapper
                title="Read Scale Barcodes"
                description="When enabled, the terminal will read the configuration below and use them to read barcodes scanned from scales"
            >
                <Checkbox
                    checked={branchRegistry?.terminalSettings?.scaleSettings?.readScaleBarCodes}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'scaleSettings.readScaleBarCodes', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="Total Number Of Digits"
                description="Enter total number of digits"
            >
                <Input
                    type="number"
                    value={branchRegistry?.terminalSettings?.scaleSettings?.totalNumberOfDigits ?? ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'scaleSettings.totalNumberOfDigits', value: parseNumberOrNull(e.target.value) }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Prefix"
                description="Enter Prefix"
            >
                <Input
                    value={branchRegistry?.terminalSettings?.scaleSettings?.prefix || ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'scaleSettings.prefix', value: e.target.value }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Plus Start Position"
                description="Enter plus start position"
            >
                <Input
                    type="number"
                    value={branchRegistry?.terminalSettings?.scaleSettings?.pluStartPosition ?? ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'scaleSettings.pluStartPosition', value: parseNumberOrNull(e.target.value) }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Plus Total Digit Count"
                description="Enter plus total digit count"
            >
                <Input
                    type="number"
                    value={branchRegistry?.terminalSettings?.scaleSettings?.pluTotalDigitCount ?? ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'scaleSettings.pluTotalDigitCount', value: parseNumberOrNull(e.target.value) }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Price Start Position"
                description="Enter price start position"
            >
                <Input
                    type="number"
                    value={branchRegistry?.terminalSettings?.scaleSettings?.priceStartPosition ?? ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'scaleSettings.priceStartPosition', value: parseNumberOrNull(e.target.value) }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Price Total Digit Count"
                description="Enter price total digit count"
            >
                <Input
                    type="number"
                    value={branchRegistry?.terminalSettings?.scaleSettings?.priceTotalDigitCount ?? ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'scaleSettings.priceTotalDigitCount', value: parseNumberOrNull(e.target.value) }))}
                    className="w-48"
                />
            </FieldWrapper>
        </div>
    );
}

function Devices() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();

    const selectedType = branchRegistry.terminalSettings?.scaleIntegrationType

    const integrationTypeOptions = [
        { label: 'Direct', value: ScaleIntegrationTypeEnum.direct },
        { label: 'Rize Integrator', value: ScaleIntegrationTypeEnum.rizeIntegrator },
        { label: 'None', value: ScaleIntegrationTypeEnum.none },
    ];

    return (
        <Tabs defaultValue="price-computing-scale" className="w-full">
            <TabsList>
                <TabsTrigger value="price-computing-scale">Price computing scale</TabsTrigger>
                <TabsTrigger value="direct-scale">Direct scale</TabsTrigger>
                <TabsTrigger value="debit-machine">Debit machine</TabsTrigger>
                <TabsTrigger value="rize-integrator">Rize integrator</TabsTrigger>
                <TabsTrigger value="customer-screen">Customer screen</TabsTrigger>
            </TabsList>
            <TabsContent value="price-computing-scale">
                <ScaleSettings />
            </TabsContent>
            <TabsContent value="direct-scale">
                <div className="space-y-1">
                    <FieldWrapper
                        title="Integration Type"
                        description="Integration type of the direct scale which can be either direct communication or rize integrator"
                    >
                        <ShadcnSelect
                            value={selectedType}
                            onValueChange={value => dispatch(changeTerminalField({ name: "scaleIntegrationType", value }))}
                        >
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select Integration Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {integrationTypeOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </ShadcnSelect>
                    </FieldWrapper>
                    {/* Conditionally rendered based on integration type */}
                    {selectedType === ScaleIntegrationTypeEnum.direct && (
                        <>
                            <FieldWrapper
                                title="Serial Port Name"
                                description="Serial port name that the scale is connected to"
                            >
                                <Input
                                    value={branchRegistry?.terminalSettings?.serialScaleSettings?.serialPortName || ''}
                                    onChange={(e) => dispatch(changeTerminalField({ name: 'serialScaleSettings.serialPortName', value: e.target.value }))}
                                    className="w-48"
                                />
                            </FieldWrapper>

                            <FieldWrapper
                                title="Get weight message"
                                description="The message sent to the scale when getting the weight"
                            >
                                <Input
                                    value={branchRegistry?.terminalSettings?.serialScaleSettings?.getWeightMessage || ''}
                                    onChange={(e) => dispatch(changeTerminalField({ name: 'serialScaleSettings.getWeightMessage', value: e.target.value }))}
                                    className="w-48"
                                />
                            </FieldWrapper>

                            <FieldWrapper
                                title="Expected payload length"
                                description="Expected payload length of the scale in the serial port"
                            >
                                <Input
                                    value={branchRegistry?.terminalSettings?.serialScaleSettings?.expectedPayloadLength || ''}
                                    onChange={(e) => dispatch(changeTerminalField({ name: 'serialScaleSettings.expectedPayloadLength', value: e.target.value }))}
                                    className="w-48"
                                />
                            </FieldWrapper>
                        </>
                    )}

                    {selectedType === ScaleIntegrationTypeEnum.rizeIntegrator && (
                        <>
                            <FieldWrapper
                                title="Timeout In Seconds"
                                description="Timeout in seconds used by the debit machine"
                            >
                                <Input
                                    type="number"
                                    value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.timeoutInSeconds ?? ''}
                                    onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.timeoutInSeconds', value: parseFloat(e.target.value) ?? null }))}
                                    className="w-48"
                                />
                            </FieldWrapper>

                            <FieldWrapper
                                title="Interface Type"
                                description="Interface Type used to communicate with the direct scale"
                            >
                                <ShadcnSelect
                                    value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.interfaceType}
                                    onValueChange={(value) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.interfaceType', value }))}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Select interface type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(DeviceInterfaceEnum).map(method => (
                                            <SelectItem key={method} value={method}>{method}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </ShadcnSelect>
                            </FieldWrapper>
                            {/* <div className="col-12">
                                <FieldWrapper
                                    icon="pi-cloud"
                                    title="Scale command"
                                    description="The command that the integrator will use to get the weight from serial scale"
                                >
                                    <InputText
                                        value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.scaleCommand}
                                        onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.scaleCommand', value: e.target.value }))}
                                    />
                                </FieldWrapper>
                            </div>
                            <div className="col-12">
                                <FieldWrapper
                                    icon="pi-cloud"
                                    title="Weight multiplier"
                                    description="The weight multiplier of the scale used by rize integrator"
                                >
                                    <InputNumber
                                        value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.weightMultiplier}
                                        onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.weightMultiplier', value: e.value }))}
                                    />
                                </FieldWrapper>
                            </div>
                            <div className="col-12">
                                <FieldWrapper
                                    icon="pi-cloud"
                                    title="Scale result length"
                                    description="The scale result length of the scale used by rize integrator"
                                >
                                    <InputNumber
                                        value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.scaleResultLength}
                                        onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.scaleResultLength', value: e.value }))}
                                    />
                                </FieldWrapper>
                            </div> */}
                            {/* <div className="col-12">
                                <FieldWrapper
                                    icon="pi-shopping-bag"
                                    title="Interface Type"
                                    description="Interface Type used to communicate with the direct scale"
                                >
                                    <Dropdown
                                        options={Object.values(DeviceInterfaceEnum).map(method => ({ label: method, value: method }))}
                                        value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.interfaceSettings?.deviceInterface}
                                        onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.interfaceSettings.deviceInterface', value: e.value }))}
                                    />
                                </FieldWrapper>
                            </div> */}
                            {/* {branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.interfaceSettings?.deviceInterface === DeviceInterfaceEnum.serial && (
                                <>
                                    <div className="col-12">
                                        <FieldWrapper
                                            icon="pi-sort-numeric-up-alt"
                                            title="Com Port"
                                            description="Com Port that the direct scale will use"
                                        >
                                            <InputNumber
                                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.interfaceSettings?.comPort}
                                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.interfaceSettings.comPort', value: e.value }))}
                                            />
                                        </FieldWrapper>
                                    </div>
                                    <div className="col-12">
                                        <FieldWrapper
                                            icon="pi-sort-numeric-up-alt"
                                            title="Baud Rate"
                                            description="Baud Rate that the direct scale will use"
                                        >
                                            <InputNumber
                                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.interfaceSettings?.baudRate}
                                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.interfaceSettings.baudRate', value: e.value }))}
                                            />
                                        </FieldWrapper>
                                    </div>
                                    <div className="col-12">
                                        <FieldWrapper
                                            icon="pi-sort-numeric-up-alt"
                                            title="Parity"
                                            description="Parity that the direct scale will use"
                                        >
                                            <Dropdown
                                                options={Object.values(ParityEnum).map(method => ({ label: method, value: method }))}
                                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.interfaceSettings?.parity}
                                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.interfaceSettings.parity', value: e.value }))}
                                            />
                                        </FieldWrapper>
                                    </div>
                                    <div className="col-12">
                                        <FieldWrapper
                                            icon="pi-database"
                                            title="Data bits"
                                            description="Data bits that the direct scale will use"
                                        >
                                            <Dropdown
                                                options={Object.values(DataBitsEnum).map(method => ({ label: method, value: method }))}
                                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.interfaceSettings?.dataBits}
                                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.interfaceSettings.dataBits', value: e.value }))}
                                            />
                                        </FieldWrapper>
                                    </div>
                                    <div className="col-12">
                                        <FieldWrapper
                                            icon="pi-stop-circle"
                                            title="Stop bits"
                                            description="Stop bits that the direct scale will use"
                                        >
                                            <Dropdown
                                                options={Object.values(StopBitsEnum).map(method => ({ label: method, value: method }))}
                                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.interfaceSettings?.stopBits}
                                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.interfaceSettings.stopBits', value: e.value }))}
                                            />
                                        </FieldWrapper>
                                    </div>
                                    <div className="col-12">
                                        <FieldWrapper
                                            icon="pi-mobile"
                                            title="Hand shake"
                                            description="Hand shake that the direct scale will use"
                                        >
                                            <Dropdown
                                                options={Object.values(HandShakeEnum).map(method => ({ label: method, value: method }))}
                                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.interfaceSettings?.handShake}
                                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.interfaceSettings.handShake', value: e.value }))}
                                            />
                                        </FieldWrapper>
                                    </div>
                                    <div className="col-12">
                                        <FieldWrapper
                                            icon="pi-lock-open"
                                            title="Dtr Enabled"
                                            description="Dtr Enabled that the direct scale will use"
                                        >
                                            <Checkbox
                                                checked={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings.interfaceSettings?.dtrEnabled}
                                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings.interfaceSettings?.dtrEnabled}
                                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.interfaceSettings.dtrEnabled', value: e.checked }))}
                                            />
                                        </FieldWrapper>
                                    </div>
                                    <div className="col-12">
                                        <FieldWrapper
                                            icon="pi-lock-open"
                                            title="Rts Enabled"
                                            description="Rts Enabled that the direct scale will use"
                                        >
                                            <Checkbox
                                                checked={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings.interfaceSettings?.rtsEnabled}
                                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings.interfaceSettings?.rtsEnabled}
                                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.interfaceSettings.rtsEnabled', value: e.checked }))}
                                            />
                                        </FieldWrapper>
                                    </div>
                                    <div className="col-12">
                                        <FieldWrapper
                                            icon="pi-lock-open"
                                            title="Add Cr"
                                            description="Add Cr that the direct scale will use"
                                        >
                                            <Checkbox
                                                checked={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings.interfaceSettings?.addCr}
                                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings.interfaceSettings?.addCr}
                                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.interfaceSettings.addCr', value: e.checked }))}
                                            />
                                        </FieldWrapper>
                                    </div>
                                </>
                            )} */}
                        </>
                    )}
                </div>
            </TabsContent>
            <TabsContent value="debit-machine">
                <CreditCardSettings />
            </TabsContent>
            <TabsContent value="rize-integrator">
                <div className="space-y-1">
                    <FieldWrapper
                        title="Service Port"
                        description="Specify the port which the service must listen to"
                    >
                        <Input
                            type="number"
                            value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.port ?? ''}
                            onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.port', value: parseFloat(e.target.value) ?? null }))}
                            className="w-48"
                        />
                    </FieldWrapper>
                </div>
            </TabsContent>
            <TabsContent value="customer-screen">
                <CustomerAppSettings />
            </TabsContent>
        </Tabs>
    )
}

function EmailLogsSettings() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();

    return (
        <div className="space-y-1">
            <FieldWrapper
                title="Max Email Attachment Size"
                description="Enter max email attachment size"
            >
                <Input
                    type="number"
                    value={branchRegistry?.terminalSettings?.emailLogsSettings?.maxEmailAttachmentSize ?? ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'emailLogsSettings.maxEmailAttachmentSize', value: parseFloat(e.target.value) ?? null }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Recipient"
                description="Enter recipient"
            >
                <Input
                    value={branchRegistry?.terminalSettings?.emailLogsSettings?.recipient || ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'emailLogsSettings.recipient', value: e.target.value }))}
                    className="w-48"
                />
            </FieldWrapper>
        </div>
    );
}

function CustomerAppSettings() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const tvsList: ITv[] = useAppSelector(state => state.tv.entities);
    const dispatch = useAppDispatch()
    const enableCustomerApp = !!branchRegistry?.terminalSettings?.enableCustomerApp;
    const customerAppIsOnSameDevice = !!branchRegistry?.terminalSettings?.customerAppIsOnSameDevice;

    return (
        <div className="space-y-1">
            <FieldWrapper
                title="Enable Customer Screen"
                description="This flag enables the customer screen and allows the pos to connect and send it the required data"
            >
                <Checkbox
                    checked={branchRegistry?.terminalSettings?.enableCustomerApp}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'enableCustomerApp', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="Same Device As Customer Screen"
                description="If checked, it will enable the capability to open the app from the pos window (only available on windows)"
            >
                <Checkbox
                    disabled={!enableCustomerApp}
                    checked={enableCustomerApp && customerAppIsOnSameDevice}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'customerAppIsOnSameDevice', value: checked }))}
                />
            </FieldWrapper>

            {enableCustomerApp && customerAppIsOnSameDevice && (
                <FieldWrapper
                    title="Path To Customer App"
                    description="Path of the customer screen executable on the same device"
                >
                    <Input
                        value={branchRegistry.terminalSettings?.pathToCustomerApp || ''}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'pathToCustomerApp', value: e.target.value }))}
                        className="w-48"
                    />
                </FieldWrapper>
            )}

            <FieldWrapper
                title="Customer App IP"
                description="Enter IP address of the customer app"
            >
                <Input
                    value={branchRegistry.terminalSettings?.customerAppIp || ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'customerAppIp', value: e.target.value }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Customer App Port"
                description="Enter port number of the customer app"
            >
                <Input
                    type="number"
                    value={branchRegistry.terminalSettings?.customerAppPort ?? ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'customerAppPort', value: parseFloat(e.target.value) ?? null }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Customer Screen Font Size"
                description="Choose font size used by the customer screen"
            >
                <ShadcnSelect
                    value={branchRegistry.terminalSettings?.customerScreenFontSize || 'regular'}
                    onValueChange={(value) => dispatch(changeTerminalField({ name: 'customerScreenFontSize', value }))}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select font size" />
                    </SelectTrigger>
                    <SelectContent>
                        {customerScreenFontSizeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                    </SelectContent>
                </ShadcnSelect>
            </FieldWrapper>

            <FieldWrapper
                title="TV"
                description="Choose tv to take the pics from, to display them on the side"
            >
                <ShadcnSelect
                    value={branchRegistry.terminalSettings?.customerScreenTV?.id}
                    onValueChange={(value) => dispatch(changeTerminalField({ name: 'customerScreenTV.id', value }))}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select TV" />
                    </SelectTrigger>
                    <SelectContent>
                        {tvsList.map(tv => (
                            <SelectItem key={tv.id} value={tv.id}>{tv.name}</SelectItem>
                        ))}
                    </SelectContent>
                </ShadcnSelect>
            </FieldWrapper>
        </div>
    );
}

const CreditCardSettings = () => {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();

    const integrationTypeOptions = [
        { label: 'Elavon CWS', value: CreditCardIntegrationTypeEnum.ELAVON_CWS },
        { label: 'None', value: null },
        { label: 'Direct', value: CreditCardIntegrationTypeEnum.INGENICO },
        { label: 'Rize Integrator', value: CreditCardIntegrationTypeEnum.rizeIntegrator },
    ];

    const selectedType = branchRegistry?.terminalSettings?.creditCardIntegrationType;

    const providerTypesValue =
        branchRegistry?.terminalSettings?.elavonCWSConfiguration?.readerSettings?.providerTypes;
    const providerTypesOptions = providerTypesValue
        ? (Array.isArray(providerTypesValue) ? providerTypesValue : [providerTypesValue]).map(
            type => ({ label: type, value: type })
        )
        : null;

    const connectionTypesValue =
        branchRegistry?.terminalSettings?.elavonCWSConfiguration?.readerSettings?.connectionTypes;
    const connectionTypesOptions = connectionTypesValue
        ? (Array.isArray(connectionTypesValue) ? connectionTypesValue : [connectionTypesValue]).map(
            type => ({ label: type, value: type })
        )
        : null;

    const deviceTypesValue =
        branchRegistry?.terminalSettings?.elavonCWSConfiguration?.readerSettings?.deviceTypes;
    const deviceTypesOptions = deviceTypesValue
        ? (Array.isArray(deviceTypesValue) ? deviceTypesValue : [deviceTypesValue]).map(
            type => ({ label: type, value: type })
        )
        : null;

    return (
        <div className="space-y-1">
            <FieldWrapper
                title="Integration Type"
                description="Select credit card integration provider"
            >
                <ShadcnSelect
                    value={selectedType ?? 'none'}
                    onValueChange={value => dispatch(changeTerminalField({
                        name: "creditCardIntegrationType",
                        value: value === 'none' ? null : value
                    }))}
                >
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select Integration Type" />
                    </SelectTrigger>
                    <SelectContent>
                        {integrationTypeOptions.map(opt => (
                            <SelectItem key={opt.value || 'none'} value={opt.value || 'none'}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </ShadcnSelect>
            </FieldWrapper>

            {/* Conditionally rendered based on integration type */}
            {selectedType === CreditCardIntegrationTypeEnum.ELAVON_CWS && (
                <>
                    <h4 className='text-lg font-semibold border-b pb-2 mt-6'>
                        CWS Settings
                    </h4>

                    <FieldWrapper
                        title="Auto Configure On Startup"
                        description="Autoconfigure elavon cws on startup of the application (must complete all configuration steps to be able to do so)"
                    >
                        <Checkbox
                            checked={branchRegistry?.terminalSettings?.elavonCWSConfiguration?.autoconfigure}
                            onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'elavonCWSConfiguration.autoconfigure', value: checked }))}
                        />
                    </FieldWrapper>

                    <FieldWrapper
                        title="CWS Machine Ip"
                        description="IP of the machine hosting cws"
                    >
                        <Input
                            value={branchRegistry?.terminalSettings?.elavonCWSConfiguration?.cwsIp || ''}
                            onChange={(e) => dispatch(changeTerminalField({ name: 'elavonCWSConfiguration.cwsIp', value: e.target.value }))}
                            className="w-48"
                        />
                    </FieldWrapper>

                    <FieldWrapper
                        title="CWS Machine Port"
                        description="Port of cws on the machine"
                    >
                        <Input
                            type="number"
                            value={branchRegistry?.terminalSettings?.elavonCWSConfiguration?.cwsPort ?? ''}
                            onChange={(e) => dispatch(changeTerminalField({ name: 'elavonCWSConfiguration.cwsPort', value: parseFloat(e.target.value) ?? null }))}
                            className="w-48"
                        />
                    </FieldWrapper>
                    <div className="col-12">
                        <h4 className='text-decoration-underline'>
                            {/* eslint-disable-next-line react/no-unescaped-entities */}
                            Elavon Account Settings (Same as "Elavon" integration type)
                        </h4>
                        <div className="col-12">
                            <ElavonIntegrationType />
                        </div>
                        <h4 className='text-decoration-underline'>
                            Reader Settings
                        </h4>
                        <div className="col-12">
                            <FieldWrapper
                                icon="pi-wifi"
                                title="CWS Reader IP"
                                description="IP of the credit card reader"
                            >
                                <Input
                                    value={branchRegistry?.terminalSettings?.elavonCWSConfiguration?.readerSettings?.inetAddress?.host || ''}
                                    onChange={(e) => dispatch(changeTerminalField({ name: 'elavonCWSConfiguration.readerSettings.inetAddress.host', value: e.target.value }))}
                                />
                            </FieldWrapper>
                        </div>
                        <div className="col-12">
                            <FieldWrapper
                                icon="pi-angle-double-up"
                                title="CWS Reader Port"
                                description="Port of the credit card reader"
                            >
                                <Input
                                    type="number"
                                    value={branchRegistry?.terminalSettings?.elavonCWSConfiguration?.readerSettings?.inetAddress?.port ?? ''}
                                    onChange={(e) => dispatch(changeTerminalField({ name: 'elavonCWSConfiguration.readerSettings.inetAddress.port', value: parseFloat(e.target.value) ?? null }))}
                                />
                            </FieldWrapper>
                        </div>
                        <div className="col-12">
                            <FieldWrapper
                                icon="pi-lock"
                                title="CWS Reader Encryption Scheme"
                                description="Select card reader encryption scheme, could be any of: None, TLS 1.2"
                            >
                                <Select
                                    options={Object.values(EncryptionSchemeEnum).map(type => ({
                                        label: type,
                                        value: type
                                    }))}
                                    value={{
                                        value: branchRegistry?.terminalSettings?.elavonCWSConfiguration?.readerSettings?.inetAddress?.encryptionScheme,
                                        label: branchRegistry?.terminalSettings?.elavonCWSConfiguration?.readerSettings?.inetAddress?.encryptionScheme
                                    }}
                                    onChange={(e) => dispatch(changeTerminalField({
                                        name: 'elavonCWSConfiguration.readerSettings.inetAddress.encryptionScheme',
                                        value: e.value
                                    }))}
                                />
                            </FieldWrapper>
                        </div>
                        <div className="col-12">
                            <FieldWrapper
                                icon="pi-id-card"
                                title="CWS Reader provider Types"
                                description="IP of the machine hosting cws"
                            >
                                <Select
                                    options={Object.values(ProviderTypesEnum).map(type => ({ label: type, value: type }))}
                                    value={providerTypesOptions}
                                    onChange={(selected) =>
                                        dispatch(
                                            changeTerminalField({
                                                name: 'elavonCWSConfiguration.readerSettings.providerTypes',
                                                value: selected ? selected.map(option => option.value) : []
                                            })
                                        )
                                    }
                                    isMulti
                                    isClearable
                                />
                            </FieldWrapper>
                        </div>
                        <div className="col-12">
                            <FieldWrapper
                                icon="pi-sitemap"
                                title="CWS Reader Connection Types"
                                description=""
                            >
                                <Select
                                    options={Object.values(ConnectionTypesEnum).map(type => ({ label: type, value: type }))}
                                    value={connectionTypesOptions}
                                    onChange={(selected) =>
                                        dispatch(
                                            changeTerminalField({
                                                name: 'elavonCWSConfiguration.readerSettings.connectionTypes',
                                                value: selected ? selected.map(option => option.value) : []
                                            })
                                        )
                                    }
                                    isMulti
                                    isClearable
                                />
                            </FieldWrapper>
                        </div>
                        <div className="col-12">
                            <FieldWrapper
                                icon="pi-desktop"
                                title="CWS Reader Device Types"
                                description=""
                            >
                                <Select
                                    options={Object.values(DeviceTypesEnum).map(type => ({ label: type, value: type }))}
                                    value={deviceTypesOptions}
                                    onChange={(selected) =>
                                        dispatch(
                                            changeTerminalField({
                                                name: 'elavonCWSConfiguration.readerSettings.deviceTypes',
                                                value: selected ? selected.map(option => option.value) : []
                                            })
                                        )
                                    }
                                    isMulti
                                    isClearable
                                />
                            </FieldWrapper>
                        </div>
                    </div>
                </>
            )}

            {!selectedType && (
                <div className="col-12">
                    {/* <ElavonIntegrationType /> */}
                </div>
            )}

            {selectedType === CreditCardIntegrationTypeEnum.INGENICO && (
                <>
                    <FieldWrapper
                        title="Credit Card Machine IP"
                        description=""
                    >
                        <Input
                            value={branchRegistry?.terminalSettings?.creditCardMachineIp || ''}
                            onChange={(e) => dispatch(changeTerminalField({ name: 'creditCardMachineIp', value: e.target.value }))}
                            className="w-48"
                        />
                    </FieldWrapper>

                    <FieldWrapper
                        title="Credit Card Machine PORT"
                        description="Enter port number of the customer app"
                    >
                        <Input
                            value={branchRegistry?.terminalSettings?.creditCardMachinePort || ''}
                            onChange={(e) => dispatch(changeTerminalField({ name: 'creditCardMachinePort', value: e.target.value }))}
                            className="w-48"
                        />
                    </FieldWrapper>
                </>
            )}

            {selectedType === CreditCardIntegrationTypeEnum.rizeIntegrator && (
                <>
                    <FieldWrapper
                        title="Timeout In Seconds"
                        description="Timeout in seconds used by the debit machine"
                    >
                        <Input
                            type="number"
                            value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.debitMachineSettings?.timeoutInSeconds ?? ''}
                            onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.debitMachineSettings.timeoutInSeconds', value: parseFloat(e.target.value) ?? null }))}
                            className="w-48"
                        />
                    </FieldWrapper>
                    {/* <div className="col-12">
                        <FieldWrapper
                            icon="pi-wifi"
                            title="Connection Timeout In Seconds"
                            description="Connection timeout in seconds used by the debit machine"
                        >
                            <InputNumber
                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.debitMachineSettings?.connectionTimeoutInSeconds}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.debitMachineSettings.connectionTimeoutInSeconds', value: e.value }))}
                            />
                        </FieldWrapper>
                    </div>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-wifi"
                            title="Paymentree Terminal Port"
                            description="Paymentree terminal port used by the debit machine"
                        >
                            <InputNumber
                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.debitMachineSettings?.paymentreeTerminalPort}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.debitMachineSettings.paymentreeTerminalPort', value: e.value }))}
                            />
                        </FieldWrapper>
                    </div>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-wifi"
                            title="Paymentree Client Id"
                            description="Paymentree client id used by the debit machine"
                        >
                            <InputText
                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.debitMachineSettings?.paymentreeClientId}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.debitMachineSettings.paymentreeClientId', value: e.target.value }))}
                            />
                        </FieldWrapper>
                    </div>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-wifi"
                            title="Paymentree Location"
                            description="Paymentree location used by the debit machine"
                        >
                            <InputText
                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.debitMachineSettings?.paymentreeLocation}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.debitMachineSettings.paymentreeLocation', value: e.target.value }))}
                            />
                        </FieldWrapper>
                    </div>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-wifi"
                            title="Paymentree Register Id"
                            description="Paymentree register id used by the debit machine"
                        >
                            <InputText
                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.debitMachineSettings?.paymentreeRegisterId}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.debitMachineSettings.paymentreeRegisterId', value: e.target.value }))}
                            />
                        </FieldWrapper>
                    </div>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-wifi"
                            title="Paymentree Terminal IP"
                            description="Paymentree terminal ip used by the debit machine"
                        >
                            <InputText
                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.debitMachineSettings?.paymentreeTerminalIp}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.debitMachineSettings.paymentreeTerminalIp', value: e.target.value }))}
                            />
                        </FieldWrapper>
                    </div>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-shopping-bag"
                            title="Interface Type"
                            description="Interface type used to communicate with the debit machine"
                        >
                            <Dropdown
                                options={Object.values(DebitMachineSettingsInterfaceSettingsEnum).map(method => ({ label: method, value: method }))}
                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.debitMachineSettings?.interfaceSettings}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.debitMachineSettings.interfaceSettings', value: e.value }))}
                            />
                        </FieldWrapper>
                    </div>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-wifi"
                            title="IP"
                            description="Ip address that the debit machine will use"
                        >
                            <InputText
                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.debitMachineSettings?.ipAddress}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.debitMachineSettings.ipAddress', value: e.target.value }))}
                            />
                        </FieldWrapper>
                    </div>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-wifi"
                            title="Port"
                            description="Port that the debit machine will use"
                        >
                            <InputNumber
                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.debitMachineSettings?.port}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.debitMachineSettings.port', value: e.value }))}
                            />
                        </FieldWrapper>
                    </div> */}
                </>
            )}

        </div>
    );
};

const ElavonIntegrationType = () => {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();

    return (
        <div className="space-y-1">
            <FieldWrapper
                title="Merchant Id"
                description="Enter the merchant id of the elavon account"
            >
                <Input
                    value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.merchantId || ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.merchantId', value: e.target.value }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="User Id"
                description="Enter the user id of the elavon account"
            >
                <Input
                    value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.userId || ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.userId', value: e.target.value }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Pin"
                description="Enter the pin of the elavon account"
            >
                <Input
                    value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.pin || ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.pin', value: e.target.value }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Vendor Id"
                description="Enter the vendor id of the elavon account"
            >
                <Input
                    value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.vendorId || ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.vendorId', value: e.target.value }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Vendor App Names"
                description="Enter the vendor app names of the elavon account"
            >
                <Input
                    value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.vendorAppName || ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.vendorAppName', value: e.target.value }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Vendor App Version"
                description="Enter the vendor app version of the elavon account"
            >
                <Input
                    value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.vendorAppVersion || ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.vendorAppVersion', value: e.target.value }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="BMS Username"
                description="Enter the bms username of the elavon account"
            >
                <Input
                    value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.bmsUsername || ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.bmsUsername', value: e.target.value }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="BMP Password"
                description="Enter the bms password of the elavon account"
            >
                <Input
                    value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.bmsPassword || ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.bmsPassword', value: e.target.value }))}
                    className="w-48"
                />
            </FieldWrapper>
        </div>
    )
}

// function ServerProperties() {
//     const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
//     const dispatch = useAppDispatch();

//     return (
//         <div className="grid">
//             <div className="col-12">
//                 <FieldWrapper
//                     icon="pi-credit-card"
//                     title="Client Id"
//                     description="Enter client id"
//                 >
//                     <InputText />
//                 </FieldWrapper>
//             </div>
//             <div className="col-12">
//                 <FieldWrapper
//                     icon="pi-credit-card"
//                     title="Client Secret"
//                     description="Enter client secret"
//                 >
//                     <InputText />
//                 </FieldWrapper>
//             </div>
//             <div className="col-12">
//                 <FieldWrapper
//                     icon="pi-copy"
//                     title="End Of Day Summary URL"
//                     description="Enter end of day summary url"
//                 >
//                     <InputNumber />
//                 </FieldWrapper>
//             </div>
//         </div>
//     );
// }

export function PrinterProperties() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();
    const receiptPrinter = branchRegistry.terminalSettings?.printerSettings?.receipt?.[0];
    const configuredReceiptCopies = branchRegistry.terminalSettings?.receiptCopies;
    const receiptCopies = isValidReceiptCopies(configuredReceiptCopies)
        ? configuredReceiptCopies
        : DEFAULT_RECEIPT_COPIES;

    return (
        <div className="space-y-1">
            <FieldWrapper
                title="Print Receipt by Default (Walk in)"
                description="Disabling this will disable printing the receipt on payment and you will be obliged to click the button to print it, only applies to walk in orders"
            >
                <Checkbox
                    checked={branchRegistry.terminalSettings?.printReceiptByDefault}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'printReceiptByDefault', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="Show order number on receipt"
                description="Show order number just above the receipt number"
            >
                <Checkbox
                    checked={branchRegistry.terminalSettings?.receiptShowOrderNumber}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'receiptShowOrderNumber', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="Receipt Header"
                description="Add a header to the receipt"
            >
                <Input
                    value={branchRegistry.terminalSettings?.receiptHeader || ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'receiptHeader', value: e.target.value }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Receipt Footer"
                description="Add a Footer to the receipt"
            >
                <Input
                    value={branchRegistry.terminalSettings?.receiptFooter || ''}
                    onChange={(e) => dispatch(changeTerminalField({ name: 'receiptFooter', value: e.target.value }))}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Open Drawer Type"
                description="Set drawer to open either before or after printing or set to manually be opened"
            >
                <ShadcnSelect
                    value={branchRegistry.terminalSettings?.openDrawerType}
                    onValueChange={(value) => dispatch(changeTerminalField({ name: 'openDrawerType', value }))}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select drawer type" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(openDrawerTypeEnum).map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </ShadcnSelect>
            </FieldWrapper>

            <FieldWrapper
                title="Open Drawer on Debit/Credit Transactions"
                description="Option to open drawer on debit/card related transactions"
            >
                <Checkbox
                    checked={branchRegistry.terminalSettings?.openDrawerOnDebitCreditTransactions}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'openDrawerOnDebitCreditTransactions', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="Receipt Copies"
                description="This specifies the number of copies of the receipt printed by default on payment"
            >
                <Input
                    type="number"
                    min={1}
                    step={1}
                    value={receiptCopies}
                    onChange={(e) => {
                        const value = parsePositiveInteger(e.target.value);
                        if (value !== null) {
                            dispatch(changeTerminalField({ name: 'receiptCopies', value }));
                        }
                    }}
                    className="w-48"
                />
            </FieldWrapper>

            <FieldWrapper
                title="Reverse"
                description="Send print commands in reverse (This is a special case for some printers where it prints the data in reverse)"
            >
                <Checkbox
                    checked={branchRegistry.terminalSettings?.printerSettings?.receipt?.[0]?.reverse}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'printerSettings.receipt.0.reverse', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="Print By PDF"
                description="Print receipt by PDF"
            >
                <Checkbox
                    checked={branchRegistry.terminalSettings?.printerSettings?.receipt?.[0]?.printByPdf}
                    onCheckedChange={(checked) => dispatch(changeTerminalField({ name: 'printerSettings.receipt.0.printByPdf', value: checked }))}
                />
            </FieldWrapper>

            <FieldWrapper
                title="Printer Type"
                description="Connection type to the printer (Network/USB)"
            >
                <ShadcnSelect
                    value={receiptPrinter?.type}
                    onValueChange={(value) => dispatch(changeTerminalField({ name: 'printerSettings.receipt.0.type', value }))}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select printer type" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(PrinterConnectionTypeEnum).map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </ShadcnSelect>
            </FieldWrapper>

            {receiptPrinter?.type === PrinterConnectionTypeEnum.NETWORK ? (
                <>
                    <FieldWrapper
                        title="Printer IP Address"
                        description="IP address of the network printer"
                    >
                        <Input
                            type="text"
                            value={receiptPrinter.ip || ''}
                            onChange={(e) => dispatch(changeTerminalField({ name: 'printerSettings.receipt.0.ip', value: e.target.value }))}
                            className="w-48"
                        />
                    </FieldWrapper>

                    <FieldWrapper
                        title="Printer Port"
                        description="Port of the network printer"
                    >
                        <Input
                            type="number"
                            min={1}
                            step={1}
                            value={receiptPrinter.port ?? ''}
                            onChange={(e) => {
                                const value = parseOptionalPositiveInteger(e.target.value);
                                if (value !== undefined) {
                                    dispatch(changeTerminalField({ name: 'printerSettings.receipt.0.port', value }));
                                }
                            }}
                            className="w-48"
                        />
                    </FieldWrapper>
                </>
            ) : (
                <FieldWrapper
                    title="Printer Name"
                    description="Printer name from the windows system"
                >
                    <Input
                        value={receiptPrinter?.name || ''}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'printerSettings.receipt.0.name', value: e.target.value }))}
                        className="w-48"
                    />
                </FieldWrapper>
            )}

            <FieldWrapper
                title="Printer Size"
                description="Choose one of the supported printer sizes"
            >
                <ShadcnSelect
                    value={branchRegistry.terminalSettings?.printerSettings?.receipt?.[0]?.size}
                    onValueChange={(value) => dispatch(changeTerminalField({ name: 'printerSettings.receipt.0.size', value }))}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select printer size" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(PrinterSizeEnum).map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </ShadcnSelect>
            </FieldWrapper>
        </div>
    );
}

// Sections configuration
const sections: MenuItem[] = [
    { label: 'General', component: GeneralSettings },
    { label: 'Personalization', component: PersonalizationSettings },
    { label: 'Admin Actions', component: AdminActionsSettings },
    { label: 'Devices', component: Devices },
    // { label: 'Scale Settings', component: ScaleSettings },
    { label: 'Email Logs Settings', component: EmailLogsSettings },
    // { label: 'Customer App', component: CustomerAppSettings },
    // { label: 'Credit Card Processing', component: CreditCardSettings },
    // { label: 'Server Properties', component: ServerProperties },
    { label: 'Printer Properties', component: PrinterProperties },
];

export default BranchRegistryTerminalSettings
