import { FilterMatchMode } from 'primereact/api';
import React, { useState, useEffect } from 'react';
import { translate } from 'react-jhipster';
import { Chart } from 'primereact/chart';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import Select from 'app/shared/components/select/select';
import { DateSlotPeriod, IRetailDashboard } from 'app/shared/model/retail-dashboard.model';
import { getReportData } from './retail-dashboard.reducer';
import { List, Grid2X2, Grid3X3, Grid } from 'lucide-react';
import { addMinutes, format } from 'date-fns';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
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

const RetialDashboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const branches = useAppSelector(state => state.branch.entities);

    const [filterState, setFilterState] = useState(initialState);
    const [view, setView] = useState<DateSlotPeriod>(DateSlotPeriod.MONTH);
    const [slots, setSlots] = useState<number>(12);
    const [gridView, setGridView] = useState({
        label: GridViewLabel.TWO,
        value: 6
    })
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
    const [data, setData] = useState<{
        revenueData?: IRetailDashboard;
        customerCountData?: IRetailDashboard;
        saleCountData?: IRetailDashboard;
        averageItemsSaleData?: IRetailDashboard;
        grossProfitData?: IRetailDashboard;
        discountData?: IRetailDashboard;
        discountPercentageData?: IRetailDashboard;
    }>({});

    const views = [
        { name: 'Week', value: DateSlotPeriod.WEEK },
        { name: 'Month', value: DateSlotPeriod.MONTH },
        { name: 'Year', value: DateSlotPeriod.YEAR },
    ];

    useEffect(() => {
        dispatch(getBranches({ page: 0, size: 100, sort: 'id,desc' }));
    }, [dispatch]);

    useEffect(() => {
        fetchData();
    }, [view, filterState.filters, branches, slots]);

    const fetchData = async () => {
        if (branches?.length === 0) return
        const payload: IRetailDashboard = {
            nodes: [],
            dateRange: {
                from: filterState.filters.instantClockedIn.value || '2024-01-01T00:00:00.00Z',
                to: filterState.filters.instantClockedOut.value || '2024-11-10T00:00:00.00Z',
                dateSlot: {
                    period: view,
                    slots
                }
            },
            branch: filterState.filters.branchId.value || branches?.[0]?.id
        };

        const reportTypes = [
            'revenue',
            'customer-count',
            'sale-count',
            'average-items-sale',
            'gross-profit',
            'discount',
            'discount-percentage'
        ];

        const promises = reportTypes.map(async (type) => {
            const response = await dispatch(getReportData({ entity: payload, reportType: type }));
            return { type, data: response.payload };
        });

        const results = await Promise.all(promises);
        const updatedData: { [key: string]: IRetailDashboard } = {};

        results.forEach(({ type, data }) => {
            const camelCaseKey = toCamelCase(type) + 'Data';
            updatedData[camelCaseKey] = data as IRetailDashboard;
        });
        setData(updatedData);
    };

    const toCamelCase = (str: string) => {
        return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
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
                            {views.map((v) => (
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
                            options={branches?.map(branch => ({ value: branch.id, label: branch.name }))}
                            isClearable
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

                <div className={`grid ${getGridClass(gridView.value)} gap-4`}>
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
    const data = {
        labels,
        datasets: [
            {
                data: dataset.data,
                fill: true,
                tension: 0.4,
                borderColor: '#42A5F5',
                backgroundColor: 'rgba(66, 165, 245, 0.2)'
            }
        ]
    };

    const options = {
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (tooltipItem: any) => `$${tooltipItem.raw.toLocaleString()}`
                }
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { borderDash: [8, 4] }, beginAtZero: true }
        },
        elements: {
            point: { radius: 5, hoverRadius: 7 }
        },
        responsive: true,
        maintainAspectRatio: false
    };

    return (
        <div>
            <h3 className="text-sm font-semibold mb-2">{title}</h3>
            <Chart type="line" data={data} options={options} />
        </div>
    );
};

export default RetialDashboard;
