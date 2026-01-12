import { ICategorySalesSummary } from 'app/shared/model/report-summary.model';
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber } from 'app/shared/util/price-utils';

const CategoryReport = ({
    categorySaleSummary
}: {
    categorySaleSummary: ICategorySalesSummary
}) => {
    return (
        <div className="p-0">
            <h3 className="text-base font-semibold mb-2">Category Sales Summary</h3>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs">Name</TableHead>
                            <TableHead className="text-xs text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categorySaleSummary?.categories?.map((c, idx) => (
                            <TableRow key={idx}>
                                <TableCell className="text-xs">{c.name}</TableCell>
                                <TableCell className="text-xs text-right">{formatNumber(c.amount)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default CategoryReport;