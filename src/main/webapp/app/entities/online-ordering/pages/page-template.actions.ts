import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

import { serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IOnlineOrderingPage } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { IPageTemplateDescriptor } from 'app/shared/model/ONLINE_ORDERING/page-template.model';

const apiUrl = 'api/online-ordering/pages';

export const getTemplates = createAsyncThunk('ooPage/fetch_templates', async () => {
  return axios.get<IPageTemplateDescriptor[]>(`${apiUrl}/templates`);
});

export const createFromTemplate = createAsyncThunk(
  'ooPage/create_from_template',
  async ({ templateKey, publish }: { templateKey: string; publish: boolean }) => {
    return axios.post<IOnlineOrderingPage>(`${apiUrl}/from-template`, null, {
      params: { templateKey, publish },
    });
  },
  { serializeError: serializeAxiosError }
);
