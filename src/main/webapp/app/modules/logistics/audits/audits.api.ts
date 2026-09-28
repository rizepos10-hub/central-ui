import axios from 'axios';

import {
  IAgingReport,
  IAlert,
  IAlertFilters,
  IAccountMemo,
  ICustomerAccount,
  IDashboard,
  IInvoiceFilters,
  IInvoicePage,
  ILiveDay,
  IPayment,
  IPaymentRequest,
  IReconDay,
  IReconRunDetail,
  IStatement,
  ITrail,
} from './audits.model';

const blank = (value?: string | null) => value || undefined;

// ---------------------------------------------------------------- reconciliation

export const fetchReconciliation = async (date: string, factoryId?: string | null) =>
  (await axios.get<IReconDay>('api/wholesale/reconciliation', { params: { date, factoryId: blank(factoryId) } })).data;

export const fetchReconciliationRun = async (runId: string) => (await axios.get<IReconRunDetail>(`api/wholesale/reconciliation/runs/${runId}`)).data;

// ---------------------------------------------------------------- alerts

const alertsUrl = 'api/wholesale/alerts';

export const fetchAlerts = async (filters: IAlertFilters) =>
  (
    await axios.get<IAlert[]>(alertsUrl, {
      params: { from: filters.from, to: filters.to, status: blank(filters.status), type: blank(filters.type), factoryId: blank(filters.factoryId) },
    })
  ).data;

export const fetchOpenAlertCount = async () => (await axios.get<{ open: number }>(`${alertsUrl}/open-count`)).data.open;

export const acknowledgeAlert = async (id: string, note?: string | null) =>
  (await axios.post<IAlert>(`${alertsUrl}/${id}/acknowledge`, { note: note || null })).data;

// ---------------------------------------------------------------- customer accounts

const accountsUrl = 'api/wholesale/accounts';

export const fetchAging = async (asOf?: string | null, factoryId?: string | null, routeDefinitionId?: string | null) =>
  (
    await axios.get<IAgingReport>(`${accountsUrl}/aging`, {
      params: { asOf: blank(asOf), factoryId: blank(factoryId), routeDefinitionId: blank(routeDefinitionId) },
    })
  ).data;

export const fetchAccount = async (customerId: string, asOf?: string | null) =>
  (await axios.get<ICustomerAccount>(`${accountsUrl}/customers/${customerId}`, { params: { asOf: blank(asOf) } })).data;

export const fetchStatement = async (customerId: string, from: string, to: string) =>
  (await axios.get<IStatement>(`${accountsUrl}/customers/${customerId}/statement`, { params: { from, to } })).data;

export const receivePayment = async (customerId: string, request: IPaymentRequest) =>
  (await axios.post<IPayment>(`${accountsUrl}/customers/${customerId}/payments`, request)).data;

export const applyMemo = async (memoId: string, orderId: string, billId: string | null | undefined, amount: number) =>
  (await axios.post<IAccountMemo>(`${accountsUrl}/credit-memos/${memoId}/apply`, { orderId, billId: billId || null, amount })).data;

export const voidMemo = async (memoId: string, reason: string) =>
  (await axios.post<IAccountMemo>(`${accountsUrl}/credit-memos/${memoId}/void`, { reason })).data;

// ---------------------------------------------------------------- invoices

export const fetchInvoiceList = async (filters: IInvoiceFilters) =>
  (
    await axios.get<IInvoicePage>('api/wholesale/invoices', {
      params: {
        from: filters.from,
        to: filters.to,
        factoryId: blank(filters.factoryId),
        routeDefinitionId: blank(filters.routeDefinitionId),
        customerId: blank(filters.customerId),
        number: blank(filters.number?.trim()),
        status: blank(filters.status),
        page: filters.page,
        size: filters.size,
      },
    })
  ).data;

// ---------------------------------------------------------------- live route

export const fetchLiveRoute = async (date: string, factoryId?: string | null) =>
  (await axios.get<ILiveDay>('api/wholesale/live-route', { params: { date, factoryId: blank(factoryId) } })).data;

export const fetchTrail = async (runId: string) => (await axios.get<ITrail>(`api/wholesale/live-route/runs/${runId}/trail`)).data;

// ---------------------------------------------------------------- dashboard

export const fetchDashboard = async (from: string, to: string, factoryId?: string | null) =>
  (await axios.get<IDashboard>('api/wholesale/dashboard', { params: { from, to, factoryId: blank(factoryId) } })).data;
