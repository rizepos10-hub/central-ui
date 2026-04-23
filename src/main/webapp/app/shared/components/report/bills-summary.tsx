import { fetchRecentByDate, fetchRecentBills } from 'app/modules/analytics/api';
import { ISummaryReport } from 'app/shared/model/report-summary.model';
import React, { useEffect, useState } from 'react';
import PaginationFilterStateVals from '../pagination/pagination-filter-state-vals';
import ReportErrorState from './report-error-state';
import ReportSection, {
    reportCellClassName,
    reportHeadClassName,
    reportHeaderRowClassName,
    reportNumericCellClassName,
    reportTableBodyClassName,
    reportTableClassName,
} from 'app/shared/components/report/report-ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { formatNumber } from 'app/shared/util/price-utils';
import { getReportApiErrorMessage } from 'app/shared/util/report-api-error-utils';

const ITEMS_PER_PAGE = 10;

const BillsSummary = ({ eodId, fromDate, toDate, branchId, source }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [bills, setBills] = useState([])
    const [error, setError] = useState<string | null>(null);

    const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [branchId, eodId, fromDate, toDate, source]);

    useEffect(() => {
        const loadBills = async () => {
            try {
                setError(null);
                if (eodId) {
                    const result = await fetchRecentBills(currentPage - 1, 10, eodId);
                    setTotalRecords(Number(result.headers['x-total-count']))
                    setBills(result.data)
                    return;
                }

                const result = await fetchRecentByDate(currentPage - 1, 10, fromDate, toDate, branchId, source);
                setTotalRecords(Number(result.headers['x-total-count']))
                setBills(result.data);
            } catch (error) {
                setBills([]);
                setTotalRecords(0);
                setError(getReportApiErrorMessage(error, 'Unable to load bills summary.'));
            }
        };

        void loadBills();
    }, [branchId, currentPage, eodId, fromDate, source, toDate])

    if (error) {
        return (
            <ReportSection title="Bills Summary">
                <ReportErrorState message={error} compact dataTestId="bills-summary-error" />
            </ReportSection>
        );
    }

    if (bills.length === 0) return null;

    return (
        <ReportSection title="Bills Summary" contentClassName="p-0">
            <Table className={reportTableClassName}>
                <TableHeader>
                    <TableRow className={reportHeaderRowClassName}>
                        <TableHead className={reportHeadClassName}>Sequence Number</TableHead>
                        <TableHead className={reportHeadClassName}>Date / Time</TableHead>
                        <TableHead className={`${reportHeadClassName} text-right`}>Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className={reportTableBodyClassName}>
                    {bills.map((b, idx) => (
                        <TableRow key={idx}>
                            <TableCell className={reportCellClassName}>{b.sequenceNumber}</TableCell>
                            <TableCell className={reportCellClassName}>{formatDateForDisplay(b.dateTime)}</TableCell>
                            <TableCell className={reportNumericCellClassName}>{formatNumber(b.total)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="flex justify-center items-center px-3 py-3">
                <PaginationFilterStateVals
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                />
            </div>
        </ReportSection>
    );
};

export default BillsSummary;
