import axios from 'axios';

import { IWholesaleUser, IWholesaleUserDraft, WholesaleUserKind } from './wholesale-user.model';

const paths: Record<WholesaleUserKind, string> = {
  salesManagers: 'api/wholesale/sales-managers',
  factoryUsers: 'api/wholesale/factory-users',
  drivers: 'api/wholesale/driver-users',
};

export const fetchUsers = async (kind: WholesaleUserKind, page: number, size: number) => {
  const response = await axios.get<IWholesaleUser[]>(paths[kind], { params: { page, size, sort: 'firstName,asc' } });
  const total = Number(response.headers?.['x-total-count']);
  return { items: response.data, total: Number.isFinite(total) ? total : response.data.length };
};

export const saveUser = async (kind: WholesaleUserKind, id: string | undefined, payload: IWholesaleUserDraft) =>
  id ? (await axios.put<IWholesaleUser>(`${paths[kind]}/${id}`, payload)).data : (await axios.post<IWholesaleUser>(paths[kind], payload)).data;

export const deleteUser = async (kind: WholesaleUserKind, id: string) => {
  await axios.delete(`${paths[kind]}/${id}`);
};
