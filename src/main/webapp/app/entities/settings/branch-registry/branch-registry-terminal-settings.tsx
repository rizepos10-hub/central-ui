import { IBranchRegistry } from 'app/shared/model/branch-registry.model'
import React, { useState, useEffect } from 'react'
import { Menu } from 'primereact/menu';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { ConnectionTypesEnum, CreditCardIntegrationTypeEnum, DataBitsEnum, DebitMachineSettingsInterfaceSettingsEnum, DeviceInterfaceEnum, DeviceTypesEnum, EncryptionSchemeEnum, HandShakeEnum, openDrawerTypeEnum, ParityEnum, PrinterConnectionTypeEnum, PrinterSizeEnum, ProviderTypesEnum, ScaleIntegrationTypeEnum, StopBitsEnum } from 'app/shared/model/terminal-settings';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeTerminalField, updateEntity, getEntity} from './branch-registry.reducer';
import { OrderMethod } from 'app/shared/model/ENUMS/order-method.model';
import { Button } from 'primereact/button';
import Select from 'react-select';
import { TabPanel, TabView } from 'primereact/tabview';
import Printer from '../printing/printer/printer';
import { getEntities } from '../tv-config/tv/tv.reducer';
import { ITv } from 'app/shared/model/TV/tv.model';

type MenuItem = {
    label: string;
    component: React.FC;
};

const FieldWrapper: React.FC<{
    icon: string;
    title: string;
    description?: string;
    children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
    <div className="flex justify-content-between mb-5">
        <div className="flex align-items-center gap-3">
            <i className={`pi ${icon} text-xl`} />
            <div>
                <h4 className="m-0">{title}</h4>
                {description && <p className="text-sm text-500 mt-1">{description}</p>}
            </div>
        </div>
        {children}
    </div>
);

const BranchRegistryTerminalSettings = () => {
    const [activeSection, setActiveSection] = useState<MenuItem>(sections[0]);
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
        <div className="container-fluid h-100">
            <div className="row h-100">
                {/* Sidebar */}
                <div className="col-md-2 border-right p-3">
                    <Menu
                        model={sections.map(section => ({
                            label: section.label,
                            command: () => setActiveSection(section)
                        }))}
                        className="w-100 border-0"
                    />
                </div>

                {/* Main Content */}
                <div className="col-md-10 p-4">
                    <h2 className="mb-4">{activeSection.label}</h2>
                    <activeSection.component />
                </div>

                {/* Save Button */}
                <div>
                    <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit">
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Section Components
function GeneralSettings() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();

    return (
        <div className="grid">
            <div className="col-12">
                <FieldWrapper
                    icon="pi-building"
                    title="Business Type"
                    description="Choose business type"
                >
                    <Dropdown
                        options={[
                            { label: 'Retail', value: 'RETAIL' },
                            { label: 'Restaurant', value: 'RESTAURANT' }
                        ]}
                        value={branchRegistry?.terminalSettings?.businessType}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'businessType', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-shopping-bag"
                    title="Order Type"
                    description="Choose Order type"
                >
                    <Dropdown
                        options={Object.values(OrderMethod).map(method => ({ label: method, value: method }))}
                        value={branchRegistry?.terminalSettings?.orderType}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'orderType', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-wallet"
                    title="Enable Split Bills"
                    description="Enable Split Bills"
                >
                    <Checkbox
                        checked={branchRegistry?.terminalSettings?.enableSplitBill}
                        value={branchRegistry?.terminalSettings?.enableSplitBill}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'enableSplitBill', value: e.checked }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-arrow-down-left"
                    title="Receive Online Order Popups"
                    description="Receive Online Order Popups"
                >
                    <Checkbox
                        checked={branchRegistry?.terminalSettings?.receiveOnlineOrderPopups}
                        value={branchRegistry?.terminalSettings?.receiveOnlineOrderPopups}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'receiveOnlineOrderPopups', value: e.checked }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-hashtag"
                    title="HST Number"
                    description="Enter HST number"
                >
                    <InputNumber
                        value={branchRegistry?.terminalSettings?.hstNumber}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'hstNumber', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-hashtag"
                    title="GST Number"
                    description="Enter GST number"
                >
                    <InputNumber
                        value={branchRegistry?.terminalSettings?.gstNumber}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'gstNumber', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-hashtag"
                    title="PST Number"
                    description="Enter PST number"
                >
                    <InputNumber
                        value={branchRegistry?.terminalSettings?.pstNumber}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'pstNumber', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
        </div>
    );
}

