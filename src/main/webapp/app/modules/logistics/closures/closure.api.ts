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

export const fetchRouteDeliveryDays = async (routeId: string, from: string, to: string) =>
  (await axios.get<IDeliveryDay[]>(`${apiUrl}/delivery-days`, { params: { routeId, from, to } })).data;
