import axios from 'axios';

import { IOrderPage, IOrderRow, IOrderSearch } from './order-search.model';

const api = 'api/wholesale';

export const searchOrders = async (search: IOrderSearch) => (await axios.get<IOrderPage>(`${api}/order-search`, { params: search })).data;

export const fetchUnfulfilledCount = async () => (await axios.get<{ count: number }>(`${api}/order-search/unfulfilled-count`)).data.count;

export const fetchUnfulfilledOrders = async (customerId: string) =>
  (await axios.get<IOrderRow[]>(`${api}/customers/${customerId}/unfulfilled-orders`)).data;

export const cancelOrder = async (orderId: string) => (await axios.post<IOrderRow>(`${api}/order-search/${orderId}/cancel`)).data;
