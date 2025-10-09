import React, { useContext, useEffect, useState } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from '@/components/ui/chart';
import type { ChartDataState, ChartOptionsState, Demo } from '../../sidebar/types/types';
import {LayoutContext} from "app/shared/sidebar/context/layoutcontext";
import {
  fetchOrdersByYear,
  fetchRecentSales,
  fetchTopCategories,
  fetchTopFields,
  fetchTopItems
} from "app/modules/analytics/api";
import {format, subWeeks} from "date-fns";
import {translate, Translate} from "react-jhipster";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/src/main/webapp/app/lib/utils';
import { Download, Search, ArrowUp, ArrowDown, ArrowUpDown, Star, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export default function Home() {

  const [products, setProducts] = useState<any>([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [lineChartData, setLineChartData] = useState<any[]>([]);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [lineChartConfig, setLineChartConfig] = useState<ChartConfig>({});
  const [pieChartConfig, setPieChartConfig] = useState<ChartConfig>({});



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
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const { layoutConfig } = useContext(LayoutContext);

  const exportCSV = () => {
    const headers = ['Name', 'Category', 'Price', 'Status'];
    const rows = recentSales.map((item: any) => [
      `${item.itemName} (${item.variantName})`,
      item.categories?.[0]?.name || '',
      item.currentPrice?.toFixed(2) || '',
      item.inventoryStatus || 'INSTOCK'
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'recent-sales.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  const onGlobalFilterChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setGlobalFilterValue(e.target.value);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'itemName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            {translate('home.table.name')}
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />}
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="font-medium text-base">
          {row.original.itemName} <span className="text-sm text-muted-foreground">({row.original.variantName})</span>
        </span>
      ),
    },
    {
      accessorFn: (row) => row.categories?.[0]?.name,
      id: 'category',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            {translate('home.table.category')}
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />}
          </Button>
        );
      },
      cell: ({ row }) => row.original.categories?.[0]?.name || '-',
    },
    {
      accessorKey: 'currentPrice',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            {translate('home.table.price')}
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />}
          </Button>
        );
      },
      cell: ({ row }) => <span>${row.original.currentPrice?.toFixed(2) || '0.00'}</span>,
    },
    {
      accessorKey: 'inventoryStatus',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            {translate('home.table.status')}
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />}
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.original.inventoryStatus || 'INSTOCK';
        const statusLower = status.toLowerCase();
        return (
          <Badge
            variant={statusLower === 'instock' ? 'default' : statusLower === 'lowstock' ? 'secondary' : 'destructive'}
          >
            {status}
          </Badge>
        );
      },
    },
  ];

  const table = useReactTable({
    data: recentSales,
    columns,
    state: {
      sorting,
      globalFilter: globalFilterValue,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilterValue,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const setAllLoading = (value) => {
    setLoading((prev) => ({
      ...prev,
      chartsData: value,
      topFieldsData: value,
      topItemsData: value,
      recentSalesData: value,
    }));
  };

  const setSingleLoading = (index, value) => {
    const keys = ['chartsData', 'topFieldsData', 'topItemsData', 'recentSalesData'];
    setLoading((prev) => ({
      ...prev,
      [keys[index]]: value,
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setAllLoading(true);

        const promises = [
          fetchTopCategories(),
          fetchTopFields(fromDate, toDate),
          fetchTopItems(5),
          fetchRecentSales(),
        ];

        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            switch (index) {
              case 0:
                setTopCategories(result.value);
                break;
              case 1:
                setTopFields(result.value);
                break;
              case 2:
                setBestSellers(result.value);
                break;
              case 3:
                setRecentSales(result.value);
                break;
              default:
                break;
            }
          } else {
            console.error('Error fetching data:', result.reason);
          }
          setSingleLoading(index, false);
        });

      } finally {
        setAllLoading(false);
      }
    };

    fetchData();
  }, []);
  useEffect(() => {
    const fetchYearData = async () => {
      setLoading({...loading, chartsData: true})
      const ordersData = await fetchOrdersByYear(selectedYear);
      setYearlyOrders(ordersData);
      setLoading({ ...loading, chartsData: false });
    };

    fetchYearData();
  }, [selectedYear])


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
    const fixedColors = [
      '#E91E63', '#03A9F4', '#607D8B', '#9C27B0', '#2196F3',
      '#00BCD4', '#8BC34A', '#FFC107', '#4CAF50', '#FF5733',
      '#FF9800', '#673AB7', '#009688', '#CDDC39', '#FFEB3B',
      '#9E9E9E', '#795548', '#FF4081', '#FF5722', '#9E9E9E'
    ];

    // Prepare line chart data for Recharts
    if (yearlyOrders.length > 0) {
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const lineData = months.map((month, monthIndex) => {
        const dataPoint: any = { month };
        yearlyOrders.forEach((branchData) => {
          dataPoint[branchData.branchName] = branchData.monthlyOrders[monthIndex]?.ordersCount || 0;
        });
        return dataPoint;
      });
      setLineChartData(lineData);

      // Create config for line chart
      const lineConfig: ChartConfig = {};
      yearlyOrders.forEach((branchData, index) => {
        lineConfig[branchData.branchName] = {
          label: branchData.branchName,
          color: fixedColors[index % fixedColors.length]
        };
      });
      setLineChartConfig(lineConfig);
    }

    // Prepare pie chart data for Recharts
    if (topCategories.length > 0) {
      const pieData = topCategories.map((category) => ({
        name: category.categoryName,
        value: category.amount
      }));
      setPieChartData(pieData);

      const pieConfig: ChartConfig = {};
      topCategories.forEach((category, index) => {
        pieConfig[category.categoryName] = {
          label: category.categoryName,
          color: fixedColors[index % fixedColors.length]
        };
      });
      setPieChartConfig(pieConfig);
    }
  }, [layoutConfig, topCategories, yearlyOrders]);



  const onYearChange = (value: string) => {
    setSelectedYear(parseInt(value));
  };


  return (
    <PageWrapper>
      <div className="grid grid-cols-1 gap-2">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-2">
            <span className="font-semibold text-sm block mb-1"><Translate contentKey={'home.sales'}/></span>
            <div className="flex justify-between items-start">
              {loading.topFieldsData ? (
                <Skeleton className="h-12 w-32" />
              ) : (
                <div className="flex-1">
                  <span className="text-2xl font-bold block">{topFields.sales}</span>
                  <div className="text-green-500 mt-2 flex items-center">
                    <span className="font-medium">+12%</span>
                    <ArrowUp className="ml-2 h-3 w-3" />
                  </div>
                </div>
              )}
              <div className="flex-1">
                <svg width="100%" viewBox="0 0 258 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1 93.9506L4.5641 94.3162C8.12821 94.6817 15.2564 95.4128 22.3846 89.6451C29.5128 83.8774 36.641 71.6109 43.7692 64.4063C50.8974 57.2018 58.0256 55.0592 65.1538 58.9268C72.2821 62.7945 79.4103 72.6725 86.5385 73.5441C93.6667 74.4157 100.795 66.2809 107.923 65.9287C115.051 65.5765 122.179 73.0068 129.308 66.8232C136.436 60.6396 143.564 40.8422 150.692 27.9257C157.821 15.0093 164.949 8.97393 172.077 6.43766C179.205 3.9014 186.333 4.86425 193.462 12.0629C200.59 19.2616 207.718 32.696 214.846 31.0487C221.974 29.4014 229.103 12.6723 236.231 5.64525C243.359 -1.38178 250.487 1.29325 254.051 2.63076L257.615 3.96827"
                    style={{ strokeWidth: '2px', stroke: 'hsl(var(--primary))' }}
                    stroke="10"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2">
            <span className="font-semibold text-sm block mb-1"><Translate contentKey={'home.revenue'}/></span>
            <div className="flex justify-between items-start">
              {loading.topFieldsData ? (
                <Skeleton className="h-12 w-32" />
              ) : (
                <div className="flex-1">
                  <span className="text-2xl font-bold block">{topFields?.revenue?.toFixed(2)}</span>
                  <div className="text-green-500 mt-2 flex items-center">
                    <span className="font-medium">+20%</span>
                    <ArrowUp className="ml-2 h-3 w-3" />
                  </div>
                </div>
              )}
              <div className="flex-1">
                <svg width="100%" viewBox="0 0 115 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1 35.6498L2.24444 32.4319C3.48889 29.214 5.97778 22.7782 8.46667 20.3627C10.9556 17.9473 13.4444 19.5522 15.9333 21.7663C18.4222 23.9803 20.9111 26.8035 23.4 30.6606C25.8889 34.5176 28.3778 39.4085 30.8667 37.2137C33.3556 35.0189 35.8444 25.7383 38.3333 26.3765C40.8222 27.0146 43.3111 37.5714 45.8 38.9013C48.2889 40.2311 50.7778 32.3341 53.2667 31.692C55.7556 31.0499 58.2444 37.6628 60.7333 39.4617C63.2222 41.2607 65.7111 38.2458 68.2 34.9205C70.6889 31.5953 73.1778 27.9597 75.6667 23.5955C78.1556 19.2313 80.6444 14.1385 83.1333 13.8875C85.6222 13.6365 88.1111 18.2272 90.6 20.2425C93.0889 22.2578 95.5778 21.6977 98.0667 18.8159C100.556 15.9341 103.044 10.7306 105.533 7.37432C108.022 4.01806 110.511 2.50903 111.756 1.75451L113 1"
                    style={{ strokeWidth: '1px', stroke: 'hsl(var(--primary))' }}
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2">
            <span className="font-semibold text-sm block mb-1"><Translate contentKey={'home.visitors'}/></span>
            <div className="flex justify-between items-start">
              {loading.topFieldsData ? (
                <Skeleton className="h-12 w-32" />
              ) : (
                <div className="flex-1">
                  <span className="text-2xl font-bold block">{topFields?.visitors}</span>
                  <div className="text-pink-500 mt-2 flex items-center">
                    <span className="font-medium">+24%</span>
                    <ArrowDown className="ml-2 h-3 w-3" />
                  </div>
                </div>
              )}
              <div className="flex-1">
                <svg width="100%" viewBox="0 0 115 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1.5 1L2.74444 2.61495C3.98889 4.2299 6.47778 7.4598 8.96667 9.07151C11.4556 10.6832 13.9444 10.6767 16.4333 11.6127C18.9222 12.5487 21.4111 14.4271 23.9 16.6724C26.3889 18.9178 28.8778 21.5301 31.3667 20.1977C33.8556 18.8652 36.3444 13.5878 38.8333 11.3638C41.3222 9.13969 43.8111 9.96891 46.3 11.9894C48.7889 14.0099 51.2778 17.2217 53.7667 16.2045C56.2556 15.1873 58.7444 9.9412 61.2333 11.2783C63.7222 12.6155 66.2111 20.5359 68.7 21.4684C71.1889 22.401 73.6778 16.3458 76.1667 16.0009C78.6556 15.6561 81.1444 21.0217 83.6333 24.2684C86.1222 27.515 88.6111 28.6428 91.1 27.4369C93.5889 26.2311 96.0778 22.6916 98.5667 22.7117C101.056 22.7317 103.544 26.3112 106.033 29.7859C108.522 33.2605 111.011 36.6302 112.256 38.3151L113.5 40"
                    style={{ strokeWidth: '1px', stroke: 'rgb(236 72 153)' }}
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2">
            <span className="font-semibold text-sm block mb-1"><Translate contentKey={'home.stock'}/></span>
            <div className="flex justify-between items-start">
              {loading.topFieldsData ? (
                <Skeleton className="h-12 w-32" />
              ) : (
                <div className="flex-1">
                  <span className="text-2xl font-bold block">{topFields?.stock}</span>
                  <div className="text-green-500 mt-2 flex items-center">
                    <span className="font-medium">+30%</span>
                    <ArrowUp className="ml-2 h-3 w-3" />
                  </div>
                </div>
              )}
              <div className="flex-1">
                <svg width="100%" viewBox="0 0 103 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M0.5 22.7464L2 23C3.40972 23.1524 5.42201 18.0581 8.95833 16.9517C12 16 14.5972 23.4341 17.4167 20.4309C20.2361 17.4277 19 9.50002 25.5 9.50002C31 9.50002 30 4.00002 33 4.00002C35.8428 4.00002 40 13 42.7917 11.0655C47.3252 7.92391 48.4306 14.016 51.25 11.4384C54.0694 8.86075 56.5 12.5 59.7083 8.22399C63.3559 3.36252 65.4888 0.499985 68.5 0.499985C73 0.499985 73.5 7.00001 78.5 6.5C84.9677 5.85322 82.2931 2.58281 85 1.50002C87.5 0.500003 90.7222 11.8656 93.5417 8.93639C97.5 4.00002 99.1806 7.12226 100.59 7.6798L102 8.23734"
                    stroke="#6366F1"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-2">
        <div className="xl:col-span-2">
          <Card>
            <CardContent className="p-2">
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm font-semibold"><Translate contentKey={'home.revenueOverview'}/></span>
                <Select value={selectedYear.toString()} onValueChange={onYearChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {loading.chartsData ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <ChartContainer config={lineChartConfig} className="h-[350px] w-full">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    {Object.keys(lineChartConfig).map((key) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={lineChartConfig[key].color}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-2">
              <div className="text-sm font-semibold mb-1"><Translate contentKey={'home.salesByCategory'}/></div>
              {loading.chartsData ? (
                <Skeleton className="h-[368px] w-full" />
              ) : (
                <ChartContainer config={pieChartConfig} className="h-[368px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(pieChartConfig)[index]?.color || '#000'} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Sales Table and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-2">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-3">
                <div className="text-xl font-semibold"><Translate contentKey={'home.recentSales'}/></div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={globalFilterValue}
                      onChange={onGlobalFilterChange}
                      placeholder={translate('home.table.search')}
                      className="pl-8 rounded-full"
                    />
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-full" onClick={exportCSV}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{translate("home.table.export")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {loading.recentSalesData ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                              <TableHead key={header.id}>
                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map(row => (
                            <TableRow key={row.id}>
                              {row.getVisibleCells().map(cell => (
                                <TableCell key={cell.id}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                              <Translate contentKey={'home.table.emptyMessage'}/>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                      {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of{' '}
                      {table.getFilteredRowModel().rows.length} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-2">
              <div className="text-xl font-semibold mb-4"><Translate contentKey={'home.topProducts'}/></div>
              {loading.topItemsData ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-[75px] w-[75px] rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-3">
                  {bestSellers?.map((product, i) => (
                    <li key={i} className="flex items-center justify-between p-3 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            product?.variantAttachments && product?.variantAttachments.length > 0
                              ? product?.variantAttachments[0]?.url
                              : product?.itemAttachments && product?.itemAttachments.length > 0
                                ? product?.itemAttachments[0]?.url
                                : '/content/images/placeholder.png'
                          }
                          alt={product.name}
                          width="75"
                          height="75"
                          className="rounded shadow-sm object-contain"
                          style={{maxHeight: '75px'}}
                        />
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-base">
                            {product.itemName} <span className="text-sm text-muted-foreground">({product.variantName})</span>
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, starIndex) => (
                              <Star
                                key={starIndex}
                                className={cn(
                                  "h-3 w-3",
                                  starIndex < (product.rating || 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-muted text-muted"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="font-semibold text-lg text-muted-foreground">
                        ${(product.currentPrice).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </PageWrapper>
  );
}
