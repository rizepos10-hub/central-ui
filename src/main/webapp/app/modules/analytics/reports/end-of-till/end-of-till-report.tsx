import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { getEntity, getEntityAndGetReportByTill } from "app/entities/settings/branch-registry/till/till.reducer";
import { Button } from "reactstrap";
import TillDetails from "app/modules/analytics/reports/end-of-till/till-details";
import EndOfTillSales from "app/modules/analytics/reports/end-of-till/end-of-till-sales";
;
import { ISummaryReport } from "app/shared/model/report-summary.model";
import EndOfTillTotalReceived from "app/modules/analytics/reports/end-of-till/end-of-till-total-received";

const EndOfTillReport = () => {
  const { id, tillId } = useParams();
  const dispatch = useAppDispatch();
  const till = useAppSelector(state => state.till.entity);
  const branchRegistry = useAppSelector(state => state.branchRegistry.entity);
  const summaryReport :ISummaryReport = useAppSelector(state => state.summaryReport.reportByTill);


  useEffect(() => {
    dispatch(getEntityAndGetReportByTill({ id: tillId, registryId: id }));

  }, []);

  return (
    <div className={"bg-white p-5"}>
      <h1>End of Till Report</h1>
      <div className="p-3 rounded-3 border bg-gray-300 border-2 border-gray-300 shadow-sm bg-gradient">
        <Button tag={Link} to={`/analytics/register-closure/${id}/${tillId}/orders?registry=${branchRegistry.name}&from=${till.startDate}&to=${till.endDate}`}
                className="btn btn--pill btn--well">
          View full details
        </Button>
      </div>

      <div>
        <TillDetails till={till} />
      </div>

      {summaryReport?.totalSales &&
        <EndOfTillSales data={summaryReport.totalSales} title={"Total Sales"} />
      }

      {summaryReport?.totalSalesByOrderOption["DineIn"] &&
        <EndOfTillSales data={summaryReport.totalSales} title={"Dine In Sales"} />
      }

      {summaryReport?.totalSalesByOrderOption["Delivery"] &&
        <EndOfTillSales data={summaryReport.totalSales} title={"Delivery Sales"} />
      }

      {summaryReport?.totalSalesByOrderOption["PickUp"] &&
        <EndOfTillSales data={summaryReport.totalSales} title={"Pick Up Sales"} />
      }

      {summaryReport?.totalSalesByOrderOption["WalkIn"] &&
        <EndOfTillSales data={summaryReport.totalSales} title={"Walk In Sales"} />
      }

      {summaryReport?.totalReceived && <EndOfTillTotalReceived totalReceived={summaryReport.totalReceived} />}
    </div>
  );
}
export default EndOfTillReport;
