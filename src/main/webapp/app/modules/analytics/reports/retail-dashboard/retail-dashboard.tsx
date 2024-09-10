import { FilterMatchMode } from 'primereact/api';
import { Calendar } from 'primereact/calendar'
import React, { useState, useEffect } from 'react'
import { translate } from 'react-jhipster';
import { Chart } from 'primereact/chart';
import { Card, Col, Row } from 'reactstrap';
import { SelectButton } from 'primereact/selectbutton';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from 'app/entities/branch/branch.reducer';
import Select from 'react-select';

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


const RetialDashboard = () => {
    const dispatch = useAppDispatch();

    const branches = useAppSelector(state => state.branch.entities);

    const [filterState, setFilterState] = useState(initialState);
    const [view, setView] = useState('Month');

    const views = [
        { name: 'Day', value: 'Day' },
        { name: 'Week', value: 'Week' },
        { name: 'Month', value: 'Month' }
    ];

    useEffect(() => {
        getEntities({
            page: 0,
            size: 100,
            sort: `id,desc`,
        })
    }, [])

    const handleViewChange = (e) => {
        setView(e.value);
        // You would also update your data fetching/processing here to match the new view
    };

    // Dummy data functions, these should be replaced with actual data fetching logic
    const getDataForView = (viewType) => {
        switch (viewType) {
            case 'Day':
                return {
                    labels: ['00:00', '06:00', '12:00', '18:00', '24:00'],
                    dataset: { data: [10, 20, 15, 25, 10] }
                };
            case 'Week':
                return {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    dataset: { data: [120, 200, 150, 250, 200, 300, 250] }
                };
            case 'Month':
                return {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    dataset: { data: [1000, 1200, 1100, 1300] }
                };
            default:
                return {
                    labels: ['May', 'June', 'July', 'Aug', 'Sep'],
                    dataset: { data: [200000, 150000, 50000, 50000, 0] }
                };
        }
    };

    const revenueData = getDataForView(view);
    const customerCountData = getDataForView(view);

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
        const startDate = e.value[0];
        const endDate = e.value[1];
        setFilterState({
            ...filterState,
            filters: {
                ...filterState.filters,
                instantClockedIn: { value: startDate, matchMode: FilterMatchMode.STARTS_WITH },
                instantClockedOut: { value: endDate, matchMode: FilterMatchMode.ENDS_WITH },
            }
        });
    }

    return (
        <div className='d-flex flex-column gap-5'>
            <div className='d-flex gap-2'>
                <div className={'d-flex flex-column gap-2 align-items-center justify-content-center w-100'}>
                    <label htmlFor="date">View</label>
                    <SelectButton
                        value={view}
                        onChange={handleViewChange}
                        optionLabel="name"
                        options={views}
                        style={{
                            width: '12rem',
                        }}
                    />
                </div>
                <div className={'d-flex flex-column gap-2 align-items-center justify-content-center w-100'}>
                    <label htmlFor="date">Date Range</label>
                    <Calendar
                        style={{ width: '12rem' }}
                        // disabled={}
                        value={calenderValue}
                        id={'date'}
                        onChange={handleDateChange}
                        selectionMode="range"
                        placeholder={translate('orders.view.table.filters.date')}
                    />
                </div>
                <div className={'d-flex flex-column gap-2 align-items-center justify-content-center w-100'}>
                    <label htmlFor="date">Branch</label>
                    <Select
                        options={branches?.map(branch => ({ value: branch.id, label: branch.name }))}
                        isClearable
                        styles={{
                            control: (baseStyles) => ({
                                ...baseStyles,
                                maxWidth: '12rem'
                            }),
                        }}
                        className="w-100 d-flex align-items-center justify-content-center"
                        onMenuOpen={() => {
                            dispatch(
                                getEntities({
                                    page: 0,
                                    size: 1000,
                                    sort: `id,desc`,
                                })
                            );
                        }}
                    />
                </div>
            </div>
            <div className='d-flex flex-column gap-5'>
                <Row>
                    <Col md={3}>
                        <Card>
                            <GeneralChart title="Revenue" labels={revenueData.labels} dataset={revenueData.dataset} />
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card>
                            <GeneralChart title="Customer Count" labels={customerCountData.labels} dataset={customerCountData.dataset} />
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card>
                            <GeneralChart title="Revenue" labels={revenueData.labels} dataset={revenueData.dataset} />
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card>
                            <GeneralChart title="Customer Count" labels={customerCountData.labels} dataset={customerCountData.dataset} />
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Col md={3}>
                        <Card>
                            <GeneralChart title="Revenue" labels={revenueData.labels} dataset={revenueData.dataset} />
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card>
                            <GeneralChart title="Customer Count" labels={customerCountData.labels} dataset={customerCountData.dataset} />
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card>
                            <GeneralChart title="Revenue" labels={revenueData.labels} dataset={revenueData.dataset} />
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card>
                            <GeneralChart title="Customer Count" labels={customerCountData.labels} dataset={customerCountData.dataset} />
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    )
}

const GeneralChart = ({ title, labels, dataset }) => {
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
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label(tooltipItem) {
                        return `$${tooltipItem.raw.toLocaleString()}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                }
            },
            y: {
                grid: {
                    borderDash: [8, 4]
                },
                beginAtZero: true
            }
        },
        elements: {
            point: {
                radius: 5,
                hoverRadius: 7
            }
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

export default RetialDashboard