import { OrderMethod } from "./ENUMS/order-method.model";

export interface ITerminalSettings {
    showItemsPic: boolean;
    showCategoriesPic: boolean;
    showRetailItemsOnly: boolean;
    countryCode: string | null;
    businessType: BusinessType;
    languageCode: string | null;
    creditCardMachineIp: string | null;
    creditCardMachinePort: string | null;
    enableSplitBill: boolean;
    printerSettings: PrinterSettings;
    printReceiptByDefault: boolean;
    receiptShowOrderNumber: boolean;
    receiptHeader: string | null;
    receiptFooter: string | null;
    hstNumber: number | null;
    pstNumber: number | null;
    gstNumber: number | null;
    enableCustomerApp: boolean;
    customerAppIp: string | null;
    customerAppPort: number | null;
    receiveOnlineOrderPopups: boolean;
    pathToCustomerApp: string | null;
    customerAppIsOnSameDevice: boolean;
    openDrawerType: string | null;
    openDrawerOnDebitCreditTransactions: boolean;
    receiptCopies: number | null;
    scaleSettings: ScaleSettings;
    elavonAccountCredentials: ElavonAccountCredentials;
    creditCardIntegrationType: CreditCardIntegrationTypeEnum;
    elavonCWSConfiguration: ElavonCWSConfiguration;
    emailLogsSettings: EmailLogsSettings;
    orderType: OrderMethod;
    selectPricingPoint: boolean;
    serialScaleSettings: SerialScaleSettings;
}

export enum CreditCardIntegrationTypeEnum {
    ELAVON_CWS = 'elavonCWS',
    ELAVON = 'elavon',
    INGENICO = 'ingenico',
}

export enum BusinessType {
    RETAIL = 'RETAIL',
    RESTAURANT = 'RESTAURANT',
}

interface PrinterSettings {
    receipt: Receipt[];
}

interface Receipt {
    type: string | null;
    name: string | null;
    ip: string | null;
    port: number | null;
    size: string | null;
    reverse: boolean;
}

interface ScaleSettings {
    readScaleBarCodes: boolean;
    totalNumberOfDigits: number | null;
    prefix: string | null;
    pluStartPosition: number | null;
    pluTotalDigitCount: number | null;
    priceStartPosition: number | null;
    priceTotalDigitCount: number | null;
}

interface ElavonAccountCredentials {
    merchantId: string | null;
    userId: string | null;
    pin: string | null;
    vendorId: string | null;
    vendorAppName: string | null;
    vendorAppVersion: string | null;
    bmsUsername: string | null;
    bmsPassword: string | null;
}

interface ElavonCWSConfiguration {
    cwsIp: string | null;
    cwsPort: number | null;
    autoconfigure: boolean;
    paymentGatewayId: null;
    readerSettings: ReaderSettings;
}

interface ReaderSettings {
    providerTypes: string[];
    connectionTypes: string[];
    deviceTypes: string[];
    inetAddress: InetAddress;
}

interface InetAddress {
    host: string | null;
    port: number | null;
    encryptionScheme: string | null;
}

interface EmailLogsSettings {
    maxEmailAttachmentSize: number | null;
    recipient: string | null;
}

interface SerialScaleSettings {
    serialPortName: string | null;
    getWeightMessage: string | null;
    expectedPayloadLength: string | null;
}