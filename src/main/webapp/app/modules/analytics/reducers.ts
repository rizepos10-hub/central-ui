import salesReportReducer from "app/modules/analytics/reports/sales-report/sales-report.reducer";
import retailDashboard from "app/modules/analytics/reports/retail-dashboard/retail-dashboard.reducer";
import summaryReport from "./reports/end-of-day/end-of-day.reducer"
import userClock from "app/modules/analytics/user-clock/user-clock.reducer";

const analyticsReducers = {
  salesReportReducer,
  summaryReport,
  userClock,
  retailDashboard
};

export default analyticsReducers;