function PersonalizationSettings() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();

    console.log(branchRegistry, 'branchRegistry')
    console.log(branchRegistry?.terminalSettings?.showItemsPic, 'branchRegistry?.terminalSettings?.showItemsPic')

    return (
        <div className="grid">
            <div className="col-12">
                <FieldWrapper
                    icon="pi-image"
                    title="Show Item Pictures"
                    description="Show item pictures in the app"
                >
                    <Checkbox
                        checked={branchRegistry?.terminalSettings?.showItemsPic}
                        value={branchRegistry?.terminalSettings?.showItemsPic}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'showItemsPic', value: e.checked }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-filter"
                    title="Show Retail Items Only"
                    description="Show Retail Items Only in the app"
                >
                    <Checkbox
                        checked={branchRegistry?.terminalSettings?.showRetailItemsOnly}
                        value={branchRegistry?.terminalSettings?.showRetailItemsOnly}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'showRetailItemsOnly', value: e.checked }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-globe"
                    title="Change POS Language"
                    description="Chane display langauge of the terminal"
                >
                    <InputText
                        value={branchRegistry?.terminalSettings?.languageCode}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'languageCode', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
        </div>
    );
}

function AdminActionsSettings() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();

    return (
        <div className="grid">
            <div className="col-12">
                <FieldWrapper
                    icon="pi-th-large"
                    title="Select Pricing Point"
                    description="Select Pricing Point"
                >
                    <Checkbox
                        checked={branchRegistry?.terminalSettings?.selectPricingPoint}
                        value={branchRegistry?.terminalSettings?.selectPricingPoint}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'selectPricingPoint', value: e.checked }))}
                    />
                </FieldWrapper>
            </div>
        </div>
    );
}

