import axios from 'axios';

import { IRouteDefinition, IRouteMember, IRouteOptimization, IWholesaleDriver } from './route-definition.model';

const apiUrl = 'api/wholesale/route-definitions';

export const fetchRoutes = async () => (await axios.get<IRouteDefinition[]>(apiUrl)).data;

export const saveRoute = async (route: IRouteDefinition) =>
  route.id ? (await axios.put<IRouteDefinition>(`${apiUrl}/${route.id}`, route)).data : (await axios.post<IRouteDefinition>(apiUrl, route)).data;

export const deleteRoute = async (id: string) => {
  await axios.delete(`${apiUrl}/${id}`);
};

export const fetchStops = async (routeId: string) => (await axios.get<IRouteMember[]>(`${apiUrl}/${routeId}/stops`)).data;

export const addStop = async (routeId: string, customerId: string) => (await axios.post<IRouteMember[]>(`${apiUrl}/${routeId}/stops/${customerId}`)).data;

export const removeStop = async (routeId: string, customerId: string) =>
  (await axios.delete<IRouteMember[]>(`${apiUrl}/${routeId}/stops/${customerId}`)).data;

export const saveStopOrder = async (routeId: string, customerIds: string[]) =>
  (await axios.put<IRouteMember[]>(`${apiUrl}/${routeId}/stops`, customerIds)).data;

export const optimizeRoute = async (routeId: string) => (await axios.post<IRouteOptimization>(`${apiUrl}/${routeId}/optimize`)).data;

export const fetchDrivers = async () => (await axios.get<IWholesaleDriver[]>('api/wholesale/drivers')).data;
