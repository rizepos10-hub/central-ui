import { FilterMatchMode } from 'primereact/api';
import { Calendar } from 'primereact/calendar';
import React, { useState, useEffect } from 'react';
import { translate } from 'react-jhipster';
import { Chart } from 'primereact/chart';
import { Card, Col, Row } from 'reactstrap';
import { SelectButton } from 'primereact/selectbutton';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import Select from 'react-select';
import { DateSlotPeriod, IRetailDashboard } from 'app/shared/model/retail-dashboard.model';
import { getReportData } from './retail-dashboard.reducer';
import { MdGridOn, MdGridView, MdList } from 'react-icons/md';
import { TfiLayoutGrid4Alt } from "react-icons/tfi";
import { addMinutes } from 'date-fns';
import { InputNumber } from 'primereact/inputnumber';

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
            const camelCaseKey = toCamelCase(type) + 'Data';  // Convert to camelCase and append "Data"
            updatedData[camelCaseKey] = data as IRetailDashboard;
        });
        setData(updatedData);
    };


    const toCamelCase = (str: string) => {
        return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    };

    const handleViewChange = (e: any) => {
        setView(e.value);
    };

    const calenderValue =
        filterState.filters?.instantClockedIn.value && !filterState.filters.instantClockedOut.value
            ?
            [filterState.filters?.instantClockedIn.value, null]
            :
            filterState.filters?.instantClockedIn.value && filterState.filters.instantClockedOut.value
                ?
                [filterState.filters?.instantClockedIn.value, filterState.filters?.instantClockedOut.value]
                :
                null;

    const handleDateChange = (e: any) => {
        const startDate = e.value[0] ? new Date(e.value[0]) : null;
        const endDate = e.value[1] ? new Date(e.value[1]) : null;

        // Adjust the timezone using date-fns addMinutes
        const localStartDate = startDate ? addMinutes(startDate, -startDate.getTimezoneOffset()) : null;
        const localEndDate = endDate ? addMinutes(endDate, -endDate.getTimezoneOffset()) : null;


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


    return (
        <div className='d-flex flex-column gap-5'>
            <div className='d-flex gap-2'>
                <div className='d-flex flex-column gap-2 align-items-center justify-content-center w-100'>
                    <div className='d-flex flex-column gap-2'>
                        <label htmlFor="view">View</label>
                        <SelectButton
                            value={view}
                            onChange={handleViewChange}
                            optionLabel="name"
                            options={views}
                            style={{ width: '12rem' }}
                        />
                    </div>
                </div>
                <div className='d-flex flex-column gap-2 align-items-center justify-content-center w-100'>
                    <div className='d-flex flex-column gap-2'>
                        <label htmlFor="slots">Slots</label>
                        <InputNumber
                            value={slots}
                            onValueChange={(e) => setSlots(e.value)}
                            min={1}
                        />
                    </div>
                </div>
                <div className='d-flex flex-column gap-2 align-items-center justify-content-center w-100'>
                    <label htmlFor="date">Date Range</label>
                    <Calendar
                        style={{ width: '12rem' }}
                        disabled={!branches || branches?.length === 0}
                        value={calenderValue}
                        id={'date'}
                        onChange={handleDateChange}
                        selectionMode="range"
                        placeholder={translate('orders.view.table.filters.date')}
                    />
                </div>
                <div className='d-flex flex-column gap-2 align-items-center justify-content-center w-100'>
                    <label htmlFor="branch">Branch</label>
                    <Select
                        options={branches?.map(branch => ({ value: branch.id, label: branch.name }))}
                        isClearable
                        styles={{ control: (baseStyles) => ({ ...baseStyles, maxWidth: '12rem' }) }}
                        className="w-100 d-flex align-items-center justify-content-center"
                        onChange={handleBranchChange}
                        onMenuOpen={() => {
                            dispatch(getBranches({ page: 0, size: 1000, sort: 'id,desc' }));
                        }}
                    />
                </div>
                <div className='d-flex flex-column gap-2 align-items-center justify-content-center w-100'>
                    <label htmlFor="branch">Grid View</label>

                    <div className='d-flex gap-2'>
                        <MdList
                            onClick={() => setGridView({
                                label: GridViewLabel.ONE,
                                value: 12
                            })}
                            size={20}
                            style={{
                                cursor: 'pointer'
                            }}
                        />
                        <MdGridView
                            onClick={() => setGridView({
                                label: GridViewLabel.TWO,
                                value: 6
                            })}
                            size={20}
                            style={{
                                cursor: 'pointer'
                            }}
                        />
                        <MdGridOn
                            onClick={() => setGridView({
                                label: GridViewLabel.THREE,
                                value: 4
                            })}
                            size={20}
                            style={{
                                cursor: 'pointer'
                            }}
                        />
                        <TfiLayoutGrid4Alt
                            onClick={() => setGridView({
                                label: GridViewLabel.FOUR,
                                value: 3
                            })}
                            size={20}
                            style={{
                                cursor: 'pointer'
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className='d-flex flex-column gap-5'>
                <Row>
                    <Col md={gridView.value}>
                        <Card>
                            <GeneralChart title="Revenue" {...chartDataMapper(data.revenueData)} />
                        </Card>
                    </Col>
                    <Col md={gridView.value}>
                        <Card>
                            <GeneralChart title="Customer Count" {...chartDataMapper(data.customerCountData)} />
                        </Card>
                    </Col>
                    <Col md={gridView.value}>
                        <Card>
                            <GeneralChart title="Sale Count" {...chartDataMapper(data.saleCountData)} />
                        </Card>
                    </Col>
                    <Col md={gridView.value}>
                        <Card>
                            <GeneralChart title="Average Items Sale" {...chartDataMapper(data.averageItemsSaleData)} />
                        </Card>
                    </Col>
                    <Col md={gridView.value}>
                        <Card>
                            <GeneralChart title="Gross Profit" {...chartDataMapper(data.grossProfitData)} />
                        </Card>
                    </Col>
                    <Col md={gridView.value}>
                        <Card>
                            <GeneralChart title="Discount" {...chartDataMapper(data.discountData)} />
                        </Card>
                    </Col>
                    <Col md={gridView.value}>
                        <Card>
                            <GeneralChart title="Discount Percentage" {...chartDataMapper(data.discountPercentageData)} />
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
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
            <h3>{title}</h3>
            <Chart type="line" data={data} options={options} />
        </div>
    );
};

export default RetialDashboard;
