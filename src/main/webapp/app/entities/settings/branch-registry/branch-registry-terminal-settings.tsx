import { IBranchRegistry } from 'app/shared/model/branch-registry.model'
import React, { useState } from 'react'
import { Menu } from 'primereact/menu';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { ConnectionTypesEnum, CreditCardIntegrationTypeEnum, DeviceTypesEnum, EncryptionSchemeEnum, ProviderTypesEnum } from 'app/shared/model/terminal-settings';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeTerminalField, updateEntity } from './branch-registry.reducer';
import { OrderMethod } from 'app/shared/model/ENUMS/order-method.model';
import { Button } from 'primereact/button';
import Select from 'react-select';

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
            dispatch(updateEntity({}));
        });
    };

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
                        inputId="enableSplitBills"
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
                        inputId="receiveOnlineOrderPopups"
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
                        inputId="showPics"
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
                        inputId="showRetailItemsOnly"
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
                        inputId="selectPricingPoint"
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
    const dispatch = useAppDispatch()
    console.log(branchRegistry, 'branchRegistry')
    return (
        <div className="grid">
            <div className="col-12">
                <FieldWrapper
                    icon="pi-user"
                    title="Enable Customer Screen"
                    description="This flag enables the customer screen and allows the pos to connect and send it the required data"
                >
                    <Checkbox
                        inputId="enableCusomterScreen"
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
                        inputId="sameDevice"
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
        </div>
    );
}

const CreditCardSettings = () => {
    const branchRegistry: IBranchRegistry = useAppSelector(state => state.branchRegistry.entity);
    const dispatch = useAppDispatch();

    const integrationTypeOptions = [
        { label: 'Elavon CWS', value: CreditCardIntegrationTypeEnum.ELAVON_CWS },
        { label: 'Elavon', value: CreditCardIntegrationTypeEnum.ELAVON },
        { label: 'Ingenico', value: CreditCardIntegrationTypeEnum.INGENICO },
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
                        onChange={e => dispatch(changeTerminalField({ name: "creditCardIntegrationType", value: e.value }))}
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

            {selectedType === CreditCardIntegrationTypeEnum.ELAVON && (
                <div className="col-12">
                    <ElavonIntegrationType />
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
                        inputId="printReceiptByDefault"
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
                        inputId="showOrderNumber"
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
                    <Dropdown options={[
                        { label: 'Retail', value: 'RETAIL' },
                        { label: 'Restaurant', value: 'RESTAURANT' }
                    ]} />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-briefcase"
                    title="Open Drawer on Debit/Credit Transactions"
                    description="Option to open drawer on debit/card related transactions"
                >
                    <Checkbox inputId='openDrawerOnDebitCreditTransactions' checked />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-copy"
                    title="Receipt Copies"
                    description="This specifies the number of copies of the receipt printed ny default on payment"
                >
                    <InputNumber />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-arrows-h"
                    title="Reverse"
                    description="Send print commands in reverse (This is a special case for some printers where it prints the data in reverse)"
                >
                    <Checkbox inputId="printDefault" checked />
                </FieldWrapper>
            </div>
            <div className="col-12 mt-2">
                <FieldWrapper
                    icon="pi-building"
                    title="Printer Type"
                    description="Connection type to the printer (Network/USB)"
                >
                    <Dropdown options={[
                        { label: 'Retail', value: 'RETAIL' },
                        { label: 'Restaurant', value: 'RESTAURANT' }
                    ]} />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-file-o"
                    title="Printer Name"
                    description="Printer name from the windows system"
                >
                    <InputText />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-tablet"
                    title="Printer Size"
                    description="Choose one of the supported printer sizes"
                >
                    <Dropdown options={[
                        { label: 'Retail', value: 'RETAIL' },
                        { label: 'Restaurant', value: 'RESTAURANT' }
                    ]} />
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
    { label: 'Scale Settings', component: ScaleSettings },
    { label: 'Email Logs settings', component: EmailLogsSettings },
    { label: 'Customer App', component: CustomerAppSettings },
    { label: 'Credit Card Processing', component: CreditCardSettings },
    // { label: 'Server Properties', component: ServerProperties },
    { label: 'Printer Properties', component: PrinterProperties },
];

export default BranchRegistryTerminalSettings