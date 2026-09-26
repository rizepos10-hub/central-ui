import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { FilterMatchMode } from "primereact/api";
import { translate } from "react-jhipster";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { getEntities as getUsers } from "app/entities/branch-pos-user/user.reducer";
import { filterEntities } from "app/modules/analytics/user-clock/user-clock.reducer";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import { IUserClock } from "app/shared/model/user-clock.model";
import { format } from "date-fns";
import { saveAsExcelFile } from "app/shared/util/excel-utils";
import {
    formatClockDuration,
    formatWorkingDuration,
    formatWorkingDurationTitle,
    getElapsedSeconds,
} from "app/shared/util/duration-format-utils";
import { formatDateForDisplay } from "app/shared/util/timezone-utils";
import { PageWrapper } from "app/shared/layout/page-wrapper";
import ReportActionBar from "app/shared/components/report/report-action-bar";
import ReportErrorState from 'app/shared/components/report/report-error-state';
import ReportExportHeader from "app/shared/components/report/report-export-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/src/main/webapp/app/lib/utils";
import { useReactToPrint } from "react-to-print";
import { analyticsReportPrintStyles, createReportFileName, downloadElementAsPdf } from "app/shared/util/report-export-utils";
import { getReportApiErrorMessage } from 'app/shared/util/report-api-error-utils';

const ALL_USERS = '__all__';

const userOptionValue = (user: { userName?: string; username?: string; login?: string }) =>
    user.userName || user.username || user.login || '';

const userFullName = (user: { firstName?: string; lastName?: string }) =>
    `${user.firstName || ''} ${user.lastName || ''}`.trim();

const clockLogin = (clock: IUserClock) => (clock.username || clock.createdBy || '').trim();

const initialState = {
    first: 0,
    rows: 500,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
        branchId: { value: null, matchMode: FilterMatchMode.EQUALS },
        username: { value: null, matchMode: FilterMatchMode.EQUALS },
        instantClockedIn: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        instantClockedOut: { value: null, matchMode: FilterMatchMode.ENDS_WITH },
    }
};

