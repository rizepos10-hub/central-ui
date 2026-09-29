import axios from 'axios';

import { IPaymentMethod, IServiceChargeOption, IShippingQuote, IShippingSettings, ITestResult, ShippingProvider } from './shipping.model';

const apiUrl = 'api/wholesale/shipping';

export const fetchShippingSettings = async () => (await axios.get<IShippingSettings>(`${apiUrl}/settings`)).data;

export const saveShippingSettings = async (payload: object) => (await axios.put<IShippingSettings>(`${apiUrl}/settings`, payload)).data;

/** Service charges of type shipping fee the fee can be charged as. */
export const fetchShippingServiceCharges = async () =>
  (await axios.get<IServiceChargeOption[]>(`${apiUrl}/settings/service-charges`)).data;

/** Tests the key typed on the page, or the saved one when none is typed. */
export const testShippingProvider = async (provider: ShippingProvider, request: { apiKey?: string | null; sandbox?: boolean }) =>
  (await axios.post<ITestResult>(`${apiUrl}/settings/test/${provider}`, request)).data;

export const fetchClickShipPaymentMethods = async (request: { apiKey?: string | null; sandbox?: boolean }) =>
  (await axios.post<IPaymentMethod[]>(`${apiUrl}/settings/clickship/payment-methods`, request)).data;

export const requoteShipping = async (orderId: string) => (await axios.post<IShippingQuote>(`${apiUrl}/orders/${orderId}/quote`)).data;

export const setShippingFee = async (orderId: string, fee: number | null) =>
  (await axios.put<IShippingQuote>(`${apiUrl}/orders/${orderId}/fee`, { fee })).data;
