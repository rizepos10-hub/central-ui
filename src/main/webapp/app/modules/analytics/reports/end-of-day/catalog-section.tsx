import React from 'react';
import { Col } from 'reactstrap';

const CatalogSection = (catalogRecords) => {

    if (!catalogRecords?.catalogRecords || catalogRecords?.catalogRecords?.length === 0) return null;

    return (
        <Col className="p-0">
            <h3>Catalog Records</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="p-1 border-bottom">Name</th>
                            <th className="p-1 border-bottom">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {catalogRecords?.catalogRecords?.map((record, idx) => (
                            <tr key={idx}>
                                <td className="p-1 border-bottom">{record.name}</td>
                                <td className="p-1 border-bottom">{record.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Col>
    );
};

export default CatalogSection;
