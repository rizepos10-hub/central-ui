import { ILocalizationSettings, localizationSettingsDefaultValue } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { createUiSettingsSectionReducer } from './section.reducer';

const apiUrl = 'api/online-ordering/settings/ui-settings/localization';

const section = createUiSettingsSectionReducer<ILocalizationSettings>('online-ordering-localization-settings', apiUrl, localizationSettingsDefaultValue);

export const getEntity = section.getEntity;
export const updateEntity = section.updateEntity;
export const changeEntityField = section.changeEntityField;
export const { reset } = section.actions;
export default section.reducer;
