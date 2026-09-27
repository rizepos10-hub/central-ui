import axios from 'axios';

import {
  CallOutcome,
  ICallListEntry,
  ICallLog,
  ICatalogItem,
  ICreditStatus,
  ICustomerNote,
  IItemHistory,
  IOrderEntryCustomer,
  IOrderFrequency,
  IRouteOverride,
  ISuggestedOrder,
  NoteStatus,
} from './sales.model';

const api = 'api/wholesale';

export const fetchOrderFrequencies = async (customerId: string) =>
  (await axios.get<IOrderFrequency[]>(`${api}/customers/${customerId}/order-frequencies`)).data;

export const saveOrderFrequencies = async (customerId: string, lines: IOrderFrequency[]) =>
  (await axios.put<IOrderFrequency[]>(`${api}/customers/${customerId}/order-frequencies`, lines)).data;

export const fetchSuggestedOrder = async (customerId: string, date: string) =>
  (await axios.get<ISuggestedOrder>(`${api}/customers/${customerId}/suggested-order`, { params: { date } })).data;

export const fetchCatalog = async () => (await axios.get<ICatalogItem[]>(`${api}/order-entry/items`)).data;

export const fetchOrderEntryCustomers = async (params: { date: string; routeId?: string; factoryId?: string; deliveryDayOnly?: boolean }) =>
  (await axios.get<IOrderEntryCustomer[]>(`${api}/order-entry/customers`, { params })).data;

export const fetchItemHistory = async (customerId: string) =>
  (await axios.get<IItemHistory[]>(`${api}/customers/${customerId}/item-history`)).data;

export const fetchCreditStatus = async (customerId: string) =>
  (await axios.get<ICreditStatus>(`${api}/customers/${customerId}/credit-status`)).data;

/** Returns null when the chosen route is the customer's default and the override was removed. */
export const saveRouteOverride = async (override: IRouteOverride) => {
  const response = await axios.post<IRouteOverride>(`${api}/route-overrides`, override);
  return response.status === 204 ? null : response.data;
};

export const placeWholesaleOrder = async (request: object) => (await axios.post<{ id: string }>('api/orders/place-order', request)).data;

export const fetchCallList = async (params: { date: string; routeId?: string; factoryId?: string; includeDone?: boolean }) =>
  (await axios.get<ICallListEntry[]>(`${api}/call-list`, { params })).data;

export const fetchCallListCount = async (date: string) =>
  (await axios.get<{ pending: number }>(`${api}/call-list/count`, { params: { date } })).data.pending;

export const logCall = async (call: { customerId: string; deliveryDate: string; outcome: CallOutcome; followUpAt?: string | null; notes?: string | null; orderId?: string | null }) =>
  (await axios.post<ICallLog>(`${api}/call-logs`, call)).data;

export const fetchCallLogs = async (customerId: string, date: string) =>
  (await axios.get<ICallLog[]>(`${api}/customers/${customerId}/call-logs`, { params: { date } })).data;

export const createCustomerNote = async (note: ICustomerNote) => (await axios.post<ICustomerNote>(`${api}/customer-notes`, note)).data;

export const fetchCustomerNotes = async (params: { status?: NoteStatus; urgent?: boolean }) =>
  (await axios.get<ICustomerNote[]>(`${api}/customer-notes`, { params })).data;

export const fetchNotesForCustomer = async (customerId: string) =>
  (await axios.get<ICustomerNote[]>(`${api}/customers/${customerId}/notes`)).data;

export const resolveCustomerNote = async (id: string) => (await axios.post<ICustomerNote>(`${api}/customer-notes/${id}/resolve`)).data;

/** Online registers with the open till of each, for choosing where wholesale orders are placed. */
export const fetchOrderRegisters = async () => {
  const registers = (await axios.get<any[]>('api/branch-registries/by-type', { params: { type: 'ONLINE' } })).data ?? [];
  const ids = registers.map(r => r.id).filter(Boolean);
  const tills = ids.length ? (await axios.post<any[]>('api/tills/open/by-register-ids?status=OPENED', ids)).data ?? [] : [];
  return registers.map(r => ({
    id: r.id as string,
    name: (r.name as string) ?? 'Online register',
    branchId: r.branch?.id as string,
    branchName: (r.branch?.name as string) ?? 'Branch',
    tillId: (tills.find(t => t?.registry?.id === r.id && t?.status === 'OPENED')?.id as string) ?? null,
  }));
};

export type OrderRegister = Awaited<ReturnType<typeof fetchOrderRegisters>>[number];
