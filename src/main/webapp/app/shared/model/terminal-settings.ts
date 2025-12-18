import { BusinessTypeEnum } from "./business-type";
import { OrderMethod } from "./ENUMS/order-method.model";
import { ITv } from "./TV/tv.model";

export interface ITerminalSettings {
    showItemsPic: boolean;
    showCategoriesPic: boolean;
    showRetailItemsOnly: boolean;
    countryCode: string | null;
    businessType: BusinessTypeEnum;
    languageCode: string | null;
    customerScreenTV: ITv | null;
    creditCardMachineIp: string | null;
    creditCardMachinePort: string | null;
    enableSplitBill: boolean;
    printerSettings: PrinterSettings;
    printReceiptByDefault: boolean;
    receiptShowOrderNumber: boolean;
    receiptHeader: string | null;
    receiptFooter: string | null;
    alwaysShowScrollbar: boolean;
    scrollbarThickness: number | null;
    hstNumber: number | null;
    pstNumber: number | null;
    gstNumber: number | null;
    enableCustomerApp: boolean;
    customerAppIp: string | null;
    customerAppPort: number | null;
    receiveOnlineOrderPopups: boolean;
    enableWalkInType: boolean;
    pathToCustomerApp: string | null;
    customerAppIsOnSameDevice: boolean;
    openDrawerType: openDrawerTypeEnum | null;
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
    scaleIntegrationType: ScaleIntegrationTypeEnum;
    rizeIntegratorWindowsServiceSettings: RizeIntegratorWindowsServiceSettings;
    enableCustomKeyboard: boolean;
}

export enum openDrawerTypeEnum {
    beforePrinting = "beforePrinting",
    afterPrinting = "afterPrinting",
    manual = "manual"
}

export interface RizeIntegratorWindowsServiceSettings {
    port: number | null;
    debitMachineSettings: DebitMachineSettings;
    scaleSettings: DebitMachineSettingsScaleSettings;
}

export interface DebitMachineSettings {
    id: string | null;
    deviceType: string | null;
    timeoutInSeconds: number | null;
}

export enum DebitMachineSettingsInterfaceSettingsEnum {
    ethernet = 'ethernet',
}

export interface DebitMachineSettingsScaleSettings {
    id: string | null;
    deviceType: string | null;
    interfaceType: DeviceInterfaceEnum | null;
    timeoutInSeconds: number | null;
    // enabled: boolean | null;
    // interfaceSettings: DebitMachineSettingsScaleInterfaceSettings | null;
    // scaleCommand: string | null;
    // scaleResultLength: number | null;
    // weightMultiplier: number | null;
}

export interface DebitMachineSettingsScaleInterfaceSettings {
    id: string | null;
    comPort: number | null;
    baudRate: number | null;
    dataBits: DataBitsEnum | null;
    deviceInterface: DeviceInterfaceEnum | null;
    parity: ParityEnum | null;
    stopBits: StopBitsEnum | null;
    handShake: HandShakeEnum | null;
    dtrEnabled: boolean | null;
    rtsEnabled: boolean | null;
    addCr: boolean | null;
}

export enum DeviceInterfaceEnum {
    serial = 'serial',
    opos = 'opos',
}

export enum DataBitsEnum {
    seven = 'seven',
    eight = 'eight',
}

export enum ParityEnum {
    none = 'none',
    odd = 'odd',
    even = 'even',
    mark = 'mark',
    space = 'space',
}

export enum StopBitsEnum {
    none = 'none',
    one = 'one',
    onePointFive = 'onePointFive',
    two = 'two',
}

export enum HandShakeEnum {
    none = 'none',
    xonXoff = 'xonXoff',
    requestToSend = 'requestToSend',
    requestToSendXonXoff = 'requestToSendXonXoff',
}

export enum DebitMachineSettingsConnectionTypeEnum {
    network = 'network',
}

export enum ScaleIntegrationTypeEnum {
    direct = 'direct',
    rizeIntegrator = 'rizeIntegrator',
    none = 'none'
}

export enum CreditCardIntegrationTypeEnum {
    ELAVON_CWS = 'elavonCWS',
    ELAVON = 'elavon',
    INGENICO = 'ingenico',
    rizeIntegrator = 'rizeIntegrator',
}

interface PrinterSettings {
    receipt: Receipt[];
}

interface Receipt {
    type: PrinterConnectionTypeEnum | null;
    name: string | null;
    ip: string | null;
    port: number | null;
    size: PrinterSizeEnum | null;
    reverse: boolean;
    printByPdf: boolean;
}

export enum PrinterConnectionTypeEnum {
    NETWORK = 'NETWORK',
    USB = 'USB'
}


export enum PrinterSizeEnum {
    mm58 = 'mm58',
    mm72 = 'mm72',
    mm80 = 'mm80'
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
    providerTypes: ProviderTypesEnum[];
    connectionTypes: ConnectionTypesEnum[];
    deviceTypes: DeviceTypesEnum[];
    inetAddress: InetAddress;
}

export enum ProviderTypesEnum {
    INGENICO_RBA_UPP = "INGENICO_RBA_UPP",
    STAR = "STAR",
    RUA = "RAU",
    Epson = "Epson",
    Magtek = "Magtek",
    RDM = "RDM",
    Opayo = "Opayo"
}

export enum ConnectionTypesEnum {
    IP = "IP"
}

export enum DeviceTypesEnum {
    CARD_READE = "CARD_READER",
    PRINTER = "PRINTER"
}

interface InetAddress {
    host: string | null;
    port: number | null;
    encryptionScheme: EncryptionSchemeEnum;
}


export enum EncryptionSchemeEnum {
    NONE = "NONE",
    TLS_12 = "TLS_12"
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