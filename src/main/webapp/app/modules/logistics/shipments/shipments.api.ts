import axios from 'axios';

import { IShipRequest, IShipmentRow, ShipmentStage } from './shipments.model';

const apiUrl = 'api/wholesale/shipments';

export const fetchShipments = async (params: { stage?: ShipmentStage; factoryId?: string }) =>
  (await axios.get<IShipmentRow[]>(apiUrl, { params })).data;

export const shipOrder = async (orderId: string, request: IShipRequest) =>
  (await axios.post<IShipmentRow>(`${apiUrl}/${orderId}/ship`, request)).data;

export const deliverOrder = async (orderId: string, notes?: string) =>
  (await axios.post<IShipmentRow>(`${apiUrl}/${orderId}/deliver`, { notes: notes || null })).data;
