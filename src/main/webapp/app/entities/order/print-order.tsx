import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { useNavigate, useParams } from 'react-router-dom';
import { getEntity } from './order.reducer';
import { getEntity as getSettings } from "app/entities/online-ordering/settings/settings.reducer";
// @ts-expect-error -- ignore
import styles from './print-order.module.css';
import { useReactToPrint } from 'react-to-print';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { Button } from '@/components/ui/button';

const PrintOrder = () => {
    const ref = useRef(null);
    const navigate = useNavigate();

    const handlePrint = useReactToPrint({
        content: () => ref.current,
        pageStyle: "@page { size: A4 portrait; margin: 0; }",
    });

    const { id } = useParams<'id'>();
    const dispatch = useAppDispatch();

    const orderEntity = useAppSelector(state => state.order.entity);
    const uiSettings = useAppSelector(state => state.uiSettings.entity);

    const [dataTableValues, setDataTableValues] = React.useState([]);


    console.log(uiSettings, 'uiSettings')

    useEffect(() => {
        dispatch(getEntity(id))
        dispatch(getSettings())
    }, [])

    useEffect(() => {
        const newDataTableValues = [];
        orderEntity?.items?.forEach((item) => {
            newDataTableValues.push({
                id: item.id,
                itemName: item.itemName,
                amount: item.amount,
                price: item.price,
                taxIdsToValues: item.taxIdsToValues,
                discount: item.discount,
                taxValue: item.taxValue,
                isAddon: false,
                total: item.total?.toFixed(2),
            });
            item.addons.forEach((addon) => {
                newDataTableValues.push({
                    id: addon.id,
                    itemName: addon.name,
                    amount: addon.amount,
                    price: addon.price,
                    taxIdsToValues: addon.taxIdsToValues,
                    discount: addon.discount,
                    taxValue: addon.taxValue,
                    isAddon: true,
                    total: addon.total?.toFixed(2),
                });
            });
        });
        setDataTableValues(newDataTableValues);
    }, [orderEntity])


    const itemNameTemplate = (rowData) => {
        return (
            <div className={`${rowData?.isAddon ? 'ps-3' : 'fw-bold'}`}>{rowData?.isAddon && '+'} {rowData?.itemName}</div>
        )
    }

    const taxesTemplate = (rowData) => {
        if (Object.keys(rowData?.taxIdsToValues).length === 0) {
            return <span></span>
        }
        return (
            <div className="d-flex flex-column gap-2">
                {Object.keys(rowData?.taxIdsToValues).map((key) => (
                    <div key={key} className="d-flex flex-column gap-2">
                        {rowData?.taxIdsToValues[key].code} : {rowData?.taxIdsToValues[key].value?.toFixed(2)}
                    </div>
                ))}
                <div className='ps-3 fw-bold'>Total : {rowData?.taxValue?.toFixed(2)}</div>
            </div>
        )
    }

    const discountTemplate = (rowData) => {
        if (!rowData?.discount) return null
        return (
            <div>
                {rowData.discount.value} {rowData.discount.type === "PERCENTAGE" && '%'}
            </div>
        )
    }

    return (
        <div>
            <div ref={ref}>
                <div className={styles.invoiceBox}>
                    <table>
                        <tr className={styles.top}>
                            <td colSpan={12}>
                                <table>
                                    <tr className={styles.information}>
                                        {uiSettings?.logo?.url && (
                                            <td className={styles.title}>
                                                <img
                                                    src={uiSettings?.logo?.url}
                                                    alt="Company logo"
                                                    className={styles.logo}
                                                />
                                            </td>
                                        )}
                                        <td>
                                            Invoice #: {orderEntity?.sequenceNumber}<br />
                                            Created: {formatDateForDisplay(orderEntity?.createdDate)}<br />
                                            {/* Due: February 1, 2023 */}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td colSpan={12}>
                                <table>
                                    <tr className={styles.information}>
                                        <td>
                                            <th>Invoice</th>
                                            {uiSettings?.applicationName}<br />
                                            {/* 12345 Sunny Road<br /> */}
                                            {/* Sunnyville, TX 12345 */}
                                        </td>
                                        {orderEntity?.customer && (
                                            <td>
                                                {orderEntity?.customer?.firstName} {orderEntity?.customer?.lastName}<br />
                                                {orderEntity?.customer?.email}
                                            </td>
                                        )}
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <tr className={styles.heading}>
                            <td>Name</td>
                            <td>Quantity</td>
                            <td>Price</td>
                            <td>Taxes</td>
                            <td>Discount</td>
                            <td>Total</td>
                        </tr>

                        {dataTableValues?.map((item, index) => (
                            <tr key={index} className={styles.item}>
                                <td>{itemNameTemplate(item)}</td>
                                <td>{item.amount.toFixed(2)}</td>
                                <td>${item.price.toFixed(2)}</td>
                                <td>{taxesTemplate(item)}</td>
                                <td>{discountTemplate(item)}</td>
                                <td>${item.total}</td>
                            </tr>
                        ))}

                        <tr className={styles.total}>
                            <td colSpan={2}></td>
                            <td colSpan={4}>
                                <div className={styles.summaryRow}>
                                    <span>Items:</span>
                                    <span className={styles.textSuccess}>
                                        + {orderEntity?.itemsTotal?.toFixed(2)}
                                    </span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Addons:</span>
                                    <span className={styles.textSuccess}>
                                        + {orderEntity?.addonsTotal?.toFixed(2)}
                                    </span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Taxes:</span>
                                    <span className={styles.textSuccess}>
                                        + {orderEntity?.totalTaxes?.toFixed(2)}
                                    </span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Discount:</span>
                                    <span className={styles.textDanger}>
                                        - {orderEntity?.totalDiscount?.toFixed(2)}
                                    </span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Total:</span>
                                    <span>
                                        {orderEntity?.total?.toFixed(2)}
                                    </span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Amount Paid</span>
                                    <span>
                                        {orderEntity?.bills?.reduce((acc, bill) => acc + bill.total, 0).toFixed(2)}
                                    </span>
                                </div>
                                <hr />
                                <div className={styles.summaryRow}>
                                    <span>Balance Due</span>
                                    <span>
                                        {orderEntity?.total?.toFixed(2) - orderEntity?.bills?.reduce((acc, bill) => acc + bill.total, 0).toFixed(2)}
                                    </span>
                                </div>

                            </td>
                        </tr>
                    </table>
                </div>
            </div>
            <div className='flex gap-2 justify-end'>
                <Button onClick={() => navigate(`/order/${orderEntity?.id}`)}>Back</Button>
                <Button onClick={handlePrint}>Print</Button>
            </div>
        </div>
    );
};

export default PrintOrder;