function ScaleSettings() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();

    return (
        <div className="grid">
            <div className="col-12">
                <FieldWrapper
                    icon="pi-sliders-v"
                    title="Read Scale Barcodes"
                    description="When enabled, the terminal will read the configuration below and use them to read barcodes scanned from scales"
                >
                    <Checkbox
                        value={branchRegistry?.terminalSettings?.scaleSettings?.readScaleBarCodes}
                        checked={branchRegistry?.terminalSettings?.scaleSettings?.readScaleBarCodes}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'readScaleBarCodes', value: e.checked }))}

                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-hashtag"
                    title="Total Number Of Digits"
                    description="Enter total number of digits"
                >
                    <InputNumber
                        value={branchRegistry?.terminalSettings?.scaleSettings?.totalNumberOfDigits}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'totalNumberOfDigits', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-ellipsis-h"
                    title="Prefix"
                    description="Enter Prefix"
                >
                    <InputText
                        value={branchRegistry?.terminalSettings?.scaleSettings?.prefix}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'prefix', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-ellipsis-h"
                    title="Plus Start Position"
                    description="Enter plus start position"
                >
                    <InputNumber
                        value={branchRegistry?.terminalSettings?.scaleSettings?.pluStartPosition}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'pluStartPosition', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-hashtag"
                    title="Plus Total Digit Count"
                    description="Enter plus total digit count"
                >
                    <InputNumber
                        value={branchRegistry?.terminalSettings?.scaleSettings?.pluTotalDigitCount}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'pluTotalDigitCount', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-ellipsis-h"
                    title="Price Start Position"
                    description="Enter price start position"
                >
                    <InputNumber
                        value={branchRegistry?.terminalSettings?.scaleSettings?.priceStartPosition}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'priceStartPosition', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-hashtag"
                    title="Price Total Digit Count"
                    description="Enter price total digit count"
                >
                    <InputNumber
                        value={branchRegistry?.terminalSettings?.scaleSettings?.priceTotalDigitCount}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'priceTotalDigitCount', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
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
        <TabView>
            <TabPanel header="Price computing scale">
                <ScaleSettings />
            </TabPanel>
            <TabPanel header="Direct scale">
                <div className="grid">
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-server"
                            title="Integration Type"
                            description="Integration type of the direct scale which can be either direct communication or rize integrator"
                        >
                            <Dropdown
                                value={selectedType}
                                options={integrationTypeOptions}
                                onChange={e => dispatch(changeTerminalField({ name: "scaleIntegrationType", value: e.value }))}
                                placeholder="Select Integration Type"
                                className="w-full"
                            />
                        </FieldWrapper>
                    </div>
                    {/* Conditionally rendered based on integration type */}
                    {selectedType === ScaleIntegrationTypeEnum.direct && (
                        <>
                            <div className="col-12">
                                <FieldWrapper
                                    icon="pi-pencil"
                                    title="Serial Port Name"
                                    description="Serial port name that the scaale is connected to"
                                >
                                    <InputText
                                        value={branchRegistry?.terminalSettings?.serialScaleSettings?.serialPortName}
                                        onChange={(e) => dispatch(changeTerminalField({ name: 'serialScaleSettings.serialPortName', value: e.target.value }))}
                                    />
                                </FieldWrapper>
                            </div>
                            <div className="col-12">
                                <FieldWrapper
                                    icon="pi-window-minimize"
                                    title="Get weight message"
                                    description="The message sent to the scale when getting the weight"
                                >
                                    <InputText
                                        value={branchRegistry?.terminalSettings?.serialScaleSettings?.getWeightMessage}
                                        onChange={(e) => dispatch(changeTerminalField({ name: 'serialScaleSettings.getWeightMessage', value: e.target.value }))}
                                    />
                                </FieldWrapper>
                            </div>
                            <div className="col-12">
                                <FieldWrapper
                                    icon="pi-cloud"
                                    title="Expected payload length"
                                    description="Expected payload length of the scale in the serial port"
                                >
                                    <InputText
                                        value={branchRegistry?.terminalSettings?.serialScaleSettings?.expectedPayloadLength}
                                        onChange={(e) => dispatch(changeTerminalField({ name: 'serialScaleSettings.expectedPayloadLength', value: e.target.value }))}
                                    />
                                </FieldWrapper>
                            </div>
                        </>
                    )}

                    {selectedType === ScaleIntegrationTypeEnum.rizeIntegrator && (
                        <>
                            <div className="col-12">
                                <FieldWrapper
                                    icon="pi-wifi"
                                    title="Timeout In Seconds"
                                    description="Timeout in seconds used by the debit machine"
                                >
                                    <InputNumber
                                        value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.timeoutInSeconds}
                                        onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.timeoutInSeconds', value: e.value }))}
                                    />
                                </FieldWrapper>
                            </div>
                            <div className="col-12">
                                <FieldWrapper
                                    icon="pi-shopping-bag"
                                    title="Interface Type"
                                    description="Interface Type used to communicate with the direct scale"
                                >
                                    <Dropdown
                                        options={Object.values(DeviceInterfaceEnum).map(method => ({ label: method, value: method }))}
                                        value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.scaleSettings?.interfaceType}
                                        onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.scaleSettings.interfaceType', value: e.value }))}
                                    />
                                </FieldWrapper>
                            </div>
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
            </TabPanel>
            <TabPanel header="Debit machine">
                <CreditCardSettings />
            </TabPanel>
            <TabPanel header="Rize integrator">
                <div className="col-12">
                    <FieldWrapper
                        icon="pi-cloud"
                        title="Service Port"
                        description="Specify the port which the service must listen to"
                    >
                        <InputNumber
                            value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.port}
                            onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.port', value: e.value }))}
                        />
                    </FieldWrapper>
                </div>
            </TabPanel>
            <TabPanel header="Customer screen">
                <CustomerAppSettings />
            </TabPanel>
        </TabView>
    )
}

