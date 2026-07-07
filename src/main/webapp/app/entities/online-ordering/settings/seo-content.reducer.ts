import { ISeoContentSettings, seoContentSettingsDefaultValue } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { createUiSettingsSectionReducer } from './section.reducer';

const apiUrl = 'api/online-ordering/settings/ui-settings/seo-content';

const section = createUiSettingsSectionReducer<ISeoContentSettings>('online-ordering-seo-content-settings', apiUrl, seoContentSettingsDefaultValue);

export const getEntity = section.getEntity;
export const updateEntity = section.updateEntity;
export const changeEntityField = section.changeEntityField;
export const { reset } = section.actions;
export default section.reducer;
