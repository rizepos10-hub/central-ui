import axios from 'axios';

import { IDeliveryDay, IWholesaleClosure } from './closure.model';

const apiUrl = 'api/wholesale/closures';

export const fetchClosures = async (from: string, to: string) => (await axios.get<IWholesaleClosure[]>(apiUrl, { params: { from, to } })).data;

export const saveClosure = async (closure: IWholesaleClosure) =>
  closure.id
    ? (await axios.put<IWholesaleClosure>(`${apiUrl}/${closure.id}`, closure)).data
    : (await axios.post<IWholesaleClosure>(apiUrl, closure)).data;

export const deleteClosure = async (id: string) => {
  await axios.delete(`${apiUrl}/${id}`);
};

/** Delivery days of every active route, keyed by route id. */
export const fetchAllRouteDeliveryDays = async (from: string, to: string) =>
  (await axios.get<Record<string, IDeliveryDay[]>>(`${apiUrl}/route-delivery-days`, { params: { from, to } })).data;
