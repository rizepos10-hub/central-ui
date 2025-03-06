import { ISummaryReport } from 'app/shared/model/report-summary.model';
import React from 'react'
import { Col } from 'reactstrap'

const BillsSummary = ({ bills }: { bills }) => {
    if (!bills) return

    return (
        <Col>
            <h3>Bills Summary</h3>
            <div className="table-responsive">
                <table className="table " id="sales_summary">
                    <tbody>
                        <tr>
                            <th colSpan={2}>Id</th>
                            <th colSpan={2}>Sequence Number</th>
                            <th colSpan={2}>Date / Time</th>
                            <th colSpan={2}>Total</th>
                        </tr>
                        {bills.map((b, idx) => (
                            <tr key={idx}>
                                <td colSpan={2}>{b.id}</td>
                                <td colSpan={2}>{b.sequenceNumber}</td>
                                <td colSpan={2}>{new Date(b.dateTime).toLocaleDateString()}</td>
                                <td colSpan={2}>{b.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Col>
    )
}

export default BillsSummary