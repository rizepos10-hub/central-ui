import { createUiSettingsSectionReducer } from './section.reducer';
import { IUiUxSettings, uiUxSettingsDefaultValue } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';

const apiUrl = 'api/online-ordering/settings/ui-settings/ui-ux';

const section = createUiSettingsSectionReducer<IUiUxSettings>('online-ordering-ui-ux-settings', apiUrl, uiUxSettingsDefaultValue);

export const getEntity = section.getEntity;
export const updateEntity = section.updateEntity;
export const changeEntityField = section.changeEntityField;
export const { reset } = section.actions;
export default section.reducer;
