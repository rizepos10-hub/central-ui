import { ICategorySalesSummary } from 'app/shared/model/report-summary.model';
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

const CategoryReport = ({
    categorySaleSummary
}: {
    categorySaleSummary: ICategorySalesSummary
}) => {
    return (
        <ReportSection title="Category Sales Summary" contentClassName="p-0">
            <Table className={reportTableClassName}>
                <TableHeader>
                    <TableRow className={reportHeaderRowClassName}>
                        <TableHead className={reportHeadClassName}>Name</TableHead>
                        <TableHead className={`${reportHeadClassName} text-right`}>Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className={reportTableBodyClassName}>
                    {categorySaleSummary?.categories?.map((c, idx) => (
                        <TableRow key={idx}>
                            <TableCell className={reportCellClassName}>{c.name}</TableCell>
                            <TableCell className={reportNumericCellClassName}>{formatNumber(c.amount)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ReportSection>
    );
};

export default CategoryReport;
