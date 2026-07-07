import { createUiSettingsSectionReducer } from './section.reducer';
import { IStorefrontSettings, storefrontSettingsDefaultValue } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';

const apiUrl = 'api/online-ordering/settings/ui-settings/storefront-settings';

const section = createUiSettingsSectionReducer<IStorefrontSettings>('online-ordering-storefront-settings', apiUrl, storefrontSettingsDefaultValue);

export const getEntity = section.getEntity;
export const updateEntity = section.updateEntity;
export const changeEntityField = section.changeEntityField;
export const { reset } = section.actions;
export default section.reducer;
