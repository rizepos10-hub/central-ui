import { ISummaryReport } from 'app/shared/model/report-summary.model';
import React, { useState } from 'react';
import { Col } from 'reactstrap';
import PaginationFilterStateVals from '../pagination/pagination-filter-state-vals';

const ITEMS_PER_PAGE = 10;

const BillsSummary = ({ bills }) => {
    const [currentPage, setCurrentPage] = useState(1);

    if (!bills) return null;

    const totalPages = Math.ceil(bills.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentBills = bills.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <Col>
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
                        {currentBills.map((b, idx) => (
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