const EmployeeHoursReport = () => {
    const dispatch = useAppDispatch();
    const reportContentRef = useRef<HTMLDivElement>(null);
    const branches = useAppSelector(state => state.branch.entities);
    const users = useAppSelector(state => state.PosBranchUser.entities);
    const userClocks: IUserClock[] = useAppSelector(state => state.userClock.entities);
    const closedUserClocks = userClocks.filter(clock => Boolean(clock.instantClockedOut));
    const loadingClocks = useAppSelector(state => state.userClock.loading);
    const userClockErrorMessage = useAppSelector(state => state.userClock.errorMessage);

    const [filterState, setFilterState] = useState(initialState);
    const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasLoadedReport, setHasLoadedReport] = useState(false);
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined
    });

    useEffect(() => {
        dispatch(getBranches({}));
        dispatch(getUsers({}));
    }, []);

    const sortedUsers = useMemo(
        () =>
            [...users]
                .map(user => ({ user, value: userOptionValue(user) }))
                .filter(entry => entry.value)
                .sort((a, b) => a.value.localeCompare(b.value, undefined, { sensitivity: 'base' })),
        [users]
    );
    const selectedUsername = filterState.filters.username.value as string | null;
    const selectedUser = selectedUsername
        ? users.find(user => userOptionValue(user) === selectedUsername)
        : undefined;
    const userLabel = selectedUsername
        ? (selectedUser && userFullName(selectedUser)) || selectedUsername
        : 'All users';

    const displayClockName = (login: string) => {
        if (!login) return '';
        const match = users.find(user => userOptionValue(user) === login);
        return (match && userFullName(match)) || login;
    };

    const handleUserChange = (value: string) => {
        setFilterState({
            ...filterState,
            filters: {
                ...filterState.filters,
                username: { value: value === ALL_USERS ? null : value, matchMode: FilterMatchMode.EQUALS },
            },
        });
    };

    const getUserClocks = async () => {
        setError(null);
        const updatedState = applyMatchModeMap(filterState);
        try {
            await dispatch(filterEntities({
                query: updatedState,
            })).unwrap();
            setHasLoadedReport(true);
        } catch {
            setHasLoadedReport(true);
        }
    };

    const handleDateChange = (range: { from: Date | undefined; to: Date | undefined }) => {
        setDateRange(range);
        let endDate = range.to;
        if (endDate) {
            endDate = new Date(endDate);
            endDate.setHours(23, 59, 59);
        }

        setFilterState({
            ...filterState,
            filters: {
                ...filterState.filters,
                instantClockedIn: { value: range.from, matchMode: FilterMatchMode.STARTS_WITH },
                instantClockedOut: { value: endDate, matchMode: FilterMatchMode.ENDS_WITH },
            }
        });
    };

    const getClockElapsedSeconds = (clock: IUserClock) =>
        getElapsedSeconds(new Date(clock.instantClockedIn), new Date(clock.instantClockedOut));

    const calculateTotalHours = (username: string) => {
        const totalSeconds = closedUserClocks
            .filter(clock => clockLogin(clock) === username)
            .reduce((sum, clock) => sum + getClockElapsedSeconds(clock), 0);

        return formatWorkingDuration(totalSeconds);
    };

    const exportExcel = async () => {
        try {
        setBusyAction('excel');
        setError(null);
        const clocksByUser = {};
        closedUserClocks.forEach(clock => {
            const login = clockLogin(clock);
            if (!clocksByUser[login]) {
                clocksByUser[login] = [];
            }
            clocksByUser[login].push(clock);
        });

        const structuredExcelData = [];

        Object.keys(clocksByUser).forEach(username => {
            let totalSeconds = 0;
            clocksByUser[username].forEach(clock => {
                const secondsThisClock = getClockElapsedSeconds(clock);
                totalSeconds += secondsThisClock;

                structuredExcelData.push({
                    Name: displayClockName(username),
                    'Clock In': clock.instantClockedIn,
                    'Clock Out': clock.instantClockedOut,
                    'Working Hours': formatClockDuration(clock.instantClockedIn, clock.instantClockedOut)
                });
            });

            structuredExcelData.push({
                Name: '',
                'Clock In': '',
                'Clock Out': '',
                'Working Hours': `Total Hours : ${formatWorkingDuration(totalSeconds)}`
            });
        });

        const headers = ['Name', 'Clock In', 'Clock Out', 'Working Hours'];
        const xlsx = await import('xlsx-js-style');
        const worksheet = xlsx.utils.json_to_sheet(structuredExcelData, { header: headers });

        headers.forEach((_, colIndex) => {
            const cellAddress = xlsx.utils.encode_cell({ r: 0, c: colIndex });
            if (worksheet[cellAddress]) {
                worksheet[cellAddress].s = {
                    font: { bold: true },
                };
            }
        });

        worksheet['!cols'] = headers.map(() => ({ wpx: 180 }));
        const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
        const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
        saveAsExcelFile(excelBuffer, 'UserClocks.xlsx');
        } catch (error) {
            setError(getReportApiErrorMessage(error, 'Unable to export employee hours report.'));
        } finally {
            setBusyAction(null);
        }
    };

    // Group user clocks by username
    const groupedUserClocks = closedUserClocks.reduce((acc, clock) => {
        const login = clockLogin(clock);
        if (!acc[login]) {
            acc[login] = [];
        }
        acc[login].push(clock);
        return acc;
    }, {} as Record<string, IUserClock[]>);
    const branchLabel = branches.find(branch => branch.id === filterState.filters.branchId.value)?.name || 'All branches';
    const dateRangeLabel =
        dateRange.from && dateRange.to
            ? `${format(dateRange.from, "yyyy-MM-dd")} - ${format(dateRange.to, "yyyy-MM-dd")}`
            : null;
    const fileName = createReportFileName('Employee Hours Report', [branchLabel, userLabel, dateRangeLabel]);
    const reportError = error || (userClockErrorMessage ? getReportApiErrorMessage(userClockErrorMessage, 'Unable to load employee hours report.') : null);
    const hasExportData = !reportError && closedUserClocks.length > 0;

    const handlePdfExport = async () => {
        if (!reportContentRef.current || !hasExportData) {
            return;
        }

        try {
            setBusyAction('pdf');
            setError(null);
            await downloadElementAsPdf(reportContentRef.current, { fileName, orientation: 'portrait' });
        } catch (error) {
            setError(getReportApiErrorMessage(error, 'Unable to export employee hours report.'));
        } finally {
            setBusyAction(null);
        }
    };

    const handlePrint = useReactToPrint({
        content: () => reportContentRef.current,
        documentTitle: fileName,
        pageStyle: analyticsReportPrintStyles('portrait'),
        onBeforeGetContent: async () => {
            setError(null);
            setBusyAction('print');
        },
        onAfterPrint: () => {
            setBusyAction(null);
        },
    });

    return (
        <PageWrapper>
            <h1 className="text-lg font-semibold mb-2">Employee Hours Report</h1>

            <div className="flex flex-col gap-2 mb-3">
                <div className="flex gap-2 items-end">
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="branchId" className="text-xs">Branch</Label>
                        <Select
                            value={filterState.filters.branchId.value}
                            onValueChange={(value) =>
                                setFilterState({
                                    ...filterState,
                                    filters: {
                                        ...filterState.filters,
                                        branchId: { value, matchMode: FilterMatchMode.EQUALS },
                                    },
                                })
                            }
                        >
                            <SelectTrigger id="branchId" className="h-7 text-xs w-[200px]">
                                <SelectValue placeholder="Select Branch" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map(branch => (
                                    <SelectItem key={branch.id} value={branch.id} className="text-xs">
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label htmlFor="username" className="text-xs">User</Label>
                        <Select value={selectedUsername ?? ALL_USERS} onValueChange={handleUserChange}>
                            <SelectTrigger id="username" className="h-7 text-xs w-[200px]">
                                <SelectValue placeholder="All users" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_USERS} className="text-xs">
                                    All users
                                </SelectItem>
                                {sortedUsers.map(({ user, value }) => (
                                    <SelectItem key={user.id || value} value={value} className="text-xs">
                                        {userFullName(user) || value}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label htmlFor="date" className="text-xs">Date Range</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant="outline"
                                    className={cn(
                                        "h-7 text-xs justify-start text-left font-normal w-[240px]",
                                        !dateRange.from && "text-muted-foreground"
                                    )}
                                    disabled={!branches || branches?.length === 0}
                                >
                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                    {dateRange.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                                {format(dateRange.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>{translate('orders.view.table.filters.date')}</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="range"
                                    selected={{ from: dateRange.from, to: dateRange.to }}
                                    onSelect={(range) => handleDateChange(range || { from: undefined, to: undefined })}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Button size="sm" className="h-7 text-xs" onClick={() => getUserClocks()}>
                        Get Report
                    </Button>
                </div>
            </div>

            {reportError ? <ReportErrorState message={reportError} dataTestId="employee-hours-error" /> : null}

            {loadingClocks && (
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}

            {!reportError && !loadingClocks && !hasLoadedReport && (
                <div
                    className="rounded-lg border px-4 py-10 text-center text-xs text-muted-foreground"
                    data-testid="employee-hours-not-loaded"
                >
                    Run the report to view results.
                </div>
            )}

            {!reportError && !loadingClocks && hasLoadedReport && closedUserClocks.length === 0 && (
                <div
                    className="rounded-lg border px-4 py-10 text-center text-xs text-muted-foreground"
                    data-testid="employee-hours-empty"
                >
                    No employee hours records found for the selected branch, user, and date range.
                </div>
            )}

            {!reportError && !loadingClocks && hasLoadedReport && closedUserClocks.length > 0 && (
                <div className="mt-2">
                    <div className="flex justify-end mb-2">
                        <ReportActionBar
                            onExcel={exportExcel}
                            onPdf={handlePdfExport}
                            onPrint={handlePrint}
                            disabled={!hasExportData || loadingClocks || busyAction !== null}
                            busyAction={busyAction}
                        />
                    </div>

                    <div ref={reportContentRef} className="report-export-root space-y-3">
                        <ReportExportHeader
                            reportTitle="Employee Hours Report"
                            hiddenOnScreen
                            forceVisible={busyAction === 'pdf'}
                            filters={[
                                { label: 'Branch', value: branchLabel },
                                { label: 'User', value: userLabel },
                                { label: 'Date Range', value: dateRangeLabel },
                            ]}
                        />

                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Name</TableHead>
                                    <TableHead className="text-xs">Clock In</TableHead>
                                    <TableHead className="text-xs">Clock Out</TableHead>
                                    <TableHead className="text-xs text-right">Working Hours</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(groupedUserClocks).map(([username, clocks]) => (
                                    <React.Fragment key={username}>
                                        {clocks.map((clock, index) => (
                                            <TableRow key={clock.id}>
                                                <TableCell className="text-xs">{index === 0 ? displayClockName(username) : ''}</TableCell>
                                                <TableCell className="text-xs">
                                                    {formatDateForDisplay(clock.instantClockedIn)}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {formatDateForDisplay(clock.instantClockedOut)}
                                                </TableCell>
                                                <TableCell
                                                    className="text-xs text-right"
                                                    title={formatWorkingDurationTitle(getClockElapsedSeconds(clock))}
                                                >
                                                    {formatClockDuration(clock.instantClockedIn, clock.instantClockedOut)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50 font-semibold">
                                            <TableCell colSpan={3} className="text-xs text-right">
                                                Total Hours:
                                            </TableCell>
                                            <TableCell
                                                className="text-xs text-right"
                                                title={formatWorkingDurationTitle(
                                                    closedUserClocks
                                                        .filter(userClock => clockLogin(userClock) === username)
                                                        .reduce((sum, userClock) => sum + getClockElapsedSeconds(userClock), 0)
                                                )}
                                            >
                                                {calculateTotalHours(username)}
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    </div>
                </div>
            )}
        </PageWrapper>
    );
}

export default EmployeeHoursReport;
