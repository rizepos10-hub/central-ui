import axios from 'axios';

import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { buildCustomerSearchGroups } from 'app/shared/util/customer-search-filter-util';

import { ICustomerWholesaleProfile, IWholesaleCustomer, IWholesaleRouteDefinition } from './wholesale-customer.model';

const apiUrl = 'api/wholesale/customers';

export interface WholesaleCustomerQuery {
  active?: boolean;
  routeId?: string;
  factoryId?: string;
  search?: string;
  page: number;
  size: number;
}

export const fetchWholesaleCustomers = async ({ active, routeId, factoryId, search, page, size }: WholesaleCustomerQuery) => {
  const params: Record<string, string | number | boolean> = { page, size };
  if (active != null) params.active = active;
  if (routeId) params.routeId = routeId;
  if (factoryId) params.factoryId = factoryId;
  if (search?.trim()) params.search = search.trim();
  const response = await axios.get<IWholesaleCustomer[]>(apiUrl, { params });
  const total = Number(response.headers?.['x-total-count']);
  return { items: response.data, total: Number.isFinite(total) ? total : response.data.length };
};

export const fetchWholesaleCustomer = async (customerId: string) => (await axios.get<IWholesaleCustomer>(`${apiUrl}/${customerId}`)).data;

export const saveWholesaleProfile = async (customerId: string, profile: ICustomerWholesaleProfile) =>
  (await axios.put<IWholesaleCustomer>(`${apiUrl}/${customerId}/profile`, profile)).data;

export const fetchRouteDefinitions = async () => (await axios.get<IWholesaleRouteDefinition[]>('api/wholesale/route-definitions')).data;

/** Retail customers by name or business name, for turning one into a wholesale customer. */
export const searchRetailCustomers = async (text: string) => {
  const query = applyMatchModeMap({
    first: 0,
    rows: 10,
    page: 0,
    sortField: null,
    sortOrder: null,
    query: '',
    filters: {},
    groups: buildCustomerSearchGroups(text),
  });
  const found = (await axios.post<any[]>('api/_search/customers', query)).data ?? [];
  return found.map(
    (customer): IWholesaleCustomer => ({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      businessName: customer.businessDetails?.businessName ?? null,
      accountNumber: customer.accountNumber,
      phone: customer.phone,
      mobileNumber: customer.mobileNumber,
      email: customer.email,
    }),
  );
};
