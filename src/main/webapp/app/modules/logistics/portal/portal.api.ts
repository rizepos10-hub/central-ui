import axios from 'axios';

import {
  IPortalAccess,
  IPortalAccessRequest,
  IPortalCatalog,
  IPortalDay,
  IPortalFeedOrder,
  IPortalLine,
  IPortalMe,
  IPortalOrder,
  IPortalTotals,
} from './portal.model';

const api = 'api/wholesale/portal';

export const fetchMe = async () => (await axios.get<IPortalMe>(`${api}/me`)).data;

export const changePassword = async (password: string) => {
  await axios.post(`${api}/password`, { password });
};

export const fetchDays = async () => (await axios.get<IPortalDay[]>(`${api}/days`)).data ?? [];

export const fetchCatalog = async (date: string) => (await axios.get<IPortalCatalog>(`${api}/catalog`, { params: { date } })).data;

export const fetchOrders = async () => (await axios.get<IPortalOrder[]>(`${api}/orders`)).data ?? [];

export const previewOrder = async (date: string, lines: IPortalLine[]) => (await axios.post<IPortalTotals>(`${api}/preview`, { date, lines })).data;

export const placeOrder = async (date: string, lines: IPortalLine[]) => (await axios.post<IPortalOrder>(`${api}/orders`, { date, lines })).data;

export const cancelOrder = async (orderId: string) => {
  await axios.delete(`${api}/orders/${orderId}`);
};

export const fetchPortalFeed = async (days?: number) =>
  (await axios.get<IPortalFeedOrder[]>('api/wholesale/portal-orders', { params: days ? { days } : {} })).data ?? [];

export const fetchPortalAccess = async (customerId: string) =>
  (await axios.get<IPortalAccess>(`api/wholesale/customers/${customerId}/portal-access`)).data;

export const savePortalAccess = async (customerId: string, request: IPortalAccessRequest) =>
  (await axios.put<IPortalAccess>(`api/wholesale/customers/${customerId}/portal-access`, request)).data;
