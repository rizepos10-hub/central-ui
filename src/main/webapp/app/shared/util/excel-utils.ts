import { ISalesSummary, ISummaryReport } from '../model/report-summary.model';

export const saveAsExcelFile = (buffer, fileName) => {
    import('file-saver').then((module) => {
        if (module && module.default) {
            const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
            const EXCEL_EXTENSION = '.xlsx';
            const data = new Blob([buffer], {
                type: EXCEL_TYPE
            });

            module.default.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
        }
    });
};

export const exportExcelSummaryReport = async (
    salesData: ISummaryReport,
    fromDate?: string,
    toDate?: string,
    title?: string,
    visibleSections?: any
) => {
    console.log(visibleSections, 'visibleSections')
    const xlsx = await import('xlsx-js-style');

    // Helper to safely format numeric values
    const fmt = (val) => (typeof val === 'number' ? val : val ?? 0);

    // Prepare an array-of-arrays to represent rows in Excel
    const sheetData = [];

    // --- TOTAL SALES ---
    title && sheetData.push([title]);
    fromDate && toDate && sheetData.push([`Date Range`, fromDate, toDate]);
    sheetData.push(['Total Sales']);
    sheetData.push(['New sales (orders)', salesData.totalSales.orders]);
    sheetData.push(['Gross Sales', salesData.totalSales.grossSales.toFixed(2)]);
    sheetData.push(['Wallet Credits', fmt(salesData.totalSales.walletCredits)]);
    sheetData.push(['Net Sales', salesData.totalSales.netSales.toFixed(2)]);
    sheetData.push(['Tax', salesData.totalSales.totalTAX.toFixed(2)]);
    sheetData.push(['Discounts', salesData.totalSales.discount.toFixed(2)]);
    sheetData.push(['Payments', salesData.totalSales.subTotal.toFixed(2)]);
    sheetData.push(['Subtotal', salesData.totalSales.subTotal.toFixed(2)]);
    sheetData.push(['Refunds', salesData.totalSales.refunds.toFixed(2)]);
    sheetData.push(['Applied Coupon', salesData.totalSales.appliedCoupon.toFixed(2)]);
    sheetData.push(['Tip', salesData.totalSales.totalTip.toFixed(2)]);
    sheetData.push([]); // blank row

    // --- TOTAL RECEIVED ---
    sheetData.push(['Payments']);
    sheetData.push(['PAYMENT', 'TIP', 'AMOUNT', 'REFUND', 'RECEIVED']);

    let totalTip = 0;
    let totalAmount = 0;
    let totalRefund = 0;
    let totalReceived = 0;

    salesData.totalReceived.forEach((item) => {
        sheetData.push([
            item.paymentType || '',
            fmt(item.tip).toFixed(2),
            fmt(item.amount).toFixed(2),
            fmt(item.refund).toFixed(2),
            fmt(item.received).toFixed(2)
        ]);
        totalTip += fmt(item.tip);
        totalAmount += fmt(item.amount);
        totalRefund += fmt(item.refund);
        totalReceived += fmt(item.received);
    });

    // Summary row for totalReceived
    sheetData.push([
        'Total',
        totalTip.toFixed(2),
        totalAmount.toFixed(2),
        totalRefund.toFixed(2),
        totalReceived.toFixed(2)
    ]);

    {
        visibleSections?.orderMethod !== false && (
            // --- TOTAL SALES BY ORDER OPTION ---
            Object.entries(salesData.totalSalesByOrderOption || {}).forEach(
                ([orderOption, summary]: [string, ISalesSummary]) => {
                    sheetData.push([]);
                    sheetData.push([orderOption]);
                    sheetData.push(['New sales (orders)', fmt(summary.orders)]);
                    sheetData.push(['Gross Sales', fmt(summary.grossSales.toFixed(2))]);
                    sheetData.push(['Wallet Credits', fmt(summary.walletCredits ?? 0)]);
                    sheetData.push(['Net Sales', fmt(summary.netSales.toFixed(2))]);
                    sheetData.push(['Tax', fmt(summary.totalTAX.toFixed(2))]);
                    sheetData.push(['Discounts', fmt(summary.discount.toFixed(2))]);
                    sheetData.push(['Payments', fmt(summary.subTotal.toFixed(2))]);
                    sheetData.push(['Subtotal', fmt(summary.subTotal.toFixed(2))]);
                    sheetData.push(['Refunds', fmt(summary.refunds.toFixed(2))]);
                    sheetData.push(['Applied Coupon', fmt(summary.appliedCoupon.toFixed(2))]);
                    sheetData.push(['Tip', fmt(summary.totalTip.toFixed(2))]);
                }
            )
        )
    }

    // Convert AOA to a worksheet
    const worksheet = xlsx.utils.aoa_to_sheet(sheetData);

    // Optional: Adjust column widths
    worksheet['!cols'] = [
        { wpx: 250 }, // Column A
        { wpx: 200 }, // Column B
        { wpx: 200 }, // Column C
        { wpx: 200 }, // Column D
        { wpx: 200 }, // Column E
    ];

    // Apply bold + bigger font to certain rows
    //  Titles: 'Total Sales', 'Total Received', and the keys in totalSalesByOrderOption
    for (let r = 0; r < sheetData.length; r++) {
        const row = sheetData[r];
        if (row.length === 1) {
            // Single-cell row
            // Check if it's a known heading
            const heading = row[0];
            if (
                heading === 'Total Sales' ||
                heading === 'Total Received' ||
                (salesData.totalSalesByOrderOption && heading in salesData.totalSalesByOrderOption)
            ) {
                const cellAddress = xlsx.utils.encode_cell({ r, c: 0 });
                if (worksheet[cellAddress]) {
                    worksheet[cellAddress].s = {
                        font: { bold: true, sz: 14 },
                    };
                }
            }
        }
    }

    // Create the workbook and write it to a buffer
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Save the file
    saveAsExcelFile(excelBuffer, 'summary.xlsx');
};