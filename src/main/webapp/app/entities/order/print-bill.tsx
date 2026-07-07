import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { useNavigate, useParams } from 'react-router-dom';
import { getEntity as getOrder } from './order.reducer';
import { getEntity as getSettings } from "app/entities/online-ordering/settings/settings.reducer";
import { getEntity as getBill } from '../bill/bill.reducer';
// @ts-expect-error -- ignore
import styles from './print-bill.module.css';
import { useReactToPrint } from 'react-to-print';
import { IBill } from 'app/shared/model/ORDER/bill.model';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { formatSourceScopedIdentifier } from 'app/shared/util/order-identifier-utils';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { Button } from '@/components/ui/button';

const PrintBill = () => {
    const ref = useRef(null);
    const navigate = useNavigate();

    const handlePrint = useReactToPrint({
        content: () => ref.current,
        pageStyle: "@page { size: A4 portrait; margin: 0; }",
    });

    const { id } = useParams<'id'>();
    const { billId } = useParams<'billId'>();
    const dispatch = useAppDispatch();

    const orderEntity: IOrder = useAppSelector(state => state.order.entity);
    const uiSettings = useAppSelector(state => state.uiSettings.entity);
    const billEntity: IBill = useAppSelector(state => state.bill.entity);

    useEffect(() => {
        dispatch(getOrder(id))
        dispatch(getSettings())
        dispatch(getBill({
            orderId: id,
            billId
        }))
    }, [])

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
                                            Date : {formatDateForDisplay(billEntity?.createdDate)}<br />
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
                                            <th>Receipt</th>
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
                            <td>Invoice Number</td>
                            <td>Invoice Date</td>
                            <td>Payment</td>
                        </tr>

                        {billEntity?.paymentTransactions?.map((item, index) => (
                            <tr key={index} className={styles.item}>
                                <td>{formatSourceScopedIdentifier(orderEntity?.sourceApp?.type, billEntity?.sequenceNumber, billEntity?.id)}</td>
                                <td>{formatDateForDisplay(item.createdDate)}</td>
                                <td>{item.amount.toFixed(2)}</td>
                            </tr>
                        ))}

                        <tr className={styles.total}>
                            <td colSpan={2}></td>
                            <td colSpan={4}>
                                <hr />
                                <div className={styles.summaryRow}>
                                    <span>Balance Due</span>
                                    <span>
                                        {
                                            ((orderEntity?.total || 0) -
                                                (billEntity?.paymentTransactions?.reduce((acc, paymentTransaction) => acc + paymentTransaction.amount, 0) || 0))?.toFixed(2)
                                        }
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

export default PrintBill;
