import axios from 'axios';

import { IWholesaleFactory } from './wholesale-factory.model';

const apiUrl = 'api/wholesale/factories';

export const fetchFactories = async (active?: boolean) =>
  (await axios.get<IWholesaleFactory[]>(apiUrl, { params: active == null ? {} : { active } })).data;

export const saveFactory = async (factory: IWholesaleFactory) =>
  factory.id
    ? (await axios.put<IWholesaleFactory>(`${apiUrl}/${factory.id}`, factory)).data
    : (await axios.post<IWholesaleFactory>(apiUrl, factory)).data;

export const deleteFactory = async (id: string) => {
  await axios.delete(`${apiUrl}/${id}`);
};
