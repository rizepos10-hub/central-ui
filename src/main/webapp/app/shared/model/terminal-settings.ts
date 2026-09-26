import { BusinessTypeEnum } from "./business-type";
import { KitchenPrintGrouping } from "./business-detail.model";
import { OrderMethod } from "./ENUMS/order-method.model";
import { ITv } from "./TV/tv.model";

export interface ITerminalSettings {
    showItemsPic: boolean;
    showItemThumbnailInOrderItems: boolean;
    showItemDescriptionOnPriceChecker?: boolean | null;
    showCategoriesPic: boolean;
    showRetailItemsOnly: boolean;
    showCurrencyOnPrintouts: boolean;
    countryCode: string | null;
    businessType: BusinessTypeEnum;
    languageCode: string | null;
    customerScreenTV: ITv | null;
    creditCardMachineIp: string | null;
    creditCardMachinePort: string | null;
    enableSplitBill: boolean;
    printerSettings: PrinterSettings;
    printReceiptByDefault: boolean;
    alwaysShowScrollbar: boolean;
    scrollbarThickness: number | null;
    enableCustomerApp: boolean;
    customerAppIp: string | null;
    customerAppPort: number | null;
    receiveOnlineOrderPopups: boolean;
    notifyOnOnlineOrderAutoProcessed: boolean;
    enableWalkInType: boolean;
    sendToKitchenOnPayButtonClick?: boolean | null;
    kitchenPrintGrouping?: KitchenPrintGrouping | null;
    printKitchenItemReconciliation?: boolean | null;
    forceSendingByCourse?: boolean | null;
    forcePrintEosReport?: boolean | null;
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
    fontScale: number;
    customerScreenFontSize: string | null;
    categoriesScreenFont?: ICategoriesScreenFont | null;
    showMinimize?: boolean | null;
    displayCategoriesHorizontally?: boolean | null;
    categoriesBarHeight?: 'small' | 'medium' | 'large' | 'extraLarge' | null;
    itemButtonBackgroundStyle?: 'partial' | 'full' | null;
    categoryButtonBackgroundStyle?: 'partial' | 'full' | null;
    senitronReaderEnabled?: boolean | null;
    senitronCdmBaseUrl?: string | null;
    senitronDeviceId?: string | null;
    senitronLocation?: string | null;
    senitronClientId?: string | null;
    senitronTransactionType?: string | null;
    labelPrintProfiles?: ILabelPrintProfile[] | null;
}

export interface ILabelPrintProfile {
    id?: string | null;
    name?: string | null;
    brand?: string | null;
    modelId?: string | null;
    language?: string | null;
    windowsDriver?: boolean | null;
    connection?: string | null;
    printerName?: string | null;
    ip?: string | null;
    port?: number | null;
    templateId?: string | null;
    isDefault?: boolean | null;
}

export interface ICategoriesScreenFont {
    fontFamily: string | null;
    fontSize: number | null;
    bold: boolean | null;
    italic: boolean | null;
    color: string | null;
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
    a4?: Receipt[];
}

interface Receipt {
    type: PrinterConnectionTypeEnum | null;
    name: string | null;
    ip: string | null;
    port: number | null;
    size: PrinterSizeEnum | null;
    reverse: boolean;
    printByPdf: boolean;
    modelId?: string | null;
    brand?: string | null;
    font?: string | null;
    charsPerLine?: number | null;
    commandMode?: PrinterCommandModeEnum | null;
    colorPrinter?: boolean | null;
}

export enum PrinterCommandModeEnum {
    ESC_POS = 'ESC_POS',
    STAR_LINE = 'STAR_LINE',
    WINDOWS_DRIVER = 'WINDOWS_DRIVER',
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
    baudRate: number | null;
    dataBits: number | null;
}
