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

  // Helper to safely parse and format numeric values.
  // Returns an empty string if the numeric value is 0.
  const cellVal = (val: any, decimals = 2) => {
    const num = typeof val === 'number' ? val : Number(val) || 0;
    return num === 0 ? '' : num.toFixed(decimals);
  };

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

  // 3. Build the header row (for branch data)
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
    'Tip'
  ];
  const headerRow = [...baseHeader, ...paymentTypes];

  // 4. Prepare the sheet data as an array of arrays
  const sheetData: any[][] = [];

  // Optional title row
  if (title) sheetData.push([title]);

  // Push the branch data header row
  sheetData.push(headerRow);

  // 5. Build each row for each branch
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
      cellVal(totalSales.orders, 0),
      cellVal(totalSales.grossSales),
      cellVal(totalSales.walletCredits),
      cellVal(totalSales.netSales),
      cellVal(totalSales.totalTAX),
      cellVal(totalSales.discount),
      cellVal(totalSales.subTotal), // Payments column (if applicable)
      cellVal(totalSales.subTotal), // Subtotal column
      cellVal(totalSales.refunds),
      cellVal(totalSales.appliedCoupon),
      cellVal(totalSales.totalTip)
    ];

    // Add dynamic payment columns (using only the filtered payment types)
    const payments = data?.totalReceived || [];
    paymentTypes.forEach((ptype) => {
      const payment = payments.find((p: any) => p.paymentType === ptype);
      const amountVal = payment?.amount ? cellVal(payment.amount) : '';
      row.push(amountVal);
    });

    sheetData.push(row);
  });

  // --- CATALOG SECTION AGGREGATION START ---
  // Aggregate catalog records (across all branches) for only two groups: "RETAIL" and "RESTAURANT"
  const aggregateCatalog: { [key: string]: any } = {};
  // Define the numeric fields we want to sum from the catalog records
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
    'walletCredits'
  ];

  excelDataArr.forEach(({ data }) => {
    const catalogRecords = data?.catalogSection?.catalogRecords || [];
    catalogRecords.forEach((record: any) => {
      const groupName = record.name?.toUpperCase();
      if (!groupName || (groupName !== 'RETAIL' && groupName !== 'RESTAURANT')) return;
      if (!aggregateCatalog[groupName]) {
        aggregateCatalog[groupName] = {};
        numFields.forEach((field) => {
          aggregateCatalog[groupName][field] = 0;
        });
      }
      numFields.forEach((field) => {
        aggregateCatalog[groupName][field] += Number(record[field]) || 0;
      });
    });
  });

  // If there is at least one aggregated catalog record, add the Catalog Section
  if (Object.keys(aggregateCatalog).length > 0) {
    sheetData.push([]); // blank row
    // Add the Catalog Section title row (will be styled bold later)
    sheetData.push(['Catalog Section']);

    // Build aggregated rows using the same columns as the base header.
    // For catalog rows, "Date Interval" and dynamic payment columns will be empty.
    // Mapping based on the baseHeader positions:
    //   0: Store (group name)
    //   1: Date Interval (empty)
    //   2: New sales (orders) -> orders
    //   3: Gross Sales -> grossSales
    //   4: Wallet Credits -> walletCredits
    //   5: Net Sales -> netSales
    //   6: Tax -> totalTAX
    //   7: Discounts -> discount
    //   8: Payments -> empty (catalog doesn't have payments)
    //   9: Subtotal -> subTotal
    //   10: Refunds -> refunds
    //   11: Applied Coupon -> appliedCoupon
    //   12: Tip -> totalTip
    const buildAggregatedRow = (group: string) => {
      const agg = aggregateCatalog[group];
      const row = [
        group, // Store column
        '', // Date Interval
        cellVal(agg.orders, 0),
        cellVal(agg.grossSales),
        cellVal(agg.walletCredits),
        cellVal(agg.netSales),
        cellVal(agg.totalTAX),
        cellVal(agg.discount),
        '', // Payments (empty)
        cellVal(agg.subTotal),
        cellVal(agg.refunds),
        cellVal(agg.appliedCoupon),
        cellVal(agg.totalTip)
      ];
      // Append empty cells for each dynamic payment column
      const dynamicEmpty = Array(paymentTypes.length).fill('');
      return row.concat(dynamicEmpty);
    };

    // Add aggregated rows for Retail and Restaurant if they exist.
    if (aggregateCatalog['RETAIL']) {
      sheetData.push(buildAggregatedRow('RETAIL'));
    }
    if (aggregateCatalog['RESTAURANT']) {
      sheetData.push(buildAggregatedRow('RESTAURANT'));
    }
  }
  // --- CATALOG SECTION AGGREGATION END ---

  // 6. Convert the array-of-arrays into a worksheet
  const worksheet = xlsx.utils.aoa_to_sheet(sheetData);

  // 7. Set column widths
  const baseColumns = baseHeader.length;
  const totalColumns = baseColumns + paymentTypes.length;
  worksheet['!cols'] = Array.from({ length: totalColumns }, (_, idx) => {
    if (idx === 0) return { wpx: 150 }; // Store
    if (idx === 1) return { wpx: 140 }; // Date Interval
    return { wpx: 100 };
  });

  // 8. Apply bold + bigger font styling to certain rows
  // Bold the title row (if exists) and the "Catalog Section" title row.
  for (let r = 0; r < sheetData.length; r++) {
    const row = sheetData[r];
    if (row.length === 1) {
      const heading = row[0];
      if (heading === title || heading === 'Catalog Section') {
        const cellAddress = xlsx.utils.encode_cell({ r, c: 0 });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = { font: { bold: true, sz: 14 } };
        }
      }
    }
  }

  // 9. Create the workbook and write to a buffer
  const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
  const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });

  // 10. Save the file
  saveAsExcelFile(excelBuffer, 'report.xlsx');
};

