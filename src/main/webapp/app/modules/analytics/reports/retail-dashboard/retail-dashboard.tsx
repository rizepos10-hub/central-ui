import { FilterMatchMode } from 'primereact/api';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { translate } from 'react-jhipster';
import { Chart } from 'primereact/chart';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import Select from 'app/shared/components/select/select';
import { DateSlotPeriod, IRetailDashboard } from 'app/shared/model/retail-dashboard.model';
import { getReportData } from './retail-dashboard.reducer';
import { CalendarIcon, Grid, Grid2X2, Grid3X3, List, Loader2 } from 'lucide-react';
import { addMinutes, format, subMonths } from 'date-fns';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/src/main/webapp/app/lib/utils';

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

enum GridViewLabel {
    ONE = 'ONE',
    TWO = 'TWO',
    THREE = 'THREE',
    FOUR = 'FOUR'
}

/** Default range: the past month through now (rolling one calendar month). */
function getDefaultRetailDashboardDateRange() {
    const to = new Date();
    const from = subMonths(to, 1);
    return { from, to };
}

function dashboardDateToApiString(value: unknown): string {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'string') {
        return value;
    }
    return String(value);
}

const REPORT_TYPES = [
    'revenue',
    'customer-count',
    'sale-count',
    'average-items-sale',
    'gross-profit',
    'discount',
    'discount-percentage',
] as const;

const VIEW_OPTIONS = [
    { name: 'Week', value: DateSlotPeriod.WEEK },
    { name: 'Month', value: DateSlotPeriod.MONTH },
    { name: 'Year', value: DateSlotPeriod.YEAR },
];

/** Debounce delay for slots (each keystroke was firing 7 API calls). */
const SLOTS_DEBOUNCE_MS = 450;

const RetialDashboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const branches = useAppSelector(state => state.branch.entities);

    const [filterState, setFilterState] = useState(() => {
        const { from, to } = getDefaultRetailDashboardDateRange();
        return {
            ...initialState,
            filters: {
                ...initialState.filters,
                instantClockedIn: {
                    value: addMinutes(from, -from.getTimezoneOffset()),
                    matchMode: FilterMatchMode.STARTS_WITH,
                },
                instantClockedOut: {
                    value: addMinutes(to, -to.getTimezoneOffset()),
                    matchMode: FilterMatchMode.ENDS_WITH,
                },
            },
        };
    });
    const [view, setView] = useState<DateSlotPeriod>(DateSlotPeriod.WEEK);
    const [slots, setSlots] = useState<number>(12);
    const [gridView, setGridView] = useState({
        label: GridViewLabel.TWO,
        value: 6
    })
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>(() => {
        const { from, to } = getDefaultRetailDashboardDateRange();
        return { from, to };
    });
    const [data, setData] = useState<{
        revenueData?: IRetailDashboard;
        customerCountData?: IRetailDashboard;
        saleCountData?: IRetailDashboard;
        averageItemsSaleData?: IRetailDashboard;
        grossProfitData?: IRetailDashboard;
        discountData?: IRetailDashboard;
        discountPercentageData?: IRetailDashboard;
    }>({});

    const [chartsLoading, setChartsLoading] = useState(false);

    const [debouncedSlots, setDebouncedSlots] = useState(slots);
    const fetchGenerationRef = useRef(0);

    useEffect(() => {
        const t = window.setTimeout(() => setDebouncedSlots(slots), SLOTS_DEBOUNCE_MS);
        return () => window.clearTimeout(t);
    }, [slots]);

    const filterFingerprint = useMemo(() => {
        const fromVal = filterState.filters.instantClockedIn.value;
        const toVal = filterState.filters.instantClockedOut.value;
        return {
            branchId: filterState.filters.branchId.value ?? '',
            fromKey: fromVal instanceof Date ? fromVal.getTime() : String(fromVal ?? ''),
            toKey: toVal instanceof Date ? toVal.getTime() : String(toVal ?? ''),
        };
    }, [
        filterState.filters.branchId.value,
        filterState.filters.instantClockedIn.value,
        filterState.filters.instantClockedOut.value,
    ]);

    const branchesLength = branches?.length ?? 0;

    const branchOptions = useMemo(
        () => branches?.map(branch => ({ value: branch.id, label: branch.name })) ?? [],
        [branches]
    );

    const selectedBranchOption = useMemo(
        () => branchOptions.find(opt => opt.value === filterState.filters.branchId.value) ?? null,
        [branchOptions, filterState.filters.branchId.value]
    );

    useEffect(() => {
        dispatch(getBranches({ page: 0, size: 100, sort: 'id,desc' }));
    }, [dispatch]);

    useEffect(() => {
        if (branchesLength === 1 && !filterState.filters.branchId.value) {
            setFilterState(prev => ({
                ...prev,
                filters: {
                    ...prev.filters,
                    branchId: { value: branches[0].id, matchMode: FilterMatchMode.EQUALS },
                },
            }));
        }
    }, [branchesLength, branches, filterState.filters.branchId.value]);

    useEffect(() => {
        if (branchesLength === 0) return;

        const fromVal = filterState.filters.instantClockedIn.value;
        const toVal = filterState.filters.instantClockedOut.value;
        if (fromVal == null || toVal == null) return;

        const myGen = ++fetchGenerationRef.current;
        let cancelled = false;

        setChartsLoading(true);

        const resolvedBranch = filterState.filters.branchId.value ?? undefined;

        const payload: IRetailDashboard = {
            nodes: [],
            dateRange: {
                from: dashboardDateToApiString(fromVal),
                to: dashboardDateToApiString(toVal),
                dateSlot: {
                    period: view,
                    slots: debouncedSlots,
                },
            },
            ...(resolvedBranch ? { branch: resolvedBranch } : {}),
        };

        (async () => {
            const promises = REPORT_TYPES.map(async reportType => {
                const response = await dispatch(getReportData({ entity: payload, reportType }));
                return { reportType, data: response.payload };
            });

            try {
                const results = await Promise.all(promises);
                if (cancelled || myGen !== fetchGenerationRef.current) return;

                const updatedData: { [key: string]: IRetailDashboard } = {};
                results.forEach(({ reportType, data: reportData }) => {
                    const camelCaseKey = toCamelCase(reportType) + 'Data';
                    updatedData[camelCaseKey] = reportData as IRetailDashboard;
                });
                setData(updatedData);
            } catch {
                // Errors surface via global middleware
            } finally {
                if (!cancelled && myGen === fetchGenerationRef.current) {
                    setChartsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [view, debouncedSlots, branchesLength, filterFingerprint, dispatch]);

    const toCamelCase = (str: string) => {
        return str.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
    };

    const handleViewChange = (value: DateSlotPeriod) => {
        setView(value);
    };

    const handleDateChange = (from: Date | undefined, to: Date | undefined) => {
        const localStartDate = from ? addMinutes(from, -from.getTimezoneOffset()) : null;
        const localEndDate = to ? addMinutes(to, -to.getTimezoneOffset()) : null;

        setDateRange({ from, to });
        setFilterState({
            ...filterState,
            filters: {
                ...filterState.filters,
                instantClockedIn: { value: localStartDate, matchMode: FilterMatchMode.STARTS_WITH },
                instantClockedOut: { value: localEndDate, matchMode: FilterMatchMode.ENDS_WITH },
            }
        });
    };

    const handleBranchChange = (selectedOption: any) => {
        setFilterState({
            ...filterState,
            filters: {
                ...filterState.filters,
                branchId: { value: selectedOption?.value || null, matchMode: FilterMatchMode.EQUALS }
            }
        });
    };

    const chartDataMapper = (chartData: IRetailDashboard | undefined) => ({
        labels: chartData?.nodes?.map(node => node.label) || [],
        dataset: { data: chartData?.nodes?.map(node => node.y) || [] }
    });

    const getGridClass = (value: number) => {
        switch (value) {
            case 12: return 'grid-cols-1';
            case 6: return 'grid-cols-1 md:grid-cols-2';
            case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
            case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
            default: return 'grid-cols-1 md:grid-cols-2';
        }
    };

    return (
        <PageWrapper>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <div className="space-y-2">
                        <Label htmlFor="view" className="text-xs font-semibold">View</Label>
                        <div className="flex gap-1">
                            {VIEW_OPTIONS.map((v) => (
                                <Button
                                    key={v.value}
                                    type="button"
                                    variant={view === v.value ? 'default' : 'outline'}
                                    size="sm"
                                    className="h-7 text-xs flex-1"
                                    onClick={() => handleViewChange(v.value)}
                                >
                                    {v.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slots" className="text-xs font-semibold">Slots</Label>
                        <Input
                            type="number"
                            id="slots"
                            value={slots}
                            onChange={(e) => setSlots(Number(e.target.value))}
                            min={1}
                            className="h-7 text-xs"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Date Range</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!branches || branches?.length === 0}
                                    className={cn(
                                        "h-7 text-xs justify-start text-left font-normal w-full",
                                        !dateRange.from && !dateRange.to && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                    {dateRange.from && dateRange.to ? (
                                        `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`
                                    ) : (
                                        <span>{translate('orders.view.table.filters.date')}</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <div className="p-3 space-y-2">
                                    <div>
                                        <Label className="text-xs">From</Label>
                                        <Calendar
                                            mode="single"
                                            selected={dateRange.from}
                                            onSelect={(date) => handleDateChange(date, dateRange.to)}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">To</Label>
                                        <Calendar
                                            mode="single"
                                            selected={dateRange.to}
                                            onSelect={(date) => handleDateChange(dateRange.from, date)}
                                        />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="branch" className="text-xs font-semibold">Branch</Label>
                        <Select
                            options={branchOptions}
                            value={selectedBranchOption}
                            isClearable={branchesLength !== 1}
                            onChange={handleBranchChange}
                            onMenuOpen={() => {
                                dispatch(getBranches({ page: 0, size: 1000, sort: 'id,desc' }));
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Grid View</Label>
                        <div className="flex gap-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setGridView({ label: GridViewLabel.ONE, value: 12 })}
                            >
                                <List className="h-3 w-3" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setGridView({ label: GridViewLabel.TWO, value: 6 })}
                            >
                                <Grid2X2 className="h-3 w-3" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setGridView({ label: GridViewLabel.THREE, value: 4 })}
                            >
                                <Grid3X3 className="h-3 w-3" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setGridView({ label: GridViewLabel.FOUR, value: 3 })}
                            >
                                <Grid className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="relative min-h-[420px] md:min-h-[520px]">
                    <div
                        className={cn(
                            `grid ${getGridClass(gridView.value)} gap-4`,
                            chartsLoading && 'pointer-events-none select-none opacity-50'
                        )}
                        aria-busy={chartsLoading}
                    >
                        <Card>
                            <CardContent className="p-4">
                                <GeneralChart title="Revenue" {...chartDataMapper(data.revenueData)} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <GeneralChart title="Customer Count" {...chartDataMapper(data.customerCountData)} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <GeneralChart title="Sale Count" {...chartDataMapper(data.saleCountData)} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <GeneralChart title="Average Items Sale" {...chartDataMapper(data.averageItemsSaleData)} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <GeneralChart title="Gross Profit" {...chartDataMapper(data.grossProfitData)} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <GeneralChart title="Discount" {...chartDataMapper(data.discountData)} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <GeneralChart title="Discount Percentage" {...chartDataMapper(data.discountPercentageData)} />
                            </CardContent>
                        </Card>
                    </div>
                    {chartsLoading ? (
                        <div
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/75 backdrop-blur-[2px]"
                            role="status"
                            aria-live="polite"
                        >
                            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
                            <p className="text-sm font-medium text-muted-foreground">Loading dashboard…</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </PageWrapper>
    );
};

interface GeneralChartProps {
    title: string;
    labels: string[];
    dataset: { data: number[] };
}

const GeneralChart: React.FC<GeneralChartProps> = ({ title, labels, dataset }) => {
    const chartConfig = useMemo(
        () => ({
            labels,
            datasets: [
                {
                    data: dataset.data,
                    fill: true,
                    tension: 0.4,
                    borderColor: '#42A5F5',
                    backgroundColor: 'rgba(66, 165, 245, 0.2)',
                },
            ],
        }),
        [labels, dataset.data]
    );

    const options = useMemo(
        () => ({
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem: any) => `$${Number(tooltipItem.raw).toFixed(2)}`,
                    },
                },
            },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { borderDash: [8, 4] }, beginAtZero: true },
            },
            elements: {
                point: { radius: 5, hoverRadius: 7 },
            },
            responsive: true,
            maintainAspectRatio: false,
        }),
        []
    );

    return (
        <div>
            <h3 className="text-sm font-semibold mb-2">{title}</h3>
            <Chart type="line" data={chartConfig} options={options} />
        </div>
    );
};

export default RetialDashboard;