function EmailLogsSettings() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();

    return (
        <div className="grid">
            <div className="col-12">
                <FieldWrapper
                    icon="pi-hashtag"
                    title="Max Email Attachment Size"
                    description="Enter max email attachment size"
                >
                    <InputNumber
                        value={branchRegistry?.terminalSettings?.emailLogsSettings?.maxEmailAttachmentSize}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'emailLogsSettings.maxEmailAttachmentSize', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-link"
                    title="Recipient"
                    description="Enter recipient"
                >
                    <InputText
                        value={branchRegistry?.terminalSettings?.emailLogsSettings?.recipient}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'emailLogsSettings.recipient', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
        </div>
    );
}

function CustomerAppSettings() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const tvsList: ITv[] = useAppSelector(state => state.tv.entities);
    const dispatch = useAppDispatch()

    return (
        <div className="grid">
            <div className="col-12">
                <FieldWrapper
                    icon="pi-user"
                    title="Enable Customer Screen"
                    description="This flag enables the customer screen and allows the pos to connect and send it the required data"
                >
                    <Checkbox
                        checked={branchRegistry?.terminalSettings?.enableCustomerApp}
                        value={branchRegistry?.terminalSettings?.enableCustomerApp}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'enableCustomerApp', value: e.checked }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-users"
                    title="Same Device As Customer Screen"
                    description="If checked, it will enable the capabilty to open the app from the pos window (only available on windows)"
                >
                    <Checkbox
                        disabled={!branchRegistry?.terminalSettings?.enableCustomerApp}
                        checked={branchRegistry?.terminalSettings?.enableCustomerApp && branchRegistry?.terminalSettings?.customerAppIsOnSameDevice}
                        value={branchRegistry?.terminalSettings?.enableCustomerApp && branchRegistry?.terminalSettings?.customerAppIsOnSameDevice}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'customerAppIsOnSameDevice', value: e.checked }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-wifi"
                    title="Customer App IP"
                    description="Enter IP address of the customer app"
                >
                    <InputText
                        value={branchRegistry.terminalSettings?.customerAppIp}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'customerAppIp', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-angle-double-up"
                    title="Customer App Port"
                    description="Enter port number of the customer app"
                >
                    <InputNumber
                        value={branchRegistry.terminalSettings?.customerAppPort}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'customerAppPort', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-eye"
                    title="TV"
                    description="Choose tv to take the pics from, to display them on the side"
                >
                    <Dropdown
                        options={tvsList.map(tv => ({ label: tv.name, value: tv.id }))}
                        value={branchRegistry.terminalSettings?.customerScreenTV?.id}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'customerScreenTV.id', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
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
        <div className="grid">
            <div className="col-12">
                <FieldWrapper
                    icon="pi-credit-card"
                    title="Integration Type"
                    description="Select credit card integration provider"
                >
                    <Dropdown
                        value={selectedType}
                        options={integrationTypeOptions}
                        onChange={e => dispatch(changeTerminalField({ name: "creditCardIntegrationType", value: e.value || null }))}
                        placeholder="Select Integration Type"
                        className="w-full"
                    />
                </FieldWrapper>
            </div>

            {/* Conditionally rendered based on integration type */}
            {selectedType === CreditCardIntegrationTypeEnum.ELAVON_CWS && (
                <>
                    <div className="col-12">
                        <h4 className='text-decoration-underline'>
                            CWS Settings
                        </h4>
                    </div>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-cloud-upload"
                            title="Auto Configure On Startup"
                            description="Autoconfigure elavon cws on startup of the application (must complete all configuration steps to be able to do so)"
                        >
                            <Checkbox
                                checked={branchRegistry?.terminalSettings?.elavonCWSConfiguration?.autoconfigure}
                                value={branchRegistry?.terminalSettings?.elavonCWSConfiguration?.autoconfigure}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'elavonCWSConfiguration.autoconfigure', value: e.target.value }))}
                            />
                        </FieldWrapper>
                    </div>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-wifi"
                            title="CWS Machine Ip"
                            description="IP of the machine hosting cws"
                        >
                            <InputText
                                value={branchRegistry?.terminalSettings?.elavonCWSConfiguration?.cwsIp}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'elavonCWSConfiguration.cwsIp', value: e.target.value }))}
                            />
                        </FieldWrapper>
                    </div>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-angle-double-up"
                            title="CWS Machine Port"
                            description="Port of cws on the machine"
                        >
                            <InputNumber
                                value={branchRegistry?.terminalSettings?.elavonCWSConfiguration?.cwsPort}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'elavonCWSConfiguration.cwsPort', value: e.value }))}
                            />
                        </FieldWrapper>
                    </div>
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
                                <InputText
                                    value={branchRegistry?.terminalSettings?.elavonCWSConfiguration?.readerSettings?.inetAddress?.host}
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
                                <InputNumber
                                    value={branchRegistry?.terminalSettings?.elavonCWSConfiguration?.readerSettings?.inetAddress?.port}
                                    onChange={(e) => dispatch(changeTerminalField({ name: 'elavonCWSConfiguration.readerSettings.inetAddress.port', value: e.value }))}
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
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-wifi"
                            title="Credit Card Machine IP"
                            description=""
                        >
                            <InputText
                                value={branchRegistry?.terminalSettings?.creditCardMachineIp}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'creditCardMachineIp', value: e.target.value }))}
                            />
                        </FieldWrapper>
                    </div>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-angle-double-up"
                            title="Credit Card Machine PORT"
                            description="Enter port number of the customer app"
                        >
                            <InputText
                                value={branchRegistry?.terminalSettings?.creditCardMachinePort}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'creditCardMachinePort', value: e.target.value }))}
                            />
                        </FieldWrapper>
                    </div>
                </>
            )}

            {selectedType === CreditCardIntegrationTypeEnum.rizeIntegrator && (
                <>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-wifi"
                            title="Timeout In Seconds"
                            description="Timeout in seconds used by the debit machine"
                        >
                            <InputNumber
                                value={branchRegistry?.terminalSettings?.rizeIntegratorWindowsServiceSettings?.debitMachineSettings?.timeoutInSeconds}
                                onChange={(e) => dispatch(changeTerminalField({ name: 'rizeIntegratorWindowsServiceSettings.debitMachineSettings.timeoutInSeconds', value: e.value }))}
                            />
                        </FieldWrapper>
                    </div>
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
        <>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-book"
                    title="Merchant Id"
                    description="Enter the merchant id of the elavon account"
                >
                    <InputText
                        value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.merchantId}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.merchantId', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-user"
                    title="User Id"
                    description="Enter the user id of the elavon account"
                >
                    <InputText
                        value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.userId}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.userId', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-hashtag"
                    title="Pin"
                    description="Enter the pin of the elavon account"
                >
                    <InputText
                        value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.pin}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.pin', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-server"
                    title="Vendor Id"
                    description="Enter the vendor id of the elavon account"
                >
                    <InputText
                        value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.vendorId}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.vendorId', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-server"
                    title="Vendor App Names"
                    description="Enter the vendor app names of the elavon account"
                >
                    <InputText
                        value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.vendorAppName}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.vendorAppName', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-server"
                    title="Vendor App Version"
                    description="Enter the vendor app version of the elavon account"
                >
                    <InputText
                        value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.vendorAppVersion}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.vendorAppVersion', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-sign-in"
                    title="BMS Username"
                    description="Enter the bms username of the elavon account"
                >
                    <InputText
                        value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.bmsUsername}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.bmsUsername', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-ellipsis-h"
                    title="BMP Password"
                    description="Enter the bms password of the elavon account"
                >
                    <InputText
                        value={branchRegistry?.terminalSettings?.elavonAccountCredentials?.bmsPassword}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'elavonAccountCredentials.bmsPassword', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
        </>
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

