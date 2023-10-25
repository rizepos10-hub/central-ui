import React, { useContext, useEffect, useRef, useState } from 'react';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Rating } from 'primereact/rating';

import { Tooltip } from 'primereact/tooltip';
import { ChartData, ChartOptions } from 'chart.js';
import type { ChartDataState, ChartOptionsState, Demo } from '../../sidebar/types/types';
import {LayoutContext} from "app/shared/sidebar/context/layoutcontext";
import axios from "axios";
import {
  fetchOrdersByYear,
  fetchRecentSales,
  fetchTopCategories,
  fetchTopFields,
  fetchTopItems
} from "app/modules/analytics/api";
import {format, subWeeks} from "date-fns";
import {Spinner} from "reactstrap";

export default function Home() {

  const [products, setProducts] = useState<any>([]);
  const [chartOptions, setChartOptions] = useState<ChartOptionsState>({});
  const [bestSellers, setBestSellers] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [topCategories, setTopCategories] = useState([])




  const [fromDate, setFromDate] = useState(format(subWeeks(new Date(), 1), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [topFields, setTopFields]:any = useState({})
  const [loading, setLoading] = useState({
    chartsData: false,
    topFieldsData: false,
    topItemsData: false,
    recentSalesData: false,
  });





  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, index) => currentYear - index);


  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [yearlyOrders, setYearlyOrders] :any= useState([]);




  const [weeks] = useState([
    {
      label: 'Year',
      value: 0,
      data: [
        [65, 59, 80, 81, 56, 55, 40],
        [28, 48, 40, 19, 86, 27, 90]
      ]
    },

  ]);
  const [chartData, setChartData] = useState<ChartDataState>({});
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const { layoutConfig } = useContext(LayoutContext);
  const dt = useRef<DataTable<any>>(null);
  const knobValue = 90;

  const exportCSV = () => {
    dt.current?.exportCSV();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  const onWeekChange = (e: DropdownChangeEvent) => {
    let newBarData = { ...chartData.barData };
    (newBarData.datasets as any)[0].data = weeks[e.value].data[0];
    (newBarData.datasets as any)[1].data[1] = weeks[e.value].data[1];
    setSelectedWeek(e.value);
    setChartData((prevState: ChartDataState) => ({
      ...prevState,
      barData: { ...prevState.barData, datasets: newBarData.datasets || [] }
    }));
  };
  const onGlobalFilterChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    (_filters['global'] as any).value = value;

    console.log(value)
    setFilters(_filters);
    setGlobalFilterValue(value);
    console.log(recentSales, 'recenthere')
  };

  const initFilters = () => {
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      name: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
      },
      'country.name': {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
      },
      representative: { value: null, matchMode: FilterMatchMode.IN },
      date: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }]
      },
      balance: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }]
      },
      status: {
        operator: FilterOperator.OR,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }]
      },
      activity: { value: null, matchMode: FilterMatchMode.BETWEEN },
      verified: { value: null, matchMode: FilterMatchMode.EQUALS }
    });
    setGlobalFilterValue('');
  };

  const nameBodyTemplate = (rowData: any) => {
    return (
      <>
        <span className="p-column-title">Name</span>
        <span className="font-medium text-lg mb-1 font-bold" key={rowData.id}>{rowData.itemName} <span className="text-sm" key={rowData.id}>({rowData.variantName})</span></span>

      </>
    );
  };

  const priceBodyTemplate = (rowData: Demo.Product) => {
    return (
      <>
        <span className="p-column-title">Price</span>
        <p className="m-3" key={rowData.id}>{(rowData.currentPrice as number).toFixed(2)}</p>
      </>
    );
  };

  const categoryBodyTemplate = (rowData: Demo.Product) => {
    return (
      <>
        <span className="p-column-title">Category</span>
        {rowData.categories[0]?.name}
      </>
    );
  };

  const statusBodyTemplate = (rowData: Demo.Product) => {
    const badgeClass = rowData.inventoryStatus?.toLowerCase();
    return (
      <>
        <span className="p-column-title">Status</span>
        <span className={' product-badge status-' + badgeClass}>{rowData.inventoryStatus ?? 'INSTOCK'  }</span>
      </>
    );
  };

  const searchBodyTemplate = () => {
    return (
      <>
        <Button type="button" icon="pi pi-search" className="p-button-outlined p-button-rounded"></Button>
      </>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {

        setLoading({
          chartsData: true,
          topFieldsData: true,
          topItemsData: true,
          recentSalesData: true,
        });


        const topCategoriesData = await fetchTopCategories();
        setTopCategories(topCategoriesData);



        const ordersData = await fetchOrdersByYear(selectedYear);
        setYearlyOrders(ordersData);
        setLoading({ ...loading, chartsData: false });


        const topFieldsData = await fetchTopFields(fromDate, toDate);
        setTopFields(topFieldsData);
        setLoading({ ...loading, topFieldsData: false });


        const topItemsData = await fetchTopItems(5);
        setBestSellers(topItemsData);
        setLoading({ ...loading, topItemsData: false });


        const recentSalesData = await fetchRecentSales();
        setRecentSales(recentSalesData);
        setLoading({ ...loading, recentSalesData: false });

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);


  // useEffect(() => {
  //
  //   const fetchData = async () => {
  //     console.log('clicked1', selectedYear)
  //     try {
  //
  //       const ordersData = await fetchOrdersByYear(selectedYear);
  //       setYearlyOrders(ordersData);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     }
  //   };
  //
  //   fetchData();
  // },[selectedYear])


  useEffect(() => {
    // ProductService.getProductsSmall().then((data) => setProducts(data));
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
    const pieData: ChartData = {
      labels: topCategories?.map(category => category.categoryName),
      datasets: [
        {
          data: topCategories.map(category => category.amount),
          backgroundColor: [documentStyle.getPropertyValue('--primary-700'), documentStyle.getPropertyValue('--primary-400'), documentStyle.getPropertyValue('--primary-100')],
          hoverBackgroundColor: [documentStyle.getPropertyValue('--primary-600'), documentStyle.getPropertyValue('--primary-300'), documentStyle.getPropertyValue('--primary-200')]
        }
      ]
    };



    const pieOptions: ChartOptions = {
      animation: {
        duration: 0
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor,
            usePointStyle: true,
            font: {
              weight: '700'
            },
            padding: 28
          },
          position: 'bottom'
        }
      }
    };
    const fixedColors = [
      '#E91E63', // Pink
      '#03A9F4', // Light Blue
      '#607D8B', // Gray
      '#9C27B0', // Purple
      '#2196F3', // Blue
      '#00BCD4', // Cyan
      '#8BC34A', // Light Green
      '#FFC107', // Yellow
      '#4CAF50', // Green
      '#FF5733', // Red
      '#FF9800', // Orange
      '#673AB7', // Deep Purple
      '#009688', // Teal
      '#CDDC39', // Lime
      '#FFEB3B', // Amber
      '#9E9E9E', // Grey
      '#795548', // Brown
      '#FF4081', // Pink
      '#FF5722', // Deep Orange
      '#9E9E9E', // Grey

    ];
    const barData:any = {
      labels: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      datasets: yearlyOrders.map((branchData, index) => ({
        label: branchData.branchName,
        data: branchData.monthlyOrders.map((order) => order.ordersCount),
        fill: false,
        borderColor:  fixedColors[index % fixedColors.length],
        tension: 0.4
      }))
    };

    const barOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder
          }
        },
        y: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder
          }
        }
      }
    };
    setChartOptions({
      barOptions,
      pieOptions
    });
    setChartData({
      barData,
      pieData
    });
    initFilters();
  }, [layoutConfig,topCategories,yearlyOrders]);



  const onYearChange =  (event) => {
    const selectedYearValue = event.value;
    setSelectedYear(selectedYearValue);


  };


  return (
    <div className="grid">
      <div className="col-12 md:col-6 xl:col-3">
        <div className="card h-full">
          <span className="font-semibold text-lg">Sales</span>
          <div className="flex justify-content-between align-items-start mt-3">
            {
              loading.topFieldsData ? (
                <Spinner />
                )
                :
                (
                  <div className="w-6">
                    <span className="text-4xl font-bold text-900">{topFields.sales}</span>
                    <div className="text-green-500">
                      <span className="font-medium">+12%</span>
                      <i className="pi pi-arrow-up text-xs ml-2"></i>
                    </div>
                  </div>
                )
              }
            <div className="w-6">
              <svg width="100%" viewBox="0 0 258 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1 93.9506L4.5641 94.3162C8.12821 94.6817 15.2564 95.4128 22.3846 89.6451C29.5128 83.8774 36.641 71.6109 43.7692 64.4063C50.8974 57.2018 58.0256 55.0592 65.1538 58.9268C72.2821 62.7945 79.4103 72.6725 86.5385 73.5441C93.6667 74.4157 100.795 66.2809 107.923 65.9287C115.051 65.5765 122.179 73.0068 129.308 66.8232C136.436 60.6396 143.564 40.8422 150.692 27.9257C157.821 15.0093 164.949 8.97393 172.077 6.43766C179.205 3.9014 186.333 4.86425 193.462 12.0629C200.59 19.2616 207.718 32.696 214.846 31.0487C221.974 29.4014 229.103 12.6723 236.231 5.64525C243.359 -1.38178 250.487 1.29325 254.051 2.63076L257.615 3.96827"
                  style={{ strokeWidth: '2px', stroke: 'var(--primary-color)' }}
                  stroke="10"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="col-12 md:col-6 xl:col-3">
        <div className="card h-full">
          <span className="font-semibold text-lg">Revenue</span>
          <div className="flex justify-content-between align-items-start mt-3">
            {
              loading.topFieldsData ? (
                  <Spinner />
                )
                :
                (
            <div className="w-6">
              <span className="text-4xl font-bold text-900">{topFields?.revenue?.toFixed(2)}</span>
              <div className="text-green-500">
                <span className="font-medium">+20%</span>
                <i className="pi pi-arrow-up text-xs ml-2"></i>
              </div>
            </div>
                )
            }
            <div className="w-6">
              <svg width="100%" viewBox="0 0 115 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1 35.6498L2.24444 32.4319C3.48889 29.214 5.97778 22.7782 8.46667 20.3627C10.9556 17.9473 13.4444 19.5522 15.9333 21.7663C18.4222 23.9803 20.9111 26.8035 23.4 30.6606C25.8889 34.5176 28.3778 39.4085 30.8667 37.2137C33.3556 35.0189 35.8444 25.7383 38.3333 26.3765C40.8222 27.0146 43.3111 37.5714 45.8 38.9013C48.2889 40.2311 50.7778 32.3341 53.2667 31.692C55.7556 31.0499 58.2444 37.6628 60.7333 39.4617C63.2222 41.2607 65.7111 38.2458 68.2 34.9205C70.6889 31.5953 73.1778 27.9597 75.6667 23.5955C78.1556 19.2313 80.6444 14.1385 83.1333 13.8875C85.6222 13.6365 88.1111 18.2272 90.6 20.2425C93.0889 22.2578 95.5778 21.6977 98.0667 18.8159C100.556 15.9341 103.044 10.7306 105.533 7.37432C108.022 4.01806 110.511 2.50903 111.756 1.75451L113 1"
                  style={{ strokeWidth: '1px', stroke: 'var(--primary-color)' }}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="col-12 md:col-6 xl:col-3">
        <div className="card h-full">
          <span className="font-semibold text-lg">Visitors</span>
          <div className="flex justify-content-between align-items-start mt-3">
            {
              loading.topFieldsData ? (
                  <Spinner />
                )
                :
                (
            <div className="w-6">
              <span className="text-4xl font-bold text-900">{topFields?.visitors}</span>
              <div className="text-pink-500">
                <span className="font-medium">+24%</span>
                <i className="pi pi-arrow-down text-xs ml-2"></i>
              </div>
            </div>
                )
            }
            <div className="w-6">
              <svg width="100%" viewBox="0 0 115 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1.5 1L2.74444 2.61495C3.98889 4.2299 6.47778 7.4598 8.96667 9.07151C11.4556 10.6832 13.9444 10.6767 16.4333 11.6127C18.9222 12.5487 21.4111 14.4271 23.9 16.6724C26.3889 18.9178 28.8778 21.5301 31.3667 20.1977C33.8556 18.8652 36.3444 13.5878 38.8333 11.3638C41.3222 9.13969 43.8111 9.96891 46.3 11.9894C48.7889 14.0099 51.2778 17.2217 53.7667 16.2045C56.2556 15.1873 58.7444 9.9412 61.2333 11.2783C63.7222 12.6155 66.2111 20.5359 68.7 21.4684C71.1889 22.401 73.6778 16.3458 76.1667 16.0009C78.6556 15.6561 81.1444 21.0217 83.6333 24.2684C86.1222 27.515 88.6111 28.6428 91.1 27.4369C93.5889 26.2311 96.0778 22.6916 98.5667 22.7117C101.056 22.7317 103.544 26.3112 106.033 29.7859C108.522 33.2605 111.011 36.6302 112.256 38.3151L113.5 40"
                  style={{ strokeWidth: '1px', stroke: 'var(--pink-500)' }}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="col-12 md:col-6 xl:col-3">
        <div className="card h-full">
          <span className="font-semibold text-lg">Stock</span>
          <div className="flex justify-content-between align-items-start mt-3">
            {
              loading.topFieldsData ? (
                  <Spinner />
                )
                :
                (
            <div className="w-6">
              <span className="text-4xl font-bold text-900">{topFields?.stock}</span>
              <div className="text-green-500">
                <span className="font-medium">+30%</span>
                <i className="pi pi-arrow-up text-xs ml-2"></i>
              </div>
            </div>
                )
            }
            <div className="w-6">
              <svg width="100%" viewBox="0 0 103 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0.5 22.7464L2 23C3.40972 23.1524 5.42201 18.0581 8.95833 16.9517C12 16 14.5972 23.4341 17.4167 20.4309C20.2361 17.4277 19 9.50002 25.5 9.50002C31 9.50002 30 4.00002 33 4.00002C35.8428 4.00002 40 13 42.7917 11.0655C47.3252 7.92391 48.4306 14.016 51.25 11.4384C54.0694 8.86075 56.5 12.5 59.7083 8.22399C63.3559 3.36252 65.4888 0.499985 68.5 0.499985C73 0.499985 73.5 7.00001 78.5 6.5C84.9677 5.85322 82.2931 2.58281 85 1.50002C87.5 0.500003 90.7222 11.8656 93.5417 8.93639C97.5 4.00002 99.1806 7.12226 100.59 7.6798L102 8.23734"
                  stroke="#6366F1"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

    <div className="col-12 xl:col-9">
        <div className="card h-auto">
          <div className="flex align-items-start justify-content-between mb-6">
            <span className="text-900 text-xl font-semibold">Revenue Overview</span>
            <Dropdown options={years.map(year => ({label: year.toString(), value: year}))}
                      defaultValue={selectedYear} value={selectedYear} className="w-10rem" optionLabel="label"
                      onChange={onYearChange}/>
          </div>
          {loading.chartsData ? (
            <Spinner />
          ) :  <Chart type="line" data={chartData.barData} options={chartOptions.barOptions} height={'350px'}/>
          }
        </div>
      </div>

        <div className="col-12 xl:col-3">
          <div className="card h-auto">
            <div className="text-900 text-xl font-semibold mb-6">Sales by Category</div>
            {loading.chartsData ? (
            <Spinner />
            ) : (
            <Chart height="368px" type="pie" data={chartData.pieData} options={chartOptions.pieOptions}></Chart>
             )}
          </div>
        </div>

      <div className="col-12 lg:col-8">
        <div className="card">
          <div className="flex flex-column md:flex-row md:align-items-start md:justify-content-between mb-3">
            <div className="text-900 text-xl font-semibold mb-3 md:mb-0">Recent Sales</div>
            <div className="inline-flex align-items-center">
                            <span className="p-input-icon-left flex-auto">
                                <i className="pi pi-search"></i>
                                <InputText type={'text'} value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Search" style={{ borderRadius: '2rem' }} className="w-full" />
                            </span>
              <Tooltip target=".export-target-button" />
              <Button icon="pi pi-upload" className="p-button-rounded mx-3 export-target-button" data-pr-tooltip="Export" onClick={exportCSV}></Button>
            </div>
          </div>
          <DataTable ref={dt} value={recentSales}
                     paginator  rows={5}
                     className="datatable-responsive"
                     globalFilter={globalFilterValue}
                     emptyMessage="No products found."
                     loading={loading.recentSalesData}
                     responsiveLayout="scroll">
            <Column  field="itemName" header="Name" sortable body={nameBodyTemplate} headerStyle={{ minWidth: '12rem' }} />
            <Column field="category[0].name" header="Category" sortable body={categoryBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
            <Column field="currentPrice" header="Price" body={priceBodyTemplate} sortable headerStyle={{ minWidth: '10rem' }} />
            <Column field="inventoryStatus" header="Status" body={statusBodyTemplate} sortable headerStyle={{ minWidth: '10rem' }} />
            {/* <Column body={searchBodyTemplate} style={{ textAlign: 'center' }} /> */}
          </DataTable>
        </div>
      </div>
      <div className="col-12 lg:col-4" >
        <div className="card h-full">
          <div className="text-900 text-xl font-semibold mb-3">Top Products</div>
          { loading.topItemsData ? (
            <ul className="list-none p-0 m-0">
            <Spinner />
            </ul>
          )
            : (
              <ul className="list-none p-0 m-0">
            {bestSellers?.map((product, i) => {
              return (
                <li key={i} className="flex align-items-center justify-content-between p-3">
                  <div className="inline-flex align-items-center">
                    <img
                      src={
                        product?.variantAttachments && product?.variantAttachments.length > 0
                          ? product?.variantAttachments[0]?.url
                          : product?.itemAttachments && product?.itemAttachments.length > 0
                            ? product?.itemAttachments[0]?.url
                            : null
                      }
                      alt={product.name}
                      width="75"
                      className="shadow-2 flex-shrink-0"
                      style={{objectFit: 'contain', maxHeight: '75px'}}
                    />

                    <div className="flex flex-column ml-3">
                      <span className="font-medium text-lg mb-1 font-bold">{product.itemName} <span
                        className="text-sm">({product.variantName})</span></span>
                      <Rating value={product.rating} readOnly cancel={false} onIconProps={{style: {fontSize: '12px'}}}
                              offIconProps={{style: {fontSize: '12px'}}}></Rating>
                    </div>
                  </div>
                  <span
                    className="ml-auto font-semibold text-xl p-text-secondary">${(product.currentPrice).toFixed(2)}</span>
                </li>
              );
            })}
          </ul>
            )}
        </div>
      </div>
    </div>
  );
}
