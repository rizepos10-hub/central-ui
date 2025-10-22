import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const CatalogSection = (catalogRecords) => {

    if (!catalogRecords?.catalogRecords || catalogRecords?.catalogRecords?.length === 0) return null;

    return (
        <>
            <div className="p-0">
                <h3 className="text-base font-semibold mb-2">Catalog Records</h3>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs">Name</TableHead>
                                <TableHead className="text-xs text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {catalogRecords?.catalogRecords?.map((record, idx) => (
                                <TableRow key={idx}>
                                    <TableCell className="text-xs">{record.name}</TableCell>
                                    <TableCell className="text-xs text-right">{record.total?.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <hr className="my-2 border-gray-300" />
        </>
    );
};

export default CatalogSection;
