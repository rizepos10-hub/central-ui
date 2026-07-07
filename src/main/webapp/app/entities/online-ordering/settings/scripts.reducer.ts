import { createUiSettingsSectionReducer } from './section.reducer';
import { IScriptsSettings, scriptsSettingsDefaultValue } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';

const apiUrl = 'api/online-ordering/settings/ui-settings/scripts';

const section = createUiSettingsSectionReducer<IScriptsSettings>('online-ordering-scripts-settings', apiUrl, scriptsSettingsDefaultValue);

export const getEntity = section.getEntity;
export const updateEntity = section.updateEntity;
export const changeEntityField = section.changeEntityField;
export const { reset } = section.actions;
export default section.reducer;
