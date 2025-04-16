import { ICategorySalesSummary } from 'app/shared/model/report-summary.model'
import React from 'react'
import { Col } from 'reactstrap'

const CategoryReport = ({
    categorySaleSummary
} : {
    categorySaleSummary: ICategorySalesSummary
}) => {
  return (
    <Col className='p-0'>
    <h3>Category Sales Summary</h3>
    <div className="table-responsive">
        <table className="table" id="sales_summary">
            <thead>
                <tr>
                    <th colSpan={3}>Name</th>
                    <th colSpan={3}>Amount</th>
                </tr>
            </thead>
            <tbody>
                {categorySaleSummary?.categories?.map((c, idx) => (
                    <tr key={idx}>
                        <td colSpan={3}>{c.name}</td>
                        <td colSpan={3}>{c.amount}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
</Col>
  )
}

export default CategoryReport