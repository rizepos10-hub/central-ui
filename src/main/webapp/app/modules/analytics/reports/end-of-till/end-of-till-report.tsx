import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "app/config/store";
import {
  getEntity,
  getEntityAReport
} from "app/entities/settings/branch-registry/till/till.reducer";
import { Button, Spinner } from "reactstrap";
import TillDetails from "app/modules/analytics/reports/end-of-till/till-details";
import GenericSalesReport from "app/shared/components/report/generic-sales-report";
;
import { ISummaryReport } from "app/shared/model/report-summary.model";
import EndOfTillTotalReceived from "app/shared/components/report/summary-report-total-received";

const EndOfTillReport = () => {
  const { id, tillId } = useParams();
  const dispatch = useAppDispatch();
  const till = useAppSelector(state => state.till.entity);
  const summaryReport :ISummaryReport = useAppSelector(state => state.till.report);
  const loading :ISummaryReport = useAppSelector(state => state.till.loading);

  useEffect(() => {
    dispatch(getEntity(tillId));
    dispatch(getEntityAReport(tillId));
  }, []);

  if(loading){
    return <Spinner />
  }


  return (
    <div className={'bg-white p-5'}>
      <h1>End of Till Report</h1>
      <div className="p-3 rounded-3 border bg-gray-300 border-2 border-gray-300 shadow-sm bg-gradient">
        <Button
          tag={Link}
          to={`/analytics/register-closure/${id}/${tillId}/orders?registry=${till?.registry?.name}&from=${till.startDate}&to=${till.endDate}`}
          className="btn btn--pill btn--well"
        >
          View full details
        </Button>
      </div>

      <div>
        <TillDetails till={till} />
      </div>


        <GenericSalesReport title={'Total Sales'} report={summaryReport?.totalSales} />

        <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["DineIn"]} title={"Dine In Sales"} />

        <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["Delivery"]} title={"Delivery Sales"} />

        <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["PickUp"]} title={"Pick Up Sales"} />

        <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["WalkIn"]} title={"Walk In Sales"} />

      {summaryReport?.totalReceived && <EndOfTillTotalReceived totalReceived={summaryReport.totalReceived} />}
    </div>
  );
}
export default EndOfTillReport;