function PrinterProperties() {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();

    return (
        <div className="grid">
            <div className="col-12">
                <FieldWrapper
                    icon="pi-print"
                    title="Print Receipt by Default (Walk in)"
                    description="Disabling this will disable printing the receipt on payment and you will be obliged to click the button to print it, only applies to walk in orders"
                >
                    <Checkbox
                        checked={branchRegistry.terminalSettings?.printReceiptByDefault}
                        value={branchRegistry.terminalSettings?.printReceiptByDefault}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'printReceiptByDefault', value: e.target.checked }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-hashtag"
                    title="Show order number on receipt"
                    description="Show order number just above the receipt number"
                >
                    <Checkbox
                        checked={branchRegistry.terminalSettings?.receiptShowOrderNumber}
                        value={branchRegistry.terminalSettings?.receiptShowOrderNumber}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'receiptShowOrderNumber', value: e.target.checked }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-caret-up"
                    title="Receipt Header"
                    description="Add a header to the receipt"
                >
                    <InputText
                        value={branchRegistry.terminalSettings?.receiptHeader}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'receiptHeader', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-caret-down"
                    title="Receipt Footer"
                    description="Add a Footer to the receipt"
                >
                    <InputText
                        value={branchRegistry.terminalSettings?.receiptFooter}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'receiptFooter', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12 mt-2">
                <FieldWrapper
                    icon="pi-briefcase"
                    title="Open Drawer Type"
                    description="Set drawer to open either before or after printing or set to manually be opened"
                >
                    <Dropdown options={Object.values(openDrawerTypeEnum).map(type => ({ label: type, value: type }))}
                        value={branchRegistry.terminalSettings?.openDrawerType}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'openDrawerType', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-briefcase"
                    title="Open Drawer on Debit/Credit Transactions"
                    description="Option to open drawer on debit/card related transactions"
                >
                    <Checkbox
                        checked={branchRegistry.terminalSettings?.openDrawerOnDebitCreditTransactions}
                        value={branchRegistry.terminalSettings?.openDrawerOnDebitCreditTransactions}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'openDrawerOnDebitCreditTransactions', value: e.checked }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-copy"
                    title="Receipt Copies"
                    description="This specifies the number of copies of the receipt printed ny default on payment"
                >
                    <InputNumber
                        value={branchRegistry.terminalSettings?.receiptCopies}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'receiptCopies', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-arrows-h"
                    title="Reverse"
                    description="Send print commands in reverse (This is a special case for some printers where it prints the data in reverse)"
                >
                    <Checkbox
                        checked={branchRegistry.terminalSettings?.printerSettings?.receipt?.[0]?.reverse}
                        value={branchRegistry.terminalSettings?.printerSettings?.receipt?.[0]?.reverse}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'printerSettings.receipt.0.reverse', value: e.checked }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-file-pdf"
                    title="Print By PDF"
                    description="Print receipt by PDF"
                >
                    <Checkbox
                        checked={branchRegistry.terminalSettings?.printerSettings?.receipt?.[0]?.printByPdf}
                        value={branchRegistry.terminalSettings?.printerSettings?.receipt?.[0]?.printByPdf}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'printerSettings.receipt.0.printByPdf', value: e.checked }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12 mt-2">
                <FieldWrapper
                    icon="pi-building"
                    title="Printer Type"
                    description="Connection type to the printer (Network/USB)"
                >
                    <Dropdown options={Object.values(PrinterConnectionTypeEnum).map(type => ({ label: type, value: type }))}
                        value={branchRegistry.terminalSettings?.printerSettings?.receipt?.[0]?.type}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'printerSettings.receipt.0.type', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-file-o"
                    title="Printer Name"
                    description="Printer name from the windows system"
                >
                    <InputText
                        value={branchRegistry.terminalSettings?.printerSettings?.receipt?.[0]?.name}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'printerSettings.receipt.0.name', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-tablet"
                    title="Printer Size"
                    description="Choose one of the supported printer sizes"
                >
                    <Dropdown options={Object.values(PrinterSizeEnum).map(type => ({ label: type, value: type }))}
                        value={branchRegistry.terminalSettings?.printerSettings?.receipt?.[0]?.size}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'printerSettings.receipt.0.size', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
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
    { label: 'Email Logs settings', component: EmailLogsSettings },
    // { label: 'Customer App', component: CustomerAppSettings },
    // { label: 'Credit Card Processing', component: CreditCardSettings },
    // { label: 'Server Properties', component: ServerProperties },
    { label: 'Printer Properties', component: PrinterProperties },
];

export default BranchRegistryTerminalSettings