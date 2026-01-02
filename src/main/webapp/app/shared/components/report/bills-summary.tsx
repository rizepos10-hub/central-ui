import { fetchRecentByDate, fetchRecentBills } from 'app/modules/analytics/api';
import { ISummaryReport } from 'app/shared/model/report-summary.model';
import React, { useEffect, useState } from 'react';
import PaginationFilterStateVals from '../pagination/pagination-filter-state-vals';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { formatNumber } from 'app/shared/util/price-utils';

const ITEMS_PER_PAGE = 10;

const BillsSummary = ({ eodId, fromDate, toDate, branchId, source }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [bills, setBills] = useState([])

    const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

    useEffect(() => {
        if (eodId) {
            fetchRecentBills(currentPage - 1, 10, eodId).then(result => {
                setTotalRecords(Number(result.headers['x-total-count']))
                setBills(result.data)
            })
        } else {
            fetchRecentByDate(currentPage - 1, 10, fromDate, toDate, branchId)
                .then((result) => {
                    setTotalRecords(Number(result.headers['x-total-count']))
                    setBills(result.data);
                });
        }
    }, [currentPage])

    if (bills.length === 0) return null;

    return (
        <div className="p-0">
            <h3 className="text-sm font-semibold mb-2">Bills Summary</h3>
            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs font-semibold">Sequence Number</TableHead>
                            <TableHead className="text-xs font-semibold">Date / Time</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bills.map((b, idx) => (
                            <TableRow key={idx}>
                                <TableCell className="text-xs">{b.sequenceNumber}</TableCell>
                                <TableCell className="text-xs">{formatDateForDisplay(b.dateTime)}</TableCell>
                                <TableCell className="text-xs text-right">{formatNumber(b.total)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-center items-center mt-3">
                <PaginationFilterStateVals
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                />
            </div>
        </div>
    );
};

export default BillsSummary;
