import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { FilterMatchMode } from "primereact/api";
import { translate } from "react-jhipster";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { filterEntities } from "app/modules/analytics/user-clock/user-clock.reducer";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import { IUserClock } from "app/shared/model/user-clock.model";
import { format, intervalToDuration } from "date-fns";
import { saveAsExcelFile } from "app/shared/util/excel-utils";
import { formatDateForDisplay } from "app/shared/util/timezone-utils";
import { PageWrapper } from "app/shared/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, FileSpreadsheet, Loader2 } from "lucide-react";
import { cn } from "@/src/main/webapp/app/lib/utils";

const initialState = {
    first: 0,
    rows: 500,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
        branchId: { value: null, matchMode: FilterMatchMode.EQUALS },
        instantClockedIn: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        instantClockedOut: { value: null, matchMode: FilterMatchMode.ENDS_WITH },
    }
};

const EmployeeHoursReport = () => {
    const dispatch = useAppDispatch();
    const branches = useAppSelector(state => state.branch.entities);
    const userClocks: IUserClock[] = useAppSelector(state => state.userClock.entities);
    const loadingClocks = useAppSelector(state => state.userClock.loading);
    const loadingReport = useAppSelector(state => state.userClock.loadingReport);

    const [filterState, setFilterState] = useState(initialState);
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined
    });

    useEffect(() => {
        dispatch(getBranches({}));
    }, []);

    const getUserClocks = () => {
        const updatedState = applyMatchModeMap(filterState);
        dispatch(filterEntities({
            query: updatedState,
        }))
    }

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

    const formatDuration = (start: Date, end: Date) => {
        const duration = intervalToDuration({ start, end });
        return `${String(duration.hours).padStart(2, '0')}:${String(duration.minutes).padStart(2, '0')}:${String(duration.seconds).padStart(2, '0')}`;
    };

    const calculateTotalHours = (username: string) => {
        const userInstances = userClocks.filter(clock => clock.username === username);
        let totalSeconds = 0;

        userInstances.forEach(clock => {
            const clockIn = new Date(clock.instantClockedIn);
            const clockOut = new Date(clock.instantClockedOut);
            const duration = intervalToDuration({ start: clockIn, end: clockOut });
            totalSeconds += duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
        });

        const totalHours = Math.floor(totalSeconds / 3600);
        const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
        const totalSecs = totalSeconds % 60;

        return `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}:${String(totalSecs).padStart(2, '0')}`;
    };

    const exportExcel = async () => {
        const clocksByUser = {};
        userClocks.forEach(clock => {
            if (!clocksByUser[clock.username]) {
                clocksByUser[clock.username] = [];
            }
            clocksByUser[clock.username].push(clock);
        });

        const structuredExcelData = [];

        Object.keys(clocksByUser).forEach(username => {
            let totalSeconds = 0;
            clocksByUser[username].forEach(clock => {
                const clockIn = new Date(clock.instantClockedIn);
                const clockOut = new Date(clock.instantClockedOut);

                const duration = intervalToDuration({ start: clockIn, end: clockOut });
                const secondsThisClock = duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
                totalSeconds += secondsThisClock;

                const hours = String(duration.hours).padStart(2, '0');
                const mins = String(duration.minutes).padStart(2, '0');
                const secs = String(duration.seconds).padStart(2, '0');
                const workingHours = `${hours}:${mins}:${secs}`;

                structuredExcelData.push({
                    Name: username,
                    'Clock In': clock.instantClockedIn,
                    'Clock Out': clock.instantClockedOut,
                    'Working Hours': workingHours
                });
            });

            const totalHours = Math.floor(totalSeconds / 3600);
            const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
            const totalSecs = totalSeconds % 60;
            const formattedTotal = `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}:${String(totalSecs).padStart(2, '0')}`;

            structuredExcelData.push({
                Name: '',
                'Clock In': '',
                'Clock Out': '',
                'Working Hours': `Total Hours : ${formattedTotal}`
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
    };

    // Group user clocks by username
    const groupedUserClocks = userClocks.reduce((acc, clock) => {
        if (!acc[clock.username]) {
            acc[clock.username] = [];
        }
        acc[clock.username].push(clock);
        return acc;
    }, {} as Record<string, IUserClock[]>);

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

            {loadingReport && (
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}

            {userClocks?.length > 0 && (
                <div className="mt-2">
                    <div className="flex justify-end mb-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={exportExcel}
                        >
                            <FileSpreadsheet className="h-3 w-3" />
                            Export Excel
                        </Button>
                    </div>

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
                                                <TableCell className="text-xs">{index === 0 ? username : ''}</TableCell>
                                                <TableCell className="text-xs">
                                                    {formatDateForDisplay(clock.instantClockedIn)}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {formatDateForDisplay(clock.instantClockedOut)}
                                                </TableCell>
                                                <TableCell className="text-xs text-right">
                                                    {formatDuration(new Date(clock.instantClockedIn), new Date(clock.instantClockedOut))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50 font-semibold">
                                            <TableCell colSpan={3} className="text-xs text-right">
                                                Total Hours:
                                            </TableCell>
                                            <TableCell className="text-xs text-right">
                                                {calculateTotalHours(username)}
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </PageWrapper>
    );
}

export default EmployeeHoursReport;
