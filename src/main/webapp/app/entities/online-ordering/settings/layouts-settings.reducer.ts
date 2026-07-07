import { createUiSettingsSectionReducer } from './section.reducer';
import { ILayoutsSettings, layoutsSettingsDefaultValue } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';

const apiUrl = 'api/online-ordering/settings/ui-settings/layouts';

const section = createUiSettingsSectionReducer<ILayoutsSettings>('online-ordering-layouts-settings', apiUrl, layoutsSettingsDefaultValue);

export const getEntity = section.getEntity;
export const updateEntity = section.updateEntity;
export const changeEntityField = section.changeEntityField;
export const { reset } = section.actions;
export default section.reducer;
