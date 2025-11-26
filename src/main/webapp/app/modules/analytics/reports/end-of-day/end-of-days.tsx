import React, { useEffect, useState } from "react";
import { fetchEndOfDaysData } from "app/modules/analytics/api";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { translate, Translate } from "react-jhipster";
import { format } from "date-fns";
import { dateToUTCString, formatDateForDisplay } from "app/shared/util/timezone-utils";
import { PageWrapper } from "app/shared/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/src/main/webapp/app/lib/utils";




interface DateRange {
  from: Date;
  to?: Date;
}

export const EndOfDays = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const branchList = useAppSelector(state => state.branch.entities);
  const businessTimeZone = useAppSelector(state => state.businessTimeZone.timeZone);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [endOfDaysData, setEndOFDaysData] = useState([]);
  const [lazyState, setLazyState] = useState({
    first: 0,
    page: 0,
    rows: 20,
    sortField: 'toDate',
    sortOrder: -1
  });


  useEffect(() => {
    loadLazyData();
    dispatch(getBranches({}));
  }, [lazyState, selectedBranch, dateRange]);

  const loadLazyData = async () => {
    setLoading(true);
    try {
      const sortDirection = lazyState.sortOrder === 1 ? "asc" : "desc";
      const sortField = lazyState.sortField + ',' + sortDirection;

      let fromDate = null;
      let toDate = null;

      if (dateRange?.from) {
        fromDate = dateToUTCString(dateRange.from);
      }
      if (dateRange?.to) {
        const adjustedToDate = new Date(dateRange.to);
        adjustedToDate.setHours(23, 59, 59);
        toDate = dateToUTCString(adjustedToDate);
      }

      const result = await fetchEndOfDaysData(
        lazyState.page,
        lazyState.rows,
        sortField,
        String(lazyState.sortOrder),
        selectedBranch,
        fromDate,
        toDate
      );
      setTotalRecords(Number(result.headers['x-total-count']));
      setEndOFDaysData(result.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setLazyState(prev => ({
      ...prev,
      page: newPage,
      first: newPage * prev.rows
    }));
  };

  const handleSort = (field: string) => {
    setLazyState(prev => ({
      ...prev,
      sortField: field,
      sortOrder: prev.sortField === field ? (prev.sortOrder === 1 ? -1 : 1) : -1
    }));
  };

  const handleRowClick = (rowData: any) => {
    const branchId = rowData?.branch?.id ?? "unknown";
    navigate(`/analytics/endofday/${rowData.id}?branchId=${encodeURIComponent(branchId)}`);
  };

  const totalPages = Math.ceil(totalRecords / lazyState.rows);
  const currentPage = lazyState.page;

  return (
    <PageWrapper>
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">
          <Translate contentKey={'analytics.endOfDay.title'}>End Of Day Reports</Translate>
        </h2>

        <div className="flex gap-3">
          <Select value={selectedBranch || "all"} onValueChange={(value) => setSelectedBranch(value === "all" ? null : value)}>
            <SelectTrigger className="h-7 w-[180px] text-xs">
              <SelectValue placeholder={translate('analytics.endOfDay.select')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {branchList.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-7 w-[240px] justify-start text-left text-xs font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3 w-3" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "PP")} - {format(dateRange.to, "PP")}
                    </>
                  ) : (
                    format(dateRange.from, "PP")
                  )
                ) : (
                  <span>{translate('orders.view.table.filters.date')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">
                  {translate('analytics.endOfDay.table.fromDate')}
                </TableHead>
                <TableHead
                  className="text-xs cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('toDate')}
                >
                  {translate('analytics.endOfDay.table.toDate')}
                  {lazyState.sortField === 'toDate' && (
                    <span className="ml-1">{lazyState.sortOrder === 1 ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead className="text-xs">
                  {translate('analytics.endOfDay.table.actionBy')}
                </TableHead>
                <TableHead className="text-xs">
                  {translate('analytics.endOfDay.table.createdDate')}
                </TableHead>
                <TableHead className="text-xs">
                  {translate('analytics.endOfDay.table.branchName')}
                </TableHead>
                <TableHead className="text-xs">
                  {translate('analytics.endOfDay.table.appName')}
                </TableHead>
                <TableHead className="text-xs">
                  {translate('analytics.endOfDay.table.appType')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-xs py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : endOfDaysData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-xs py-4">
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                endOfDaysData.map((rowData: any) => (
                  <TableRow
                    key={rowData.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(rowData)}
                  >
                    <TableCell className="text-xs">
                      {formatDateForDisplay(rowData?.fromDate)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDateForDisplay(rowData?.toDate)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {rowData?.actionTakenBy}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDateForDisplay(rowData?.createdDate)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {rowData?.branch?.name}
                    </TableCell>
                    <TableCell className="text-xs">
                      {rowData?.branch?.appName}
                    </TableCell>
                    <TableCell className="text-xs">
                      {rowData?.branch?.appType}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t">
              <div className="text-xs text-muted-foreground">
                Showing {lazyState.first + 1} to {Math.min(lazyState.first + lazyState.rows, totalRecords)} of {totalRecords} entries
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  &lt;
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (currentPage < 3) {
                    pageNum = i;
                  } else if (currentPage > totalPages - 3) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum + 1}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  &gt;
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
