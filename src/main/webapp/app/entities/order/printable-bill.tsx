import React from 'react';
import './ordered-items.css';

interface PrintableBillProps {
    dataTableValues: any;
}

const PrintableBill = React.forwardRef<HTMLDivElement, PrintableBillProps>(({
    dataTableValues,
}, ref) => {
    console.log(dataTableValues, 'dataTableValues')
    const itemNameTemplate = (rowData) => {
        console.log(rowData, 'rowData')
        return (
            <div className={`${rowData?.isAddon ? 'ps-3' : 'fw-bold'}`}>{rowData?.isAddon && '+'} {rowData?.itemName}</div>
        );
    };

    const taxesTemplate = (rowData) => {
        if (Object.keys(rowData?.taxIdsToValues).length === 0) {
            return <span></span>;
        }
        return (
            <div className="d-flex flex-column gap-2">
                {Object.keys(rowData?.taxIdsToValues)?.map((key) => (
                    <div key={key} className="d-flex flex-column gap-2">
                        {rowData?.taxIdsToValues[key].code} : {rowData?.taxIdsToValues[key].value?.toFixed(2)}
                    </div>
                ))}
                <div className='ps-3 fw-bold'>Total : {rowData?.taxValue?.toFixed(2)}</div>
            </div>
        );
    };

    const discountTemplate = (rowData) => {
        if (!rowData?.discount) return null;
        return (
            <div>
                {rowData.discount.value} {rowData.discount.type === "PERCENTAGE" && '%'}
            </div>
        );
    };

    return (
        <div ref={ref} className="print-container" id="print-container">
            <table style={{ width: '55rem' }}>
                <thead>
                    <tr>
                        <th style={{ width: '16%', borderBottom: '1px solid #ccc' }}>Name</th>
                        <th style={{ width: '15%', borderBottom: '1px solid #ccc' }}>Quantity</th>
                        <th style={{ width: '15%', borderBottom: '1px solid #ccc' }}>Price</th>
                        <th style={{ width: '15%', borderBottom: '1px solid #ccc' }}>Taxes</th>
                        <th style={{ width: '15%', borderBottom: '1px solid #ccc' }}>Discount</th>
                        <th style={{ width: '15%', borderBottom: '1px solid #ccc' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {dataTableValues?.map((rowData) => (
                        <tr key={rowData.id}>
                            <td>{itemNameTemplate(rowData)}</td>
                            <td>{rowData.amount}</td>
                            <td>{rowData.price}</td>
                            <td>{taxesTemplate(rowData)}</td>
                            <td>{discountTemplate(rowData)}</td>
                            <td>{rowData.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

export default PrintableBill;