export type LogisticsOrderStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface LogisticsOrder {
  id: string;
  reference: string;
  customer: string;
  warehouse: string;
  destination: string;
  routeId: string;
  status: LogisticsOrderStatus;
  eta: string;
  items: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface LogisticsRoute {
  id: string;
  name: string;
  driver: string;
  truck: string;
  status: LogisticsOrderStatus;
  distance: string;
  estimatedTime: string;
  path: Array<{ lat: number; lng: number }>;
  color: string;
}

export const logisticsOrders: LogisticsOrder[] = [
  {
    id: 'ORD-1001',
    reference: 'WH-DEL-01',
    customer: 'Central Market',
    warehouse: 'North Warehouse',
    destination: 'Central Market, 13th Avenue',
    routeId: 'route-1',
    status: 'IN_TRANSIT',
    eta: '12:35 PM',
    items: 22,
    priority: 'HIGH',
  },
  {
    id: 'ORD-1002',
    reference: 'WH-DEL-02',
    customer: 'City Bistro',
    warehouse: 'North Warehouse',
    destination: 'City Bistro, Main Street',
    routeId: 'route-1',
    status: 'PENDING',
    eta: '01:10 PM',
    items: 14,
    priority: 'MEDIUM',
  },
  {
    id: 'ORD-1003',
    reference: 'WH-DEL-03',
    customer: 'Seaside Grocers',
    warehouse: 'South Warehouse',
    destination: 'Seaside Grocers, Ocean Drive',
    routeId: 'route-2',
    status: 'IN_TRANSIT',
    eta: '12:50 PM',
    items: 30,
    priority: 'HIGH',
  },
  {
    id: 'ORD-1004',
    reference: 'WH-DEL-04',
    customer: 'Harvest Table',
    warehouse: 'South Warehouse',
    destination: 'Harvest Table, Elm Street',
    routeId: 'route-3',
    status: 'PENDING',
    eta: '01:45 PM',
    items: 18,
    priority: 'LOW',
  },
  {
    id: 'ORD-1005',
    reference: 'WH-DEL-05',
    customer: 'Moonlight Cafe',
    warehouse: 'North Warehouse',
    destination: 'Moonlight Cafe, 5th Avenue',
    routeId: 'route-1',
    status: 'PENDING',
    eta: '01:30 PM',
    items: 11,
    priority: 'MEDIUM',
  },
];

export const logisticsRoutes: LogisticsRoute[] = [
  {
    id: 'route-1',
    name: 'North Hub — Downtown',
    driver: 'Maya Patel',
    truck: 'Truck 814',
    status: 'IN_TRANSIT',
    distance: '18 km',
    estimatedTime: '13 mins',
    color: '#22c55e',
    path: [
      { lat: 42.312, lng: -83.036 },
      { lat: 42.315, lng: -83.025 },
      { lat: 42.320, lng: -83.015 },
    ],
  },
  {
    id: 'route-2',
    name: 'South Hub — Waterfront',
    driver: 'Emilio Ruiz',
    truck: 'Truck 903',
    status: 'IN_TRANSIT',
    distance: '26 km',
    estimatedTime: '19 mins',
    color: '#0ea5e9',
    path: [
      { lat: 42.295, lng: -83.019 },
      { lat: 42.285, lng: -83.010 },
      { lat: 42.275, lng: -83.001 },
    ],
  },
  {
    id: 'route-3',
    name: 'South Hub — Uptown',
    driver: 'Jordan Lee',
    truck: 'Truck 721',
    status: 'PENDING',
    distance: '32 km',
    estimatedTime: '27 mins',
    color: '#f97316',
    path: [
      { lat: 42.295, lng: -83.041 },
      { lat: 42.300, lng: -83.050 },
      { lat: 42.307, lng: -83.060 },
    ],
  },
];

