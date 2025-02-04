import { IBranchRegistry } from 'app/shared/model/branch-registry.model'
import React, { useState } from 'react'
import { Menu } from 'primereact/menu';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { CreditCardIntegrationTypeEnum } from 'app/shared/model/terminal-settings';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeEntityField, changeTerminalField, updateEntity } from './branch-registry.reducer';
import { OrderMethod } from 'app/shared/model/ENUMS/order-method.model';
import { Button } from 'primereact/button';

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
                    icon="pi-building"
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
                    icon="pi-building"
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
                    icon="pi-building"
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
                    icon="pi-tax"
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
                    icon="pi-tax"
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
                    icon="pi-tax"
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
                    icon="pi-image"
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
                    icon="pi-language"
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
                    icon="pi-image"
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
                    icon="pi-scale"
                    title="Read Scale Barcodes"
                    description="When enabled, the terminal will read the configuration below and use them to read barcodes scanned from scales"
                >
                    <InputNumber />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-scale"
                    title="Total Number Of Digits"
                    description="Enter total number of digits"
                >
                    <InputNumber />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-scale"
                    title="Prefix"
                    description="Enter Prefix"
                >
                    <InputNumber />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-scale"
                    title="Plus Start Position"
                    description="Enter plus start position"
                >
                    <InputNumber />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-scale"
                    title="Plus Total Digit Count"
                    description="Enter plus total digit count"
                >
                    <InputNumber />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-scale"
                    title="Price Start Position"
                    description="Enter price start position"
                >
                    <InputNumber />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-scale"
                    title="Price Total Digit Count"
                    description="Enter price total digit count"
                >
                    <InputNumber />
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
                    icon="pi-scale"
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
                    icon="pi-scale"
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

    return (
        <div className="grid">
            <div className="col-12">
                <FieldWrapper
                    icon="pi-mobile"
                    title="Enable Customer Screen"
                    description="This flag enables the customer screen and allows the pos to connect and send it the required data"
                >
                    <Checkbox
                        inputId="enableCusomterScreen"
                        checked={branchRegistry?.terminalSettings?.enableCustomerApp}
                        value={branchRegistry?.terminalSettings?.enableCustomerApp}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'enableCustomerApp', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-mobile"
                    title="Same Device As Customer Screen"
                    description="If checked, it will enable the capabilty to open the app from the pos window (only available on windows)"
                >
                    <Checkbox
                        inputId="sameDevice"
                        checked={branchRegistry?.terminalSettings?.customerAppIsOnSameDevice}
                        value={branchRegistry?.terminalSettings?.customerAppIsOnSameDevice}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'customerAppIsOnSameDevice', value: e.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-mobile"
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
                    icon="pi-mobile"
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
                        placeholder="Select Integration Type"
                        className="w-full"
                    />
                </FieldWrapper>
            </div>

            {/* Conditionally rendered based on integration type */}
            {selectedType === CreditCardIntegrationTypeEnum.ELAVON_CWS && (
                <div className="col-12">
                    {/* Add Elavon CWS specific fields here */}
                </div>
            )}

            {selectedType === CreditCardIntegrationTypeEnum.ELAVON && (
                <div className="col-12">
                    {/* Add Elavon specific fields here */}
                </div>
            )}

            {selectedType === CreditCardIntegrationTypeEnum.INGENICO && (
                <>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-mobile"
                            title="Credit Card Machine IP"
                            description=""
                        >
                            <InputNumber />
                        </FieldWrapper>
                    </div>
                    <div className="col-12">
                        <FieldWrapper
                            icon="pi-mobile"
                            title="Credit Card Machine PORT"
                            description="Enter port number of the customer app"
                        >
                            <InputNumber />
                        </FieldWrapper>
                    </div>
                </>
            )}

        </div>
    );
};

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
                    icon="pi-print"
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
                    icon="pi-credit-card"
                    title="Receipt Header"
                    description="Add a header to the receipt"
                >
                    <InputText
                        value={branchRegistry.terminalSettings?.receiptHeader}
                        onChange={(e) => dispatch(changeTerminalField({ name: 'receiptHeader', value: e.target.value }))}
                    />
                </FieldWrapper>
            </div>
            <div className="col-12 mt-2">
                <FieldWrapper
                    icon="pi-building"
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
                    icon="pi-credit-card"
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
                    icon="pi-print"
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
                    icon="pi-credit-card"
                    title="Printer Name"
                    description="Printer name from the windows system"
                >
                    <InputText />
                </FieldWrapper>
            </div>
            <div className="col-12">
                <FieldWrapper
                    icon="pi-credit-card"
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