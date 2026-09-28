import axios from 'axios';

import {
  IAssignableCategory,
  IAssignedCustomer,
  IBranchRef,
  ICategoryAssignment,
  ICustomerAssignment,
  ISalesman,
  ISalesmanDraft,
  assignedCustomerName,
} from './salesman.model';

const api = 'api/wholesale';

export const fetchSalesmen = async (page: number, size: number) => {
  const response = await axios.get<ISalesman[]>(`${api}/salesmen`, { params: { page, size, sort: 'firstName,asc' } });
  const total = Number(response.headers?.['x-total-count']);
  return { items: response.data, total: Number.isFinite(total) ? total : response.data.length };
};

export const saveSalesman = async (id: string | undefined, payload: ISalesmanDraft) =>
  id ? (await axios.put<ISalesman>(`${api}/salesmen/${id}`, payload)).data : (await axios.post<ISalesman>(`${api}/salesmen`, payload)).data;

export const fetchBranches = async () =>
  ((await axios.get<IBranchRef[]>('api/branches', { params: { page: 0, size: 1000, sort: 'name,asc' } })).data ?? []).map(b => ({
    id: b.id,
    name: b.name,
  }));

/** Assignments only carry customer ids, so names come from the salesman's customer list. */
export const fetchAssignedCustomers = async (salesmanId: string): Promise<IAssignedCustomer[]> => {
  const [assignments, customers] = await Promise.all([
    axios.get<ICustomerAssignment[]>(`${api}/assignments/by-salesman/${salesmanId}`),
    axios.get<any[]>(`${api}/assignments/by-salesman/${salesmanId}/customers`, { params: { page: 0, size: 2000 } }),
  ]);
  const byId = new Map((customers.data ?? []).map(c => [String(c.id), c]));
  return (assignments.data ?? []).map(a => ({
    assignmentId: a.id,
    customerId: a.customerId,
    name: assignedCustomerName(byId.get(a.customerId), a.customerId),
    accountNumber: byId.get(a.customerId)?.accountNumber ?? null,
  }));
};

export const assignCustomer = async (salesmanId: string, customerId: string) =>
  (await axios.post<ICustomerAssignment>(`${api}/assignments`, { salesmanId, customerId })).data;

export const unassignCustomer = async (assignmentId: string) => {
  await axios.delete(`${api}/assignments/${assignmentId}`);
};

export const fetchAssignableCategories = async () => (await axios.get<IAssignableCategory[]>(`${api}/category-assignments/categories`)).data ?? [];

export const fetchCategoryAssignments = async (salesmanId: string) =>
  (await axios.get<ICategoryAssignment[]>(`${api}/category-assignments/by-salesman/${salesmanId}`)).data ?? [];

export const assignCategory = async (salesmanId: string, categoryId: string) =>
  (await axios.post<ICategoryAssignment>(`${api}/category-assignments`, { salesmanId, categoryId })).data;

export const unassignCategory = async (assignmentId: string) => {
  await axios.delete(`${api}/category-assignments/${assignmentId}`);
};
