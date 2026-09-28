import axios from 'axios';

import {
  ICloseHandover,
  ICreditFilters,
  IHandoverDetail,
  IHandoverRow,
  IMemoDetail,
  IMemoRow,
  IReleaseResult,
  IRunDetail,
  IRunSummary,
  IStaleReport,
  IStopDetail,
} from './delivery.model';

const runsUrl = 'api/wholesale/delivery-runs';
const handoversUrl = 'api/wholesale/cash-handovers';

const blank = (value?: string | null) => value || undefined;

// ---------------------------------------------------------------- delivery runs

export const fetchRuns = async (date: string, factoryId?: string | null) =>
  (await axios.get<IRunSummary[]>(runsUrl, { params: { date, factoryId: blank(factoryId) } })).data;

export const fetchRun = async (id: string) => (await axios.get<IRunDetail>(`${runsUrl}/${id}`)).data;

export const fetchStop = async (runId: string, orderId: string) => (await axios.get<IStopDetail>(`${runsUrl}/${runId}/stops/${orderId}`)).data;

export const releaseRuns = async (date: string, factoryId?: string | null, routeDefinitionId?: string | null) =>
  (await axios.post<IReleaseResult>(`${runsUrl}/release`, { date, factoryId: factoryId || null, routeDefinitionId: routeDefinitionId || null })).data;

export const changeDriver = async (runId: string, driverUserId: string | null) =>
  (await axios.put<IRunDetail>(`${runsUrl}/${runId}/driver`, { driverUserId })).data;

export const unlockRun = async (runId: string) => (await axios.post<IRunDetail>(`${runsUrl}/${runId}/unlock`)).data;

// ---------------------------------------------------------------- cash handover

export const fetchHandovers = async (date: string, factoryId?: string | null) =>
  (await axios.get<IHandoverRow[]>(handoversUrl, { params: { date, factoryId: blank(factoryId) } })).data;

export const fetchHandover = async (runId: string) => (await axios.get<IHandoverDetail>(`${handoversUrl}/runs/${runId}`)).data;

export const closeHandover = async (runId: string, request: ICloseHandover) =>
  (await axios.post<IHandoverDetail>(`${handoversUrl}/runs/${runId}/close`, request)).data;

// ---------------------------------------------------------------- credit memos and stale returns

export const fetchCreditMemos = async (filters: ICreditFilters) =>
  (
    await axios.get<IMemoRow[]>('api/wholesale/credit-memos', {
      params: {
        from: filters.from,
        to: filters.to,
        customerId: blank(filters.customerId),
        routeDefinitionId: blank(filters.routeDefinitionId),
        status: blank(filters.status),
        reason: blank(filters.reason),
      },
    })
  ).data;

export const fetchCreditMemo = async (id: string) => (await axios.get<IMemoDetail>(`api/wholesale/credit-memos/${id}`)).data;

export const fetchStaleReturns = async (filters: ICreditFilters) =>
  (
    await axios.get<IStaleReport>('api/wholesale/stale-returns', {
      params: {
        from: filters.from,
        to: filters.to,
        routeDefinitionId: blank(filters.routeDefinitionId),
        customerId: blank(filters.customerId),
        itemId: blank(filters.itemId),
      },
    })
  ).data;
