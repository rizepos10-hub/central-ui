import { ISummaryReport } from 'app/shared/model/report-summary.model';
import React from 'react'
import { Col } from 'reactstrap'

const TipSummary = ({ report }: { report: ISummaryReport["tipSummary"] }) => {
    if (!report) return

    return (
        <Col>
            <h3>Tip Summary</h3>
            <div className="table-responsive">
                <table className="table " id="sales_summary">
                    <tbody>
                        <tr>
                            <th colSpan={2}>Username</th>
                            <th colSpan={2}>Order Count</th>
                            <th colSpan={2}>Total Tips</th>
                        </tr>
                        {report.map((r, idx) => (
                            <tr key={idx}>
                                <td colSpan={2}>{r.username}</td>
                                <td colSpan={2}>{r.orderCount}</td>
                                <td colSpan={2}>{r.totalTips}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Col>
    )
}

export default TipSummary