import { contentPagesSettingsDefaultValue, IContentPagesSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { createUiSettingsSectionReducer } from './section.reducer';

const apiUrl = 'api/online-ordering/settings/ui-settings/content-pages';

const section = createUiSettingsSectionReducer<IContentPagesSettings>('online-ordering-content-pages-settings', apiUrl, contentPagesSettingsDefaultValue);

export const getEntity = section.getEntity;
export const updateEntity = section.updateEntity;
export const changeEntityField = section.changeEntityField;
export const { reset } = section.actions;
export default section.reducer;
