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


export const exportExcelEodSummaryReport = async (
  excelDataArr: any[],
  fromDate?: string,
  toDate?: string,
  title?: string
) => {
  const xlsx = await import('xlsx-js-style');

  // Safely parse numeric values
  const fmt = (val: any) => (typeof val === 'number' ? val : val ?? 0);

  // 1. Sum payment amounts across all branches for each payment type
  const paymentSums: { [key: string]: number } = {};
  excelDataArr.forEach(({ data }) => {
    const payments = data?.totalReceived || [];
    payments.forEach((p: any) => {
      if (p.paymentType) {
        const amount = Number(p.amount) || 0;
        paymentSums[p.paymentType] = (paymentSums[p.paymentType] || 0) + amount;
      }
    });
  });

  // 2. Collect payment types that have a total amount > 0
  const paymentTypes = Object.keys(paymentSums).filter(
    (ptype) => paymentSums[ptype] > 0
  );

  // 3. Build the header row for branch data
  const baseHeader = [
    'Store',
    'Date Interval',
    'New sales (orders)',
    'Gross Sales',
    'Wallet Credits',
    'Net Sales',
    'Tax',
    'Discounts',
    'Payments',
    'Subtotal',
    'Refunds',
    'Applied Coupon',
    'Tip',
  ];
  const headerRow = [...baseHeader, ...paymentTypes];

  // 4. Prepare the sheet data as an array of arrays
  const sheetData: any[][] = [];

  // Optional title row
  if (title) sheetData.push([title]);

  // Push the header row
  sheetData.push(headerRow);

  // 5. Build each row for each branch (for payment summary)
  // (The branch-level rows are still added here if needed; remove or comment out this block
  // if you do not require branch rows and want only the aggregated catalog section.)
  excelDataArr.forEach(({ branch, data }) => {
    const storeName = branch?.name || '';
    const dateAndDay =
      fromDate && toDate
        ? `${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}`
        : '';

    const totalSales = data?.totalSales || {};

    const row = [
      storeName,
      dateAndDay,
      totalSales.orders ?? 0,
      totalSales.grossSales != null
        ? Number(totalSales.grossSales).toFixed(2)
        : '0.00',
      totalSales.walletCredits != null
        ? Number(totalSales.walletCredits).toFixed(2)
        : '0.00',
      totalSales.netSales != null
        ? Number(totalSales.netSales).toFixed(2)
        : '0.00',
      totalSales.totalTAX != null
        ? Number(totalSales.totalTAX).toFixed(2)
        : '0.00',
      totalSales.discount != null
        ? Number(totalSales.discount).toFixed(2)
        : '0.00',
      totalSales.subTotal != null
        ? Number(totalSales.subTotal).toFixed(2)
        : '0.00',
      totalSales.subTotal != null
        ? Number(totalSales.subTotal).toFixed(2)
        : '0.00',
      totalSales.refunds != null
        ? Number(totalSales.refunds).toFixed(2)
        : '0.00',
      totalSales.appliedCoupon != null
        ? Number(totalSales.appliedCoupon).toFixed(2)
        : '0.00',
      totalSales.totalTip != null
        ? Number(totalSales.totalTip).toFixed(2)
        : '0.00',
    ];

    // Add dynamic payment columns (using only the filtered payment types)
    const payments = data?.totalReceived || [];
    paymentTypes.forEach((ptype) => {
      const payment = payments.find((p: any) => p.paymentType === ptype);
      const amountVal = payment?.amount ? fmt(payment.amount).toFixed(2) : '0.00';
      row.push(amountVal);
    });

    sheetData.push(row);
  });

  // --- CATALOG SECTION AGGREGATION START ---
  // Aggregate catalog records (across all branches) for only two groups: "RETAIL" and "RESTAURANT"
  const aggregateCatalog: { [key: string]: any } = {};
  // Define the numeric fields we want to sum
  const numFields = [
    'orders',
    'subTotal',
    'discount',
    'appliedCoupon',
    'deliveryCharge',
    'deliveryTAX',
    'refunds',
    'netSales',
    'totalTAX',
    'grossSales',
    'totalTip',
    'taxes',
    'walletCredits',
  ];

  excelDataArr.forEach(({ data }) => {
    const catalogRecords = data?.catalogSection?.catalogRecords || [];
    catalogRecords.forEach((record: any) => {
      const groupName = record.name?.toUpperCase();
      if (!groupName || (groupName !== 'RETAIL' && groupName !== 'RESTAURANT')) {
        return;
      }
      if (!aggregateCatalog[groupName]) {
        aggregateCatalog[groupName] = {};
        numFields.forEach((field) => {
          aggregateCatalog[groupName][field] = 0;
        });
      }
      numFields.forEach((field) => {
        aggregateCatalog[groupName][field] += Number(fmt(record[field]));
      });
    });
  });

  // If there is at least one aggregated record, add header and two rows (Retail and Restaurant)
  if (Object.keys(aggregateCatalog).length > 0) {
    sheetData.push([]); // blank row
    // The Catalog Section header will be styled bold later
    sheetData.push(['Catalog Section']);
    sheetData.push([
      'Name',
      'Orders',
      'SubTotal',
      'Discount',
      'Applied Coupon',
      'Delivery Charge',
      'Delivery TAX',
      'Refunds',
      'Net Sales',
      'Tax',
      'Gross Sales',
      'Tip',
      'Taxes',
      'Wallet Credits'
    ]);

    // Prepare aggregated row for "RETAIL"
    if (aggregateCatalog['RETAIL']) {
      sheetData.push([
        'RETAIL',
        aggregateCatalog['RETAIL'].orders,
        aggregateCatalog['RETAIL'].subTotal != null
          ? aggregateCatalog['RETAIL'].subTotal.toFixed(2)
          : '0.00',
        aggregateCatalog['RETAIL'].discount != null
          ? aggregateCatalog['RETAIL'].discount.toFixed(2)
          : '0.00',
        aggregateCatalog['RETAIL'].appliedCoupon != null
          ? aggregateCatalog['RETAIL'].appliedCoupon.toFixed(2)
          : '0.00',
        aggregateCatalog['RETAIL'].deliveryCharge != null
          ? aggregateCatalog['RETAIL'].deliveryCharge.toFixed(2)
          : '0.00',
        aggregateCatalog['RETAIL'].deliveryTAX != null
          ? aggregateCatalog['RETAIL'].deliveryTAX.toFixed(2)
          : '0.00',
        aggregateCatalog['RETAIL'].refunds != null
          ? aggregateCatalog['RETAIL'].refunds.toFixed(2)
          : '0.00',
        aggregateCatalog['RETAIL'].netSales != null
          ? aggregateCatalog['RETAIL'].netSales.toFixed(2)
          : '0.00',
        aggregateCatalog['RETAIL'].totalTAX != null
          ? aggregateCatalog['RETAIL'].totalTAX.toFixed(2)
          : '0.00',
        aggregateCatalog['RETAIL'].grossSales != null
          ? aggregateCatalog['RETAIL'].grossSales.toFixed(2)
          : '0.00',
        aggregateCatalog['RETAIL'].totalTip,
        aggregateCatalog['RETAIL'].taxes,
        aggregateCatalog['RETAIL'].walletCredits,
      ]);
    }

    // Prepare aggregated row for "RESTAURANT"
    if (aggregateCatalog['RESTAURANT']) {
      sheetData.push([
        'RESTAURANT',
        aggregateCatalog['RESTAURANT'].orders,
        aggregateCatalog['RESTAURANT'].subTotal != null
          ? aggregateCatalog['RESTAURANT'].subTotal.toFixed(2)
          : '0.00',
        aggregateCatalog['RESTAURANT'].discount != null
          ? aggregateCatalog['RESTAURANT'].discount.toFixed(2)
          : '0.00',
        aggregateCatalog['RESTAURANT'].appliedCoupon != null
          ? aggregateCatalog['RESTAURANT'].appliedCoupon.toFixed(2)
          : '0.00',
        aggregateCatalog['RESTAURANT'].deliveryCharge != null
          ? aggregateCatalog['RESTAURANT'].deliveryCharge.toFixed(2)
          : '0.00',
        aggregateCatalog['RESTAURANT'].deliveryTAX != null
          ? aggregateCatalog['RESTAURANT'].deliveryTAX.toFixed(2)
          : '0.00',
        aggregateCatalog['RESTAURANT'].refunds != null
          ? aggregateCatalog['RESTAURANT'].refunds.toFixed(2)
          : '0.00',
        aggregateCatalog['RESTAURANT'].netSales != null
          ? aggregateCatalog['RESTAURANT'].netSales.toFixed(2)
          : '0.00',
        aggregateCatalog['RESTAURANT'].totalTAX != null
          ? aggregateCatalog['RESTAURANT'].totalTAX.toFixed(2)
          : '0.00',
        aggregateCatalog['RESTAURANT'].grossSales != null
          ? aggregateCatalog['RESTAURANT'].grossSales.toFixed(2)
          : '0.00',
        aggregateCatalog['RESTAURANT'].totalTip,
        aggregateCatalog['RESTAURANT'].taxes,
        aggregateCatalog['RESTAURANT'].walletCredits,
      ]);
    }
  }
  // --- CATALOG SECTION AGGREGATION END ---

  // 6. Convert the array-of-arrays into a worksheet
  const worksheet = xlsx.utils.aoa_to_sheet(sheetData);

  // Optional: Set column widths
  const baseColumns = baseHeader.length;
  const totalColumns = baseColumns + paymentTypes.length;
  worksheet['!cols'] = Array.from({ length: totalColumns }, (_, idx) => {
    if (idx === 0) return { wpx: 150 }; // Store
    if (idx === 1) return { wpx: 140 }; // Date Interval
    return { wpx: 100 };
  });

  // 7. Apply bold + bigger font styling to certain rows
  // Bold the title row (if exists), branch header row and "Catalog Section" header
  for (let r = 0; r < sheetData.length; r++) {
    const row = sheetData[r];
    // Single cell rows which are headers we want bolded:
    if (row.length === 1) {
      const heading = row[0];
      if (heading === title || heading === 'Catalog Section') {
        const cellAddress = xlsx.utils.encode_cell({ r, c: 0 });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { bold: true, sz: 14 }
          };
        }
      }
    }
  }

  // 8. Create the workbook and write to a buffer
  const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
  const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });

  // 9. Save the file
  saveAsExcelFile(excelBuffer, 'report.xlsx');
};
