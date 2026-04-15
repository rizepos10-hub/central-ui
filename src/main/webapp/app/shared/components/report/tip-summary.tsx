import { ISummaryReport } from 'app/shared/model/report-summary.model';
import React from 'react';
import ReportSection, {
  reportCellClassName,
  reportHeadClassName,
  reportHeaderRowClassName,
  reportNumericCellClassName,
  reportTableBodyClassName,
  reportTableClassName,
} from 'app/shared/components/report/report-ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber } from 'app/shared/util/price-utils';

const TipSummary = ({ report }: { report: ISummaryReport["tipSummary"] }) => {
    if (!report || report.length === 0) return null;

    return (
        <ReportSection title="Tip Summary" contentClassName="p-0">
            <Table className={reportTableClassName}>
                <TableHeader>
                    <TableRow className={reportHeaderRowClassName}>
                        <TableHead className={reportHeadClassName}>Username</TableHead>
                        <TableHead className={`${reportHeadClassName} text-right`}>Order Count</TableHead>
                        <TableHead className={`${reportHeadClassName} text-right`}>Total Tips</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className={reportTableBodyClassName}>
                    {report.map((r, idx) => (
                        <TableRow key={idx}>
                            <TableCell className={reportCellClassName}>{r.username}</TableCell>
                            <TableCell className={reportNumericCellClassName}>{r.orderCount}</TableCell>
                            <TableCell className={reportNumericCellClassName}>{formatNumber(r.totalTips)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ReportSection>
    )
}

export default TipSummary
