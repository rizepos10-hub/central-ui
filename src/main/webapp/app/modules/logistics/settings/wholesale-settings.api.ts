import axios from 'axios';

import { IWholesaleSettings } from './wholesale-settings.model';

const apiUrl = 'api/wholesale/settings';

export const fetchSettings = async () => (await axios.get<IWholesaleSettings>(apiUrl)).data;

export const saveSettings = async (settings: IWholesaleSettings) => (await axios.put<IWholesaleSettings>(apiUrl, settings)).data;
