import { fetchRecentBills } from 'app/modules/analytics/api';
import { ISummaryReport } from 'app/shared/model/report-summary.model';
import React, { useEffect, useState } from 'react';
import { Col } from 'reactstrap';
import PaginationFilterStateVals from '../pagination/pagination-filter-state-vals';

const ITEMS_PER_PAGE = 10;

const BillsSummary = ({ eodId }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [bills, setBills] = useState([])

    if (!bills) return null;

    const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

    useEffect(() => {
        fetchRecentBills(currentPage - 1, 10, eodId).then(result => {
            setTotalRecords(Number(result.headers['x-total-count']))
            setBills(result.data)
        })
    }, [currentPage])

    return (
        <Col className='p-0'>
            <h3>Bills Summary</h3>
            <div className="table-responsive">
                <table className="table" id="sales_summary">
                    <thead>
                        <tr>
                            <th colSpan={2}>Sequence Number</th>
                            <th colSpan={2}>Date / Time</th>
                            <th colSpan={2}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bills.map((b, idx) => (
                            <tr key={idx}>
                                <td colSpan={2}>{b.sequenceNumber}</td>
                                <td colSpan={2}>{new Date(b.dateTime).toLocaleString()}</td>
                                <td colSpan={2}>{b.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className='d-flex justify-content-center align-items-center'>
                <PaginationFilterStateVals
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                />
            </div>
        </Col>
    );
};

export default BillsSummary;
