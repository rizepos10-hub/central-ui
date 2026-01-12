import { ISummaryReport } from 'app/shared/model/report-summary.model';
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber } from 'app/shared/util/price-utils';

const TipSummary = ({ report }: { report: ISummaryReport["tipSummary"] }) => {
    if (!report || report.length === 0) return null;

    return (
        <div className="p-0">
            <h3 className="text-sm font-semibold mb-2">Tip Summary</h3>
            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs font-semibold">Username</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Order Count</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Total Tips</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {report.map((r, idx) => (
                            <TableRow key={idx}>
                                <TableCell className="text-xs">{r.username}</TableCell>
                                <TableCell className="text-xs text-right">{r.orderCount}</TableCell>
                                <TableCell className="text-xs text-right">{formatNumber(r.totalTips)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default TipSummary
