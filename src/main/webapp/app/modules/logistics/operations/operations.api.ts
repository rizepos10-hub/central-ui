import axios from 'axios';

import {
  ActionChannel,
  IAllocationResult,
  IFactoryBoardRow,
  IFactoryOrderDetail,
  IFactoryOrderSummary,
  IInvoiceIssueResult,
  IInvoiceRow,
  ILineAvailability,
  ILoadingList,
  IOrderLineChange,
  IOrderSheetRow,
  IProductAllocation,
  IProductCustomers,
  IProductionMatrix,
  ProductionStatus,
} from './operations.model';

const sheetsUrl = 'api/wholesale/order-sheets';
const factoryOrdersUrl = 'api/wholesale/factory-orders';

// ---------------------------------------------------------------- order sheets

export const fetchOrderSheets = async (date: string, factoryId?: string | null) =>
  (await axios.get<IOrderSheetRow[]>(sheetsUrl, { params: { date, factoryId: factoryId || undefined } })).data;

export const submitOrderSheet = async (routeId: string, date: string, note?: string) =>
  (await axios.post<IOrderSheetRow>(`${sheetsUrl}/${routeId}/${date}/submit`, { note: note || null })).data;

export const approveOrderSheet = async (routeId: string, date: string, note?: string) =>
  (await axios.post<IOrderSheetRow>(`${sheetsUrl}/${routeId}/${date}/approve`, { note: note || null })).data;

export const reopenOrderSheet = async (routeId: string, date: string, reason: string) =>
  (await axios.post<IOrderSheetRow>(`${sheetsUrl}/${routeId}/${date}/reopen`, { note: reason })).data;

// ---------------------------------------------------------------- production and loading lists

export const fetchProduction = async (date: string, factoryId: string) =>
  (await axios.get<IProductionMatrix>('api/wholesale/production', { params: { date, factoryId } })).data;

export const fetchLoadingLists = async (date: string, factoryId?: string | null, routeId?: string | null) =>
  (await axios.get<ILoadingList[]>('api/wholesale/loading-lists', { params: { date, factoryId: factoryId || undefined, routeId: routeId || undefined } }))
    .data;

// ---------------------------------------------------------------- factory orders

export const fetchFactoryBoard = async (date: string) => (await axios.get<IFactoryBoardRow[]>(`${factoryOrdersUrl}/board`, { params: { date } })).data;

export const fetchFactoryInbox = async (from?: string, factoryId?: string | null) =>
  (await axios.get<IFactoryOrderSummary[]>(`${factoryOrdersUrl}/inbox`, { params: { from, factoryId: factoryId || undefined } })).data;

export const fetchFactoryOrder = async (id: string) => (await axios.get<IFactoryOrderDetail>(`${factoryOrdersUrl}/${id}`)).data;

export const fetchFactoryOrderCustomers = async (id: string) => (await axios.get<IProductCustomers[]>(`${factoryOrdersUrl}/${id}/customers`)).data;

export const sendFactoryOrder = async (factoryId: string, date: string, note?: string) =>
  (await axios.post<IFactoryOrderDetail>(`${factoryOrdersUrl}/send`, { factoryId, date, note: note || null })).data;

export const approveFactoryOrder = async (id: string, version: number, channel: ActionChannel, note?: string) =>
  (await axios.post<IFactoryOrderDetail>(`${factoryOrdersUrl}/${id}/approve`, { version, channel, note: note || null })).data;

export const returnFactoryOrder = async (id: string, version: number, channel: ActionChannel, lines: ILineAvailability[], note?: string) =>
  (await axios.post<IFactoryOrderDetail>(`${factoryOrdersUrl}/${id}/return`, { version, channel, lines, note: note || null })).data;

export const updateProduction = async (id: string, channel: ActionChannel, line?: { itemId: string; variantId?: string | null; status: ProductionStatus }) =>
  (await axios.post<IFactoryOrderDetail>(`${factoryOrdersUrl}/${id}/production`, { channel, ...line })).data;

export const updateRouteProgress = async (id: string, channel: ActionChannel, routeId: string, ready: boolean, dispatched: boolean) =>
  (await axios.post<IFactoryOrderDetail>(`${factoryOrdersUrl}/${id}/route-progress`, { channel, routeId, ready, dispatched })).data;

export const allocateShortages = async (id: string, version: number, products: IProductAllocation[], note?: string) =>
  (await axios.post<IAllocationResult>(`${factoryOrdersUrl}/${id}/allocate`, { version, products, note: note || null })).data;

export const amendFactoryOrder = async (id: string, version: number, changes: IOrderLineChange[], note?: string) =>
  (await axios.post<IFactoryOrderDetail>(`${factoryOrdersUrl}/${id}/amend`, { version, changes, note: note || null })).data;

// ---------------------------------------------------------------- invoices

export const fetchInvoices = async (id: string) => (await axios.get<IInvoiceRow[]>(`${factoryOrdersUrl}/${id}/invoices`)).data;

export const issueInvoices = async (id: string, orderIds?: string[]) =>
  (await axios.post<IInvoiceIssueResult>(`${factoryOrdersUrl}/${id}/invoices`, { orderIds: orderIds?.length ? orderIds : null })).data;
