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
import { IRetailDashboard } from 'app/shared/model/retail-dashboard.model';
import { getReportData } from './retail-dashboard.reducer';

interface FilterState {
    first: number;
    rows: number;
    page: number;
    sortField: string | null;
    sortOrder: string | null;
    filters: {
        branchId: { value: string | null; matchMode: string };
        instantClockedIn: { value: string | null; matchMode: string };
        instantClockedOut: { value: string | null; matchMode: string };
    };
}

const initialState: FilterState = {
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

const RetialDashboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const branches = useAppSelector(state => state.branch.entities);

    const [filterState, setFilterState] = useState(initialState);
    const [branch, setBranch] = useState<string>('');
    const [view, setView] = useState<string>('Month');
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
        { name: 'Day', value: 'Day' },
        { name: 'Week', value: 'Week' },
        { name: 'Month', value: 'Month' }
    ];

    useEffect(() => {
        dispatch(getBranches({ page: 0, size: 100, sort: 'id,desc' }));
    }, [dispatch]);

    useEffect(() => {
        fetchData();
    }, [view, filterState.filters, branches]);

    const fetchData = async () => {
        console.log(branches)
        if(branches?.length === 0) return
        const payload: IRetailDashboard = {
            nodes: [],
            dateRange: {
                from: filterState.filters.instantClockedIn.value || '2024-01-01T00:00:00.00Z',
                to: filterState.filters.instantClockedOut.value || '2024-11-10T00:00:00.00Z'
            },
            branch: filterState.filters.branchId.value || branches?.[0]?.id
        };
        console.log(1)

        const reportTypes = [
            'revenue',
            'customer-count',
            'sale-count',
            'average-items-sale',
            'gross-profit',
            'discount',
            'discount-percentage'
        ];
        console.log(1)

        const promises = reportTypes.map(async (type) => {
            const response = await dispatch(getReportData({ entity: payload, reportType: type }));
            return { type, data: response.payload };
        });
        console.log(1)

        const results = await Promise.all(promises);
        console.log(1)
        const updatedData: { [key: string]: IRetailDashboard } = {};
        console.log(1)
        results.forEach(({ type, data }) => {
            updatedData[`${type}Data`] = data as IRetailDashboard;
        });
        console.log(1)
        setData(updatedData);
    };

    const handleViewChange = (e: any) => {
        setView(e.value);
    };

    const handleDateChange = (e: any) => {
        const startDate = e.value[0] ? e.value[0].toISOString() : null;
        const endDate = e.value[1] ? e.value[1].toISOString() : null;

        setFilterState({
            ...filterState,
            filters: {
                ...filterState.filters,
                instantClockedIn: { value: startDate, matchMode: FilterMatchMode.STARTS_WITH },
                instantClockedOut: { value: endDate, matchMode: FilterMatchMode.ENDS_WITH }
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

    const calendarValue = filterState.filters.instantClockedIn.value && filterState.filters.instantClockedOut.value
        ? [new Date(filterState.filters.instantClockedIn.value), new Date(filterState.filters.instantClockedOut.value)]
        : null;


    const chartDataMapper = (chartData: IRetailDashboard | undefined) => ({
        labels: chartData?.nodes?.map(node => node.label) || [],
        dataset: { data: chartData?.nodes?.map(node => node.y) || [] }
    });

    return (
        <div className='d-flex flex-column gap-5'>
            <div className='d-flex gap-2'>
                <div className='d-flex flex-column gap-2 align-items-center justify-content-center w-100'>
                    <label htmlFor="view">View</label>
                    <SelectButton
                        value={view}
                        onChange={handleViewChange}
                        optionLabel="name"
                        options={views}
                        style={{ width: '12rem' }}
                    />
                </div>
                <div className='d-flex flex-column gap-2 align-items-center justify-content-center w-100'>
                    <label htmlFor="date">Date Range</label>
                    <Calendar
                        style={{ width: '12rem' }}
                        value={calendarValue}
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
            </div>
            <div className='d-flex flex-column gap-5'>
                <Row>
                    <Col md={3}>
                        <Card>
                            <GeneralChart title="Revenue" {...chartDataMapper(data.revenueData)} />
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card>
                            <GeneralChart title="Customer Count" {...chartDataMapper(data.customerCountData)} />
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card>
                            <GeneralChart title="Sale Count" {...chartDataMapper(data.saleCountData)} />
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card>
                            <GeneralChart title="Average Items Sale" {...chartDataMapper(data.averageItemsSaleData)} />
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card>
                            <GeneralChart title="Gross Profit" {...chartDataMapper(data.grossProfitData)} />
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card>
                            <GeneralChart title="Discount" {...chartDataMapper(data.discountData)} />
                        </Card>
                    </Col>
                    <Col md={3}>
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
                ...dataset,
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
